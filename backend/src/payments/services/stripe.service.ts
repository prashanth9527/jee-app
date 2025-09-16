import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentGatewayInterface, PaymentOrderResponse, PaymentStatusResponse, WebhookResponse } from '../interfaces/payment-gateway.interface';
import Stripe from 'stripe';
import { randomUUID } from 'crypto';

@Injectable()
export class StripeService implements PaymentGatewayInterface {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('Stripe secret key not configured');
    }
    this.stripe = new Stripe(secretKey);
  }

  async createOrder(
    userId: string,
    planId: string,
    amount: number,
    currency: string,
    successUrl: string,
    cancelUrl: string,
    merchantOrderId: string
  ): Promise<PaymentOrderResponse> {
    try {
      const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        throw new Error('Plan not found');
      }

      // Create Stripe product and price if not exists
      let priceId = plan.stripePriceId;
      if (!priceId) {
        const product = await this.stripe.products.create({
          name: plan.name,
          description: plan.description || undefined,
        });

        const price = await this.stripe.prices.create({
          unit_amount: plan.priceCents,
          currency: plan.currency,
          recurring: { interval: plan.interval === 'YEAR' ? 'year' : 'month' },
          product: product.id,
        });

        priceId = price.id;

        // Update plan with Stripe price ID
        await this.prisma.plan.update({
          where: { id: planId },
          data: { stripePriceId: priceId },
        });
      }

      // Create Stripe checkout session
      const session = await this.stripe.checkout.sessions.create({
        mode: 'subscription',
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        client_reference_id: userId,
        metadata: {
          merchantOrderId,
          planId,
        },
      });

      // Store order in database
      await this.prisma.paymentOrder.create({
        data: {
          userId,
          planId,
          merchantOrderId,
          amount: plan.priceCents, // Stripe uses cents
          currency: plan.currency.toUpperCase(),
          gateway: 'STRIPE',
          gatewayOrderId: session.id,
          successUrl,
          cancelUrl,
          stripeSessionId: session.id,
          status: 'PENDING',
        },
      });

      return {
        success: true,
        orderId: merchantOrderId,
        redirectUrl: session.url || undefined,
      };
    } catch (error) {
      console.error('Stripe order creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create Stripe order',
      };
    }
  }

  async checkOrderStatus(merchantOrderId: string): Promise<PaymentStatusResponse> {
    try {
      const order = await this.prisma.paymentOrder.findUnique({
        where: { merchantOrderId },
      });

      if (!order || !order.stripeSessionId) {
        return {
          success: false,
          status: 'PENDING',
          error: 'Order not found',
        };
      }

      const session = await this.stripe.checkout.sessions.retrieve(order.stripeSessionId);
      
      let status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
      switch (session.payment_status) {
        case 'paid':
          status = 'COMPLETED';
          break;
        case 'unpaid':
          status = 'PENDING';
          break;
        case 'no_payment_required':
          status = 'COMPLETED';
          break;
        default:
          status = 'PENDING';
      }

      // Update order status in database
      await this.prisma.paymentOrder.update({
        where: { merchantOrderId },
        data: {
          status,
          gatewayStatus: session.payment_status,
        },
      });

      return {
        success: true,
        status,
        orderId: merchantOrderId,
        gatewayOrderId: session.id,
      };
    } catch (error) {
      console.error('Stripe status check error:', error);
      return {
        success: false,
        status: 'PENDING',
        error: error.message || 'Failed to check Stripe order status',
      };
    }
  }

  async handleWebhook(payload: any, headers: any): Promise<WebhookResponse> {
    try {
      const signature = headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!signature || !webhookSecret) {
        return {
          success: false,
          processed: false,
          error: 'Missing webhook signature or secret',
        };
      }

      let event: Stripe.Event;
      try {
        event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      } catch (err) {
        return {
          success: false,
          processed: false,
          error: 'Invalid webhook signature',
        };
      }

      const session = event.data.object as Stripe.Checkout.Session;
      const merchantOrderId = session.metadata?.merchantOrderId;

      if (!merchantOrderId) {
        return {
          success: false,
          processed: false,
          error: 'No merchant order ID in webhook',
        };
      }

      let status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
      let processed = false;

      switch (event.type) {
        case 'checkout.session.completed':
          if (session.payment_status === 'paid') {
            status = 'COMPLETED';
            processed = true;
          } else {
            status = 'PENDING';
          }
          break;
        case 'checkout.session.expired':
          status = 'CANCELLED';
          processed = true;
          break;
        default:
          return {
            success: true,
            processed: false,
            orderId: merchantOrderId,
          };
      }

      // Update order in database
      await this.prisma.paymentOrder.update({
        where: { merchantOrderId },
        data: {
          status,
          gatewayStatus: session.payment_status,
        },
      });

      // If payment is completed, create subscription
      if (status === 'COMPLETED' && processed) {
        await this.createSubscriptionFromOrder(merchantOrderId);
      }

      return {
        success: true,
        processed,
        orderId: merchantOrderId,
        status,
      };
    } catch (error) {
      console.error('Stripe webhook error:', error);
      return {
        success: false,
        processed: false,
        error: error.message || 'Failed to process Stripe webhook',
      };
    }
  }

  private async createSubscriptionFromOrder(merchantOrderId: string) {
    try {
      const order = await this.prisma.paymentOrder.findUnique({
        where: { merchantOrderId },
        include: { user: true, plan: true },
      });

      if (!order || order.status !== 'COMPLETED') {
        return;
      }

      // Check if user already has an active subscription for this plan
      const existingSubscription = await this.prisma.subscription.findFirst({
        where: {
          userId: order.userId,
          planId: order.planId,
          status: 'ACTIVE',
        },
      });

      if (existingSubscription) {
        // Extend existing subscription
        const currentEndDate = existingSubscription.endsAt || new Date();
        const extensionDays = order.plan.interval === 'YEAR' ? 365 : 30;
        const newEndDate = new Date(currentEndDate.getTime() + extensionDays * 24 * 60 * 60 * 1000);

        await this.prisma.subscription.update({
          where: { id: existingSubscription.id },
          data: { endsAt: newEndDate },
        });
      } else {
        // Create new subscription
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + (order.plan.interval === 'YEAR' ? 365 : 30));

        await this.prisma.subscription.create({
          data: {
            userId: order.userId,
            planId: order.planId,
            status: 'ACTIVE',
            startedAt: startDate,
            endsAt: endDate,
          },
        });
      }

      // Update AI limits if it's an AI-enabled plan
      if (order.plan.planType === 'AI_ENABLED') {
        await this.prisma.user.update({
          where: { id: order.userId },
          data: {
            aiTestsLimit: order.plan.interval === 'YEAR' ? 1000 : 100, // Set appropriate limits
            lastAiResetAt: new Date(),
          },
        });
      }
    } catch (error) {
      console.error('Error creating subscription from order:', error);
    }
  }
}
