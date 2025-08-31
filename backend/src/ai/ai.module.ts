import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AIService } from './ai.service';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [AIService, SubscriptionValidationService],
  exports: [AIService],
})
export class AIModule {} 