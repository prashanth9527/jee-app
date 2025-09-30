import { Module } from '@nestjs/common';
import { AdminAnalyticsService } from './analytics.service';
import { AdminAnalyticsController } from './analytics.controller';
import { SystemSettingsService } from './system-settings.service';
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
import { SyllabusImportController } from './syllabus-import.controller';
import { SyllabusImportService } from './syllabus-import.service';
import { PDFProcessorController } from './pdf-processor.controller';
import { PDFProcessorService } from './pdf-processor.service';
import { PDFReviewController } from './pdf-review.controller';
import { PDFReviewService } from './pdf-review.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [PrismaModule, AwsModule],
  controllers: [
    AdminAnalyticsController,
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
    SyllabusImportController,
    PDFProcessorController,
    PDFReviewController
  ],
  providers: [AdminAnalyticsService, SystemSettingsService, SyllabusImportService, PDFProcessorService, PDFReviewService],
  exports: [AdminAnalyticsService, SystemSettingsService],
})
export class AdminModule {}