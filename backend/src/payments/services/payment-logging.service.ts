import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PaymentLogData {
  logType: 'INFO' | 'WARNING' | 'ERROR' | 'WEBHOOK' | 'API_CALL' | 'STATUS_UPDATE';
  eventType?: string;
  message: string;
  data?: any;
  requestUrl?: string;
  requestMethod?: string;
  requestHeaders?: any;
  requestBody?: any;
  responseStatus?: number;
  responseHeaders?: any;
  responseBody?: any;
  processingTimeMs?: number;
}

@Injectable()
export class PaymentLoggingService {
  constructor(private readonly prisma: PrismaService) {}

  async logPaymentEvent(
    paymentOrderId: string,
    logData: PaymentLogData
  ): Promise<void> {
    try {
      await this.prisma.paymentLog.create({
        data: {
          paymentOrderId,
          logType: logData.logType,
          eventType: logData.eventType,
          message: logData.message,
          data: logData.data ? JSON.stringify(logData.data) : null,
          requestUrl: logData.requestUrl,
          requestMethod: logData.requestMethod,
          requestHeaders: logData.requestHeaders ? JSON.stringify(logData.requestHeaders) : null,
          requestBody: logData.requestBody ? JSON.stringify(logData.requestBody) : null,
          responseStatus: logData.responseStatus,
          responseHeaders: logData.responseHeaders ? JSON.stringify(logData.responseHeaders) : null,
          responseBody: logData.responseBody ? JSON.stringify(logData.responseBody) : null,
          processingTimeMs: logData.processingTimeMs,
        },
      });
    } catch (error) {
      console.error('Failed to log payment event:', error);
      // Don't throw error to avoid breaking payment flow
    }
  }

  async logInitialPaymentResponse(
    paymentOrderId: string,
    response: any,
    gateway: string
  ): Promise<void> {
    await this.logPaymentEvent(paymentOrderId, {
      logType: 'API_CALL',
      eventType: 'initial_payment_response',
      message: `Initial payment response received from ${gateway}`,
      data: response,
      responseBody: response,
    });
  }

  async logWebhookReceived(
    paymentOrderId: string,
    payload: any,
    headers: any,
    gateway: string
  ): Promise<void> {
    await this.logPaymentEvent(paymentOrderId, {
      logType: 'WEBHOOK',
      eventType: 'webhook_received',
      message: `Webhook received from ${gateway}`,
      data: { payload, headers },
      requestBody: payload,
      requestHeaders: headers,
    });
  }

  async logWebhookProcessed(
    paymentOrderId: string,
    result: any,
    processingTimeMs: number,
    gateway: string
  ): Promise<void> {
    await this.logPaymentEvent(paymentOrderId, {
      logType: 'WEBHOOK',
      eventType: 'webhook_processed',
      message: `Webhook processed successfully for ${gateway}`,
      data: result,
      responseBody: result,
      processingTimeMs,
    });
  }

  async logError(
    paymentOrderId: string,
    error: any,
    context: string,
    gateway: string
  ): Promise<void> {
    await this.logPaymentEvent(paymentOrderId, {
      logType: 'ERROR',
      eventType: 'error_occurred',
      message: `Error in ${context} for ${gateway}: ${error.message || 'Unknown error'}`,
      data: {
        error: error.message,
        stack: error.stack,
        context,
        gateway,
      },
    });
  }

  async logStatusUpdate(
    paymentOrderId: string,
    oldStatus: string,
    newStatus: string,
    gateway: string
  ): Promise<void> {
    await this.logPaymentEvent(paymentOrderId, {
      logType: 'STATUS_UPDATE',
      eventType: 'status_changed',
      message: `Payment status updated from ${oldStatus} to ${newStatus} for ${gateway}`,
      data: { oldStatus, newStatus, gateway },
    });
  }

  async getPaymentLogs(paymentOrderId: string) {
    return this.prisma.paymentLog.findMany({
      where: { paymentOrderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPaymentOrderWithLogs(paymentOrderId: string) {
    return this.prisma.paymentOrder.findUnique({
      where: { merchantOrderId: paymentOrderId },
      include: {
        paymentLogs: {
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: { id: true, email: true, fullName: true },
        },
        plan: {
          select: { id: true, name: true, priceCents: true, currency: true },
        },
      },
    });
  }

  // Webhook log methods
  async getWebhookLogs(limit: number = 50, offset: number = 0, gateway?: string) {
    const whereClause = gateway ? { gateway: gateway.toUpperCase() } : {};
    
    const [webhookLogs, total] = await Promise.all([
      this.prisma.webhookLog.findMany({
        where: whereClause,
        orderBy: { receivedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.webhookLog.count({
        where: whereClause,
      }),
    ]);

    return { webhookLogs, total };
  }

  async getWebhookLog(id: string) {
    return this.prisma.webhookLog.findUnique({
      where: { id },
    });
  }
}



