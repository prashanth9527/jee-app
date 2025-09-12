import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminAnalyticsController {
	constructor(private readonly prisma: PrismaService) {}

	@Get('overview')
	async getOverview() {
		// Get total counts
		const totalUsers = await this.prisma.user.count();
		const totalQuestions = await this.prisma.question.count();
		const totalExamPapers = await this.prisma.examPaper.count();
		const totalExamSubmissions = await this.prisma.examSubmission.count();
		const totalSubscriptions = await this.prisma.subscription.count();
		const totalPlans = await this.prisma.plan.count();

		// Get active counts
		const activeSubscriptions = await this.prisma.subscription.count({
			where: { status: 'ACTIVE' }
		});

		const completedSubmissions = await this.prisma.examSubmission.count({
			where: { submittedAt: { not: null } }
		});

		// Get recent activity
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

		// Calculate revenue
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

		const mrr = activeSubscriptionsWithPlans.reduce((total: number, sub: any) => {
			if (sub.plan.interval === 'MONTH') {
				return total + sub.plan.priceCents;
			} else {
				// Convert yearly to monthly
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
				mrr: mrr / 100 // Convert cents to dollars
			}
		};
	}

	@Get('users')
	async getUserAnalytics() {
		// User growth over time
		const now = new Date();
		const last6Months = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

		const monthlyRegistrations = await this.prisma.user.groupBy({
			by: ['createdAt'],
			where: {
				createdAt: { gte: last6Months }
			},
			_count: true
		});

		// Group by month
		const monthlyData = monthlyRegistrations.reduce((acc: Record<string, number>, item: any) => {
			const month = new Date(item.createdAt).toISOString().slice(0, 7); // YYYY-MM
			acc[month] = (acc[month] || 0) + item._count;
			return acc;
		}, {} as Record<string, number>);

		// Role distribution
		const roleDistribution = await this.prisma.user.groupBy({
			by: ['role'],
			_count: true
		});

		// Verification status
		const verificationStats = await this.prisma.user.groupBy({
			by: ['emailVerified', 'phoneVerified'],
			_count: true
		});

		// Trial users
		const trialUsers = await this.prisma.user.count({
			where: {
				trialEndsAt: { gt: now }
			}
		});

		// Top users by exam submissions
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

	@Get('exams')
	async getExamAnalytics() {
		// Exam submission statistics
		const totalSubmissions = await this.prisma.examSubmission.count();
		const completedSubmissions = await this.prisma.examSubmission.count({
			where: { submittedAt: { not: null } }
		});
		const averageScore = await this.prisma.examSubmission.aggregate({
			where: { submittedAt: { not: null } },
			_avg: { scorePercent: true }
		});

		// Performance by subject
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
		`) as any[];

		// Performance by topic
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
		`) as any[];

		// Recent exam activity
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

		// Exam paper popularity
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

	@Get('questions')
	async getQuestionAnalytics() {
		// Question statistics
		const totalQuestions = await this.prisma.question.count();
		// Get questions by subject with counts
		const questionsBySubject = await this.prisma.question.groupBy({
			by: ['subjectId'],
			_count: true
		});

		// Get subject names for the grouped data
		const subjectIds = questionsBySubject.map((q: any) => q.subjectId).filter((id: any) => id !== null) as string[];
		const subjects = await this.prisma.subject.findMany({
			where: { id: { in: subjectIds } },
			select: { id: true, name: true }
		});

		// Get questions by topic with counts
		const questionsByTopic = await this.prisma.question.groupBy({
			by: ['topicId'],
			_count: true
		});

		// Get topic names for the grouped data
		const topicIds = questionsByTopic.map((q: any) => q.topicId).filter((id: any) => id !== null) as string[];
		const topics = await this.prisma.topic.findMany({
			where: { id: { in: topicIds } },
			select: { 
				id: true, 
				name: true,
				subject: { select: { name: true } }
			}
		});

		// Get questions by subtopic with counts
		const questionsBySubtopic = await this.prisma.question.groupBy({
			by: ['subtopicId'],
			_count: true
		});

		// Get subtopic names for the grouped data
		const subtopicIds = questionsBySubtopic.map((q: any) => q.subtopicId).filter((id: any) => id !== null) as string[];
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

		// Question difficulty distribution
		const difficultyDistribution = await this.prisma.question.groupBy({
			by: ['difficulty'],
			_count: true
		});

		// Most used questions in exams
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
		`) as any[];

		// Question performance (success rate)
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
		`) as any[];

		// Combine the grouped data with the actual subject/topic/subtopic names
	const questionsBySubjectWithNames = questionsBySubject.map((q: any) => {
		const subject = subjects.find((s: any) => s.id === q.subjectId);
			return {
				...q,
				subject: { name: subject?.name || 'Unknown Subject' }
			};
		});

	const questionsByTopicWithNames = questionsByTopic.map((q: any) => {
		const topic = topics.find((t: any) => t.id === q.topicId);
			return {
				...q,
				topic: { 
					name: topic?.name || 'Unknown Topic',
					subject: { name: topic?.subject?.name || 'Unknown Subject' }
				}
			};
		});

	const questionsBySubtopicWithNames = questionsBySubtopic.map((q: any) => {
		const subtopic = subtopics.find((s: any) => s.id === q.subtopicId);
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
			questionsByTopic: questionsByTopicWithNames.slice(0, 20), // Limit to top 20
			questionsBySubtopic: questionsBySubtopicWithNames.slice(0, 20), // Limit to top 20
			difficultyDistribution,
			mostUsedQuestions,
			questionPerformance
		};
	}

	@Get('subscriptions')
	async getSubscriptionAnalytics() {
		// Subscription overview
		const totalSubscriptions = await this.prisma.subscription.count();
		const activeSubscriptions = await this.prisma.subscription.count({
			where: { status: 'ACTIVE' }
		});
		const canceledSubscriptions = await this.prisma.subscription.count({
			where: { status: 'CANCELED' }
		});

		// Revenue analytics
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

		// Calculate MRR and ARR
		const mrr = subscriptionsWithPlans.reduce((total: number, sub: any) => {
			if (sub.plan.interval === 'MONTH') {
				return total + sub.plan.priceCents;
			} else {
				return total + Math.round(sub.plan.priceCents / 12);
			}
		}, 0);

		const arr = subscriptionsWithPlans.reduce((total: number, sub: any) => {
			if (sub.plan.interval === 'YEAR') {
				return total + sub.plan.priceCents;
			} else {
				return total + (sub.plan.priceCents * 12);
			}
		}, 0);

		// Plan popularity
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

		// Subscription growth over time
		const now = new Date();
		const last6Months = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

		const monthlySubscriptions = await this.prisma.subscription.groupBy({
			by: ['createdAt'],
			where: {
				createdAt: { gte: last6Months }
			},
			_count: true
		});

		// Group by month
		const monthlyData = monthlySubscriptions.reduce((acc: Record<string, number>, item: any) => {
			const month = new Date(item.createdAt).toISOString().slice(0, 7); // YYYY-MM
			acc[month] = (acc[month] || 0) + item._count;
			return acc;
		}, {} as Record<string, number>);

		// Recent subscriptions
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
				mrr: mrr / 100, // Convert cents to dollars
				arr: arr / 100, // Convert cents to dollars
				churnRate: totalSubscriptions > 0 ? (canceledSubscriptions / totalSubscriptions) * 100 : 0
			},
			planPopularity,
			monthlySubscriptions: monthlyData,
			recentSubscriptions
		};
	}

	@Get('content')
	async getContentAnalytics() {
		// Content statistics
		const totalSubjects = await this.prisma.subject.count();
		const totalTopics = await this.prisma.topic.count();
		const totalSubtopics = await this.prisma.subtopic.count();
		const totalQuestions = await this.prisma.question.count();
		const totalTags = await this.prisma.tag.count();

		// Content distribution
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

		// Tag usage
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

		// Content growth over time
		const now = new Date();
		const last6Months = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

		const monthlyQuestions = await this.prisma.question.groupBy({
			by: ['createdAt'],
			where: {
				createdAt: { gte: last6Months }
			},
			_count: true
		});

		// Group by month
		const monthlyData = monthlyQuestions.reduce((acc: Record<string, number>, item: any) => {
			const month = new Date(item.createdAt).toISOString().slice(0, 7); // YYYY-MM
			acc[month] = (acc[month] || 0) + item._count;
			return acc;
		}, {} as Record<string, number>);

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

	@Get('dashboard')
	async getDashboardData() {
		// Get all analytics data for dashboard
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
} 