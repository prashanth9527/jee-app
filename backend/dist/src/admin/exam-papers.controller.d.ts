import { PrismaService } from '../prisma/prisma.service';
export declare class AdminExamPapersController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(page?: string, limit?: string, search?: string): Promise<{
        examPapers: ({
            _count: {
                submissions: number;
            };
        } & {
            id: string;
            title: string;
            description: string | null;
            subjectIds: string[];
            topicIds: string[];
            subtopicIds: string[];
            questionIds: string[];
            timeLimitMin: number | null;
            createdAt: Date;
            updatedAt: Date;
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
    findOne(id: string): Promise<{
        questions: any[];
        submissions: ({
            user: {
                id: string;
                email: string;
                fullName: string;
            };
        } & {
            id: string;
            startedAt: Date;
            userId: string;
            examPaperId: string;
            submittedAt: Date | null;
            totalQuestions: number;
            correctCount: number;
            scorePercent: number | null;
        })[];
        _count: {
            submissions: number;
        };
        id: string;
        title: string;
        description: string | null;
        subjectIds: string[];
        topicIds: string[];
        subtopicIds: string[];
        questionIds: string[];
        timeLimitMin: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(body: {
        title: string;
        description?: string;
        subjectIds?: string[];
        topicIds?: string[];
        subtopicIds?: string[];
        questionIds?: string[];
        timeLimitMin?: number;
        questionCount?: number;
    }): Promise<{
        _count: {
            submissions: number;
        };
    } & {
        id: string;
        title: string;
        description: string | null;
        subjectIds: string[];
        topicIds: string[];
        subtopicIds: string[];
        questionIds: string[];
        timeLimitMin: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, body: {
        title?: string;
        description?: string;
        subjectIds?: string[];
        topicIds?: string[];
        subtopicIds?: string[];
        questionIds?: string[];
        timeLimitMin?: number;
        questionCount?: number;
    }): Promise<{
        _count: {
            submissions: number;
        };
    } & {
        id: string;
        title: string;
        description: string | null;
        subjectIds: string[];
        topicIds: string[];
        subtopicIds: string[];
        questionIds: string[];
        timeLimitMin: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        title: string;
        description: string | null;
        subjectIds: string[];
        topicIds: string[];
        subtopicIds: string[];
        questionIds: string[];
        timeLimitMin: number | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    bulkDelete(body: {
        ids: string[];
    }): Promise<{
        ok: boolean;
        deletedCount: number;
        message: string;
    }>;
    getStatistics(id: string): Promise<{
        examPaper: {
            _count: {
                submissions: number;
            };
        } & {
            id: string;
            title: string;
            description: string | null;
            subjectIds: string[];
            topicIds: string[];
            subtopicIds: string[];
            questionIds: string[];
            timeLimitMin: number | null;
            createdAt: Date;
            updatedAt: Date;
        };
        statistics: {
            totalSubmissions: number;
            completedCount: number;
            averageScore: number;
            highestScore: number;
            lowestScore: number;
            completionRate: number;
        };
    }>;
}
