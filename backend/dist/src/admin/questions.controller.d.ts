import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';
export declare class AdminQuestionsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(subjectId?: string, topicId?: string, subtopicId?: string): import(".prisma/client").Prisma.PrismaPromise<({
        options: {
            id: string;
            text: string;
            isCorrect: boolean;
            order: number;
            questionId: string;
        }[];
        tags: ({
            tag: {
                id: string;
                name: string;
            };
        } & {
            questionId: string;
            tagId: string;
        })[];
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
    })[]>;
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
        options: {
            id: string;
            text: string;
            isCorrect: boolean;
            order: number;
            questionId: string;
        }[];
        tags: ({
            tag: {
                id: string;
                name: string;
            };
        } & {
            questionId: string;
            tagId: string;
        })[];
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
        options: {
            id: string;
            text: string;
            isCorrect: boolean;
            order: number;
            questionId: string;
        }[];
        tags: ({
            tag: {
                id: string;
                name: string;
            };
        } & {
            questionId: string;
            tagId: string;
        })[];
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
    }) | null>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__QuestionClient<{
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
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    importCsv(file?: Express.Multer.File): Promise<{
        ok: boolean;
        count: number;
    }>;
    exportCsv(res: Response): Promise<void>;
}
