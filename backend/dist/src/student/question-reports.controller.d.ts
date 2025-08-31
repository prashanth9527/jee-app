import { PrismaService } from '../prisma/prisma.service';
interface CreateReportDto {
    questionId: string;
    reportType: 'INCORRECT_ANSWER' | 'INCORRECT_EXPLANATION' | 'SUGGESTED_EXPLANATION' | 'GRAMMATICAL_ERROR' | 'TECHNICAL_ERROR' | 'OTHER';
    reason: string;
    description?: string;
    alternativeExplanation?: string;
    suggestedAnswer?: string;
    suggestedOptions?: Array<{
        text: string;
        isCorrect: boolean;
        order: number;
    }>;
}
export declare class StudentQuestionReportsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createReport(createReportDto: CreateReportDto, req: any): Promise<{
        message: string;
        report: {
            id: string;
            reportType: import(".prisma/client").$Enums.QuestionReportType;
            reason: string;
            status: import(".prisma/client").$Enums.ReportStatus;
            createdAt: Date;
            question: {
                id: string;
                subject: {
                    stream: {
                        name: string;
                    };
                    name: string;
                } | null;
                stem: string;
            };
        };
    }>;
    getMyReports(req: any): Promise<({
        question: {
            id: string;
            subject: {
                stream: {
                    name: string;
                };
                name: string;
            } | null;
            stem: string;
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
    })[]>;
    getQuestionReports(questionId: string, req: any): Promise<{
        question: {
            id: string;
            stem: string;
            explanation: string | null;
            alternativeExplanations: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                explanation: string;
                questionId: string;
                reportId: string | null;
                source: string;
            }[];
            subject: {
                stream: {
                    name: string;
                };
                name: string;
            } | null;
        };
        userReports: {
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
        }[];
    }>;
}
export {};
