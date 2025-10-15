import { Module } from '@nestjs/common';
import { LMSService } from './lms.service';
import { LMSController } from './lms.controller';
import { LessonProgressService } from './lesson-progress.service';
import { StudentLessonProgressController, AdminLessonAnalyticsController } from './lesson-progress.controller';
import { LmsSummaryController } from './lms-summary.controller';
import { LmsSummaryService } from './lms-summary.service';
import { ContentLearningService } from './content-learning.service';
import { ContentLearningController } from './content-learning.controller';
import { OpenAIService } from '../ai/openai.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from '../aws/aws.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { MailerService } from '../auth/mailer.service';

@Module({
  imports: [PrismaModule, ConfigModule, AwsModule, SubscriptionsModule],
  controllers: [
    LMSController, 
    StudentLessonProgressController, 
    AdminLessonAnalyticsController,
    LmsSummaryController,
    ContentLearningController
  ],
  providers: [LMSService, LessonProgressService, LmsSummaryService, ContentLearningService, OpenAIService, MailerService],
  exports: [LMSService, LessonProgressService, LmsSummaryService, ContentLearningService],
})
export class LMSModule {}
