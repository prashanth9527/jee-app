import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
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

@Module({
	imports: [PrismaModule],
	controllers: [
		AdminSubjectsController, AdminStreamsController, AdminTopicsController, AdminSubtopicsController,
		AdminTagsController, AdminQuestionsController, AdminPYQController,
		AdminExamPapersController, AdminSubscriptionsController, AdminUsersController,
		AdminAnalyticsController, AdminQuestionReportsController
	],
})
export class AdminModule {} 