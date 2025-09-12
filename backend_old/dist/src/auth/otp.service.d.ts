import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from './mailer.service';
import { SmsService } from './sms.service';
type OtpTypeLiteral = 'EMAIL' | 'PHONE';
export declare class OtpService {
    private readonly prisma;
    private readonly mailer;
    private readonly sms;
    private readonly otpLimits;
    constructor(prisma: PrismaService, mailer: MailerService, sms: SmsService);
    private checkOtpLimits;
    sendEmailOtp(userId: string, email: string): Promise<void>;
    sendPhoneOtp(userId: string, phone: string): Promise<void>;
    verifyOtp(userId: string, code: string, type: OtpTypeLiteral): Promise<boolean>;
    getOtpUsageStats(userId: string, type: OtpTypeLiteral): Promise<{
        hourlyCount: number;
        dailyCount: number;
        hourlyLimit: number;
        dailyLimit: number;
        cooldownMinutes: number;
        canRequestNow: boolean | 0 | null;
        timeUntilNextRequest: number;
    }>;
    sendPhoneOtpForRegistration(phone: string, ipAddress?: string): Promise<void>;
}
export {};
