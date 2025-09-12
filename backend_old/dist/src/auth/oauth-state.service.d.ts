import { PrismaService } from '../prisma/prisma.service';
export declare class OAuthStateService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    generateState(provider: string, redirectUri?: string, ttlMinutes?: number): Promise<string>;
    validateAndConsumeState(state: string, provider: string): Promise<{
        redirectUri?: string;
    }>;
    cleanupExpiredStates(): Promise<number>;
    private generateRandomState;
}
