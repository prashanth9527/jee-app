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
    verifyEmail(req: any, code: string): Promise<{
        ok: boolean;
    }>;
    verifyPhone(req: any, code: string): Promise<{
        ok: boolean;
    }>;
    me(req: any): any;
}
