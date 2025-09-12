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
exports.AdminExamPapersController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let AdminExamPapersController = class AdminExamPapersController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(page, limit, search) {
        const currentPage = parseInt(page || '1');
        const itemsPerPage = parseInt(limit || '10');
        const skip = (currentPage - 1) * itemsPerPage;
        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        const totalItems = await this.prisma.examPaper.count({ where });
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const examPapers = await this.prisma.examPaper.findMany({
            where,
            include: {
                _count: {
                    select: {
                        submissions: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: itemsPerPage,
        });
        return {
            examPapers,
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
    async findOne(id) {
        const examPaper = await this.prisma.examPaper.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        submissions: true
                    }
                },
                submissions: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true
                            }
                        }
                    },
                    take: 10,
                    orderBy: {
                        startedAt: 'desc'
                    }
                }
            }
        });
        if (!examPaper) {
            throw new common_1.BadRequestException('Exam paper not found');
        }
        let questions = [];
        if (examPaper.questionIds && examPaper.questionIds.length > 0) {
            questions = await this.prisma.question.findMany({
                where: {
                    id: { in: examPaper.questionIds }
                },
                include: {
                    subject: true,
                    topic: true,
                    subtopic: true,
                    options: true
                }
            });
        }
        return {
            ...examPaper,
            questions
        };
    }
    async create(body) {
        if (!body.title || !body.title.trim()) {
            throw new common_1.BadRequestException('Exam paper title is required');
        }
        const trimmedTitle = body.title.trim();
        const existingPaper = await this.prisma.examPaper.findFirst({
            where: { title: trimmedTitle }
        });
        if (existingPaper) {
            throw new common_1.BadRequestException('Exam paper with this title already exists');
        }
        let questionIds = body.questionIds || [];
        if (body.questionCount && body.questionCount > 0 && questionIds.length === 0) {
            const where = {};
            if (body.subjectIds?.length)
                where.subjectId = { in: body.subjectIds };
            if (body.topicIds?.length)
                where.topicId = { in: body.topicIds };
            if (body.subtopicIds?.length)
                where.subtopicId = { in: body.subtopicIds };
            const questions = await this.prisma.question.findMany({
                where,
                select: { id: true },
                take: body.questionCount,
                orderBy: { createdAt: 'desc' }
            });
            questionIds = questions.map(q => q.id);
        }
        return this.prisma.examPaper.create({
            data: {
                title: trimmedTitle,
                description: body.description?.trim() || null,
                subjectIds: body.subjectIds || [],
                topicIds: body.topicIds || [],
                subtopicIds: body.subtopicIds || [],
                questionIds,
                timeLimitMin: body.timeLimitMin || null,
            },
            include: {
                _count: {
                    select: {
                        submissions: true
                    }
                }
            }
        });
    }
    async update(id, body) {
        const existingPaper = await this.prisma.examPaper.findUnique({
            where: { id }
        });
        if (!existingPaper) {
            throw new common_1.BadRequestException('Exam paper not found');
        }
        if (body.title && body.title.trim() !== existingPaper.title) {
            const duplicatePaper = await this.prisma.examPaper.findFirst({
                where: {
                    title: body.title.trim(),
                    id: { not: id }
                }
            });
            if (duplicatePaper) {
                throw new common_1.BadRequestException('Exam paper with this title already exists');
            }
        }
        let questionIds = body.questionIds;
        if (body.questionCount && body.questionCount > 0 && (!questionIds || questionIds.length === 0)) {
            const where = {};
            if (body.subjectIds?.length)
                where.subjectId = { in: body.subjectIds };
            if (body.topicIds?.length)
                where.topicId = { in: body.topicIds };
            if (body.subtopicIds?.length)
                where.subtopicId = { in: body.subtopicIds };
            const questions = await this.prisma.question.findMany({
                where,
                select: { id: true },
                take: body.questionCount,
                orderBy: { createdAt: 'desc' }
            });
            questionIds = questions.map(q => q.id);
        }
        return this.prisma.examPaper.update({
            where: { id },
            data: {
                title: body.title?.trim(),
                description: body.description?.trim(),
                subjectIds: body.subjectIds,
                topicIds: body.topicIds,
                subtopicIds: body.subtopicIds,
                questionIds,
                timeLimitMin: body.timeLimitMin,
            },
            include: {
                _count: {
                    select: {
                        submissions: true
                    }
                }
            }
        });
    }
    async remove(id) {
        const examPaper = await this.prisma.examPaper.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        submissions: true
                    }
                }
            }
        });
        if (!examPaper) {
            throw new common_1.BadRequestException('Exam paper not found');
        }
        if (examPaper._count.submissions > 0) {
            throw new common_1.BadRequestException(`Cannot delete exam paper "${examPaper.title}" as it has ${examPaper._count.submissions} submission${examPaper._count.submissions !== 1 ? 's' : ''}. Please delete all submissions first.`);
        }
        return this.prisma.examPaper.delete({ where: { id } });
    }
    async bulkDelete(body) {
        if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
            throw new common_1.BadRequestException('Exam paper IDs array is required');
        }
        const examPapersWithSubmissions = await this.prisma.examPaper.findMany({
            where: {
                id: { in: body.ids }
            },
            include: {
                _count: {
                    select: {
                        submissions: true
                    }
                }
            }
        });
        const papersWithSubmissions = examPapersWithSubmissions.filter(paper => paper._count.submissions > 0);
        if (papersWithSubmissions.length > 0) {
            const paperTitles = papersWithSubmissions.map(paper => `"${paper.title}"`).join(', ');
            throw new common_1.BadRequestException(`Cannot delete the following exam papers as they have submissions: ${paperTitles}. Please delete all submissions first.`);
        }
        const result = await this.prisma.examPaper.deleteMany({
            where: {
                id: {
                    in: body.ids
                }
            }
        });
        return {
            ok: true,
            deletedCount: result.count,
            message: `Successfully deleted ${result.count} exam paper${result.count !== 1 ? 's' : ''}`
        };
    }
    async getStatistics(id) {
        const examPaper = await this.prisma.examPaper.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        submissions: true
                    }
                }
            }
        });
        if (!examPaper) {
            throw new common_1.BadRequestException('Exam paper not found');
        }
        const submissions = await this.prisma.examSubmission.findMany({
            where: { examPaperId: id },
            select: {
                scorePercent: true,
                correctCount: true,
                totalQuestions: true,
                startedAt: true,
                submittedAt: true
            }
        });
        const completedSubmissions = submissions.filter(s => s.submittedAt);
        const totalSubmissions = submissions.length;
        const completedCount = completedSubmissions.length;
        let averageScore = 0;
        let highestScore = 0;
        let lowestScore = 100;
        if (completedCount > 0) {
            const scores = completedSubmissions.map(s => s.scorePercent || 0);
            averageScore = scores.reduce((sum, score) => sum + score, 0) / completedCount;
            highestScore = Math.max(...scores);
            lowestScore = Math.min(...scores);
        }
        return {
            examPaper,
            statistics: {
                totalSubmissions,
                completedCount,
                averageScore: Math.round(averageScore * 100) / 100,
                highestScore: Math.round(highestScore * 100) / 100,
                lowestScore: Math.round(lowestScore * 100) / 100,
                completionRate: totalSubmissions > 0 ? (completedCount / totalSubmissions) * 100 : 0
            }
        };
    }
};
exports.AdminExamPapersController = AdminExamPapersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminExamPapersController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminExamPapersController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminExamPapersController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminExamPapersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminExamPapersController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)('bulk'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminExamPapersController.prototype, "bulkDelete", null);
__decorate([
    (0, common_1.Get)(':id/statistics'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminExamPapersController.prototype, "getStatistics", null);
exports.AdminExamPapersController = AdminExamPapersController = __decorate([
    (0, common_1.Controller)('admin/exam-papers'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminExamPapersController);
//# sourceMappingURL=exam-papers.controller.js.map