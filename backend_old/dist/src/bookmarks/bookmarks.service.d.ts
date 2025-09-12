import { PrismaService } from '../prisma/prisma.service';
export declare class BookmarksService {
    private prisma;
    constructor(prisma: PrismaService);
    createBookmark(userId: string, questionId: string): Promise<{
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        questionId: string;
        userId: string;
    }>;
    removeBookmark(userId: string, questionId: string): Promise<{
        message: string;
    }>;
    getUserBookmarks(userId: string, page?: number, limit?: number): Promise<{
        bookmarks: ({
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
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            questionId: string;
            userId: string;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    isBookmarked(userId: string, questionId: string): Promise<boolean>;
    getBookmarkStatus(userId: string, questionIds: string[]): Promise<{
        questionId: string;
        isBookmarked: boolean;
    }[]>;
    getBookmarksBySubject(userId: string, subjectId: string): Promise<({
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        questionId: string;
        userId: string;
    })[]>;
    getBookmarksByTopic(userId: string, topicId: string): Promise<({
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
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        questionId: string;
        userId: string;
    })[]>;
}
