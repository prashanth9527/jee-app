import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';

@Module({
	imports: [PrismaModule],
	controllers: [StudentController],
	providers: [SubscriptionValidationService],
})
export class StudentModule {} 