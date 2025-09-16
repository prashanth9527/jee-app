import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentGatewayInterface, PaymentOrderResponse, PaymentStatusResponse, WebhookResponse } from '../interfaces/payment-gateway.interface';
import { PaymentLoggingService } from './payment-logging.service';
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest, MetaInfo } from 'pg-sdk-node';
import { randomUUID } from 'crypto';

@Injectable()
export class PhonePeService implements PaymentGatewayInterface {
  private client: StandardCheckoutClient;

  constructor(
    private readonly prisma: PrismaService,
    private readonly loggingService: PaymentLoggingService
  ) {
    const clientId = process.env.PHONEPE_CLIENT_ID;
    const clientSecret = process.env.PHONEPE_CLIENT_SECRET;
    const clientVersion = process.env.PHONEPE_CLIENT_VERSION || '1.0';
    const environment = process.env.PHONEPE_ENVIRONMENT === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

    if (!clientId || !clientSecret) {
      throw new Error('PhonePe credentials not configured');
    }

    this.client = StandardCheckoutClient.getInstance(
      clientId,
      clientSecret,
      parseInt(clientVersion),
      environment
    );
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
      // Convert amount from cents to paisa (PhonePe uses paisa)
      // amount is already in cents (9900 cents = ₹99), so we use it directly as paisa
      const amountInPaisa = amount;

      // Create meta info with user and plan details
      const metaInfo = MetaInfo.builder()
        .udf1(userId)
        .udf2(planId)
        .udf3('subscription')
        .build();

      // Create payment request
      const request = StandardCheckoutPayRequest.builder()
        .merchantOrderId(merchantOrderId)
        .amount(amountInPaisa)
        .redirectUrl(successUrl)
        .metaInfo(metaInfo)
        .build();

      // Initiate payment
      const response = await this.client.pay(request);

      // Store order in database
      const paymentOrder = await this.prisma.paymentOrder.create({
        data: {
          userId,
          planId,
          merchantOrderId,
          amount: amountInPaisa, // Store in paisa for PhonePe
          currency: currency.toUpperCase(),
          gateway: 'PHONEPE',
          gatewayOrderId: merchantOrderId, // Use our merchant order ID
          successUrl,
          cancelUrl,
          phonepeRedirectUrl: response.redirectUrl,
          phonepeDeepLink: (response as any).deepLink || null,
          status: 'PENDING',
          initialResponse: JSON.stringify(response),
        },
      });

      // Log initial payment response
      await this.loggingService.logInitialPaymentResponse(
        paymentOrder.id,
        response,
        'PHONEPE'
      );

      return {
        success: true,
        orderId: merchantOrderId,
        redirectUrl: response.redirectUrl,
        deepLink: (response as any).deepLink || undefined,
      };
    } catch (error) {
      console.error('PhonePe order creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create PhonePe order',
      };
    }
  }

  async checkOrderStatus(merchantOrderId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await this.client.getOrderStatus(merchantOrderId);
      
      // Map PhonePe status to our status
      let status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
      switch (response.state) {
        case 'PAYMENT_SUCCESS':
          status = 'COMPLETED';
          break;
        case 'PAYMENT_ERROR':
        case 'PAYMENT_DECLINED':
          status = 'FAILED';
          break;
        case 'PAYMENT_CANCELLED':
          status = 'CANCELLED';
          break;
        default:
          status = 'PENDING';
      }

      // Update order status in database
      await this.prisma.paymentOrder.update({
        where: { merchantOrderId },
        data: {
          status,
          gatewayStatus: response.state,
        },
      });

      return {
        success: true,
        status,
        orderId: merchantOrderId,
        gatewayOrderId: response.merchantOrderId,
      };
    } catch (error) {
      console.error('PhonePe status check error:', error);
      return {
        success: false,
        status: 'PENDING',
        error: error.message || 'Failed to check PhonePe order status',
      };
    }
  }

  async handleWebhook(payload: any, headers: any): Promise<WebhookResponse> {
    const startTime = Date.now();
    let paymentOrderId: string | null = null;

    try {
      const authorization = headers['authorization'] || headers['Authorization'];
      const responseBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
      
      const username = process.env.PHONEPE_CALLBACK_USERNAME;
      const password = process.env.PHONEPE_CALLBACK_PASSWORD;

      if (!username || !password || !authorization) {
        return {
          success: false,
          processed: false,
          error: 'Missing webhook credentials',
        };
      }

      // Validate callback
      const callbackResponse = this.client.validateCallback(
        username,
        password,
        authorization,
        responseBody
      );

      const { type, payload: callbackPayload } = callbackResponse;
      const merchantOrderId = callbackPayload.originalMerchantOrderId;

      if (!merchantOrderId) {
        return {
          success: false,
          processed: false,
          error: 'No merchant order ID in callback',
        };
      }

      // Get payment order for logging
      const paymentOrder = await this.prisma.paymentOrder.findUnique({
        where: { merchantOrderId },
      });

      if (paymentOrder) {
        paymentOrderId = paymentOrder.id;
        
        // Log webhook received
        await this.loggingService.logWebhookReceived(
          paymentOrderId,
          payload,
          headers,
          'PHONEPE'
        );
      }

      // Update order status based on callback type
      let status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
      switch (type.toString()) {
        case 'CHECKOUT_ORDER_COMPLETED':
          status = 'COMPLETED';
          break;
        case 'CHECKOUT_ORDER_FAILED':
          status = 'FAILED';
          break;
        default:
          status = 'PENDING';
      }

      // Log status update if changed
      if (paymentOrder && paymentOrder.status !== status) {
        await this.loggingService.logStatusUpdate(
          paymentOrderId!,
          paymentOrder.status,
          status,
          'PHONEPE'
        );
      }

      // Update order in database
      await this.prisma.paymentOrder.update({
        where: { merchantOrderId },
        data: {
          status,
          gatewayStatus: callbackPayload.state,
          webhookPayload: JSON.stringify(payload),
          webhookHeaders: JSON.stringify(headers),
          webhookProcessedAt: new Date(),
          webhookProcessed: true,
        },
      });

      // If payment is completed, create subscription
      if (status === 'COMPLETED') {
        await this.createSubscriptionFromOrder(merchantOrderId);
      }

      const processingTime = Date.now() - startTime;
      const result = {
        success: true,
        processed: true,
        orderId: merchantOrderId,
        status,
      };

      // Log webhook processed
      if (paymentOrderId) {
        await this.loggingService.logWebhookProcessed(
          paymentOrderId,
          result,
          processingTime,
          'PHONEPE'
        );
      }

      return result;
    } catch (error) {
      console.error('PhonePe webhook error:', error);
      
      // Log error if we have payment order ID
      if (paymentOrderId) {
        await this.loggingService.logError(
          paymentOrderId,
          error,
          'webhook_processing',
          'PHONEPE'
        );
      }

      return {
        success: false,
        processed: false,
        error: error.message || 'Failed to process PhonePe webhook',
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
