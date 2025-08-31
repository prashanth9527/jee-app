import { PrismaService } from '../prisma/prisma.service';
export declare class PYQController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAvailableYears(): Promise<(number | null)[]>;
    getSubjectsWithPYQ(): Promise<({
        _count: {
            questions: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        streamId: string;
        name: string;
        description: string | null;
    })[]>;
    getTopicsWithPYQ(subjectId?: string): Promise<({
        subject: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            streamId: string;
            name: string;
            description: string | null;
        };
        _count: {
            questions: number;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        subjectId: string;
    })[]>;
    getPYQQuestions(page?: string, limit?: string, year?: string, subjectId?: string, topicId?: string, subtopicId?: string, difficulty?: string, search?: string): Promise<{
        questions: ({
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
    getPYQQuestion(id: string): Promise<({
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
    getPYQAnalytics(): Promise<{
        totalPYQ: number;
        byYear: {
            year: number | null;
            count: number;
        }[];
        bySubject: {
            name: string;
            count: number;
        }[];
        byDifficulty: {
            difficulty: import(".prisma/client").$Enums.Difficulty;
            count: number;
        }[];
    }>;
    generatePYQPracticeTest(year?: string, subjectId?: string, topicId?: string, questionCount?: string, difficulty?: string): Promise<{
        questions: ({
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
            options: {
                id: string;
                text: string;
                isCorrect: boolean;
                order: number;
                questionId: string;
            }[];
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
        totalQuestions: number;
        availableQuestions: number;
    }>;
}
