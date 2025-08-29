import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';
export declare class StudentController {
    private readonly prisma;
    private readonly subscriptionValidation;
    constructor(prisma: PrismaService, subscriptionValidation: SubscriptionValidationService);
    getDashboard(req: any): Promise<{
        totalExamsTaken: number;
        averageScore: number;
        totalQuestionsAnswered: number;
        correctAnswers: number;
        subjects: {
            name: any;
            score: number;
            questions: any;
        }[];
    }>;
    getExamPapers(req: any, page?: string, limit?: string, search?: string, subjectId?: string): Promise<{
        papers: {
            subjects: {
                id: string;
                name: string;
            }[];
            hasAttempted: boolean;
            questionCount: number;
            id: string;
            _count: {
                submissions: number;
            };
            title: string;
            description: string | null;
            subjectIds: string[];
            topicIds: string[];
            subtopicIds: string[];
            questionIds: string[];
            timeLimitMin: number | null;
            createdAt: Date;
        }[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
        };
    }>;
    getExamHistory(req: any, page?: string, limit?: string): Promise<{
        submissions: {
            examPaper: {
                subjects: string[];
                id: string;
                title: string;
                description: string | null;
                subjectIds: string[];
            };
            userId: string;
            id: string;
            examPaperId: string;
            startedAt: Date;
            submittedAt: Date | null;
            totalQuestions: number;
            correctCount: number;
            scorePercent: number | null;
        }[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
        };
    }>;
    getPerformance(req: any): Promise<{
        subjectPerformance: {
            subjectId: any;
            subjectName: any;
            totalQuestions: any;
            correctAnswers: any;
            score: number;
        }[];
        topicPerformance: {
            topicId: any;
            topicName: any;
            subjectName: any;
            totalQuestions: any;
            correctAnswers: any;
            score: number;
        }[];
        difficultyPerformance: {
            difficulty: any;
            totalQuestions: any;
            correctAnswers: any;
            score: number;
        }[];
        recentTrend: {
            score: number;
            date: Date | null;
            examTitle: string;
        }[];
    }>;
    getSubscriptionStatus(req: any): Promise<{
        subscriptionStatus: import("../subscriptions/subscription-validation.service").SubscriptionStatus;
        subscriptionDetails: {
            user: {
                id: string;
                email: string;
                fullName: string;
                trialStartedAt: Date | null;
                trialEndsAt: Date | null;
            };
            subscriptionStatus: import("../subscriptions/subscription-validation.service").SubscriptionStatus;
            subscriptions: ({
                plan: {
                    id: string;
                    name: string;
                    description: string | null;
                    createdAt: Date;
                    updatedAt: Date;
                    priceCents: number;
                    currency: string;
                    interval: import(".prisma/client").$Enums.PlanInterval;
                    stripePriceId: string | null;
                    isActive: boolean;
                };
            } & {
                userId: string;
                id: string;
                startedAt: Date;
                createdAt: Date;
                updatedAt: Date;
                planId: string;
                status: import(".prisma/client").$Enums.SubscriptionStatus;
                endsAt: Date | null;
                stripeCustomerId: string | null;
                stripeSubId: string | null;
                stripeStatus: string | null;
            })[];
        } | null;
    }>;
    getProfile(req: any): Promise<{
        id: string;
        createdAt: Date;
        email: string;
        phone: string | null;
        emailVerified: boolean;
        phoneVerified: boolean;
        fullName: string;
        role: import(".prisma/client").$Enums.UserRole;
        trialStartedAt: Date | null;
        trialEndsAt: Date | null;
        subscriptions: ({
            plan: {
                name: string;
                priceCents: number;
                currency: string;
                interval: import(".prisma/client").$Enums.PlanInterval;
            };
        } & {
            userId: string;
            id: string;
            startedAt: Date;
            createdAt: Date;
            updatedAt: Date;
            planId: string;
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            endsAt: Date | null;
            stripeCustomerId: string | null;
            stripeSubId: string | null;
            stripeStatus: string | null;
        })[];
    } | null>;
    updateProfile(req: any, body: {
        fullName?: string;
        phone?: string;
    }): Promise<{
        id: string;
        email: string;
        phone: string | null;
        emailVerified: boolean;
        phoneVerified: boolean;
        fullName: string;
        role: import(".prisma/client").$Enums.UserRole;
    }>;
    getSubjects(): Promise<{
        id: string;
        _count: {
            questions: number;
        };
        name: string;
        description: string | null;
    }[]>;
    getTopics(subjectId?: string): Promise<({
        _count: {
            questions: number;
        };
        subject: {
            name: string;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        subjectId: string;
    })[]>;
    getSubtopics(topicId?: string, subjectId?: string): Promise<({
        _count: {
            questions: number;
        };
        topic: {
            name: string;
            subject: {
                name: string;
            };
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        createdAt: Date;
        updatedAt: Date;
        topicId: string;
    })[]>;
}
