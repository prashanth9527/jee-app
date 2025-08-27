export declare class SmsService {
    private client;
    constructor();
    sendOtpSms(to: string, code: string): Promise<void>;
}
