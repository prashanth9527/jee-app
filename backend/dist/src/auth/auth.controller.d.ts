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
    me(req: any): Promise<{
        needsProfileCompletion: boolean;
        id: string;
        email: string;
        phone: string | null;
        emailVerified: boolean;
        phoneVerified: boolean;
        hashedPassword: string | null;
        fullName: string;
        role: import(".prisma/client").$Enums.UserRole;
        googleId: string | null;
        profilePicture: string | null;
        createdAt: Date;
        updatedAt: Date;
        trialStartedAt: Date | null;
        trialEndsAt: Date | null;
        aiTestsUsed: number;
        aiTestsLimit: number;
        lastAiResetAt: Date | null;
        streamId: string | null;
    }>;
}
