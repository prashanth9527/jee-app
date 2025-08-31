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
            createdAt: Date;
            description: string | null;
            _count: {
                submissions: number;
            };
            title: string;
            subjectIds: string[];
            topicIds: string[];
            subtopicIds: string[];
            questionIds: string[];
            timeLimitMin: number | null;
        }[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
        };
    }>;
    getAiUsage(req: any): Promise<import("../subscriptions/subscription-validation.service").AiUsageStatus>;
    getExamHistory(req: any, page?: string, limit?: string, type?: string): Promise<{
        submissions: {
            id: string;
            title: string;
            startedAt: Date;
            submittedAt: Date | null;
            totalQuestions: number;
            correctCount: number;
            scorePercent: number | null;
            timeLimitMin: number | null;
            duration: number | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
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
        } | null;
    }>;
    getProfile(req: any): Promise<{
        id: string;
        email: string;
        phone: string | null;
        emailVerified: boolean;
        phoneVerified: boolean;
        fullName: string;
        role: import(".prisma/client").$Enums.UserRole;
        createdAt: Date;
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
    getSubjects(req: any): Promise<{
        id: string;
        name: string;
        description: string | null;
        _count: {
            questions: number;
        };
    }[]>;
    getTopics(subjectId?: string): Promise<({
        subject: {
            name: string;
        };
        _count: {
            questions: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        subjectId: string;
    })[]>;
    getSubtopics(topicId?: string, subjectId?: string): Promise<({
        topic: {
            name: string;
            subject: {
                name: string;
            };
        };
        _count: {
            questions: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        topicId: string;
    })[]>;
    getQuestionAvailability(subjectId?: string, topicId?: string, subtopicId?: string, difficulty?: string): Promise<{
        totalQuestions: number;
        difficultyBreakdown: {
            difficulty: import(".prisma/client").$Enums.Difficulty;
            count: number;
        }[];
    }>;
}
