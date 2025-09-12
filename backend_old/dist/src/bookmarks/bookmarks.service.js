"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let BookmarksService = class BookmarksService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createBookmark(userId, questionId) {
        const question = await this.prisma.question.findUnique({
            where: { id: questionId },
            include: {
                subject: true,
                topic: true,
                subtopic: true,
                options: true,
                tags: {
                    include: {
                        tag: true,
                    },
                },
            },
        });
        if (!question) {
            throw new common_1.NotFoundException('Question not found');
        }
        const existingBookmark = await this.prisma.bookmark.findUnique({
            where: {
                userId_questionId: {
                    userId,
                    questionId,
                },
            },
        });
        if (existingBookmark) {
            throw new common_1.ConflictException('Question is already bookmarked');
        }
        const bookmark = await this.prisma.bookmark.create({
            data: {
                userId,
                questionId,
            },
            include: {
                question: {
                    include: {
                        subject: true,
                        topic: true,
                        subtopic: true,
                        options: true,
                        tags: {
                            include: {
                                tag: true,
                            },
                        },
                    },
                },
            },
        });
        return bookmark;
    }
    async removeBookmark(userId, questionId) {
        const bookmark = await this.prisma.bookmark.findUnique({
            where: {
                userId_questionId: {
                    userId,
                    questionId,
                },
            },
        });
        if (!bookmark) {
            throw new common_1.NotFoundException('Bookmark not found');
        }
        await this.prisma.bookmark.delete({
            where: {
                userId_questionId: {
                    userId,
                    questionId,
                },
            },
        });
        return { message: 'Bookmark removed successfully' };
    }
    async getUserBookmarks(userId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [bookmarks, total] = await Promise.all([
            this.prisma.bookmark.findMany({
                where: { userId },
                include: {
                    question: {
                        include: {
                            subject: true,
                            topic: true,
                            subtopic: true,
                            options: true,
                            tags: {
                                include: {
                                    tag: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.bookmark.count({
                where: { userId },
            }),
        ]);
        return {
            bookmarks,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async isBookmarked(userId, questionId) {
        const bookmark = await this.prisma.bookmark.findUnique({
            where: {
                userId_questionId: {
                    userId,
                    questionId,
                },
            },
        });
        return !!bookmark;
    }
    async getBookmarkStatus(userId, questionIds) {
        const bookmarks = await this.prisma.bookmark.findMany({
            where: {
                userId,
                questionId: {
                    in: questionIds,
                },
            },
            select: {
                questionId: true,
            },
        });
        const bookmarkMap = new Map(bookmarks.map((bookmark) => [bookmark.questionId, true]));
        return questionIds.map((questionId) => ({
            questionId,
            isBookmarked: bookmarkMap.has(questionId),
        }));
    }
    async getBookmarksBySubject(userId, subjectId) {
        return this.prisma.bookmark.findMany({
            where: {
                userId,
                question: {
                    subjectId,
                },
            },
            include: {
                question: {
                    include: {
                        subject: true,
                        topic: true,
                        subtopic: true,
                        options: true,
                        tags: {
                            include: {
                                tag: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getBookmarksByTopic(userId, topicId) {
        return this.prisma.bookmark.findMany({
            where: {
                userId,
                question: {
                    topicId,
                },
            },
            include: {
                question: {
                    include: {
                        subject: true,
                        topic: true,
                        subtopic: true,
                        options: true,
                        tags: {
                            include: {
                                tag: true,
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.BookmarksService = BookmarksService;
exports.BookmarksService = BookmarksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BookmarksService);
//# sourceMappingURL=bookmarks.service.js.map