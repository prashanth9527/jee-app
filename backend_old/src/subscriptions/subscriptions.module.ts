import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionValidationService } from './subscription-validation.service';

@Module({
	imports: [PrismaModule],
	providers: [SubscriptionsService, SubscriptionValidationService],
	controllers: [SubscriptionsController],
	exports: [SubscriptionsService, SubscriptionValidationService],
})
export class SubscriptionsModule {} 