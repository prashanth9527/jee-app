import { PrismaService } from '../prisma/prisma.service';
export declare class AdminPYQController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getPYQStats(): Promise<{
        totalPYQ: number;
        byYear: {
            year: number | null;
            count: number;
        }[];
        bySubject: {
            name: string;
            count: number;
        }[];
    }>;
    getPYQQuestions(page?: string, limit?: string, year?: string, subjectId?: string, topicId?: string, search?: string): Promise<{
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
    createPYQQuestion(body: {
        stem: string;
        explanation?: string;
        difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
        yearAppeared: number;
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
        subject: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
        isAIGenerated: boolean;
        aiPrompt: string | null;
    }) | null>;
    updatePYQQuestion(id: string, body: {
        stem?: string;
        explanation?: string;
        difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
        yearAppeared?: number;
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
        subject: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
        isAIGenerated: boolean;
        aiPrompt: string | null;
    }) | null>;
    deletePYQQuestion(id: string): Promise<{
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
    }>;
    bulkImportPYQ(file: Express.Multer.File): Promise<{
        message: string;
        fileName: string;
    }>;
    markQuestionsAsPYQ(body: {
        questionIds: string[];
        yearAppeared: number;
    }): Promise<{
        message: string;
        updatedCount: number;
    }>;
    removePYQStatus(body: {
        questionIds: string[];
    }): Promise<{
        message: string;
        updatedCount: number;
    }>;
}
