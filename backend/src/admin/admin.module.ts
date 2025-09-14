import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AwsModule } from '../aws/aws.module';
import { AdminSubjectsController } from './subjects.controller';
import { AdminStreamsController } from './streams.controller';
import { AdminTopicsController } from './topics.controller';
import { AdminSubtopicsController } from './subtopics.controller';
import { AdminTagsController } from './tags.controller';
import { AdminQuestionsController } from './questions.controller';
import { AdminPYQController } from './pyq.controller';
import { AdminExamPapersController } from './exam-papers.controller';
import { AdminSubscriptionsController } from './subscriptions.controller';
import { AdminUsersController } from './users.controller';
import { AdminAnalyticsController } from './analytics.controller';
import { AdminQuestionReportsController } from './question-reports.controller';
import { AdminNotificationsController } from './notifications.controller';
import { SystemSettingsController } from './system-settings.controller';
import { SystemSettingsService } from './system-settings.service';
import { ContentSeedingController } from './content-seeding.controller';
import { ContentSeedingService } from './content-seeding.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { FileUploadModule } from '../file-upload/file-upload.module';

@Module({
	imports: [PrismaModule, AwsModule, NotificationsModule, FileUploadModule],
	controllers: [
		AdminSubjectsController, AdminStreamsController, AdminTopicsController, AdminSubtopicsController,
		AdminTagsController, AdminQuestionsController, AdminPYQController,
		AdminExamPapersController, AdminSubscriptionsController, AdminUsersController,
		AdminAnalyticsController, AdminQuestionReportsController, AdminNotificationsController, 
		SystemSettingsController, ContentSeedingController
	],
	providers: [SystemSettingsService, ContentSeedingService],
	exports: [SystemSettingsService, ContentSeedingService],
})
export class AdminModule {} 