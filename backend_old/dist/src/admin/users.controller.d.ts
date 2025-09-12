import { PrismaService } from '../prisma/prisma.service';
export declare class AdminUsersController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    listUsers(page?: string, limit?: string, search?: string, role?: string, emailVerified?: string, phoneVerified?: string): Promise<{
        users: ({
            subscriptions: ({
                plan: {
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
            _count: {
                subscriptions: number;
                examSubmissions: number;
            };
        } & {
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
    findUser(id: string): Promise<{
        subscriptions: ({
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
        examSubmissions: ({
            examPaper: {
                id: string;
                title: string;
            };
        } & {
            id: string;
            startedAt: Date;
            submittedAt: Date | null;
            totalQuestions: number;
            correctCount: number;
            scorePercent: number | null;
            userId: string;
            examPaperId: string;
        })[];
        _count: {
            subscriptions: number;
            examSubmissions: number;
        };
    } & {
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
    }>;
    updateUser(id: string, body: {
        fullName?: string;
        email?: string;
        phone?: string;
        role?: 'ADMIN' | 'STUDENT';
        emailVerified?: boolean;
        phoneVerified?: boolean;
    }): Promise<{
        _count: {
            subscriptions: number;
            examSubmissions: number;
        };
    } & {
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
    }>;
    deleteUser(id: string): Promise<{
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
    }>;
    verifyEmail(id: string): Promise<{
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
    }>;
    verifyPhone(id: string): Promise<{
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
    }>;
    startTrial(id: string, body: {
        days?: number;
    }): Promise<{
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
    }>;
    endTrial(id: string): Promise<{
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
    }>;
    getAnalytics(): Promise<{
        overview: {
            totalUsers: number;
            adminUsers: number;
            studentUsers: number;
            emailVerifiedUsers: number;
            phoneVerifiedUsers: number;
            trialUsers: number;
            subscribedUsers: number;
        };
        recentUsers: {
            id: string;
            email: string;
            emailVerified: boolean;
            phoneVerified: boolean;
            fullName: string;
            role: import(".prisma/client").$Enums.UserRole;
            createdAt: Date;
        }[];
        topExamUsers: {
            id: string;
            email: string;
            fullName: string;
            _count: {
                examSubmissions: number;
            };
        }[];
    }>;
    getRoleAnalytics(): Promise<{
        roleStats: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.UserGroupByOutputType, "role"[]> & {
            _count: number;
        })[];
        verificationStats: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.UserGroupByOutputType, ("emailVerified" | "phoneVerified")[]> & {
            _count: number;
        })[];
    }>;
}
