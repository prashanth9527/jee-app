import { PrismaService } from '../prisma/prisma.service';
export declare class SubscriptionsService {
    private readonly prisma;
    private stripe;
    constructor(prisma: PrismaService);
    listPlans(): import(".prisma/client").Prisma.PrismaPromise<{
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
    }[]>;
    createPlan(data: {
        name: string;
        description?: string;
        priceCents: number;
        currency?: string;
        interval?: 'MONTH' | 'YEAR';
    }): import(".prisma/client").Prisma.Prisma__PlanClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    updatePlan(id: string, data: {
        name?: string;
        description?: string;
        priceCents?: number;
        currency?: string;
        interval?: 'MONTH' | 'YEAR';
        isActive?: boolean;
    }): import(".prisma/client").Prisma.Prisma__PlanClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    createCheckoutSession(userId: string, planId: string, successUrl: string, cancelUrl: string): Promise<{
        url: any;
    }>;
    handleWebhook(event: any): Promise<{
        received: boolean;
    }>;
    userHasAccess(userId: string): Promise<boolean>;
}
