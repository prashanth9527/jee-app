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
exports.AdminQuestionReportsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let AdminQuestionReportsController = class AdminQuestionReportsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getReports(status, type, page = '1', limit = '10') {
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (status && status !== 'all') {
            where.status = status;
        }
        if (type && type !== 'all') {
            where.reportType = type;
        }
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
                                select: { name: true, stream: { select: { name: true, code: true } } }
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
    async getReportStats() {
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
    async getReport(id) {
        const report = await this.prisma.questionReport.findUnique({
            where: { id },
            include: {
                question: {
                    select: {
                        id: true,
                        stem: true,
                        explanation: true,
                        options: {
                            orderBy: { order: 'asc' }
                        },
                        subject: {
                            select: { name: true, stream: { select: { name: true, code: true } } }
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
            throw new Error('Report not found');
        }
        return report;
    }
    async reviewReport(id, reviewDto, req) {
        const reviewerId = req.user.id;
        const report = await this.prisma.questionReport.findUnique({
            where: { id },
            include: {
                question: true
            }
        });
        if (!report) {
            throw new Error('Report not found');
        }
        if (report.status !== 'PENDING') {
            throw new Error('Report has already been reviewed');
        }
        const result = await this.prisma.$transaction(async (prisma) => {
            const updatedReport = await prisma.questionReport.update({
                where: { id },
                data: {
                    status: reviewDto.status,
                    reviewedById: reviewerId,
                    reviewedAt: new Date(),
                    reviewNotes: reviewDto.reviewNotes
                }
            });
            if (reviewDto.status === 'APPROVED' && report.reportType === 'SUGGESTED_EXPLANATION' && report.alternativeExplanation) {
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
            message: `Report ${reviewDto.status.toLowerCase()} successfully`,
            report: result
        };
    }
    async getQuestionExplanations(questionId) {
        const question = await this.prisma.question.findUnique({
            where: { id: questionId },
            include: {
                alternativeExplanations: {
                    orderBy: { createdAt: 'asc' }
                },
                reports: {
                    where: { status: 'PENDING' },
                    include: {
                        user: {
                            select: { fullName: true, email: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!question) {
            throw new Error('Question not found');
        }
        return {
            question: {
                id: question.id,
                stem: question.stem,
                explanation: question.explanation
            },
            alternativeExplanations: question.alternativeExplanations,
            pendingReports: question.reports
        };
    }
};
exports.AdminQuestionReportsController = AdminQuestionReportsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('type')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminQuestionReportsController.prototype, "getReports", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminQuestionReportsController.prototype, "getReportStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminQuestionReportsController.prototype, "getReport", null);
__decorate([
    (0, common_1.Post)(':id/review'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminQuestionReportsController.prototype, "reviewReport", null);
__decorate([
    (0, common_1.Get)('question/:questionId/explanations'),
    __param(0, (0, common_1.Param)('questionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminQuestionReportsController.prototype, "getQuestionExplanations", null);
exports.AdminQuestionReportsController = AdminQuestionReportsController = __decorate([
    (0, common_1.Controller)('admin/question-reports'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminQuestionReportsController);
//# sourceMappingURL=question-reports.controller.js.map