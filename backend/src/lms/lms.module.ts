import { Module } from '@nestjs/common';
import { LMSService } from './lms.service';
import { LMSController } from './lms.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { AwsModule } from '../aws/aws.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [PrismaModule, ConfigModule, AwsModule, SubscriptionsModule],
  controllers: [LMSController],
  providers: [LMSService],
  exports: [LMSService],
})
export class LMSModule {}
