import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PaymentGatewayFactory } from './services/payment-gateway.factory';
import { StripeService } from './services/stripe.service';
import { PhonePeService } from './services/phonepe.service';
import { PaymentLoggingService } from './services/payment-logging.service';
import { PaymentsController } from './payments.controller';

@Module({
  imports: [PrismaModule],
  providers: [PaymentGatewayFactory, StripeService, PhonePeService, PaymentLoggingService],
  controllers: [PaymentsController],
  exports: [PaymentGatewayFactory, PaymentLoggingService],
})
export class PaymentsModule {}
