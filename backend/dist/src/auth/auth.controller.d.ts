import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    register(dto: RegisterDto): Promise<{
        id: string;
        email: string;
    }>;
    startRegistration(dto: RegisterDto): Promise<{
        id: string;
        email: string;
        message: string;
    }>;
    completeRegistration(body: {
        userId: string;
        otpCode: string;
    }): Promise<{
        access_token: string;
        message: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            emailVerified: boolean;
        };
    }>;
    resendEmailOtp(body: {
        userId: string;
        email: string;
    }): Promise<{
        message: string;
    }>;
    completeProfile(req: any, body: {
        phone: string;
        streamId?: string;
    }): Promise<{
        message: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            phone: string | null;
            stream: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                code: string;
            } | null;
            emailVerified: boolean;
        };
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    sendEmailOtp(req: any): Promise<{
        ok: boolean;
    }>;
    sendPhoneOtp(req: any, phone: string): Promise<{
        ok: boolean;
    }>;
    sendLoginOtp(phone: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    verifyEmail(req: any, code: string): Promise<{
        ok: boolean;
    }>;
    verifyPhone(req: any, code: string): Promise<{
        ok: boolean;
    }>;
    me(req: any): Promise<any>;
}
