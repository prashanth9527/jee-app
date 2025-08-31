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
                    createdAt: Date;
                    updatedAt: Date;
                    streamId: string;
                    name: string;
                    description: string | null;
                } | null;
                topic: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    subjectId: string;
                } | null;
                subtopic: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    name: string;
                    description: string | null;
                    topicId: string;
                } | null;
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
                yearAppeared: number | null;
                isPreviousYear: boolean;
                isAIGenerated: boolean;
                aiPrompt: string | null;
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
