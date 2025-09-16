import { Injectable } from '@nestjs/common';
import { PaymentGatewayInterface } from '../interfaces/payment-gateway.interface';
import { StripeService } from './stripe.service';
import { PhonePeService } from './phonepe.service';

@Injectable()
export class PaymentGatewayFactory {
  constructor(
    private readonly stripeService: StripeService,
    private readonly phonepeService: PhonePeService,
  ) {}

  getPaymentGateway(): PaymentGatewayInterface {
    const gateway = process.env.PAYMENT_GATEWAY?.toLowerCase();
    
    switch (gateway) {
      case 'phonepe':
        return this.phonepeService;
      case 'stripe':
      default:
        return this.stripeService;
    }
  }

  getGatewayName(): string {
    const gateway = process.env.PAYMENT_GATEWAY?.toLowerCase();
    return gateway === 'phonepe' ? 'PHONEPE' : 'STRIPE';
  }
}

