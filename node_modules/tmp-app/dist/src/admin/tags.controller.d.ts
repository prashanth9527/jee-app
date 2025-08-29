import { PrismaService } from '../prisma/prisma.service';
export declare class AdminTagsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(page?: string, limit?: string, search?: string): Promise<{
        tags: ({
            _count: {
                questions: number;
            };
        } & {
            id: string;
            name: string;
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
        questions: ({
            question: {
                subject: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    updatedAt: Date;
                    description: string | null;
                } | null;
                topic: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    subjectId: string;
                    updatedAt: Date;
                    description: string | null;
                } | null;
                subtopic: {
                    id: string;
                    name: string;
                    createdAt: Date;
                    topicId: string;
                    updatedAt: Date;
                    description: string | null;
                } | null;
            } & {
                id: string;
                createdAt: Date;
                stem: string;
                explanation: string | null;
                difficulty: import(".prisma/client").$Enums.Difficulty;
                yearAppeared: number | null;
                isPreviousYear: boolean;
                subjectId: string | null;
                topicId: string | null;
                subtopicId: string | null;
                updatedAt: Date;
            };
        } & {
            questionId: string;
            tagId: string;
        })[];
        _count: {
            questions: number;
        };
    } & {
        id: string;
        name: string;
    }>;
    create(body: {
        name: string;
    }): Promise<{
        _count: {
            questions: number;
        };
    } & {
        id: string;
        name: string;
    }>;
    update(id: string, body: {
        name?: string;
    }): Promise<{
        _count: {
            questions: number;
        };
    } & {
        id: string;
        name: string;
    }>;
    remove(id: string): Promise<{
        id: string;
        name: string;
    }>;
    bulkDelete(body: {
        ids: string[];
    }): Promise<{
        ok: boolean;
        deletedCount: number;
        message: string;
    }>;
}
