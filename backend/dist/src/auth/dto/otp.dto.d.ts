export declare enum OtpChannel {
    EMAIL = "EMAIL",
    PHONE = "PHONE"
}
export declare class SendOtpDto {
    channel: OtpChannel;
    target: string;
}
export declare class VerifyOtpDto {
    channel: OtpChannel;
    code: string;
}
