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
      // Get user details for UDF
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, phone: true }
      });

      // Convert amount from cents to paisa (PhonePe uses paisa)
      // amount is already in cents (9900 cents = ₹99), so we use it directly as paisa
      const amountInPaisa = amount;

      // Create meta info with user and plan details
      const metaInfo = MetaInfo.builder()
        .udf1(userId)
        .udf2(planId)
        .udf3('subscription')
        .udf4(user?.email || '')
        .udf5(user?.phone || '')
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
          gatewayOrderId: (response as any).merchantOrderId || merchantOrderId, // Use PhonePe's order ID if available
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
      // First, get the payment order to retrieve the correct PhonePe order ID
      const paymentOrder = await this.prisma.paymentOrder.findUnique({
        where: { merchantOrderId },
      });

      if (!paymentOrder) {
        return {
          success: false,
          status: 'PENDING',
          error: 'Payment order not found',
        };
      }

      // Use the gateway order ID (PhonePe's order ID) for status check
      const phonepeOrderId = paymentOrder.gatewayOrderId || merchantOrderId;
      const response = await this.client.getOrderStatus(phonepeOrderId);
      
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

      // Get current order status before updating
      const currentOrder = await this.prisma.paymentOrder.findUnique({
        where: { merchantOrderId },
      });

      // Update order status in database
      const updatedOrder = await this.prisma.paymentOrder.update({
        where: { merchantOrderId },
        data: {
          status,
          gatewayStatus: response.state,
          statusResponse: JSON.stringify(response), // Store status check response
        } as any, // Temporary type assertion until TypeScript picks up new schema
      });

      // Insert response into PaymentLogs
      await this.prisma.paymentLog.create({
        data: {
          paymentOrderId: updatedOrder.id,
          logType: 'INFO',
          eventType: 'status_check_response',
          message: `PhonePe status check completed for order ${merchantOrderId}`,
          data: JSON.stringify({
            merchantOrderId,
            status,
            gatewayStatus: response.state,
            response: response,
            previousStatus: currentOrder?.status
          }),
          responseBody: JSON.stringify(response),
          createdAt: new Date()
        }
      });

      // If payment is completed and wasn't already completed, create subscription
      if (status === 'COMPLETED' && currentOrder?.status !== 'COMPLETED') {
        await this.createSubscriptionFromOrder(merchantOrderId);
      }

      return {
        success: true,
        status,
        orderId: merchantOrderId,
        gatewayOrderId: response.merchantOrderId,
      };
    } catch (error) {
      console.error('PhonePe status check error:', error);
      
      // Log error in PaymentLogs if we can find the payment order
      try {
        const paymentOrder = await this.prisma.paymentOrder.findUnique({
          where: { merchantOrderId },
        });
        
        if (paymentOrder) {
          await this.prisma.paymentLog.create({
            data: {
              paymentOrderId: paymentOrder.id,
              logType: 'ERROR',
              eventType: 'status_check_error',
              message: `PhonePe status check failed for order ${merchantOrderId}`,
              data: JSON.stringify({
                merchantOrderId,
                error: error.message,
                stack: error.stack,
                name: error.name
              }),
              createdAt: new Date()
            }
          });
        }
      } catch (logError) {
        console.error('Error logging status check error:', logError);
      }
      
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
    let webhookLogId: string | null = null;

    try {
      // Log webhook immediately when it hits our system
      const webhookLog = await this.prisma.webhookLog.create({
        data: {
          gateway: 'PHONEPE',
          eventType: payload?.type || 'UNKNOWN',
          merchantOrderId: payload?.data?.merchantOrderId || payload?.merchantOrderId || null,
          payload: payload,
          headers: headers,
          rawBody: typeof payload === 'string' ? payload : JSON.stringify(payload),
          receivedAt: new Date(),
        },
      });
      webhookLogId = webhookLog.id;

      console.log('Webhook received and logged:', {
        webhookLogId,
        eventType: payload?.type,
        merchantOrderId: payload?.data?.merchantOrderId || payload?.merchantOrderId,
        timestamp: new Date().toISOString()
      });

      const authorization = headers['authorization'] || headers['Authorization'];
      const responseBody = typeof payload === 'string' ? payload : JSON.stringify(payload);
      
      const username = process.env.PHONEPE_CALLBACK_USERNAME;
      const password = process.env.PHONEPE_CALLBACK_PASSWORD;

      if (!username || !password || !authorization) {
        // Update webhook log with error
        if (webhookLogId) {
          await this.prisma.webhookLog.update({
            where: { id: webhookLogId },
            data: {
              processed: true,
              processedAt: new Date(),
              processingTimeMs: Date.now() - startTime,
              error: 'Missing webhook credentials',
              response: { success: false, processed: false, error: 'Missing webhook credentials' },
              statusCode: 400,
            },
          });
        }

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
        // Update webhook log with error
        if (webhookLogId) {
          await this.prisma.webhookLog.update({
            where: { id: webhookLogId },
            data: {
              processed: true,
              processedAt: new Date(),
              processingTimeMs: Date.now() - startTime,
              error: 'No merchant order ID in callback',
              response: { success: false, processed: false, error: 'No merchant order ID in callback' },
              statusCode: 400,
            },
          });
        }

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

      // Get current order status before updating
      const currentOrder = await this.prisma.paymentOrder.findUnique({
        where: { merchantOrderId },
      });

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

      // If payment is completed and wasn't already completed, create subscription
      if (status === 'COMPLETED' && currentOrder?.status !== 'COMPLETED') {
        await this.createSubscriptionFromOrder(merchantOrderId);
      }

      const processingTime = Date.now() - startTime;
      const result = {
        success: true,
        processed: true,
        orderId: merchantOrderId,
        status,
      };

      // Update webhook log with success
      if (webhookLogId) {
        await this.prisma.webhookLog.update({
          where: { id: webhookLogId },
          data: {
            processed: true,
            processedAt: new Date(),
            processingTimeMs: processingTime,
            response: result,
            statusCode: 200,
            merchantOrderId: merchantOrderId, // Update with actual order ID
          },
        });
      }

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
      
      // Update webhook log with error
      if (webhookLogId) {
        try {
          await this.prisma.webhookLog.update({
            where: { id: webhookLogId },
            data: {
              processed: true,
              processedAt: new Date(),
              processingTimeMs: Date.now() - startTime,
              error: error.message || 'Failed to process PhonePe webhook',
              response: { 
                success: false, 
                processed: false, 
                error: error.message || 'Failed to process PhonePe webhook' 
              },
              statusCode: 500,
            },
          });
        } catch (logError) {
          console.error('Error updating webhook log:', logError);
        }
      }
      
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

      // Complete referral if user was referred
      await this.completeReferralIfExists(order.userId);

      // Log subscription creation
      await this.loggingService.logPaymentEvent(
        order.id,
        {
          logType: 'INFO',
          eventType: 'subscription_created',
          message: `Subscription created successfully for user ${order.userId} with plan ${order.plan.name}`,
          data: {
            userId: order.userId,
            planId: order.planId,
            planName: order.plan.name,
            planType: order.plan.planType,
            interval: order.plan.interval,
            subscriptionId: existingSubscription ? existingSubscription.id : 'new'
          }
        }
      );
    } catch (error) {
      console.error('Error creating subscription from order:', error);
      
      // Log error - we need to get the order again since it's out of scope
      try {
        const orderForLogging = await this.prisma.paymentOrder.findUnique({
          where: { merchantOrderId },
        });
        
        if (orderForLogging) {
          await this.loggingService.logError(
            orderForLogging.id,
            error,
            'subscription_creation',
            'PHONEPE'
          );
        }
      } catch (logError) {
        console.error('Error logging subscription creation error:', logError);
      }
    }
  }

  private async completeReferralIfExists(userId: string) {
    try {
      // Check if user has a pending referral
      const referral = await this.prisma.referral.findUnique({
        where: { refereeId: userId },
        include: {
          referrer: true,
          referee: true
        }
      });

      if (referral && referral.status === 'PENDING') {
        // Update referral status to completed
        await this.prisma.referral.update({
          where: { id: referral.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        });

        // Create rewards for both referrer and referee
        await this.createReferralRewards(referral.id, referral.referrerId, referral.refereeId);

        console.log(`Referral completed for user ${userId} referred by ${referral.referrerId}`);
      }
    } catch (error) {
      console.error('Error completing referral:', error);
    }
  }

  private async createReferralRewards(referralId: string, referrerId: string, refereeId: string) {
    try {
      // Get referral configuration (you might want to make this configurable)
      const referrerReward = { type: 'SUBSCRIPTION_DAYS', value: 7 }; // 7 days for referrer
      const refereeReward = { type: 'SUBSCRIPTION_DAYS', value: 3 }; // 3 days for referee

      // Create rewards
      const rewards = [
        {
          referralId,
          type: 'SUBSCRIPTION_DAYS' as const,
          amount: referrerReward.value,
          description: `${referrerReward.value} days subscription extension for referring a friend`,
          currency: null,
          isClaimed: false
        },
        {
          referralId,
          type: 'SUBSCRIPTION_DAYS' as const,
          amount: refereeReward.value,
          description: `${refereeReward.value} days subscription extension for being referred`,
          currency: null,
          isClaimed: false
        }
      ];

      await this.prisma.referralReward.createMany({
        data: rewards
      });

      // Apply rewards immediately
      await this.applyReferralReward(referrerId, referrerReward);
      await this.applyReferralReward(refereeId, refereeReward);

      console.log(`Referral rewards created and applied for referral ${referralId}`);
    } catch (error) {
      console.error('Error creating referral rewards:', error);
    }
  }

  private async applyReferralReward(userId: string, reward: any) {
    try {
      if (reward.type === 'SUBSCRIPTION_DAYS') {
        await this.applySubscriptionDaysReward(userId, reward.value);
      }
    } catch (error) {
      console.error('Error applying referral reward:', error);
    }
  }

  private async applySubscriptionDaysReward(userId: string, days: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          subscriptions: {
            where: { status: 'ACTIVE' },
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        }
      });

      if (!user) {
        return;
      }

      if (user.subscriptions.length > 0) {
        // Extend existing subscription
        const subscription = user.subscriptions[0];
        const newEndDate = new Date(subscription.endsAt || new Date());
        newEndDate.setDate(newEndDate.getDate() + days);

        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { endsAt: newEndDate }
        });
      } else {
        // Create new subscription with free days
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        // Find the free trial plan or create a basic plan
        let freeTrialPlan = await this.prisma.plan.findFirst({
          where: { name: 'Free Trial' }
        });

        if (!freeTrialPlan) {
          // Create a basic free trial plan if it doesn't exist
          freeTrialPlan = await this.prisma.plan.create({
            data: {
              name: 'Free Trial',
              description: 'Free trial plan for referral rewards',
              priceCents: 0,
              currency: 'INR',
              interval: 'MONTH',
              planType: 'MANUAL',
              isActive: true
            }
          });
        }

        await this.prisma.subscription.create({
          data: {
            userId,
            planId: freeTrialPlan.id,
            status: 'ACTIVE',
            startedAt: startDate,
            endsAt: endDate
          }
        });
      }

      console.log(`${days} days added to subscription for user ${userId}`);
    } catch (error) {
      console.error('Error applying subscription days reward:', error);
    }
  }
}
