import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { OAuthStateService } from './oauth-state.service';
interface GoogleLoginDto {
    googleId: string;
    email: string;
    name: string;
    picture?: string;
}
interface GoogleTokenExchangeDto {
    code: string;
    redirectUri: string;
    state?: string;
}
interface GoogleStateDto {
    redirectUri?: string;
}
export declare class GoogleAuthController {
    private authService;
    private prisma;
    private oauthStateService;
    private usedCodes;
    constructor(authService: AuthService, prisma: PrismaService, oauthStateService: OAuthStateService);
    generateState(stateData: GoogleStateDto): Promise<{
        state: string;
        message: string;
    }>;
    googleLogin(googleData: GoogleLoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
            profilePicture: string | null;
            emailVerified: boolean;
            stream: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                code: string;
            } | null;
            subscriptions: ({
                plan: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    priceCents: number;
                    currency: string;
                    interval: import(".prisma/client").$Enums.PlanInterval;
                    planType: import(".prisma/client").$Enums.PlanType;
                    stripePriceId: string | null;
                    isActive: boolean;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                startedAt: Date;
                userId: string;
                status: import(".prisma/client").$Enums.SubscriptionStatus;
                planId: string;
                endsAt: Date | null;
                stripeCustomerId: string | null;
                stripeSubId: string | null;
                stripeStatus: string | null;
            })[];
            needsProfileCompletion: boolean;
        };
    }>;
    googleRegister(googleData: GoogleLoginDto & {
        streamId?: string;
        phone?: string;
    }): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
            profilePicture: string | null;
            emailVerified: boolean;
            stream: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
                isActive: boolean;
                code: string;
            } | null;
            subscriptions: ({
                plan: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    priceCents: number;
                    currency: string;
                    interval: import(".prisma/client").$Enums.PlanInterval;
                    planType: import(".prisma/client").$Enums.PlanType;
                    stripePriceId: string | null;
                    isActive: boolean;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                startedAt: Date;
                userId: string;
                status: import(".prisma/client").$Enums.SubscriptionStatus;
                planId: string;
                endsAt: Date | null;
                stripeCustomerId: string | null;
                stripeSubId: string | null;
                stripeStatus: string | null;
            })[];
        };
    }>;
    exchangeToken(tokenData: GoogleTokenExchangeDto): Promise<{
        access_token: any;
        user: {
            id: any;
            email: any;
            name: any;
            picture: any;
        };
    }>;
    cleanupExpiredStates(): Promise<{
        message: string;
        cleanedCount: number;
    }>;
}
export {};
