import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminAnalyticsService } from './analytics.service';
import { AdminAnalyticsController } from './analytics.controller';
import { SystemSettingsService } from './system-settings.service';
import { AdminStreamsController } from './streams.controller';
import { AdminSubjectsController } from './subjects.controller';
import { AdminLessonsController } from './lessons.controller';
import { AdminTopicsController } from './topics.controller';
import { AdminSubtopicsController } from './subtopics.controller';
import { AdminTagsController } from './tags.controller';
import { AdminQuestionsController } from './questions.controller';
import { AdminPYQController } from './pyq.controller';
import { AdminExamPapersController } from './exam-papers.controller';
import { AdminQuestionReportsController } from './question-reports.controller';
import { SystemSettingsController } from './system-settings.controller';
import { AdminSubscriptionsController } from './subscriptions.controller';
import { AdminUsersController } from './users.controller';
import { SyllabusImportController } from './syllabus-import.controller';
import { SyllabusImportService } from './syllabus-import.service';
import { PDFProcessorController } from './pdf-processor.controller';
import { PDFProcessorService } from './pdf-processor.service';
import { PDFProcessorCacheController } from './pdf-processor-cache.controller';
import { PDFProcessorCacheService } from './pdf-processor-cache.service';
import { PDFReviewController } from './pdf-review.controller';
import { PDFReviewService } from './pdf-review.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AwsModule } from '../aws/aws.module';
import { AIProviderFactory } from '../ai/ai-provider.factory';
import { OpenAIService } from '../ai/openai.service';
import { DeepSeekService } from '../ai/deepseek.service';
import { ClaudeService } from '../ai/claude.service';
import { AiService } from '../ai/ai.service';
import { MathpixService } from './mathpix.service';
import { MathpixProcessorService } from './mathpix-processor.service';
import { ZipProcessorService } from './zip-processor.service';
import { ImageWatermarkRemoverService } from './image-watermark-remover.service';

@Module({
  imports: [PrismaModule, AwsModule, ConfigModule],
  controllers: [
    AdminAnalyticsController,
    AdminStreamsController,
    AdminSubjectsController,
    AdminLessonsController,
    AdminTopicsController,
    AdminSubtopicsController,
    AdminTagsController,
    AdminQuestionsController,
    AdminPYQController,
    AdminExamPapersController,
    AdminQuestionReportsController,
    SystemSettingsController,
    AdminSubscriptionsController,
    AdminUsersController,
    SyllabusImportController,
    PDFProcessorController,
    PDFProcessorCacheController,
    PDFReviewController
  ],
  providers: [
    AdminAnalyticsService, 
    SystemSettingsService, 
    SyllabusImportService, 
    PDFProcessorService, 
    PDFProcessorCacheService,
    PDFReviewService,
    MathpixService,
    MathpixProcessorService,
    ZipProcessorService,
    ImageWatermarkRemoverService,
    AIProviderFactory,
    OpenAIService,
    DeepSeekService,
    ClaudeService,
    AiService
  ],
  exports: [AdminAnalyticsService, SystemSettingsService],
})
export class AdminModule {}