export declare class MailerService {
    private transporter;
    constructor();
    sendOtpEmail(to: string, code: string): Promise<void>;
}
