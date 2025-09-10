import { Controller, Get, Post, Put, Body, Param, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';
import { formatPhoneForDisplay } from '../auth/utils/phone.utils';

@Controller('student')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class StudentController {
	constructor(
		private readonly prisma: PrismaService,
		private readonly subscriptionValidation: SubscriptionValidationService
	) {}

	@Get('dashboard')
	async getDashboard(@Req() req: any) {
		const userId = req.user.id;

		// Check subscription status
		const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
		if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
			throw new ForbiddenException('Subscription required to access dashboard');
		}

		// Get total exams taken
		const totalExamsTaken = await this.prisma.examSubmission.count({
			where: { userId, submittedAt: { not: null } }
		});

		// Get average score
		const submissions = await this.prisma.examSubmission.findMany({
			where: { userId, submittedAt: { not: null } },
			select: { scorePercent: true }
		});

		const averageScore = submissions.length > 0 
			? submissions.reduce((sum: number, sub: any) => sum + (sub.scorePercent || 0), 0) / submissions.length 
			: 0;

		// Get total questions answered and correct answers
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
		const correctAnswers = answers.filter((a: any) => a.isCorrect).length;

		// Get subject performance
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
		`, userId) as any[];

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

	@Get('exam-papers')
	async getExamPapers(
		@Req() req: any,
		@Query('page') page = '1',
		@Query('limit') limit = '10',
		@Query('search') search?: string,
		@Query('subjectId') subjectId?: string
	) {
		const userId = req.user.id;

		// Check subscription status
		const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
		if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
			throw new ForbiddenException('Subscription required to access exam papers');
		}
		const pageNum = parseInt(page, 10);
		const limitNum = parseInt(limit, 10);
		const skip = (pageNum - 1) * limitNum;

		// Build where clause
		const where: any = {};
		
		if (search) {
			where.OR = [
				{ title: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } }
			];
		}

		if (subjectId) {
			where.subjectIds = { has: subjectId };
		}

		// Get exam papers
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

		// Get subject names for each paper
		const papersWithSubjects = await Promise.all(
			papers.map(async (paper: any) => {
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
			})
		);

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



	@Get('ai-usage')
	async getAiUsage(@Req() req: any) {
		const userId = req.user.id;
		return await this.subscriptionValidation.validateAiUsage(userId);
	}

	@Get('exam-history')
	async getExamHistory(
		@Req() req: any,
		@Query('page') page = '1',
		@Query('limit') limit = '10',
		@Query('type') type?: string // 'practice' or 'exam'
	) {
		const userId = req.user.id;
		const pageNum = parseInt(page);
		const limitNum = parseInt(limit);
		const skip = (pageNum - 1) * limitNum;

		// Check subscription status
		const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
		if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
			throw new ForbiddenException('Subscription required to access exam history');
		}

		// Build where clause
		const where: any = {
			userId,
			submittedAt: { not: null }
		};

		// Filter by type if specified
		if (type === 'practice') {
			where.examPaper = {
				questionIds: { isEmpty: false } // Practice tests have question IDs
			};
		} else if (type === 'exam') {
			where.examPaper = {
				questionIds: { isEmpty: true } // Exam papers don't have question IDs
			};
		}

		// Get submissions with pagination
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
			submissions: submissions.map((sub: any) => ({
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

	@Get('performance')
	async getPerformance(@Req() req: any) {
		const userId = req.user.id;

		// Check subscription status
		const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
		if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
			throw new ForbiddenException('Subscription required to access performance analytics');
		}

		// Get performance by subject
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
		`, userId) as any[];

		// Get performance by topic
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
		`, userId) as any[];

		// Get performance by difficulty
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
		`, userId) as any[];

		// Get recent performance trend (last 10 exams)
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
			recentTrend: recentTrend.map((r: any) => ({
				score: r.scorePercent || 0,
				date: r.submittedAt,
				examTitle: r.examPaper.title
			}))
		};
	}

	@Get('subscription-status')
	async getSubscriptionStatus(@Req() req: any) {
		console.log('Subscription status request - User:', req.user);
		const userId = req.user.id;
		const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
		const subscriptionDetails = await this.subscriptionValidation.getSubscriptionDetails(userId);
		
		return {
			subscriptionStatus,
			subscriptionDetails
		};
	}

	@Get('profile')
	async getProfile(@Req() req: any) {
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

		// Add verification status information
		return {
			...user,
			needsPhoneVerification: !!user?.phone && !user?.phoneVerified,
			canVerifyPhone: !!user?.phone && !user?.phoneVerified,
			phoneDisplay: user?.phone ? formatPhoneForDisplay(user.phone) : null
		};
	}

	@Put('profile')
	async updateProfile(@Req() req: any, @Body() body: { fullName?: string }) {
		const userId = req.user.id;

		// Only allow updating fullName, phone changes should go through the verification flow
		return this.prisma.user.update({
			where: { id: userId },
			data: {
				fullName: body.fullName
			},
			select: {
				id: true,
				email: true,
				fullName: true,
				phone: true,
				pendingPhone: true,
				emailVerified: true,
				phoneVerified: true,
				role: true
			}
		});
	}

	@Get('subjects')
	async getSubjects(@Req() req: any) {
		const userId = req.user.id;
		
		// Get user's stream
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { streamId: true }
		});

		if (!user?.streamId) {
			throw new ForbiddenException('No stream assigned to user');
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

	@Get('topics')
	async getTopics(@Query('subjectId') subjectId?: string) {
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

	@Get('subtopics')
	async getSubtopics(@Query('topicId') topicId?: string, @Query('subjectId') subjectId?: string) {
		const where: any = {};
		
		if (topicId) {
			where.topicId = topicId;
		} else if (subjectId) {
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

	@Get('question-availability')
	async getQuestionAvailability(
		@Query('subjectId') subjectId?: string,
		@Query('topicId') topicId?: string,
		@Query('subtopicId') subtopicId?: string,
		@Query('difficulty') difficulty?: string
	) {
		const where: any = {};
		
		if (subjectId) where.subjectId = subjectId;
		if (topicId) where.topicId = topicId;
		if (subtopicId) where.subtopicId = subtopicId;
		if (difficulty && difficulty !== 'MIXED') where.difficulty = difficulty;

		const totalQuestions = await this.prisma.question.count({ where });

		// Get breakdown by difficulty
		const difficultyBreakdown = await this.prisma.question.groupBy({
			by: ['difficulty'],
			where,
			_count: {
				difficulty: true
			}
		});

		return {
			totalQuestions,
			difficultyBreakdown: difficultyBreakdown.map((d: any) => ({
				difficulty: d.difficulty,
				count: d._count.difficulty
			}))
		};
	}
} 