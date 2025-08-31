import { Module } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ReferralsController],
  providers: [ReferralsService],
  exports: [ReferralsService]
})
export class ReferralsModule {} 