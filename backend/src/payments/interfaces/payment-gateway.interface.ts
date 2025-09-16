export interface PaymentGatewayInterface {
  createOrder(
    userId: string,
    planId: string,
    amount: number, // Amount in cents (for Stripe) or paisa (for PhonePe)
    currency: string,
    successUrl: string,
    cancelUrl: string,
    merchantOrderId: string
  ): Promise<PaymentOrderResponse>;

  checkOrderStatus(merchantOrderId: string): Promise<PaymentStatusResponse>;

  handleWebhook(payload: any, headers: any): Promise<WebhookResponse>;
}

export interface PaymentOrderResponse {
  success: boolean;
  orderId?: string;
  redirectUrl?: string;
  deepLink?: string;
  error?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  orderId?: string;
  gatewayOrderId?: string;
  error?: string;
}

export interface WebhookResponse {
  success: boolean;
  processed: boolean;
  orderId?: string;
  status?: string;
  error?: string;
}
