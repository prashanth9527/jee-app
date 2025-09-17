import { Controller, Post, Get, Body, Param, Req, UseGuards, Headers, RawBodyRequest, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PaymentGatewayFactory } from './services/payment-gateway.factory';
import { PaymentLoggingService } from './services/payment-logging.service';
import { randomUUID } from 'crypto';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentGatewayFactory: PaymentGatewayFactory,
    private readonly loggingService: PaymentLoggingService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async createCheckout(
    @Req() req: any,
    @Body() body: { planId: string; successUrl: string; cancelUrl: string }
  ) {
    try {
      const { planId, successUrl, cancelUrl } = body;
      const userId = req.user.id;
      const merchantOrderId = randomUUID();

      const gateway = this.paymentGatewayFactory.getPaymentGateway();
      
      // For now, we'll use a default amount - in production, you'd fetch this from the plan
      const amount = 1000; // This should be fetched from the plan
      const currency = 'INR'; // This should be fetched from the plan

      const result = await gateway.createOrder(
        userId,
        planId,
        amount,
        currency,
        successUrl,
        cancelUrl,
        merchantOrderId
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to create payment order');
      }

      return {
        success: true,
        orderId: result.orderId,
        redirectUrl: result.redirectUrl,
        deepLink: result.deepLink,
        gateway: this.paymentGatewayFactory.getGatewayName(),
      };
    } catch (error) {
      console.error('Payment checkout error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create checkout session',
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('status/:orderId')
  async checkOrderStatus(@Param('orderId') orderId: string) {
    try {
      const gateway = this.paymentGatewayFactory.getPaymentGateway();
      const result = await gateway.checkOrderStatus(orderId);

      return {
        success: result.success,
        status: result.status,
        orderId: result.orderId,
        gatewayOrderId: result.gatewayOrderId,
        error: result.error,
      };
    } catch (error) {
      console.error('Order status check error:', error);
      return {
        success: false,
        error: error.message || 'Failed to check order status',
      };
    }
  }

  @Post('webhook')
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers() headers: any
  ) {
    try {
      const gateway = this.paymentGatewayFactory.getPaymentGateway();
      const payload = req.rawBody || req.body;
      
      console.log('Webhook received:', {
        gateway: this.paymentGatewayFactory.getGatewayName(),
        headers: Object.keys(headers),
        payloadType: typeof payload,
        payloadKeys: payload ? Object.keys(payload) : 'null'
      });
      
      const result = await gateway.handleWebhook(payload, headers);

      return {
        success: result.success,
        processed: result.processed,
        orderId: result.orderId,
        status: result.status,
        error: result.error,
      };
    } catch (error) {
      console.error('Webhook handling error:', error);
      return {
        success: false,
        processed: false,
        error: error.message || 'Failed to process webhook',
      };
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('logs/:orderId')
  async getPaymentLogs(@Param('orderId') orderId: string) {
    try {
      const paymentOrder = await this.loggingService.getPaymentOrderWithLogs(orderId);
      
      if (!paymentOrder) {
        return {
          success: false,
          error: 'Payment order not found',
        };
      }

      return {
        success: true,
        paymentOrder,
      };
    } catch (error) {
      console.error('Error fetching payment logs:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch payment logs',
      };
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('webhook-logs')
  async getWebhookLogs(
    @Query('limit') limit: string = '50',
    @Query('offset') offset: string = '0',
    @Query('gateway') gateway?: string
  ) {
    try {
      const limitNum = parseInt(limit) || 50;
      const offsetNum = parseInt(offset) || 0;
      
      const { webhookLogs, total } = await this.loggingService.getWebhookLogs(
        limitNum,
        offsetNum,
        gateway
      );

      return {
        success: true,
        webhookLogs,
        total,
        limit: limitNum,
        offset: offsetNum,
      };
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch webhook logs',
      };
    }
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('webhook-logs/:id')
  async getWebhookLog(@Param('id') id: string) {
    try {
      const webhookLog = await this.loggingService.getWebhookLog(id);

      if (!webhookLog) {
        return {
          success: false,
          error: 'Webhook log not found',
        };
      }

      return {
        success: true,
        webhookLog,
      };
    } catch (error) {
      console.error('Error fetching webhook log:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch webhook log',
      };
    }
  }
}
