import { Module } from '@nestjs/common';
import { BlogsController, PublicBlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PrismaModule, AiModule],
  controllers: [BlogsController, PublicBlogsController],
  providers: [BlogsService],
  exports: [BlogsService],
})
export class BlogsModule {}

