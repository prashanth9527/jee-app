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
                name: string;
                stream: {
                    id: string;
                    name: string;
                    code: string;
                };
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
                order: number;
                questionId: string;
                text: string;
                isCorrect: boolean;
            }[];
        } & {
            isPreviousYear: boolean;
            id: string;
            stem: string;
            explanation: string | null;
            difficulty: import(".prisma/client").$Enums.Difficulty;
            yearAppeared: number | null;
            isAIGenerated: boolean;
            aiPrompt: string | null;
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
            streamId: string;
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
            order: number;
            questionId: string;
            text: string;
            isCorrect: boolean;
        }[];
    } & {
        isPreviousYear: boolean;
        id: string;
        stem: string;
        explanation: string | null;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        yearAppeared: number | null;
        isAIGenerated: boolean;
        aiPrompt: string | null;
        subjectId: string | null;
        topicId: string | null;
        subtopicId: string | null;
        createdAt: Date;
        updatedAt: Date;
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
            streamId: string;
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
            order: number;
            questionId: string;
            text: string;
            isCorrect: boolean;
        }[];
    } & {
        isPreviousYear: boolean;
        id: string;
        stem: string;
        explanation: string | null;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        yearAppeared: number | null;
        isAIGenerated: boolean;
        aiPrompt: string | null;
        subjectId: string | null;
        topicId: string | null;
        subtopicId: string | null;
        createdAt: Date;
        updatedAt: Date;
    }) | null>;
    deletePYQQuestion(id: string): Promise<{
        isPreviousYear: boolean;
        id: string;
        stem: string;
        explanation: string | null;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        yearAppeared: number | null;
        isAIGenerated: boolean;
        aiPrompt: string | null;
        subjectId: string | null;
        topicId: string | null;
        subtopicId: string | null;
        createdAt: Date;
        updatedAt: Date;
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
