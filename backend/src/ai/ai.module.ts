import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AiService } from './ai.service';
import { AdvancedAnalyticsService } from './advanced-analytics.service';
import { ContentGenerationService } from './content-generation.service';
import { AIAssessmentsService } from './ai-assessments.service';
import { AdvancedAIController } from './advanced-ai.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [ConfigModule, PrismaModule, SubscriptionsModule],
  controllers: [AdvancedAIController],
  providers: [
    AiService,
    AdvancedAnalyticsService,
    ContentGenerationService,
    AIAssessmentsService
  ],
  exports: [
    AiService,
    AdvancedAnalyticsService,
    ContentGenerationService,
    AIAssessmentsService
  ],
})
export class AiModule {}