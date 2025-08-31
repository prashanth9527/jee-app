import { SubscriptionsService } from './subscriptions.service';
export declare class SubscriptionsController {
    private readonly subs;
    constructor(subs: SubscriptionsService);
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
    createPlan(body: {
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
    updatePlan(id: string, body: {
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
    createCheckout(req: any, body: {
        planId: string;
        successUrl: string;
        cancelUrl: string;
    }): Promise<{
        url: any;
    }>;
    webhook(event: any): Promise<{
        received: boolean;
    }>;
}
