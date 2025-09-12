import { PrismaService } from '../prisma/prisma.service';
interface ReviewReportDto {
    status: 'APPROVED' | 'REJECTED';
    reviewNotes?: string;
}
export declare class AdminQuestionReportsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getReports(status?: string, type?: string, page?: string, limit?: string): Promise<{
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
                createdAt: Date;
                updatedAt: Date;
                text: string;
                isCorrect: boolean;
                order: number;
                reportId: string;
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
    getReportStats(): Promise<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
        typeStats: {
            type: import(".prisma/client").$Enums.QuestionReportType;
            count: number;
        }[];
    }>;
    getReport(id: string): Promise<{
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
            options: {
                id: string;
                text: string;
                isCorrect: boolean;
                order: number;
                questionId: string;
            }[];
            stem: string;
            explanation: string | null;
        };
        suggestedOptions: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            text: string;
            isCorrect: boolean;
            order: number;
            reportId: string;
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
    reviewReport(id: string, reviewDto: ReviewReportDto, req: any): Promise<{
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
    getQuestionExplanations(questionId: string): Promise<{
        question: {
            id: string;
            stem: string;
            explanation: string | null;
        };
        alternativeExplanations: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            explanation: string;
            questionId: string;
            reportId: string | null;
            source: string;
        }[];
        pendingReports: ({
            user: {
                email: string;
                fullName: string;
            };
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
    }>;
}
export {};
