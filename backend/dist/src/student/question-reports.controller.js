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
exports.StudentQuestionReportsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let StudentQuestionReportsController = class StudentQuestionReportsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createReport(createReportDto, req) {
        const userId = req.user.id;
        const question = await this.prisma.question.findUnique({
            where: { id: createReportDto.questionId },
            include: {
                subject: {
                    select: { name: true, stream: { select: { name: true } } }
                }
            }
        });
        if (!question) {
            throw new Error('Question not found');
        }
        const report = await this.prisma.questionReport.create({
            data: {
                questionId: createReportDto.questionId,
                userId,
                reportType: createReportDto.reportType,
                reason: createReportDto.reason,
                description: createReportDto.description || '',
                alternativeExplanation: createReportDto.alternativeExplanation,
                suggestedAnswer: createReportDto.suggestedAnswer,
                suggestedOptions: createReportDto.suggestedOptions ? {
                    create: createReportDto.suggestedOptions
                } : undefined
            },
            include: {
                question: {
                    select: {
                        id: true,
                        stem: true,
                        subject: {
                            select: { name: true, stream: { select: { name: true } } }
                        }
                    }
                }
            }
        });
        return {
            message: 'Question report submitted successfully',
            report: {
                id: report.id,
                reportType: report.reportType,
                reason: report.reason,
                status: report.status,
                createdAt: report.createdAt,
                question: report.question
            }
        };
    }
    async getMyReports(req) {
        const userId = req.user.id;
        const reports = await this.prisma.questionReport.findMany({
            where: { userId },
            include: {
                question: {
                    select: {
                        id: true,
                        stem: true,
                        subject: {
                            select: { name: true, stream: { select: { name: true } } }
                        }
                    }
                },
                suggestedOptions: {
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return reports;
    }
    async getQuestionReports(questionId, req) {
        const userId = req.user.id;
        const question = await this.prisma.question.findUnique({
            where: { id: questionId },
            include: {
                alternativeExplanations: {
                    orderBy: { createdAt: 'asc' }
                },
                subject: {
                    select: { name: true, stream: { select: { name: true } } }
                }
            }
        });
        if (!question) {
            throw new Error('Question not found');
        }
        const userReports = await this.prisma.questionReport.findMany({
            where: {
                questionId,
                userId
            },
            orderBy: { createdAt: 'desc' }
        });
        return {
            question: {
                id: question.id,
                stem: question.stem,
                explanation: question.explanation,
                alternativeExplanations: question.alternativeExplanations,
                subject: question.subject
            },
            userReports
        };
    }
};
exports.StudentQuestionReportsController = StudentQuestionReportsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StudentQuestionReportsController.prototype, "createReport", null);
__decorate([
    (0, common_1.Get)('my-reports'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentQuestionReportsController.prototype, "getMyReports", null);
__decorate([
    (0, common_1.Get)('question/:questionId'),
    __param(0, (0, common_1.Param)('questionId')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StudentQuestionReportsController.prototype, "getQuestionReports", null);
exports.StudentQuestionReportsController = StudentQuestionReportsController = __decorate([
    (0, common_1.Controller)('student/question-reports'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('STUDENT'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StudentQuestionReportsController);
//# sourceMappingURL=question-reports.controller.js.map