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
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            subjectIds: string[];
            topicIds: string[];
            subtopicIds: string[];
            questionIds: string[];
            timeLimitMin: number | null;
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
        _count: {
            submissions: number;
        };
        submissions: ({
            user: {
                id: string;
                email: string;
                fullName: string;
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        subjectIds: string[];
        topicIds: string[];
        subtopicIds: string[];
        questionIds: string[];
        timeLimitMin: number | null;
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
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        subjectIds: string[];
        topicIds: string[];
        subtopicIds: string[];
        questionIds: string[];
        timeLimitMin: number | null;
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
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        subjectIds: string[];
        topicIds: string[];
        subtopicIds: string[];
        questionIds: string[];
        timeLimitMin: number | null;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        subjectIds: string[];
        topicIds: string[];
        subtopicIds: string[];
        questionIds: string[];
        timeLimitMin: number | null;
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
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            subjectIds: string[];
            topicIds: string[];
            subtopicIds: string[];
            questionIds: string[];
            timeLimitMin: number | null;
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
