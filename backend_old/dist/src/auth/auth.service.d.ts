import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { OtpService } from './otp.service';
import { ReferralsService } from '../referrals/referrals.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionService } from './session.service';
export declare class AuthService {
    private readonly users;
    private readonly jwt;
    private readonly otp;
    private readonly referralsService;
    private readonly prisma;
    private readonly sessionService;
    constructor(users: UsersService, jwt: JwtService, otp: OtpService, referralsService: ReferralsService, prisma: PrismaService, sessionService: SessionService);
    register(params: {
        email: string;
        password: string;
        fullName: string;
        phone: string;
        referralCode?: string;
        streamId: string;
    }): Promise<{
        id: string;
        email: string;
    }>;
    startRegistration(params: {
        email: string;
        password: string;
        fullName: string;
        phone: string;
        referralCode?: string;
        streamId: string;
    }): Promise<{
        id: string;
        email: string;
        message: string;
    }>;
    completeRegistration(userId: string, otpCode: string): Promise<{
        access_token: string;
        message: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            emailVerified: boolean;
        };
    }>;
    resendEmailOtp(userId: string, email: string): Promise<{
        message: string;
    }>;
    completeProfile(userId: string, phone: string, streamId?: string): Promise<{
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
    login(params: {
        email?: string;
        password?: string;
        phone?: string;
        otpCode?: string;
        deviceInfo?: string;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    loginWithPassword(email: string, password: string, deviceInfo?: string, ipAddress?: string, userAgent?: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    loginWithPhoneOtp(phone: string, otpCode: string, deviceInfo?: string, ipAddress?: string, userAgent?: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
        };
    }>;
    loginWithEmailOtp(email: string, otpCode: string, deviceInfo?: string, ipAddress?: string, userAgent?: string): Promise<{
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
    sendLoginOtp(phone: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    sendEmailLoginOtp(email: string): Promise<{
        ok: boolean;
        message: string;
    }>;
    verifyEmail(userId: string, code: string): Promise<{
        ok: boolean;
    }>;
    verifyPhone(userId: string, code: string): Promise<{
        ok: boolean;
    }>;
    generateJwtToken(user: any): Promise<string>;
    getUserById(userId: string): Promise<{
        id: string;
        email: string;
        phone: string | null;
        pendingPhone: string | null;
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
    } | null>;
    sendPhoneOtpForRegistration(phone: string, ipAddress?: string): Promise<{
        ok: boolean;
    }>;
    getOtpUsageStats(userId: string, type: 'EMAIL' | 'PHONE'): Promise<{
        hourlyCount: number;
        dailyCount: number;
        hourlyLimit: number;
        dailyLimit: number;
        cooldownMinutes: number;
        canRequestNow: boolean | 0 | null;
        timeUntilNextRequest: number;
    }>;
    sendPhoneVerificationOtp(userId: string): Promise<{
        ok: boolean;
        message: string;
        phone: string | null;
    }>;
    getVerificationStatus(userId: string): Promise<{
        emailVerified: boolean;
        phoneVerified: boolean;
        hasPhone: boolean;
        phone: string | null;
        needsPhoneVerification: boolean;
        canVerifyPhone: boolean;
    }>;
    logout(sessionId: string): Promise<void>;
    logoutAllDevices(userId: string): Promise<void>;
    getUserSessions(userId: string): Promise<{
        id: string;
        createdAt: Date;
        sessionId: string;
        deviceInfo: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        lastActivityAt: Date;
    }[]>;
}
