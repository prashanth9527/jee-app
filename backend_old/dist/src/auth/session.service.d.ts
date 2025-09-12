import { PrismaService } from '../prisma/prisma.service';
export declare class SessionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createSession(userId: string, deviceInfo?: string, ipAddress?: string, userAgent?: string): Promise<string>;
    validateSession(sessionId: string): Promise<{
        userId: string;
        isValid: boolean;
    }>;
    invalidateSession(sessionId: string): Promise<void>;
    invalidateAllUserSessions(userId: string): Promise<void>;
    cleanupExpiredSessions(): Promise<number>;
    getUserActiveSessions(userId: string): Promise<{
        id: string;
        createdAt: Date;
        sessionId: string;
        deviceInfo: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        lastActivityAt: Date;
    }[]>;
    hasActiveSessions(userId: string): Promise<boolean>;
}
