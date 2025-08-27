import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminSubjectsController } from './subjects.controller';
import { AdminTopicsController } from './topics.controller';
import { AdminSubtopicsController } from './subtopics.controller';
import { AdminTagsController } from './tags.controller';

@Module({
	imports: [PrismaModule],
	controllers: [AdminSubjectsController, AdminTopicsController, AdminSubtopicsController, AdminTagsController],
})
export class AdminModule {} 