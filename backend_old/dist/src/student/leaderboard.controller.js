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
exports.StudentLeaderboardController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let StudentLeaderboardController = class StudentLeaderboardController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getLeaderboard(req, type = 'overall') {
        const userId = req.user.id;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { streamId: true, stream: { select: { name: true, code: true } } }
        });
        if (!user?.streamId) {
            throw new Error('User not assigned to any stream');
        }
        let leaderboardData;
        switch (type) {
            case 'practice-tests':
                leaderboardData = await this.getPracticeTestLeaderboard(user.streamId);
                break;
            case 'exam-papers':
                leaderboardData = await this.getExamPaperLeaderboard(user.streamId);
                break;
            case 'pyq':
                leaderboardData = await this.getPYQLeaderboard(user.streamId);
                break;
            case 'overall':
            default:
                leaderboardData = await this.getOverallLeaderboard(user.streamId);
                break;
        }
        const userPosition = leaderboardData.findIndex((entry) => entry.userId === userId) + 1;
        return {
            stream: user.stream,
            type,
            leaderboard: leaderboardData,
            userPosition: userPosition > 0 ? userPosition : null,
            totalStudents: leaderboardData.length
        };
    }
    async getOverallLeaderboard(streamId) {
        const students = await this.prisma.user.findMany({
            where: {
                streamId,
                role: 'STUDENT'
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                _count: {
                    select: {
                        examSubmissions: true
                    }
                }
            },
            orderBy: {
                fullName: 'asc'
            }
        });
        const leaderboard = await Promise.all(students.map(async (student) => {
            const examScores = await this.prisma.examSubmission.findMany({
                where: { userId: student.id },
                select: { scorePercent: true, totalQuestions: true, correctCount: true }
            });
            const totalScore = examScores.reduce((sum, submission) => sum + (submission.scorePercent || 0), 0);
            const totalTests = examScores.length;
            const averageScore = totalTests > 0 ? totalScore / totalTests : 0;
            const totalCorrect = examScores.reduce((sum, submission) => sum + submission.correctCount, 0);
            const totalQuestions = examScores.reduce((sum, submission) => sum + submission.totalQuestions, 0);
            return {
                userId: student.id,
                fullName: student.fullName,
                email: student.email,
                averageScore: Math.round(averageScore * 100) / 100,
                totalTests,
                totalCorrect,
                totalQuestions,
                examSubmissions: student._count.examSubmissions
            };
        }));
        return leaderboard
            .sort((a, b) => {
            if (b.averageScore !== a.averageScore) {
                return b.averageScore - a.averageScore;
            }
            return b.totalTests - a.totalTests;
        })
            .slice(0, 50);
    }
    async getPracticeTestLeaderboard(streamId) {
        const students = await this.prisma.user.findMany({
            where: {
                streamId,
                role: 'STUDENT'
            },
            select: {
                id: true,
                fullName: true,
                email: true
            }
        });
        const leaderboard = await Promise.all(students.map(async (student) => {
            const practiceSubmissions = await this.prisma.examSubmission.findMany({
                where: {
                    userId: student.id
                },
                select: { scorePercent: true, totalQuestions: true, correctCount: true, startedAt: true }
            });
            const totalScore = practiceSubmissions.reduce((sum, submission) => sum + (submission.scorePercent || 0), 0);
            const averageScore = practiceSubmissions.length > 0 ? totalScore / practiceSubmissions.length : 0;
            return {
                userId: student.id,
                fullName: student.fullName,
                email: student.email,
                averageScore: Math.round(averageScore * 100) / 100,
                totalTests: practiceSubmissions.length,
                totalScore: Math.round(totalScore),
                lastTestDate: practiceSubmissions.length > 0
                    ? practiceSubmissions[practiceSubmissions.length - 1].startedAt
                    : null
            };
        }));
        return leaderboard
            .filter(entry => entry.totalTests > 0)
            .sort((a, b) => b.averageScore - a.averageScore)
            .slice(0, 50);
    }
    async getExamPaperLeaderboard(streamId) {
        const students = await this.prisma.user.findMany({
            where: {
                streamId,
                role: 'STUDENT'
            },
            select: {
                id: true,
                fullName: true,
                email: true
            }
        });
        const leaderboard = await Promise.all(students.map(async (student) => {
            const examSubmissions = await this.prisma.examSubmission.findMany({
                where: {
                    userId: student.id
                },
                select: { scorePercent: true, totalQuestions: true, correctCount: true, startedAt: true }
            });
            const totalScore = examSubmissions.reduce((sum, submission) => sum + (submission.scorePercent || 0), 0);
            const averageScore = examSubmissions.length > 0 ? totalScore / examSubmissions.length : 0;
            return {
                userId: student.id,
                fullName: student.fullName,
                email: student.email,
                averageScore: Math.round(averageScore * 100) / 100,
                totalTests: examSubmissions.length,
                totalScore: Math.round(totalScore),
                lastTestDate: examSubmissions.length > 0
                    ? examSubmissions[examSubmissions.length - 1].startedAt
                    : null
            };
        }));
        return leaderboard
            .filter(entry => entry.totalTests > 0)
            .sort((a, b) => b.averageScore - a.averageScore)
            .slice(0, 50);
    }
    async getPYQLeaderboard(streamId) {
        const students = await this.prisma.user.findMany({
            where: {
                streamId,
                role: 'STUDENT'
            },
            select: {
                id: true,
                fullName: true,
                email: true
            }
        });
        const leaderboard = await Promise.all(students.map(async (student) => {
            const pyqSubmissions = await this.prisma.examSubmission.findMany({
                where: {
                    userId: student.id
                },
                select: { scorePercent: true, totalQuestions: true, correctCount: true, startedAt: true }
            });
            const totalScore = pyqSubmissions.reduce((sum, submission) => sum + (submission.scorePercent || 0), 0);
            const averageScore = pyqSubmissions.length > 0 ? totalScore / pyqSubmissions.length : 0;
            return {
                userId: student.id,
                fullName: student.fullName,
                email: student.email,
                averageScore: Math.round(averageScore * 100) / 100,
                totalTests: pyqSubmissions.length,
                totalScore: Math.round(totalScore),
                lastTestDate: pyqSubmissions.length > 0
                    ? pyqSubmissions[pyqSubmissions.length - 1].startedAt
                    : null
            };
        }));
        return leaderboard
            .filter(entry => entry.totalTests > 0)
            .sort((a, b) => b.averageScore - a.averageScore)
            .slice(0, 50);
    }
};
exports.StudentLeaderboardController = StudentLeaderboardController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StudentLeaderboardController.prototype, "getLeaderboard", null);
exports.StudentLeaderboardController = StudentLeaderboardController = __decorate([
    (0, common_1.Controller)('student/leaderboard'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('STUDENT'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StudentLeaderboardController);
//# sourceMappingURL=leaderboard.controller.js.map