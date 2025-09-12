import { BookmarksService } from './bookmarks.service';
export declare class BookmarksController {
    private readonly bookmarksService;
    constructor(bookmarksService: BookmarksService);
    createBookmark(questionId: string, req: any): Promise<{
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
    removeBookmark(questionId: string, req: any): Promise<{
        message: string;
    }>;
    getUserBookmarks(req: any, page: number, limit: number): Promise<{
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
    isBookmarked(questionId: string, req: any): Promise<{
        questionId: string;
        isBookmarked: boolean;
    }>;
    getBookmarkStatus(body: {
        questionIds: string[];
    }, req: any): Promise<{
        questionId: string;
        isBookmarked: boolean;
    }[]>;
    getBookmarksBySubject(subjectId: string, req: any): Promise<({
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
    getBookmarksByTopic(topicId: string, req: any): Promise<({
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
