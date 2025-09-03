import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AISuggestionsService } from './ai-suggestions.service';
import { AISuggestionsController } from './ai-suggestions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [ConfigModule, PrismaModule, SubscriptionsModule],
  controllers: [AISuggestionsController],
  providers: [AISuggestionsService],
  exports: [AISuggestionsService]
})
export class AISuggestionsModule {} 