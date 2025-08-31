import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AIModule } from '../ai/ai.module';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';

@Module({
	imports: [PrismaModule, AIModule],
	providers: [ExamsService],
	controllers: [ExamsController],
})
export class ExamsModule {} 