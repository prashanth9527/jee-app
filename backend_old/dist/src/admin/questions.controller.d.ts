import { PrismaService } from '../prisma/prisma.service';
import { Response } from 'express';
export declare class AdminQuestionsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(page?: string, limit?: string, search?: string, subjectId?: string, topicId?: string, subtopicId?: string, difficulty?: string): Promise<{
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
                subject: {
                    id: string;
                    stream: {
                        id: string;
                        name: string;
                        code: string;
                    };
                    name: string;
                };
            } | null;
            subtopic: {
                id: string;
                name: string;
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
            } | null;
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
            tip_formula: string | null;
            yearAppeared: number | null;
            isPreviousYear: boolean;
            isAIGenerated: boolean;
            aiPrompt: string | null;
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
            subject: {
                id: string;
                stream: {
                    id: string;
                    name: string;
                    code: string;
                };
                name: string;
            };
        } | null;
        subtopic: {
            id: string;
            name: string;
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
        } | null;
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
        tip_formula: string | null;
        yearAppeared: number | null;
        isPreviousYear: boolean;
        isAIGenerated: boolean;
        aiPrompt: string | null;
    }) | null, null, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    create(body: {
        stem: string;
        explanation?: string;
        tip_formula?: string;
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
        tip_formula: string | null;
        yearAppeared: number | null;
        isPreviousYear: boolean;
        isAIGenerated: boolean;
        aiPrompt: string | null;
    }) | null>;
    update(id: string, body: {
        stem?: string;
        explanation?: string;
        tip_formula?: string;
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
        tip_formula: string | null;
        yearAppeared: number | null;
        isPreviousYear: boolean;
        isAIGenerated: boolean;
        aiPrompt: string | null;
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
        tip_formula: string | null;
        yearAppeared: number | null;
        isPreviousYear: boolean;
        isAIGenerated: boolean;
        aiPrompt: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    bulkDelete(body: {
        ids: string[];
    }): Promise<{
        ok: boolean;
        deletedCount: number;
        message: string;
    }>;
    importCsv(file?: Express.Multer.File): Promise<{
        ok: boolean;
        count: number;
    }>;
    exportCsv(res: Response): Promise<void>;
}
