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
exports.StudentController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const prisma_service_1 = require("../prisma/prisma.service");
const subscription_validation_service_1 = require("../subscriptions/subscription-validation.service");
let StudentController = class StudentController {
    constructor(prisma, subscriptionValidation) {
        this.prisma = prisma;
        this.subscriptionValidation = subscriptionValidation;
    }
    async getDashboard(req) {
        const userId = req.user.id;
        const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
        if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
            throw new common_1.ForbiddenException('Subscription required to access dashboard');
        }
        const totalExamsTaken = await this.prisma.examSubmission.count({
            where: { userId, submittedAt: { not: null } }
        });
        const submissions = await this.prisma.examSubmission.findMany({
            where: { userId, submittedAt: { not: null } },
            select: { scorePercent: true }
        });
        const averageScore = submissions.length > 0
            ? submissions.reduce((sum, sub) => sum + (sub.scorePercent || 0), 0) / submissions.length
            : 0;
        const answers = await this.prisma.examAnswer.findMany({
            where: {
                submission: {
                    userId,
                    submittedAt: { not: null }
                }
            },
            select: { isCorrect: true }
        });
        const totalQuestionsAnswered = answers.length;
        const correctAnswers = answers.filter(a => a.isCorrect).length;
        const subjectStats = await this.prisma.$queryRawUnsafe(`
			SELECT 
				s.id as "subjectId",
				s.name as "subjectName",
				COUNT(a.id)::int as "totalQuestions",
				SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::int as "correctAnswers",
				ROUND(
					(SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::numeric / COUNT(a.id)::numeric) * 100, 
					2
				) as "score"
			FROM "ExamAnswer" a
			JOIN "Question" q ON q.id = a."questionId"
			JOIN "Subject" s ON s.id = q."subjectId"
			JOIN "ExamSubmission" es ON es.id = a."submissionId"
			WHERE es."userId" = $1 AND es."submittedAt" IS NOT NULL
			GROUP BY s.id, s.name
			ORDER BY "totalQuestions" DESC
		`, userId);
        return {
            totalExamsTaken,
            averageScore: Math.round(averageScore * 100) / 100,
            totalQuestionsAnswered,
            correctAnswers,
            subjects: subjectStats.map(s => ({
                name: s.subjectName,
                score: parseFloat(s.score) || 0,
                questions: s.totalQuestions
            }))
        };
    }
    async getExamPapers(req, page = '1', limit = '10', search, subjectId) {
        const userId = req.user.id;
        const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
        if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
            throw new common_1.ForbiddenException('Subscription required to access exam papers');
        }
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        if (subjectId) {
            where.subjectIds = { has: subjectId };
        }
        const [papers, total] = await Promise.all([
            this.prisma.examPaper.findMany({
                where,
                skip,
                take: limitNum,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    timeLimitMin: true,
                    createdAt: true,
                    subjectIds: true,
                    topicIds: true,
                    subtopicIds: true,
                    questionIds: true,
                    _count: {
                        select: {
                            submissions: {
                                where: { userId }
                            }
                        }
                    }
                }
            }),
            this.prisma.examPaper.count({ where })
        ]);
        const papersWithSubjects = await Promise.all(papers.map(async (paper) => {
            const subjects = paper.subjectIds?.length
                ? await this.prisma.subject.findMany({
                    where: { id: { in: paper.subjectIds } },
                    select: { id: true, name: true }
                })
                : [];
            return {
                ...paper,
                subjects,
                hasAttempted: paper._count.submissions > 0,
                questionCount: paper.questionIds?.length || 0
            };
        }));
        return {
            papers: papersWithSubjects,
            pagination: {
                currentPage: pageNum,
                totalPages: Math.ceil(total / limitNum),
                totalItems: total,
                itemsPerPage: limitNum
            }
        };
    }
    async getAiUsage(req) {
        const userId = req.user.id;
        return await this.subscriptionValidation.validateAiUsage(userId);
    }
    async getExamHistory(req, page = '1', limit = '10', type) {
        const userId = req.user.id;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
        if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
            throw new common_1.ForbiddenException('Subscription required to access exam history');
        }
        const where = {
            userId,
            submittedAt: { not: null }
        };
        if (type === 'practice') {
            where.examPaper = {
                questionIds: { isEmpty: false }
            };
        }
        else if (type === 'exam') {
            where.examPaper = {
                questionIds: { isEmpty: true }
            };
        }
        const [submissions, total] = await Promise.all([
            this.prisma.examSubmission.findMany({
                where,
                include: {
                    examPaper: {
                        select: {
                            id: true,
                            title: true,
                            timeLimitMin: true
                        }
                    }
                },
                orderBy: { submittedAt: 'desc' },
                skip,
                take: limitNum
            }),
            this.prisma.examSubmission.count({ where })
        ]);
        return {
            submissions: submissions.map(sub => ({
                id: sub.id,
                title: sub.examPaper.title,
                startedAt: sub.startedAt,
                submittedAt: sub.submittedAt,
                totalQuestions: sub.totalQuestions,
                correctCount: sub.correctCount,
                scorePercent: sub.scorePercent,
                timeLimitMin: sub.examPaper.timeLimitMin,
                duration: sub.submittedAt ?
                    Math.round((new Date(sub.submittedAt).getTime() - new Date(sub.startedAt).getTime()) / 1000 / 60) :
                    null
            })),
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum)
            }
        };
    }
    async getPerformance(req) {
        const userId = req.user.id;
        const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
        if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
            throw new common_1.ForbiddenException('Subscription required to access performance analytics');
        }
        const subjectPerformance = await this.prisma.$queryRawUnsafe(`
			SELECT 
				s.id as "subjectId",
				s.name as "subjectName",
				COUNT(a.id)::int as "totalQuestions",
				SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::int as "correctAnswers",
				ROUND(
					(SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::numeric / COUNT(a.id)::numeric) * 100, 
					2
				) as "score"
			FROM "ExamAnswer" a
			JOIN "Question" q ON q.id = a."questionId"
			JOIN "Subject" s ON s.id = q."subjectId"
			JOIN "ExamSubmission" es ON es.id = a."submissionId"
			WHERE es."userId" = $1 AND es."submittedAt" IS NOT NULL
			GROUP BY s.id, s.name
			ORDER BY "score" DESC
		`, userId);
        const topicPerformance = await this.prisma.$queryRawUnsafe(`
			SELECT 
				t.id as "topicId",
				t.name as "topicName",
				s.name as "subjectName",
				COUNT(a.id)::int as "totalQuestions",
				SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::int as "correctAnswers",
				ROUND(
					(SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::numeric / COUNT(a.id)::numeric) * 100, 
					2
				) as "score"
			FROM "ExamAnswer" a
			JOIN "Question" q ON q.id = a."questionId"
			JOIN "Topic" t ON t.id = q."topicId"
			JOIN "Subject" s ON s.id = t."subjectId"
			JOIN "ExamSubmission" es ON es.id = a."submissionId"
			WHERE es."userId" = $1 AND es."submittedAt" IS NOT NULL
			GROUP BY t.id, t.name, s.name
			HAVING COUNT(a.id) >= 5
			ORDER BY "score" DESC
			LIMIT 20
		`, userId);
        const difficultyPerformance = await this.prisma.$queryRawUnsafe(`
			SELECT 
				q.difficulty,
				COUNT(a.id)::int as "totalQuestions",
				SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::int as "correctAnswers",
				ROUND(
					(SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::numeric / COUNT(a.id)::numeric) * 100, 
					2
				) as "score"
			FROM "ExamAnswer" a
			JOIN "Question" q ON q.id = a."questionId"
			JOIN "ExamSubmission" es ON es.id = a."submissionId"
			WHERE es."userId" = $1 AND es."submittedAt" IS NOT NULL
			GROUP BY q.difficulty
			ORDER BY q.difficulty
		`, userId);
        const recentTrend = await this.prisma.examSubmission.findMany({
            where: {
                userId,
                submittedAt: { not: null }
            },
            orderBy: { submittedAt: 'desc' },
            take: 10,
            select: {
                scorePercent: true,
                submittedAt: true,
                examPaper: {
                    select: { title: true }
                }
            }
        });
        return {
            subjectPerformance: subjectPerformance.map(s => ({
                subjectId: s.subjectId,
                subjectName: s.subjectName,
                totalQuestions: s.totalQuestions,
                correctAnswers: s.correctAnswers,
                score: parseFloat(s.score) || 0
            })),
            topicPerformance: topicPerformance.map(t => ({
                topicId: t.topicId,
                topicName: t.topicName,
                subjectName: t.subjectName,
                totalQuestions: t.totalQuestions,
                correctAnswers: t.correctAnswers,
                score: parseFloat(t.score) || 0
            })),
            difficultyPerformance: difficultyPerformance.map(d => ({
                difficulty: d.difficulty,
                totalQuestions: d.totalQuestions,
                correctAnswers: d.correctAnswers,
                score: parseFloat(d.score) || 0
            })),
            recentTrend: recentTrend.map(r => ({
                score: r.scorePercent || 0,
                date: r.submittedAt,
                examTitle: r.examPaper.title
            }))
        };
    }
    async getSubscriptionStatus(req) {
        console.log('Subscription status request - User:', req.user);
        const userId = req.user.id;
        const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
        const subscriptionDetails = await this.subscriptionValidation.getSubscriptionDetails(userId);
        return {
            subscriptionStatus,
            subscriptionDetails
        };
    }
    async getProfile(req) {
        const user = await this.prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                emailVerified: true,
                phoneVerified: true,
                role: true,
                createdAt: true,
                trialStartedAt: true,
                trialEndsAt: true,
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    include: {
                        plan: {
                            select: { name: true, priceCents: true, currency: true, interval: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });
        return user;
    }
    async updateProfile(req, body) {
        const userId = req.user.id;
        if (body.phone) {
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    phone: body.phone,
                    id: { not: userId }
                }
            });
            if (existingUser) {
                throw new Error('Phone number is already registered');
            }
        }
        return this.prisma.user.update({
            where: { id: userId },
            data: {
                fullName: body.fullName,
                phone: body.phone,
                phoneVerified: body.phone ? false : undefined
            },
            select: {
                id: true,
                email: true,
                fullName: true,
                phone: true,
                emailVerified: true,
                phoneVerified: true,
                role: true
            }
        });
    }
    async getSubjects(req) {
        const userId = req.user.id;
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { streamId: true }
        });
        if (!user?.streamId) {
            throw new common_1.ForbiddenException('No stream assigned to user');
        }
        return this.prisma.subject.findMany({
            where: { streamId: user.streamId },
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                description: true,
                _count: {
                    select: { questions: true }
                }
            }
        });
    }
    async getTopics(subjectId) {
        const where = subjectId ? { subjectId } : {};
        return this.prisma.topic.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                subject: {
                    select: { name: true }
                },
                _count: {
                    select: { questions: true }
                }
            }
        });
    }
    async getSubtopics(topicId, subjectId) {
        const where = {};
        if (topicId) {
            where.topicId = topicId;
        }
        else if (subjectId) {
            where.topic = { subjectId };
        }
        return this.prisma.subtopic.findMany({
            where,
            orderBy: { name: 'asc' },
            include: {
                topic: {
                    select: {
                        name: true,
                        subject: {
                            select: { name: true }
                        }
                    }
                },
                _count: {
                    select: { questions: true }
                }
            }
        });
    }
    async getQuestionAvailability(subjectId, topicId, subtopicId, difficulty) {
        const where = {};
        if (subjectId)
            where.subjectId = subjectId;
        if (topicId)
            where.topicId = topicId;
        if (subtopicId)
            where.subtopicId = subtopicId;
        if (difficulty && difficulty !== 'MIXED')
            where.difficulty = difficulty;
        const totalQuestions = await this.prisma.question.count({ where });
        const difficultyBreakdown = await this.prisma.question.groupBy({
            by: ['difficulty'],
            where,
            _count: {
                difficulty: true
            }
        });
        return {
            totalQuestions,
            difficultyBreakdown: difficultyBreakdown.map(d => ({
                difficulty: d.difficulty,
                count: d._count.difficulty
            }))
        };
    }
};
exports.StudentController = StudentController;
__decorate([
    (0, common_1.Get)('dashboard'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('exam-papers'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('search')),
    __param(4, (0, common_1.Query)('subjectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getExamPapers", null);
__decorate([
    (0, common_1.Get)('ai-usage'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getAiUsage", null);
__decorate([
    (0, common_1.Get)('exam-history'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getExamHistory", null);
__decorate([
    (0, common_1.Get)('performance'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getPerformance", null);
__decorate([
    (0, common_1.Get)('subscription-status'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getSubscriptionStatus", null);
__decorate([
    (0, common_1.Get)('profile'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Put)('profile'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)('subjects'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getSubjects", null);
__decorate([
    (0, common_1.Get)('topics'),
    __param(0, (0, common_1.Query)('subjectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getTopics", null);
__decorate([
    (0, common_1.Get)('subtopics'),
    __param(0, (0, common_1.Query)('topicId')),
    __param(1, (0, common_1.Query)('subjectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getSubtopics", null);
__decorate([
    (0, common_1.Get)('question-availability'),
    __param(0, (0, common_1.Query)('subjectId')),
    __param(1, (0, common_1.Query)('topicId')),
    __param(2, (0, common_1.Query)('subtopicId')),
    __param(3, (0, common_1.Query)('difficulty')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getQuestionAvailability", null);
exports.StudentController = StudentController = __decorate([
    (0, common_1.Controller)('student'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('STUDENT'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        subscription_validation_service_1.SubscriptionValidationService])
], StudentController);
//# sourceMappingURL=student.controller.js.map