import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';
export declare class AdminQuestionsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(page?: string, limit?: string, search?: string, subjectId?: string, topicId?: string, subtopicId?: string, difficulty?: string): Promise<{
        questions: ({
            subject: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            } | null;
            topic: {
                id: string;
                subjectId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            } | null;
            subtopic: {
                id: string;
                topicId: string;
                createdAt: Date;
                updatedAt: Date;
                name: string;
                description: string | null;
            } | null;
            tags: ({
                tag: {
                    id: string;
                    name: string;
                };
            } & {
                questionId: string;
                tagId: string;
            })[];
            options: {
                id: string;
                questionId: string;
                text: string;
                isCorrect: boolean;
                order: number;
            }[];
        } & {
            id: string;
            stem: string;
            explanation: string | null;
            difficulty: import(".prisma/client").$Enums.Difficulty;
            yearAppeared: number | null;
            isPreviousYear: boolean;
            subjectId: string | null;
            topicId: string | null;
            subtopicId: string | null;
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
    findOne(id: string): import(".prisma/client").Prisma.Prisma__QuestionClient<({
        subject: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        } | null;
        topic: {
            id: string;
            subjectId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        } | null;
        subtopic: {
            id: string;
            topicId: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
        } | null;
        tags: ({
            tag: {
                id: string;
                name: string;
            };
        } & {
            questionId: string;
            tagId: string;
        })[];
        options: {
            id: string;
            questionId: string;
            text: string;
            isCorrect: boolean;
            order: number;
        }[];
    } & {
        id: string;
        stem: string;
        explanation: string | null;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        yearAppeared: number | null;
        isPreviousYear: boolean;
        subjectId: string | null;
        topicId: string | null;
        subtopicId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    create(body: {
        stem: string;
        explanation?: string;
        difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
        yearAppeared?: number;
        isPreviousYear?: boolean;
        subjectId?: string;
        topicId?: string;
        subtopicId?: string;
        options: {
            text: string;
            isCorrect?: boolean;
            order?: number;
        }[];
        tagNames?: string[];
    }): Promise<({
        tags: ({
            tag: {
                id: string;
                name: string;
            };
        } & {
            questionId: string;
            tagId: string;
        })[];
        options: {
            id: string;
            questionId: string;
            text: string;
            isCorrect: boolean;
            order: number;
        }[];
    } & {
        id: string;
        stem: string;
        explanation: string | null;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        yearAppeared: number | null;
        isPreviousYear: boolean;
        subjectId: string | null;
        topicId: string | null;
        subtopicId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    update(id: string, body: {
        stem?: string;
        explanation?: string;
        difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
        yearAppeared?: number;
        isPreviousYear?: boolean;
        subjectId?: string;
        topicId?: string;
        subtopicId?: string;
        options?: {
            id?: string;
            text: string;
            isCorrect?: boolean;
            order?: number;
        }[];
        tagNames?: string[];
    }): Promise<({
        tags: ({
            tag: {
                id: string;
                name: string;
            };
        } & {
            questionId: string;
            tagId: string;
        })[];
        options: {
            id: string;
            questionId: string;
            text: string;
            isCorrect: boolean;
            order: number;
        }[];
    } & {
        id: string;
        stem: string;
        explanation: string | null;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        yearAppeared: number | null;
        isPreviousYear: boolean;
        subjectId: string | null;
        topicId: string | null;
        subtopicId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__QuestionClient<{
        id: string;
        stem: string;
        explanation: string | null;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        yearAppeared: number | null;
        isPreviousYear: boolean;
        subjectId: string | null;
        topicId: string | null;
        subtopicId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    importCsv(file?: Express.Multer.File): Promise<{
        ok: boolean;
        count: number;
    }>;
    exportCsv(res: Response): Promise<void>;
}
