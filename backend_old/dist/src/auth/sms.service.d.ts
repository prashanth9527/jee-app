export declare class SmsService {
    private readonly logger;
    private client;
    constructor();
    sendOtpSms(phone: string, otp: string): Promise<{
        success: boolean;
        sid: any;
    }>;
}
