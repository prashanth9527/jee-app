import { Module } from '@nestjs/common';
import { ExpertController } from './expert.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExpertController],
})
export class ExpertModule {} 