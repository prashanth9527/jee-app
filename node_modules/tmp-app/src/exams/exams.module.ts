import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';

@Module({
	imports: [PrismaModule],
	providers: [ExamsService],
	controllers: [ExamsController],
})
export class ExamsModule {} 