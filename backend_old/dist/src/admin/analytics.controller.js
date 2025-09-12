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
exports.AdminAnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let AdminAnalyticsController = class AdminAnalyticsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getOverview() {
        const totalUsers = await this.prisma.user.count();
        const totalQuestions = await this.prisma.question.count();
        const totalExamPapers = await this.prisma.examPaper.count();
        const totalExamSubmissions = await this.prisma.examSubmission.count();
        const totalSubscriptions = await this.prisma.subscription.count();
        const totalPlans = await this.prisma.plan.count();
        const activeSubscriptions = await this.prisma.subscription.count({
            where: { status: 'ACTIVE' }
        });
        const completedSubmissions = await this.prisma.examSubmission.count({
            where: { submittedAt: { not: null } }
        });
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const newUsersLast30Days = await this.prisma.user.count({
            where: { createdAt: { gte: last30Days } }
        });
        const newSubmissionsLast30Days = await this.prisma.examSubmission.count({
            where: { startedAt: { gte: last30Days } }
        });
        const newSubscriptionsLast30Days = await this.prisma.subscription.count({
            where: { createdAt: { gte: last30Days } }
        });
        const activeSubscriptionsWithPlans = await this.prisma.subscription.findMany({
            where: { status: 'ACTIVE' },
            include: {
                plan: {
                    select: {
                        priceCents: true,
                        currency: true,
                        interval: true
                    }
                }
            }
        });
        const mrr = activeSubscriptionsWithPlans.reduce((total, sub) => {
            if (sub.plan.interval === 'MONTH') {
                return total + sub.plan.priceCents;
            }
            else {
                return total + Math.round(sub.plan.priceCents / 12);
            }
        }, 0);
        return {
            overview: {
                totalUsers,
                totalQuestions,
                totalExamPapers,
                totalExamSubmissions,
                totalSubscriptions,
                totalPlans,
                activeSubscriptions,
                completedSubmissions,
                newUsersLast30Days,
                newSubmissionsLast30Days,
                newSubscriptionsLast30Days,
                mrr: mrr / 100
            }
        };
    }
    async getUserAnalytics() {
        const now = new Date();
        const last6Months = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        const monthlyRegistrations = await this.prisma.user.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: { gte: last6Months }
            },
            _count: true
        });
        const monthlyData = monthlyRegistrations.reduce((acc, item) => {
            const month = new Date(item.createdAt).toISOString().slice(0, 7);
            acc[month] = (acc[month] || 0) + item._count;
            return acc;
        }, {});
        const roleDistribution = await this.prisma.user.groupBy({
            by: ['role'],
            _count: true
        });
        const verificationStats = await this.prisma.user.groupBy({
            by: ['emailVerified', 'phoneVerified'],
            _count: true
        });
        const trialUsers = await this.prisma.user.count({
            where: {
                trialEndsAt: { gt: now }
            }
        });
        const topUsers = await this.prisma.user.findMany({
            take: 10,
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
                examSubmissions: {
                    _count: 'desc'
                }
            }
        });
        return {
            monthlyRegistrations: monthlyData,
            roleDistribution,
            verificationStats,
            trialUsers,
            topUsers
        };
    }
    async getExamAnalytics() {
        const totalSubmissions = await this.prisma.examSubmission.count();
        const completedSubmissions = await this.prisma.examSubmission.count({
            where: { submittedAt: { not: null } }
        });
        const averageScore = await this.prisma.examSubmission.aggregate({
            where: { submittedAt: { not: null } },
            _avg: { scorePercent: true }
        });
        const subjectPerformance = await this.prisma.$queryRawUnsafe(`
			SELECT 
				s.name as subject_name,
				COUNT(DISTINCT es.id) as total_submissions,
				AVG(es."scorePercent") as average_score,
				COUNT(DISTINCT es."userId") as unique_users
			FROM "ExamSubmission" es
			JOIN "ExamPaper" ep ON ep.id = es."examPaperId"
			JOIN "Question" q ON q.id = ANY(ep."questionIds")
			JOIN "Subject" s ON s.id = q."subjectId"
			WHERE es."submittedAt" IS NOT NULL
			GROUP BY s.id, s.name
			ORDER BY total_submissions DESC
		`);
        const topicPerformance = await this.prisma.$queryRawUnsafe(`
			SELECT 
				t.name as topic_name,
				s.name as subject_name,
				COUNT(DISTINCT es.id) as total_submissions,
				AVG(es."scorePercent") as average_score,
				COUNT(DISTINCT es."userId") as unique_users
			FROM "ExamSubmission" es
			JOIN "ExamPaper" ep ON ep.id = es."examPaperId"
			JOIN "Question" q ON q.id = ANY(ep."questionIds")
			JOIN "Topic" t ON t.id = q."topicId"
			JOIN "Subject" s ON s.id = t."subjectId"
			WHERE es."submittedAt" IS NOT NULL
			GROUP BY t.id, t.name, s.name
			ORDER BY total_submissions DESC
			LIMIT 20
		`);
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const recentSubmissions = await this.prisma.examSubmission.findMany({
            where: {
                startedAt: { gte: last30Days }
            },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true
                    }
                },
                examPaper: {
                    select: {
                        title: true
                    }
                }
            },
            orderBy: { startedAt: 'desc' },
            take: 10
        });
        const examPaperPopularity = await this.prisma.examPaper.findMany({
            select: {
                id: true,
                title: true,
                _count: {
                    select: {
                        submissions: true
                    }
                }
            },
            orderBy: {
                submissions: {
                    _count: 'desc'
                }
            },
            take: 10
        });
        return {
            overview: {
                totalSubmissions,
                completedSubmissions,
                completionRate: totalSubmissions > 0 ? (completedSubmissions / totalSubmissions) * 100 : 0,
                averageScore: averageScore._avg.scorePercent || 0
            },
            subjectPerformance,
            topicPerformance,
            recentSubmissions,
            examPaperPopularity
        };
    }
    async getQuestionAnalytics() {
        const totalQuestions = await this.prisma.question.count();
        const questionsBySubject = await this.prisma.question.groupBy({
            by: ['subjectId'],
            _count: true
        });
        const subjectIds = questionsBySubject.map(q => q.subjectId).filter(id => id !== null);
        const subjects = await this.prisma.subject.findMany({
            where: { id: { in: subjectIds } },
            select: { id: true, name: true }
        });
        const questionsByTopic = await this.prisma.question.groupBy({
            by: ['topicId'],
            _count: true
        });
        const topicIds = questionsByTopic.map(q => q.topicId).filter(id => id !== null);
        const topics = await this.prisma.topic.findMany({
            where: { id: { in: topicIds } },
            select: {
                id: true,
                name: true,
                subject: { select: { name: true } }
            }
        });
        const questionsBySubtopic = await this.prisma.question.groupBy({
            by: ['subtopicId'],
            _count: true
        });
        const subtopicIds = questionsBySubtopic.map(q => q.subtopicId).filter(id => id !== null);
        const subtopics = await this.prisma.subtopic.findMany({
            where: { id: { in: subtopicIds } },
            select: {
                id: true,
                name: true,
                topic: {
                    select: {
                        name: true,
                        subject: { select: { name: true } }
                    }
                }
            }
        });
        const difficultyDistribution = await this.prisma.question.groupBy({
            by: ['difficulty'],
            _count: true
        });
        const mostUsedQuestions = await this.prisma.$queryRawUnsafe(`
			SELECT 
				q.id,
				q.stem,
				q.difficulty,
				s.name as subject_name,
				t.name as topic_name,
				COUNT(*) as usage_count
			FROM "Question" q
			JOIN "ExamPaper" ep ON q.id = ANY(ep."questionIds")
			JOIN "Subject" s ON s.id = q."subjectId"
			JOIN "Topic" t ON t.id = q."topicId"
			GROUP BY q.id, q.stem, q.difficulty, s.name, t.name
			ORDER BY usage_count DESC
			LIMIT 20
		`);
        const questionPerformance = await this.prisma.$queryRawUnsafe(`
			SELECT 
				q.id,
				q.stem,
				q.difficulty,
				s.name as subject_name,
				COUNT(a.id) as total_attempts,
				SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END) as correct_attempts,
				ROUND(
					(SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::numeric / COUNT(a.id)::numeric) * 100, 
					2
				) as success_rate
			FROM "Question" q
			JOIN "ExamAnswer" a ON a."questionId" = q.id
			JOIN "Subject" s ON s.id = q."subjectId"
			GROUP BY q.id, q.stem, q.difficulty, s.name
			HAVING COUNT(a.id) >= 5
			ORDER BY success_rate ASC
			LIMIT 20
		`);
        const questionsBySubjectWithNames = questionsBySubject.map(q => {
            const subject = subjects.find(s => s.id === q.subjectId);
            return {
                ...q,
                subject: { name: subject?.name || 'Unknown Subject' }
            };
        });
        const questionsByTopicWithNames = questionsByTopic.map(q => {
            const topic = topics.find(t => t.id === q.topicId);
            return {
                ...q,
                topic: {
                    name: topic?.name || 'Unknown Topic',
                    subject: { name: topic?.subject?.name || 'Unknown Subject' }
                }
            };
        });
        const questionsBySubtopicWithNames = questionsBySubtopic.map(q => {
            const subtopic = subtopics.find(s => s.id === q.subtopicId);
            return {
                ...q,
                subtopic: {
                    name: subtopic?.name || 'Unknown Subtopic',
                    topic: {
                        name: subtopic?.topic?.name || 'Unknown Topic',
                        subject: { name: subtopic?.topic?.subject?.name || 'Unknown Subject' }
                    }
                }
            };
        });
        return {
            overview: {
                totalQuestions
            },
            questionsBySubject: questionsBySubjectWithNames,
            questionsByTopic: questionsByTopicWithNames.slice(0, 20),
            questionsBySubtopic: questionsBySubtopicWithNames.slice(0, 20),
            difficultyDistribution,
            mostUsedQuestions,
            questionPerformance
        };
    }
    async getSubscriptionAnalytics() {
        const totalSubscriptions = await this.prisma.subscription.count();
        const activeSubscriptions = await this.prisma.subscription.count({
            where: { status: 'ACTIVE' }
        });
        const canceledSubscriptions = await this.prisma.subscription.count({
            where: { status: 'CANCELED' }
        });
        const subscriptionsWithPlans = await this.prisma.subscription.findMany({
            where: { status: 'ACTIVE' },
            include: {
                plan: {
                    select: {
                        name: true,
                        priceCents: true,
                        currency: true,
                        interval: true
                    }
                }
            }
        });
        const mrr = subscriptionsWithPlans.reduce((total, sub) => {
            if (sub.plan.interval === 'MONTH') {
                return total + sub.plan.priceCents;
            }
            else {
                return total + Math.round(sub.plan.priceCents / 12);
            }
        }, 0);
        const arr = subscriptionsWithPlans.reduce((total, sub) => {
            if (sub.plan.interval === 'YEAR') {
                return total + sub.plan.priceCents;
            }
            else {
                return total + (sub.plan.priceCents * 12);
            }
        }, 0);
        const planPopularity = await this.prisma.plan.findMany({
            select: {
                id: true,
                name: true,
                priceCents: true,
                currency: true,
                interval: true,
                _count: {
                    select: {
                        subscriptions: true
                    }
                }
            },
            orderBy: {
                subscriptions: {
                    _count: 'desc'
                }
            }
        });
        const now = new Date();
        const last6Months = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        const monthlySubscriptions = await this.prisma.subscription.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: { gte: last6Months }
            },
            _count: true
        });
        const monthlyData = monthlySubscriptions.reduce((acc, item) => {
            const month = new Date(item.createdAt).toISOString().slice(0, 7);
            acc[month] = (acc[month] || 0) + item._count;
            return acc;
        }, {});
        const recentSubscriptions = await this.prisma.subscription.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true
                    }
                },
                plan: {
                    select: {
                        name: true,
                        priceCents: true,
                        currency: true
                    }
                }
            }
        });
        return {
            overview: {
                totalSubscriptions,
                activeSubscriptions,
                canceledSubscriptions,
                mrr: mrr / 100,
                arr: arr / 100,
                churnRate: totalSubscriptions > 0 ? (canceledSubscriptions / totalSubscriptions) * 100 : 0
            },
            planPopularity,
            monthlySubscriptions: monthlyData,
            recentSubscriptions
        };
    }
    async getContentAnalytics() {
        const totalSubjects = await this.prisma.subject.count();
        const totalTopics = await this.prisma.topic.count();
        const totalSubtopics = await this.prisma.subtopic.count();
        const totalQuestions = await this.prisma.question.count();
        const totalTags = await this.prisma.tag.count();
        const subjectsWithCounts = await this.prisma.subject.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        topics: true,
                        questions: true
                    }
                }
            },
            orderBy: {
                questions: {
                    _count: 'desc'
                }
            }
        });
        const topicsWithCounts = await this.prisma.topic.findMany({
            select: {
                id: true,
                name: true,
                subject: {
                    select: {
                        name: true
                    }
                },
                _count: {
                    select: {
                        subtopics: true,
                        questions: true
                    }
                }
            },
            orderBy: {
                questions: {
                    _count: 'desc'
                }
            },
            take: 20
        });
        const subtopicsWithCounts = await this.prisma.subtopic.findMany({
            select: {
                id: true,
                name: true,
                topic: {
                    select: {
                        name: true,
                        subject: {
                            select: {
                                name: true
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
            orderBy: {
                questions: {
                    _count: 'desc'
                }
            },
            take: 20
        });
        const tagUsage = await this.prisma.tag.findMany({
            select: {
                id: true,
                name: true,
                _count: {
                    select: {
                        questions: true
                    }
                }
            },
            orderBy: {
                questions: {
                    _count: 'desc'
                }
            },
            take: 20
        });
        const now = new Date();
        const last6Months = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        const monthlyQuestions = await this.prisma.question.groupBy({
            by: ['createdAt'],
            where: {
                createdAt: { gte: last6Months }
            },
            _count: true
        });
        const monthlyData = monthlyQuestions.reduce((acc, item) => {
            const month = new Date(item.createdAt).toISOString().slice(0, 7);
            acc[month] = (acc[month] || 0) + item._count;
            return acc;
        }, {});
        return {
            overview: {
                totalSubjects,
                totalTopics,
                totalSubtopics,
                totalQuestions,
                totalTags
            },
            subjectsWithCounts,
            topicsWithCounts,
            subtopicsWithCounts,
            tagUsage,
            monthlyQuestions: monthlyData
        };
    }
    async getDashboardData() {
        const [overview, userAnalytics, examAnalytics, questionAnalytics, subscriptionAnalytics, contentAnalytics] = await Promise.all([
            this.getOverview(),
            this.getUserAnalytics(),
            this.getExamAnalytics(),
            this.getQuestionAnalytics(),
            this.getSubscriptionAnalytics(),
            this.getContentAnalytics()
        ]);
        return {
            overview: overview.overview,
            userAnalytics,
            examAnalytics,
            questionAnalytics,
            subscriptionAnalytics,
            contentAnalytics
        };
    }
};
exports.AdminAnalyticsController = AdminAnalyticsController;
__decorate([
    (0, common_1.Get)('overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "getUserAnalytics", null);
__decorate([
    (0, common_1.Get)('exams'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "getExamAnalytics", null);
__decorate([
    (0, common_1.Get)('questions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "getQuestionAnalytics", null);
__decorate([
    (0, common_1.Get)('subscriptions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "getSubscriptionAnalytics", null);
__decorate([
    (0, common_1.Get)('content'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "getContentAnalytics", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminAnalyticsController.prototype, "getDashboardData", null);
exports.AdminAnalyticsController = AdminAnalyticsController = __decorate([
    (0, common_1.Controller)('admin/analytics'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminAnalyticsController);
//# sourceMappingURL=analytics.controller.js.map