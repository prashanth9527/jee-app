import { Module } from '@nestjs/common';
import { BlogsController, PublicBlogsController } from './blogs.controller';
import { BlogsService } from './blogs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { FileUploadModule } from '../file-upload/file-upload.module';

@Module({
  imports: [PrismaModule, AiModule, FileUploadModule],
  controllers: [BlogsController, PublicBlogsController],
  providers: [BlogsService],
  exports: [BlogsService],
})
export class BlogsModule {}

