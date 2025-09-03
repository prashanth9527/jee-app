import { PrismaService } from '../prisma/prisma.service';
export declare class ExpertController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getQuestions(req: any, page?: string, limit?: string, search?: string, subjectId?: string, topicId?: string, subtopicId?: string, difficulty?: string): Promise<{
        questions: ({
            subject: {
                id: string;
                stream: {
                    id: string;
                    name: string;
                    code: string;
                };
                name: string;
            } | null;
            topic: {
                id: string;
                name: string;
            } | null;
            subtopic: {
                id: string;
                name: string;
            } | null;
            options: {
                id: string;
                text: string;
                isCorrect: boolean;
                order: number;
            }[];
            tags: {
                tag: {
                    id: string;
                    name: string;
                };
            }[];
            _count: {
                answers: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            subjectId: string | null;
            topicId: string | null;
            subtopicId: string | null;
            stem: string;
            explanation: string | null;
            difficulty: import(".prisma/client").$Enums.Difficulty;
            tip_formula: string | null;
            yearAppeared: number | null;
            isPreviousYear: boolean;
            isAIGenerated: boolean;
            aiPrompt: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getQuestion(id: string): Promise<{
        subject: {
            id: string;
            stream: {
                id: string;
                name: string;
                code: string;
            };
            name: string;
        } | null;
        topic: {
            id: string;
            name: string;
        } | null;
        subtopic: {
            id: string;
            name: string;
        } | null;
        options: {
            id: string;
            text: string;
            isCorrect: boolean;
            order: number;
        }[];
        tags: {
            tag: {
                id: string;
                name: string;
            };
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subjectId: string | null;
        topicId: string | null;
        subtopicId: string | null;
        stem: string;
        explanation: string | null;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        tip_formula: string | null;
        yearAppeared: number | null;
        isPreviousYear: boolean;
        isAIGenerated: boolean;
        aiPrompt: string | null;
    }>;
    createQuestion(body: any): Promise<{
        subject: {
            id: string;
            stream: {
                id: string;
                name: string;
                code: string;
            };
            name: string;
        } | null;
        topic: {
            id: string;
            name: string;
        } | null;
        subtopic: {
            id: string;
            name: string;
        } | null;
        options: {
            id: string;
            text: string;
            isCorrect: boolean;
            order: number;
        }[];
        tags: {
            tag: {
                id: string;
                name: string;
            };
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subjectId: string | null;
        topicId: string | null;
        subtopicId: string | null;
        stem: string;
        explanation: string | null;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        tip_formula: string | null;
        yearAppeared: number | null;
        isPreviousYear: boolean;
        isAIGenerated: boolean;
        aiPrompt: string | null;
    }>;
    updateQuestion(id: string, body: any): Promise<{
        subject: {
            id: string;
            stream: {
                id: string;
                name: string;
                code: string;
            };
            name: string;
        } | null;
        topic: {
            id: string;
            name: string;
        } | null;
        subtopic: {
            id: string;
            name: string;
        } | null;
        options: {
            id: string;
            text: string;
            isCorrect: boolean;
            order: number;
        }[];
        tags: {
            tag: {
                id: string;
                name: string;
            };
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subjectId: string | null;
        topicId: string | null;
        subtopicId: string | null;
        stem: string;
        explanation: string | null;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        tip_formula: string | null;
        yearAppeared: number | null;
        isPreviousYear: boolean;
        isAIGenerated: boolean;
        aiPrompt: string | null;
    }>;
    deleteQuestion(id: string): Promise<{
        message: string;
    }>;
    getQuestionReports(req: any, page?: string, limit?: string, status?: string, type?: string): Promise<{
        reports: ({
            user: {
                id: string;
                email: string;
                fullName: string;
            };
            question: {
                id: string;
                subject: {
                    stream: {
                        name: string;
                        code: string;
                    };
                    name: string;
                } | null;
                stem: string;
                explanation: string | null;
            };
            suggestedOptions: {
                id: string;
                text: string;
                isCorrect: boolean;
                order: number;
            }[];
            reviewedBy: {
                id: string;
                fullName: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            questionId: string;
            userId: string;
            status: import(".prisma/client").$Enums.ReportStatus;
            reportType: import(".prisma/client").$Enums.QuestionReportType;
            reason: string;
            alternativeExplanation: string | null;
            suggestedAnswer: string | null;
            reviewedById: string | null;
            reviewedAt: Date | null;
            reviewNotes: string | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
    getQuestionReportStats(): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        typeStats: {
            type: import(".prisma/client").$Enums.QuestionReportType;
            count: number;
        }[];
    }>;
    getQuestionReport(id: string): Promise<{
        user: {
            id: string;
            email: string;
            fullName: string;
        };
        question: {
            id: string;
            subject: {
                stream: {
                    name: string;
                    code: string;
                };
                name: string;
            } | null;
            stem: string;
            explanation: string | null;
        };
        suggestedOptions: {
            id: string;
            text: string;
            isCorrect: boolean;
            order: number;
        }[];
        reviewedBy: {
            id: string;
            fullName: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        questionId: string;
        userId: string;
        status: import(".prisma/client").$Enums.ReportStatus;
        reportType: import(".prisma/client").$Enums.QuestionReportType;
        reason: string;
        alternativeExplanation: string | null;
        suggestedAnswer: string | null;
        reviewedById: string | null;
        reviewedAt: Date | null;
        reviewNotes: string | null;
    }>;
    reviewQuestionReport(id: string, body: {
        status: 'APPROVED' | 'REJECTED';
        reviewNotes?: string;
    }, req: any): Promise<{
        message: string;
        report: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            questionId: string;
            userId: string;
            status: import(".prisma/client").$Enums.ReportStatus;
            reportType: import(".prisma/client").$Enums.QuestionReportType;
            reason: string;
            alternativeExplanation: string | null;
            suggestedAnswer: string | null;
            reviewedById: string | null;
            reviewedAt: Date | null;
            reviewNotes: string | null;
        };
    }>;
    getSubjects(): Promise<({
        stream: {
            id: string;
            name: string;
            code: string;
        };
        _count: {
            questions: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        streamId: string;
        name: string;
        description: string | null;
    })[]>;
    getTopics(subjectId?: string): Promise<({
        subject: {
            id: string;
            stream: {
                id: string;
                name: string;
                code: string;
            };
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
    getSubtopics(topicId?: string): Promise<({
        topic: {
            id: string;
            name: string;
            subject: {
                id: string;
                stream: {
                    id: string;
                    name: string;
                    code: string;
                };
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
    getTags(): Promise<{
        id: string;
        name: string;
    }[]>;
}
