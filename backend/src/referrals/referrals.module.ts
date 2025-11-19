import { Module } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { ReferralsController } from './referrals.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailerService } from '../auth/mailer.service';

@Module({
  imports: [PrismaModule],
  controllers: [ReferralsController],
  providers: [ReferralsService, MailerService],
  exports: [ReferralsService]
})
export class ReferralsModule {} 