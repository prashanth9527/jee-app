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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PYQController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let PYQController = class PYQController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAvailableYears() {
        const years = await this.prisma.question.findMany({
            where: {
                isPreviousYear: true,
                yearAppeared: { not: null }
            },
            select: {
                yearAppeared: true
            },
            distinct: ['yearAppeared'],
            orderBy: {
                yearAppeared: 'desc'
            }
        });
        return years.map(y => y.yearAppeared).filter(Boolean);
    }
    async getSubjectsWithPYQ() {
        const subjects = await this.prisma.subject.findMany({
            where: {
                questions: {
                    some: {
                        isPreviousYear: true
                    }
                }
            },
            include: {
                _count: {
                    select: {
                        questions: {
                            where: {
                                isPreviousYear: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        return subjects;
    }
    async getTopicsWithPYQ(subjectId) {
        const where = {
            questions: {
                some: {
                    isPreviousYear: true
                }
            }
        };
        if (subjectId) {
            where.subjectId = subjectId;
        }
        const topics = await this.prisma.topic.findMany({
            where,
            include: {
                subject: true,
                _count: {
                    select: {
                        questions: {
                            where: {
                                isPreviousYear: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        return topics;
    }
    async getPYQQuestions(page, limit, year, subjectId, topicId, subtopicId, difficulty, search) {
        const currentPage = parseInt(page || '1');
        const itemsPerPage = parseInt(limit || '10');
        const skip = (currentPage - 1) * itemsPerPage;
        const where = {
            isPreviousYear: true
        };
        if (year)
            where.yearAppeared = parseInt(year);
        if (subjectId)
            where.subjectId = subjectId;
        if (topicId)
            where.topicId = topicId;
        if (subtopicId)
            where.subtopicId = subtopicId;
        if (difficulty)
            where.difficulty = difficulty;
        if (search) {
            where.OR = [
                { stem: { contains: search, mode: 'insensitive' } },
                { explanation: { contains: search, mode: 'insensitive' } },
                { subject: { name: { contains: search, mode: 'insensitive' } } },
                { topic: { name: { contains: search, mode: 'insensitive' } } },
                { subtopic: { name: { contains: search, mode: 'insensitive' } } },
                { tags: { tag: { name: { contains: search, mode: 'insensitive' } } } }
            ];
        }
        const totalItems = await this.prisma.question.count({ where });
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const questions = await this.prisma.question.findMany({
            where,
            include: {
                options: {
                    orderBy: { order: 'asc' }
                },
                tags: {
                    include: { tag: true }
                },
                subject: true,
                topic: true,
                subtopic: true
            },
            orderBy: [
                { yearAppeared: 'desc' },
                { createdAt: 'desc' }
            ],
            skip,
            take: itemsPerPage,
        });
        return {
            questions,
            pagination: {
                currentPage,
                totalPages,
                totalItems,
                itemsPerPage,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1
            }
        };
    }
    async getPYQQuestion(id) {
        return this.prisma.question.findUnique({
            where: { id },
            include: {
                options: {
                    orderBy: { order: 'asc' }
                },
                tags: {
                    include: { tag: true }
                },
                subject: true,
                topic: true,
                subtopic: true
            }
        });
    }
    async getPYQAnalytics() {
        const totalPYQ = await this.prisma.question.count({
            where: { isPreviousYear: true }
        });
        const byYear = await this.prisma.question.groupBy({
            by: ['pyqYear'],
            where: {
                isFromPYQ: true,
                pyqYear: { not: null }
            },
            _count: {
                id: true
            },
            orderBy: {
                pyqYear: 'desc'
            }
        });
        const bySubject = await this.prisma.subject.findMany({
            include: {
                _count: {
                    select: {
                        questions: {
                            where: { isPreviousYear: true }
                        }
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });
        const byDifficulty = await this.prisma.question.groupBy({
            by: ['difficulty'],
            where: { isPreviousYear: true },
            _count: {
                id: true
            }
        });
        return {
            totalPYQ,
            byYear: byYear.map((item) => ({
                year: item.pyqYear,
                count: item._count?.id || 0
            })),
            bySubject: bySubject.map(subject => ({
                name: subject.name,
                count: subject._count.questions
            })),
            byDifficulty: byDifficulty.map(item => ({
                difficulty: item.difficulty,
                count: item._count.id
            }))
        };
    }
    async generatePYQPracticeTest(year, subjectId, topicId, questionCount, difficulty) {
        const count = parseInt(questionCount || '10');
        const where = {
            isPreviousYear: true
        };
        if (year)
            where.yearAppeared = parseInt(year);
        if (subjectId)
            where.subjectId = subjectId;
        if (topicId)
            where.topicId = topicId;
        if (difficulty && difficulty !== 'MIXED')
            where.difficulty = difficulty;
        const availableQuestions = await this.prisma.question.findMany({
            where,
            include: {
                options: {
                    orderBy: { order: 'asc' }
                },
                subject: true,
                topic: true
            },
            orderBy: {
                yearAppeared: 'desc'
            }
        });
        const selectedQuestions = availableQuestions
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(count, availableQuestions.length));
        return {
            questions: selectedQuestions,
            totalQuestions: selectedQuestions.length,
            availableQuestions: availableQuestions.length
        };
    }
};
exports.PYQController = PYQController;
__decorate([
    (0, common_1.Get)('years'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PYQController.prototype, "getAvailableYears", null);
__decorate([
    (0, common_1.Get)('subjects'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PYQController.prototype, "getSubjectsWithPYQ", null);
__decorate([
    (0, common_1.Get)('topics'),
    __param(0, (0, common_1.Query)('subjectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PYQController.prototype, "getTopicsWithPYQ", null);
__decorate([
    (0, common_1.Get)('questions'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('year')),
    __param(3, (0, common_1.Query)('subjectId')),
    __param(4, (0, common_1.Query)('topicId')),
    __param(5, (0, common_1.Query)('subtopicId')),
    __param(6, (0, common_1.Query)('difficulty')),
    __param(7, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PYQController.prototype, "getPYQQuestions", null);
__decorate([
    (0, common_1.Get)('questions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PYQController.prototype, "getPYQQuestion", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PYQController.prototype, "getPYQAnalytics", null);
__decorate([
    (0, common_1.Get)('practice/generate'),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Query)('subjectId')),
    __param(2, (0, common_1.Query)('topicId')),
    __param(3, (0, common_1.Query)('questionCount')),
    __param(4, (0, common_1.Query)('difficulty')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], PYQController.prototype, "generatePYQPracticeTest", null);
exports.PYQController = PYQController = __decorate([
    (0, common_1.Controller)('student/pyq'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('STUDENT'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PYQController);
//# sourceMappingURL=pyq.controller.js.map