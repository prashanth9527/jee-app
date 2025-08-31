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
exports.ExpertController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
let ExpertController = class ExpertController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getQuestions(req, page = '1', limit = '10', search, subjectId, topicId, subtopicId, difficulty) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (search) {
            where.OR = [
                { stem: { contains: search, mode: 'insensitive' } },
                { explanation: { contains: search, mode: 'insensitive' } },
                { subject: { name: { contains: search, mode: 'insensitive' } } },
                { topic: { name: { contains: search, mode: 'insensitive' } } },
                { subtopic: { name: { contains: search, mode: 'insensitive' } } }
            ];
        }
        if (subjectId)
            where.subjectId = subjectId;
        if (topicId)
            where.topicId = topicId;
        if (subtopicId)
            where.subtopicId = subtopicId;
        if (difficulty)
            where.difficulty = difficulty;
        const [questions, total] = await Promise.all([
            this.prisma.question.findMany({
                where,
                include: {
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
                    topic: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    subtopic: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    options: {
                        select: {
                            id: true,
                            text: true,
                            isCorrect: true,
                            order: true
                        },
                        orderBy: { order: 'asc' }
                    },
                    tags: {
                        select: {
                            tag: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    },
                    _count: {
                        select: {
                            answers: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            this.prisma.question.count({ where })
        ]);
        return {
            questions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        };
    }
    async getQuestion(id) {
        const question = await this.prisma.question.findUnique({
            where: { id },
            include: {
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
                topic: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                subtopic: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                options: {
                    select: {
                        id: true,
                        text: true,
                        isCorrect: true,
                        order: true
                    },
                    orderBy: { order: 'asc' }
                },
                tags: {
                    select: {
                        tag: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        if (!question) {
            throw new common_1.ForbiddenException('Question not found');
        }
        return question;
    }
    async createQuestion(body) {
        const { options, tags, ...questionData } = body;
        const question = await this.prisma.question.create({
            data: {
                ...questionData,
                options: {
                    create: options.map((option, index) => ({
                        text: option.text,
                        isCorrect: option.isCorrect,
                        order: index
                    }))
                },
                tags: tags && tags.length > 0 ? {
                    create: tags.map((tagId) => ({
                        tag: {
                            connect: { id: tagId }
                        }
                    }))
                } : undefined
            },
            include: {
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
                topic: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                subtopic: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                options: {
                    select: {
                        id: true,
                        text: true,
                        isCorrect: true,
                        order: true
                    },
                    orderBy: { order: 'asc' }
                },
                tags: {
                    select: {
                        tag: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        return question;
    }
    async updateQuestion(id, body) {
        const { options, tags, ...questionData } = body;
        await this.prisma.questionOption.deleteMany({
            where: { questionId: id }
        });
        await this.prisma.questionTag.deleteMany({
            where: { questionId: id }
        });
        const question = await this.prisma.question.update({
            where: { id },
            data: {
                ...questionData,
                options: {
                    create: options.map((option, index) => ({
                        text: option.text,
                        isCorrect: option.isCorrect,
                        order: index
                    }))
                },
                tags: tags && tags.length > 0 ? {
                    create: tags.map((tagId) => ({
                        tag: {
                            connect: { id: tagId }
                        }
                    }))
                } : undefined
            },
            include: {
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
                topic: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                subtopic: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                options: {
                    select: {
                        id: true,
                        text: true,
                        isCorrect: true,
                        order: true
                    },
                    orderBy: { order: 'asc' }
                },
                tags: {
                    select: {
                        tag: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
            }
        });
        return question;
    }
    async deleteQuestion(id) {
        await this.prisma.question.delete({
            where: { id }
        });
        return { message: 'Question deleted successfully' };
    }
    async getQuestionReports(req, page = '1', limit = '10', status, type) {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (status && status !== 'all')
            where.status = status;
        if (type && type !== 'all')
            where.reportType = type;
        const [reports, total] = await Promise.all([
            this.prisma.questionReport.findMany({
                where,
                include: {
                    question: {
                        select: {
                            id: true,
                            stem: true,
                            explanation: true,
                            subject: {
                                select: {
                                    name: true,
                                    stream: {
                                        select: {
                                            name: true,
                                            code: true
                                        }
                                    }
                                }
                            }
                        }
                    },
                    user: {
                        select: {
                            id: true,
                            fullName: true,
                            email: true
                        }
                    },
                    suggestedOptions: {
                        select: {
                            id: true,
                            text: true,
                            isCorrect: true,
                            order: true
                        },
                        orderBy: { order: 'asc' }
                    },
                    reviewedBy: {
                        select: {
                            id: true,
                            fullName: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            this.prisma.questionReport.count({ where })
        ]);
        return {
            reports,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        };
    }
    async getQuestionReportStats() {
        const [total, pending, approved, rejected] = await Promise.all([
            this.prisma.questionReport.count(),
            this.prisma.questionReport.count({ where: { status: 'PENDING' } }),
            this.prisma.questionReport.count({ where: { status: 'APPROVED' } }),
            this.prisma.questionReport.count({ where: { status: 'REJECTED' } })
        ]);
        const typeStats = await this.prisma.questionReport.groupBy({
            by: ['reportType'],
            _count: {
                reportType: true
            }
        });
        return {
            total,
            pending,
            approved,
            rejected,
            typeStats: typeStats.map(stat => ({
                type: stat.reportType,
                count: stat._count.reportType
            }))
        };
    }
    async getQuestionReport(id) {
        const report = await this.prisma.questionReport.findUnique({
            where: { id },
            include: {
                question: {
                    select: {
                        id: true,
                        stem: true,
                        explanation: true,
                        subject: {
                            select: {
                                name: true,
                                stream: {
                                    select: {
                                        name: true,
                                        code: true
                                    }
                                }
                            }
                        }
                    }
                },
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                suggestedOptions: {
                    select: {
                        id: true,
                        text: true,
                        isCorrect: true,
                        order: true
                    },
                    orderBy: { order: 'asc' }
                },
                reviewedBy: {
                    select: {
                        id: true,
                        fullName: true
                    }
                }
            }
        });
        if (!report) {
            throw new common_1.ForbiddenException('Report not found');
        }
        return report;
    }
    async reviewQuestionReport(id, body, req) {
        const reviewerId = req.user.id;
        const report = await this.prisma.questionReport.findUnique({
            where: { id },
            include: { question: true }
        });
        if (!report) {
            throw new common_1.ForbiddenException('Report not found');
        }
        if (report.status !== 'PENDING') {
            throw new common_1.ForbiddenException('Report has already been reviewed');
        }
        const result = await this.prisma.$transaction(async (prisma) => {
            const updatedReport = await prisma.questionReport.update({
                where: { id },
                data: {
                    status: body.status,
                    reviewedById: reviewerId,
                    reviewedAt: new Date(),
                    reviewNotes: body.reviewNotes
                }
            });
            if (body.status === 'APPROVED' && report.reportType === 'SUGGESTED_EXPLANATION' && report.alternativeExplanation) {
                await prisma.questionAlternativeExplanation.create({
                    data: {
                        questionId: report.questionId,
                        explanation: report.alternativeExplanation,
                        source: 'REPORT_APPROVED',
                        reportId: report.id
                    }
                });
            }
            return updatedReport;
        });
        return {
            message: `Report ${body.status.toLowerCase()} successfully`,
            report: result
        };
    }
    async getSubjects() {
        return this.prisma.subject.findMany({
            include: {
                stream: {
                    select: {
                        id: true,
                        name: true,
                        code: true
                    }
                },
                _count: {
                    select: {
                        questions: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
    }
    async getTopics(subjectId) {
        const where = {};
        if (subjectId)
            where.subjectId = subjectId;
        return this.prisma.topic.findMany({
            where,
            include: {
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
                _count: {
                    select: {
                        questions: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
    }
    async getSubtopics(topicId) {
        const where = {};
        if (topicId)
            where.topicId = topicId;
        return this.prisma.subtopic.findMany({
            where,
            include: {
                topic: {
                    select: {
                        id: true,
                        name: true,
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
                        }
                    }
                },
                _count: {
                    select: {
                        questions: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        });
    }
    async getTags() {
        return this.prisma.tag.findMany({
            orderBy: { name: 'asc' }
        });
    }
};
exports.ExpertController = ExpertController;
__decorate([
    (0, common_1.Get)('questions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('subjectId')),
    __param(5, (0, common_1.Query)('topicId')),
    __param(6, (0, common_1.Query)('subtopicId')),
    __param(7, (0, common_1.Query)('difficulty')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ExpertController.prototype, "getQuestions", null);
__decorate([
    (0, common_1.Get)('questions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExpertController.prototype, "getQuestion", null);
__decorate([
    (0, common_1.Post)('questions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExpertController.prototype, "createQuestion", null);
__decorate([
    (0, common_1.Put)('questions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExpertController.prototype, "updateQuestion", null);
__decorate([
    (0, common_1.Delete)('questions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExpertController.prototype, "deleteQuestion", null);
__decorate([
    (0, common_1.Get)('question-reports'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], ExpertController.prototype, "getQuestionReports", null);
__decorate([
    (0, common_1.Get)('question-reports/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExpertController.prototype, "getQuestionReportStats", null);
__decorate([
    (0, common_1.Get)('question-reports/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExpertController.prototype, "getQuestionReport", null);
__decorate([
    (0, common_1.Post)('question-reports/:id/review'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ExpertController.prototype, "reviewQuestionReport", null);
__decorate([
    (0, common_1.Get)('subjects'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExpertController.prototype, "getSubjects", null);
__decorate([
    (0, common_1.Get)('topics'),
    __param(0, (0, common_1.Query)('subjectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExpertController.prototype, "getTopics", null);
__decorate([
    (0, common_1.Get)('subtopics'),
    __param(0, (0, common_1.Query)('topicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ExpertController.prototype, "getSubtopics", null);
__decorate([
    (0, common_1.Get)('tags'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ExpertController.prototype, "getTags", null);
exports.ExpertController = ExpertController = __decorate([
    (0, common_1.Controller)('expert'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('EXPERT'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExpertController);
//# sourceMappingURL=expert.controller.js.map