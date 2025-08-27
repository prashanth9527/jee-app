import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from './mailer.service';
import { SmsService } from './sms.service';
type OtpTypeLiteral = 'EMAIL' | 'PHONE';
export declare class OtpService {
    private readonly prisma;
    private readonly mailer;
    private readonly sms;
    constructor(prisma: PrismaService, mailer: MailerService, sms: SmsService);
    sendEmailOtp(userId: string, email: string): Promise<void>;
    sendPhoneOtp(userId: string, phone: string): Promise<void>;
    verifyOtp(userId: string, code: string, type: OtpTypeLiteral): Promise<boolean>;
}
export {};
