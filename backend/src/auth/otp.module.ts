import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MailerService } from './mailer.service';
import { SmsService } from './sms.service';

@Module({
  imports: [PrismaModule],
  providers: [OtpService, MailerService, SmsService],
  exports: [OtpService],
})
export class OtpModule {}
