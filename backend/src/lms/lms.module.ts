import { Module } from '@nestjs/common';
import { LMSService } from './lms.service';
import { LMSController } from './lms.controller';
import { LessonProgressService } from './lesson-progress.service';
import { StudentLessonProgressController, AdminLessonAnalyticsController } from './lesson-progress.controller';
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
    AdminLessonAnalyticsController
  ],
  providers: [LMSService, LessonProgressService, MailerService],
  exports: [LMSService, LessonProgressService],
})
export class LMSModule {}
