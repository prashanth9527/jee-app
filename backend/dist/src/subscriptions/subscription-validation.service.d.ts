import { PrismaService } from '../prisma/prisma.service';
export interface SubscriptionStatus {
    hasValidSubscription: boolean;
    isOnTrial: boolean;
    trialEndsAt?: Date;
    subscriptionEndsAt?: Date;
    daysRemaining: number;
    needsSubscription: boolean;
    message: string;
    planType?: 'MANUAL' | 'AI_ENABLED';
}
export interface AiUsageStatus {
    canUseAi: boolean;
    aiTestsUsed: number;
    aiTestsLimit: number;
    aiTestsRemaining: number;
    lastResetAt?: Date;
    nextResetAt?: Date;
    message: string;
}
export declare class SubscriptionValidationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validateStudentSubscription(userId: string): Promise<SubscriptionStatus>;
    canAccessContent(userId: string): Promise<boolean>;
    getSubscriptionDetails(userId: string): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            trialStartedAt: Date | null;
            trialEndsAt: Date | null;
        };
        subscriptionStatus: SubscriptionStatus;
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
    } | null>;
    hasAIAccess(userId: string): Promise<boolean>;
    validateAiUsage(userId: string): Promise<AiUsageStatus>;
    incrementAiUsage(userId: string): Promise<void>;
    private checkAndResetAiUsage;
    private calculateNextResetDate;
    setAiLimitForUser(userId: string, limit: number): Promise<void>;
}
