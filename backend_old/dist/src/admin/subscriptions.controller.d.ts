import { PrismaService } from '../prisma/prisma.service';
export declare class AdminSubscriptionsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listPlans(page?: string, limit?: string, search?: string): Promise<{
        plans: ({
            _count: {
                subscriptions: number;
            };
        } & {
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
        })[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    findPlan(id: string): Promise<{
        subscriptions: ({
            user: {
                id: string;
                email: string;
                fullName: string;
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
        _count: {
            subscriptions: number;
        };
    } & {
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
    }>;
    createPlan(body: {
        name: string;
        description?: string;
        priceCents: number;
        currency?: string;
        interval?: 'MONTH' | 'YEAR';
    }): Promise<{
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
    }>;
    updatePlan(id: string, body: {
        name?: string;
        description?: string;
        priceCents?: number;
        currency?: string;
        interval?: 'MONTH' | 'YEAR';
        isActive?: boolean;
    }): Promise<{
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
    }>;
    deletePlan(id: string): Promise<{
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
    }>;
    listSubscriptions(page?: string, limit?: string, search?: string, status?: string, planId?: string): Promise<{
        subscriptions: ({
            user: {
                id: string;
                email: string;
                fullName: string;
            };
            plan: {
                id: string;
                name: string;
                priceCents: number;
                currency: string;
                interval: import(".prisma/client").$Enums.PlanInterval;
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
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    findSubscription(id: string): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
            createdAt: Date;
        };
        plan: {
            id: string;
            name: string;
            description: string | null;
            priceCents: number;
            currency: string;
            interval: import(".prisma/client").$Enums.PlanInterval;
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
    }>;
    updateSubscription(id: string, body: {
        status?: 'ACTIVE' | 'CANCELED' | 'EXPIRED';
        endsAt?: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
        };
        plan: {
            id: string;
            name: string;
            priceCents: number;
            currency: string;
            interval: import(".prisma/client").$Enums.PlanInterval;
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
    }>;
    getAnalytics(): Promise<{
        overview: {
            totalPlans: number;
            totalSubscriptions: number;
            activeSubscriptions: number;
            canceledSubscriptions: number;
            mrr: number;
        };
        recentSubscriptions: ({
            user: {
                email: string;
                fullName: string;
            };
            plan: {
                name: string;
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
        planDistribution: ({
            _count: {
                subscriptions: number;
            };
        } & {
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
        })[];
    }>;
}
