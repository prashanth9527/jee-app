import { Module } from '@nestjs/common';
import { ExamsController, SubmissionsController, PapersController } from './exams.controller';
import { ExamsService } from './exams.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [ExamsController, SubmissionsController, PapersController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}