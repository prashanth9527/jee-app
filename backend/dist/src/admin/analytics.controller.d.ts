import { PrismaService } from '../prisma/prisma.service';
export declare class AdminAnalyticsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getOverview(): Promise<{
        overview: {
            totalUsers: number;
            totalQuestions: number;
            totalExamPapers: number;
            totalExamSubmissions: number;
            totalSubscriptions: number;
            totalPlans: number;
            activeSubscriptions: number;
            completedSubmissions: number;
            newUsersLast30Days: number;
            newSubmissionsLast30Days: number;
            newSubscriptionsLast30Days: number;
            mrr: number;
        };
    }>;
    getUserAnalytics(): Promise<{
        monthlyRegistrations: Record<string, number>;
        roleDistribution: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.UserGroupByOutputType, "role"[]> & {
            _count: number;
        })[];
        verificationStats: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.UserGroupByOutputType, ("emailVerified" | "phoneVerified")[]> & {
            _count: number;
        })[];
        trialUsers: number;
        topUsers: {
            id: string;
            _count: {
                examSubmissions: number;
            };
            email: string;
            fullName: string;
        }[];
    }>;
    getExamAnalytics(): Promise<{
        overview: {
            totalSubmissions: number;
            completedSubmissions: number;
            completionRate: number;
            averageScore: number;
        };
        subjectPerformance: any[];
        topicPerformance: any[];
        recentSubmissions: ({
            user: {
                email: string;
                fullName: string;
            };
            examPaper: {
                title: string;
            };
        } & {
            id: string;
            userId: string;
            startedAt: Date;
            scorePercent: number | null;
            totalQuestions: number;
            correctCount: number;
            examPaperId: string;
            submittedAt: Date | null;
        })[];
        examPaperPopularity: {
            id: string;
            _count: {
                submissions: number;
            };
            title: string;
        }[];
    }>;
    getQuestionAnalytics(): Promise<{
        overview: {
            totalQuestions: number;
        };
        questionsBySubject: {
            subject: {
                name: string;
            };
            subjectId: string | null;
            _count: number;
        }[];
        questionsByTopic: {
            topic: {
                name: string;
                subject: {
                    name: string;
                };
            };
            topicId: string | null;
            _count: number;
        }[];
        questionsBySubtopic: {
            subtopic: {
                name: string;
                topic: {
                    name: string;
                    subject: {
                        name: string;
                    };
                };
            };
            subtopicId: string | null;
            _count: number;
        }[];
        difficultyDistribution: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.QuestionGroupByOutputType, "difficulty"[]> & {
            _count: number;
        })[];
        mostUsedQuestions: any[];
        questionPerformance: any[];
    }>;
    getSubscriptionAnalytics(): Promise<{
        overview: {
            totalSubscriptions: number;
            activeSubscriptions: number;
            canceledSubscriptions: number;
            mrr: number;
            arr: number;
            churnRate: number;
        };
        planPopularity: {
            id: string;
            name: string;
            priceCents: number;
            currency: string;
            interval: import(".prisma/client").$Enums.PlanInterval;
            _count: {
                subscriptions: number;
            };
        }[];
        monthlySubscriptions: Record<string, number>;
        recentSubscriptions: ({
            user: {
                email: string;
                fullName: string;
            };
            plan: {
                name: string;
                priceCents: number;
                currency: string;
            };
        } & {
            status: import(".prisma/client").$Enums.SubscriptionStatus;
            id: string;
            userId: string;
            planId: string;
            startedAt: Date;
            endsAt: Date | null;
            stripeCustomerId: string | null;
            stripeSubId: string | null;
            stripeStatus: string | null;
            createdAt: Date;
            updatedAt: Date;
        })[];
    }>;
    getContentAnalytics(): Promise<{
        overview: {
            totalSubjects: number;
            totalTopics: number;
            totalSubtopics: number;
            totalQuestions: number;
            totalTags: number;
        };
        subjectsWithCounts: {
            id: string;
            name: string;
            _count: {
                topics: number;
                questions: number;
            };
        }[];
        topicsWithCounts: {
            id: string;
            name: string;
            _count: {
                questions: number;
                subtopics: number;
            };
            subject: {
                name: string;
            };
        }[];
        subtopicsWithCounts: {
            id: string;
            name: string;
            _count: {
                questions: number;
            };
            topic: {
                name: string;
                subject: {
                    name: string;
                };
            };
        }[];
        tagUsage: {
            id: string;
            name: string;
            _count: {
                questions: number;
            };
        }[];
        monthlyQuestions: Record<string, number>;
    }>;
    getDashboardData(): Promise<{
        overview: {
            totalUsers: number;
            totalQuestions: number;
            totalExamPapers: number;
            totalExamSubmissions: number;
            totalSubscriptions: number;
            totalPlans: number;
            activeSubscriptions: number;
            completedSubmissions: number;
            newUsersLast30Days: number;
            newSubmissionsLast30Days: number;
            newSubscriptionsLast30Days: number;
            mrr: number;
        };
        userAnalytics: {
            monthlyRegistrations: Record<string, number>;
            roleDistribution: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.UserGroupByOutputType, "role"[]> & {
                _count: number;
            })[];
            verificationStats: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.UserGroupByOutputType, ("emailVerified" | "phoneVerified")[]> & {
                _count: number;
            })[];
            trialUsers: number;
            topUsers: {
                id: string;
                _count: {
                    examSubmissions: number;
                };
                email: string;
                fullName: string;
            }[];
        };
        examAnalytics: {
            overview: {
                totalSubmissions: number;
                completedSubmissions: number;
                completionRate: number;
                averageScore: number;
            };
            subjectPerformance: any[];
            topicPerformance: any[];
            recentSubmissions: ({
                user: {
                    email: string;
                    fullName: string;
                };
                examPaper: {
                    title: string;
                };
            } & {
                id: string;
                userId: string;
                startedAt: Date;
                scorePercent: number | null;
                totalQuestions: number;
                correctCount: number;
                examPaperId: string;
                submittedAt: Date | null;
            })[];
            examPaperPopularity: {
                id: string;
                _count: {
                    submissions: number;
                };
                title: string;
            }[];
        };
        questionAnalytics: {
            overview: {
                totalQuestions: number;
            };
            questionsBySubject: {
                subject: {
                    name: string;
                };
                subjectId: string | null;
                _count: number;
            }[];
            questionsByTopic: {
                topic: {
                    name: string;
                    subject: {
                        name: string;
                    };
                };
                topicId: string | null;
                _count: number;
            }[];
            questionsBySubtopic: {
                subtopic: {
                    name: string;
                    topic: {
                        name: string;
                        subject: {
                            name: string;
                        };
                    };
                };
                subtopicId: string | null;
                _count: number;
            }[];
            difficultyDistribution: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.QuestionGroupByOutputType, "difficulty"[]> & {
                _count: number;
            })[];
            mostUsedQuestions: any[];
            questionPerformance: any[];
        };
        subscriptionAnalytics: {
            overview: {
                totalSubscriptions: number;
                activeSubscriptions: number;
                canceledSubscriptions: number;
                mrr: number;
                arr: number;
                churnRate: number;
            };
            planPopularity: {
                id: string;
                name: string;
                priceCents: number;
                currency: string;
                interval: import(".prisma/client").$Enums.PlanInterval;
                _count: {
                    subscriptions: number;
                };
            }[];
            monthlySubscriptions: Record<string, number>;
            recentSubscriptions: ({
                user: {
                    email: string;
                    fullName: string;
                };
                plan: {
                    name: string;
                    priceCents: number;
                    currency: string;
                };
            } & {
                status: import(".prisma/client").$Enums.SubscriptionStatus;
                id: string;
                userId: string;
                planId: string;
                startedAt: Date;
                endsAt: Date | null;
                stripeCustomerId: string | null;
                stripeSubId: string | null;
                stripeStatus: string | null;
                createdAt: Date;
                updatedAt: Date;
            })[];
        };
        contentAnalytics: {
            overview: {
                totalSubjects: number;
                totalTopics: number;
                totalSubtopics: number;
                totalQuestions: number;
                totalTags: number;
            };
            subjectsWithCounts: {
                id: string;
                name: string;
                _count: {
                    topics: number;
                    questions: number;
                };
            }[];
            topicsWithCounts: {
                id: string;
                name: string;
                _count: {
                    questions: number;
                    subtopics: number;
                };
                subject: {
                    name: string;
                };
            }[];
            subtopicsWithCounts: {
                id: string;
                name: string;
                _count: {
                    questions: number;
                };
                topic: {
                    name: string;
                    subject: {
                        name: string;
                    };
                };
            }[];
            tagUsage: {
                id: string;
                name: string;
                _count: {
                    questions: number;
                };
            }[];
            monthlyQuestions: Record<string, number>;
        };
    }>;
}
