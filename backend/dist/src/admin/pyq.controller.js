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
exports.AdminPYQController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const platform_express_1 = require("@nestjs/platform-express");
let AdminPYQController = class AdminPYQController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPYQStats() {
        const totalPYQ = await this.prisma.question.count({
            where: { isPreviousYear: true }
        });
        const byYear = await this.prisma.question.groupBy({
            by: ['yearAppeared'],
            where: {
                isPreviousYear: true,
                yearAppeared: { not: null }
            },
            _count: {
                id: true
            },
            orderBy: {
                yearAppeared: 'desc'
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
        return {
            totalPYQ,
            byYear: byYear.map(item => ({
                year: item.yearAppeared,
                count: item._count.id
            })),
            bySubject: bySubject.map(subject => ({
                name: subject.name,
                count: subject._count.questions
            }))
        };
    }
    async getPYQQuestions(page, limit, year, subjectId, topicId, search) {
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
        if (search) {
            where.OR = [
                { stem: { contains: search, mode: 'insensitive' } },
                { explanation: { contains: search, mode: 'insensitive' } },
                { subject: { name: { contains: search, mode: 'insensitive' } } },
                { subject: { stream: { name: { contains: search, mode: 'insensitive' } } } },
                { subject: { stream: { code: { contains: search, mode: 'insensitive' } } } },
                { topic: { name: { contains: search, mode: 'insensitive' } } }
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
                subject: {
                    select: {
                        id: true,
                        name: true,
                        stream: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                },
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
    async createPYQQuestion(body) {
        const question = await this.prisma.question.create({
            data: {
                stem: body.stem,
                explanation: body.explanation,
                difficulty: body.difficulty || 'MEDIUM',
                yearAppeared: body.yearAppeared,
                isPreviousYear: true,
                subjectId: body.subjectId,
                topicId: body.topicId,
                subtopicId: body.subtopicId,
                options: {
                    create: body.options.map((option, index) => ({
                        text: option.text,
                        isCorrect: !!option.isCorrect,
                        order: option.order ?? index
                    }))
                }
            }
        });
        if (body.tagNames?.length) {
            for (const name of body.tagNames) {
                const tag = await this.prisma.tag.upsert({
                    where: { name },
                    update: {},
                    create: { name }
                });
                await this.prisma.questionTag.create({
                    data: { questionId: question.id, tagId: tag.id }
                });
            }
        }
        return this.prisma.question.findUnique({
            where: { id: question.id },
            include: {
                options: true,
                tags: { include: { tag: true } },
                subject: true,
                topic: true,
                subtopic: true
            }
        });
    }
    async updatePYQQuestion(id, body) {
        await this.prisma.question.update({
            where: { id },
            data: {
                stem: body.stem,
                explanation: body.explanation,
                difficulty: body.difficulty,
                yearAppeared: body.yearAppeared,
                subjectId: body.subjectId,
                topicId: body.topicId,
                subtopicId: body.subtopicId,
            }
        });
        if (body.options) {
            await this.prisma.questionOption.deleteMany({ where: { questionId: id } });
            await this.prisma.questionOption.createMany({
                data: body.options.map((option, index) => ({
                    questionId: id,
                    text: option.text,
                    isCorrect: !!option.isCorrect,
                    order: option.order ?? index
                }))
            });
        }
        if (body.tagNames) {
            await this.prisma.questionTag.deleteMany({ where: { questionId: id } });
            for (const name of body.tagNames) {
                const tag = await this.prisma.tag.upsert({
                    where: { name },
                    update: {},
                    create: { name }
                });
                await this.prisma.questionTag.create({
                    data: { questionId: id, tagId: tag.id }
                });
            }
        }
        return this.prisma.question.findUnique({
            where: { id },
            include: {
                options: true,
                tags: { include: { tag: true } },
                subject: true,
                topic: true,
                subtopic: true
            }
        });
    }
    async deletePYQQuestion(id) {
        return this.prisma.question.delete({ where: { id } });
    }
    async bulkImportPYQ(file) {
        return {
            message: 'Bulk import functionality will be implemented here',
            fileName: file?.originalname
        };
    }
    async markQuestionsAsPYQ(body) {
        const result = await this.prisma.question.updateMany({
            where: {
                id: { in: body.questionIds }
            },
            data: {
                isPreviousYear: true,
                yearAppeared: body.yearAppeared
            }
        });
        return {
            message: `Marked ${result.count} questions as Previous Year Questions`,
            updatedCount: result.count
        };
    }
    async removePYQStatus(body) {
        const result = await this.prisma.question.updateMany({
            where: {
                id: { in: body.questionIds }
            },
            data: {
                isPreviousYear: false,
                yearAppeared: null
            }
        });
        return {
            message: `Removed PYQ status from ${result.count} questions`,
            updatedCount: result.count
        };
    }
};
exports.AdminPYQController = AdminPYQController;
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminPYQController.prototype, "getPYQStats", null);
__decorate([
    (0, common_1.Get)('questions'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('year')),
    __param(3, (0, common_1.Query)('subjectId')),
    __param(4, (0, common_1.Query)('topicId')),
    __param(5, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminPYQController.prototype, "getPYQQuestions", null);
__decorate([
    (0, common_1.Post)('questions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminPYQController.prototype, "createPYQQuestion", null);
__decorate([
    (0, common_1.Put)('questions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminPYQController.prototype, "updatePYQQuestion", null);
__decorate([
    (0, common_1.Delete)('questions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminPYQController.prototype, "deletePYQQuestion", null);
__decorate([
    (0, common_1.Post)('bulk-import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminPYQController.prototype, "bulkImportPYQ", null);
__decorate([
    (0, common_1.Post)('mark-as-pyq'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminPYQController.prototype, "markQuestionsAsPYQ", null);
__decorate([
    (0, common_1.Post)('remove-pyq-status'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminPYQController.prototype, "removePYQStatus", null);
exports.AdminPYQController = AdminPYQController = __decorate([
    (0, common_1.Controller)('admin/pyq'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminPYQController);
//# sourceMappingURL=pyq.controller.js.map