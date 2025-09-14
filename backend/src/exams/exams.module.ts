import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';

@Module({
  imports: [PrismaModule, AiModule, SubscriptionsModule],
	providers: [ExamsService],
	controllers: [ExamsController],
})
export class ExamsModule {} 