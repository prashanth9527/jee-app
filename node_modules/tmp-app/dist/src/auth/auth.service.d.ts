import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp.service';
export declare class AuthService {
    private readonly users;
    private readonly jwt;
    private readonly otp;
    constructor(users: UsersService, jwt: JwtService, otp: OtpService);
    register(params: {
        email: string;
        password: string;
        fullName: string;
        phone?: string;
    }): Promise<{
        id: string;
        email: string;
    }>;
    login(params: {
        email: string;
        password: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    sendEmailOtp(userId: string, email: string): Promise<{
        ok: boolean;
    }>;
    sendPhoneOtp(userId: string, phone: string): Promise<{
        ok: boolean;
    }>;
    verifyEmail(userId: string, code: string): Promise<{
        ok: boolean;
    }>;
    verifyPhone(userId: string, code: string): Promise<{
        ok: boolean;
    }>;
}
