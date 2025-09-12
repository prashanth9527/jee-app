import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { PYQController } from './pyq.controller';
import { StudentLeaderboardController } from './leaderboard.controller';
import { StudentQuestionReportsController } from './question-reports.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';

@Module({
	imports: [PrismaModule],
	controllers: [StudentController, PYQController, StudentLeaderboardController, StudentQuestionReportsController],
	providers: [SubscriptionValidationService],
})
export class StudentModule {} 