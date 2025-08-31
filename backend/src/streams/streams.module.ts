import { Module } from '@nestjs/common';
import { StreamsController } from './streams.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StreamsController],
  exports: [],
})
export class StreamsModule {} 