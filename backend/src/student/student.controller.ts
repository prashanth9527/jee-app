import { Controller, Get, Post, Put, Delete, Body, Param, Query, Req, UseGuards, ForbiddenException, NotFoundException, HttpException, BadRequestException } from '@nestjs/common';
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
		@Query('subjectId') subjectId?: string,
		@Query('lessonId') lessonId?: string,
		@Query('topicId') topicId?: string,
		@Query('subtopicId') subtopicId?: string,
		@Query('examType') examType?: string,
		@Query('difficulty') difficulty?: string,
		@Query('year') year?: string,
		@Query('minDuration') minDuration?: string,
		@Query('maxDuration') maxDuration?: string,
		@Query('minQuestions') minQuestions?: string,
		@Query('maxQuestions') maxQuestions?: string,
		@Query('attempted') attempted?: string,
		@Query('bookmarked') bookmarked?: string
	) {
		const userId = req.user.id;

		// Check subscription status
		const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
		if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
			throw new ForbiddenException('Subscription required to access exam papers');
		}

		// Validate filter combinations
		if (lessonId && !subjectId) {
			throw new BadRequestException('Subject must be selected when filtering by lesson');
		}
		if (topicId && !subjectId) {
			throw new BadRequestException('Subject must be selected when filtering by topic');
		}
		if (subtopicId && !topicId) {
			throw new BadRequestException('Topic must be selected when filtering by subtopic');
		}
		const pageNum = parseInt(page, 10);
		const limitNum = parseInt(limit, 10);
		const skip = (pageNum - 1) * limitNum;

		// Build where clause - include both public exam papers and user's AI-generated ones
		const where: any = {
			OR: [
				{ createdById: null }, // Public exam papers
				{ createdById: userId } // User's own AI-generated exam papers
			]
		};
		
		if (search) {
			where.AND = where.AND || [];
			where.AND.push({
				OR: [
					{ title: { contains: search, mode: 'insensitive' } },
					{ description: { contains: search, mode: 'insensitive' } }
				]
			});
		}

		if (subjectId) {
			where.AND = where.AND || [];
			where.AND.push({ subjectIds: { has: subjectId } });
		}

		// For lesson filtering, we need to filter through questions
		// since ExamPaper doesn't store lessonIds directly
		if (lessonId) {
			try {
				// Get question IDs that belong to this lesson
				const lessonQuestions = await this.prisma.question.findMany({
					where: { lessonId },
					select: { id: true }
				});
				const lessonQuestionIds = lessonQuestions.map(q => q.id);
				
				if (lessonQuestionIds.length === 0) {
					// No questions found for this lesson, return empty result
					return {
						papers: [],
						pagination: {
							currentPage: pageNum,
							totalPages: 0,
							totalItems: 0,
							itemsPerPage: limitNum
						}
					};
				}
				
				where.AND = where.AND || [];
				where.AND.push({
					questionIds: {
						hasSome: lessonQuestionIds
					}
				});
			} catch (error) {
				console.error('Error filtering by lesson:', error);
				throw new BadRequestException('Invalid lesson ID provided');
			}
		}

		if (topicId) {
			where.AND = where.AND || [];
			where.AND.push({ topicIds: { has: topicId } });
		}

		if (subtopicId) {
			where.AND = where.AND || [];
			where.AND.push({ subtopicIds: { has: subtopicId } });
		}

		// Exam type filter
		if (examType) {
			where.AND = where.AND || [];
			where.AND.push({ examType: examType as any });
		}

		// Duration range filter
		if (minDuration || maxDuration) {
			where.AND = where.AND || [];
			const durationFilter: any = {};
			if (minDuration) {
				durationFilter.gte = parseInt(minDuration, 10);
			}
			if (maxDuration) {
				durationFilter.lte = parseInt(maxDuration, 10);
			}
			where.AND.push({ timeLimitMin: durationFilter });
		}

		// Question count range filter
		if (minQuestions || maxQuestions) {
			where.AND = where.AND || [];
			const questionCountFilter: any = {};
			if (minQuestions) {
				questionCountFilter.gte = parseInt(minQuestions, 10);
			}
			if (maxQuestions) {
				questionCountFilter.lte = parseInt(maxQuestions, 10);
			}
			where.AND.push({
				questionIds: {
					_arrayLength: questionCountFilter
				}
			});
		}

		// Attempted filter
		if (attempted === 'true') {
			where.AND = where.AND || [];
			where.AND.push({
				submissions: {
					some: {
						userId: userId,
						submittedAt: { not: null }
					}
				}
			});
		} else if (attempted === 'false') {
			where.AND = where.AND || [];
			where.AND.push({
				submissions: {
					none: {
						userId: userId,
						submittedAt: { not: null }
					}
				}
			});
		}

		// Bookmarked filter
		if (bookmarked === 'true') {
			where.AND = where.AND || [];
			where.AND.push({
				examBookmarks: {
					some: {
						userId: userId
					}
				}
			});
		} else if (bookmarked === 'false') {
			where.AND = where.AND || [];
			where.AND.push({
				examBookmarks: {
					none: {
						userId: userId
					}
				}
			});
		}

		// Difficulty and year filters (through questions)
		if (difficulty || year) {
			// Get question IDs that match the difficulty and year criteria
			const questionWhere: any = {};
			if (difficulty) {
				questionWhere.difficulty = difficulty as any;
			}
			if (year) {
				questionWhere.yearAppeared = parseInt(year, 10);
			}

			const matchingQuestions = await this.prisma.question.findMany({
				where: questionWhere,
				select: { id: true }
			});
			const matchingQuestionIds = matchingQuestions.map(q => q.id);

			if (matchingQuestionIds.length > 0) {
				where.AND = where.AND || [];
				where.AND.push({
					questionIds: {
						hasSome: matchingQuestionIds
					}
				});
			} else {
				// No questions match the criteria, return empty result
				return {
					papers: [],
					pagination: {
						currentPage: pageNum,
						totalPages: 0,
						totalItems: 0,
						itemsPerPage: limitNum
					}
				};
			}
		}

		// Get exam papers with optimized queries
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
					examType: true,
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

		// Collect all unique IDs for batch queries
		const paperIds = papers.map(p => p.id);
		const allSubjectIds = [...new Set(papers.flatMap(p => p.subjectIds || []))];
		const allQuestionIds = [...new Set(papers.flatMap(p => p.questionIds || []))];

		// Define types for better TypeScript support
		type SubjectMap = Record<string, { id: string; name: string }>;
		type LessonInfoMap = Record<string, { id: string; lessonId: string | null; lesson: { id: string; name: string; subject: { name: string } } | null }>;
		type SubmissionStatsMap = Record<string, { _count: { id: number }; _avg: { scorePercent: number | null } }>;
		type DifficultyStatsMap = Record<string, Array<{ id: string; difficulty: string; _count: { difficulty: number } }>>;

		// Batch fetch all related data
		const [
			subjectsMap,
			lessonInfoMap,
			submissionStatsMap,
			difficultyStatsMap,
			practiceSessions,
			bookmarks
		] = await Promise.all([
			// Fetch all subjects in one query
			allSubjectIds.length > 0 
				? this.prisma.subject.findMany({
					where: { id: { in: allSubjectIds } },
					select: { id: true, name: true }
				}).then(subjects => 
					subjects.reduce((map: SubjectMap, subject) => {
						map[subject.id] = subject;
						return map;
					}, {} as SubjectMap)
				)
				: Promise.resolve({} as SubjectMap),

			// Fetch lesson info for all questions in one query
			allQuestionIds.length > 0
				? this.prisma.question.findMany({
					where: { id: { in: allQuestionIds } },
					select: { 
						id: true, 
						lessonId: true,
						lesson: {
							select: { id: true, name: true, subject: { select: { name: true } } }
						}
					}
				}).then(questions => 
					questions.reduce((map: LessonInfoMap, question) => {
						map[question.id] = question;
						return map;
					}, {} as LessonInfoMap)
				)
				: Promise.resolve({} as LessonInfoMap),

			// Fetch submission stats for all papers in one query
			paperIds.length > 0
				? this.prisma.examSubmission.groupBy({
					by: ['examPaperId'],
					where: { examPaperId: { in: paperIds } },
					_count: { id: true },
					_avg: { scorePercent: true }
				}).then(stats => 
					stats.reduce((map: SubmissionStatsMap, stat) => {
						map[stat.examPaperId] = stat;
						return map;
					}, {} as SubmissionStatsMap)
				)
				: Promise.resolve({} as SubmissionStatsMap),

			// Fetch difficulty stats for all questions in one query
			allQuestionIds.length > 0
				? this.prisma.question.groupBy({
					where: { id: { in: allQuestionIds } },
					by: ['id', 'difficulty'],
					_count: { difficulty: true }
				}).then(stats => 
					stats.reduce((map: DifficultyStatsMap, stat) => {
						if (!map[stat.id]) map[stat.id] = [];
						map[stat.id].push(stat);
						return map;
					}, {} as DifficultyStatsMap)
				)
				: Promise.resolve({} as DifficultyStatsMap),

			// Fetch practice sessions for all papers in one query
			paperIds.length > 0
				? this.prisma.practiceSession.findMany({
					where: { 
						userId: req.user.id,
						examPaperId: { in: paperIds }
					},
					select: { examPaperId: true }
				}).then(sessions => new Set(sessions.map(s => s.examPaperId)))
				: Promise.resolve(new Set<string>()),

			// Fetch bookmarks for all papers in one query
			paperIds.length > 0
				? this.prisma.examBookmark.findMany({
					where: { 
						userId: req.user.id,
						examPaperId: { in: paperIds }
					},
					select: { examPaperId: true }
				}).then(bookmarks => new Set(bookmarks.map(b => b.examPaperId)))
				: Promise.resolve(new Set<string>())
		]);

		// Process papers with the batch-fetched data
		const papersWithSubjects = papers.map((paper: any) => {
			// Get subjects for this paper
			const subjects = paper.subjectIds?.length 
				? paper.subjectIds.map((id: string) => subjectsMap[id]).filter(Boolean)
				: [];

			// Get lesson information for the first few questions
			const lessonInfo = paper.questionIds?.length 
				? paper.questionIds.slice(0, 5)
					.map((id: string) => lessonInfoMap[id])
					.filter(Boolean)
					.map((q: any) => q.lesson)
					.filter(Boolean)
				: [];

			// Get submission stats for this paper
			const submissionStats = submissionStatsMap[paper.id] || { _count: { id: 0 }, _avg: { scorePercent: 0 } };

			// Get difficulty stats for this paper's questions
			const difficultyStats = paper.questionIds?.length
				? paper.questionIds
					.flatMap((id: string) => difficultyStatsMap[id] || [])
					.reduce((acc: any[], stat: any) => {
						const existing = acc.find((d: any) => d.difficulty === stat.difficulty);
						if (existing) {
							existing._count.difficulty += stat._count.difficulty;
						} else {
							acc.push({ ...stat });
						}
						return acc;
					}, [] as any[])
				: [];

			// Determine overall difficulty based on question distribution
			let overallDifficulty = 'MEDIUM';
			if (difficultyStats.length > 0) {
				const totalQuestions = difficultyStats.reduce((sum: number, stat: any) => sum + stat._count.difficulty, 0);
				const hardCount = difficultyStats.find((d: any) => d.difficulty === 'HARD')?._count.difficulty || 0;
				const easyCount = difficultyStats.find((d: any) => d.difficulty === 'EASY')?._count.difficulty || 0;
				
				if (hardCount / totalQuestions > 0.6) {
					overallDifficulty = 'HARD';
				} else if (easyCount / totalQuestions > 0.6) {
					overallDifficulty = 'EASY';
				}
			}

			return {
				...paper,
				subjects,
				hasAttempted: paper._count.submissions > 0,
				hasPracticed: practiceSessions.has(paper.id),
				isBookmarked: bookmarks.has(paper.id),
				questionCount: paper.questionIds?.length || 0,
				lessonInfo,
				averageScore: submissionStats._avg.scorePercent || 0,
				completionRate: submissionStats._count.id > 0 ? 100 : 0, // Simplified for now
				totalAttempts: submissionStats._count.id,
				overallDifficulty,
				difficultyStats
			};
		});

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

	@Post('exam-papers/:examId/bookmark')
	async bookmarkExam(@Req() req: any, @Param('examId') examId: string) {
		const userId = req.user.id;

		try {
			// Check if exam exists
			const examPaper = await this.prisma.examPaper.findUnique({
				where: { id: examId }
			});

			if (!examPaper) {
				throw new Error('Exam paper not found');
			}

			// Create bookmark
			const bookmark = await this.prisma.examBookmark.create({
				data: {
					userId,
					examPaperId: examId
				}
			});

			return { success: true, message: 'Exam bookmarked successfully' };
		} catch (error) {
			if (error.code === 'P2002') {
				throw new Error('Exam is already bookmarked');
			}
			throw new Error(`Failed to bookmark exam: ${error.message}`);
		}
	}

	@Delete('exam-papers/:examId/bookmark')
	async unbookmarkExam(@Req() req: any, @Param('examId') examId: string) {
		const userId = req.user.id;

		try {
			await this.prisma.examBookmark.deleteMany({
				where: {
					userId,
					examPaperId: examId
				}
			});

			return { success: true, message: 'Exam unbookmarked successfully' };
		} catch (error) {
			throw new Error(`Failed to unbookmark exam: ${error.message}`);
		}
	}

	@Get('practice-exam/:examId')
	async getPracticeExam(@Req() req: any, @Param('examId') examId: string) {
		const userId = req.user.id;

		try {
			// Get exam paper with full question details
			const examPaper = await this.prisma.examPaper.findUnique({
				where: { id: examId },
				select: {
					id: true,
					title: true,
					description: true,
					timeLimitMin: true,
					examType: true,
					subjectIds: true,
					topicIds: true,
					subtopicIds: true,
					questionIds: true,
					createdAt: true
				}
			});

			if (!examPaper) {
				throw new Error('Exam paper not found');
			}

			// Get full question details with options and explanations
			const questions = await this.prisma.question.findMany({
				where: { id: { in: examPaper.questionIds } },
				select: {
					id: true,
					stem: true,
					options: {
						select: {
							id: true,
							text: true,
							isCorrect: true,
							order: true
						},
						orderBy: { order: 'asc' }
					},
					explanation: true,
					difficulty: true,
					yearAppeared: true,
					lessonId: true,
					correctNumericAnswer: true,
					questionType: true,
					isOpenEnded: true,
					answerTolerance: true,
					parentQuestionId: true,
					subQuestions: {
						select: {
							id: true,
							stem: true,
							options: {
								select: {
									id: true,
									text: true,
									isCorrect: true,
									order: true
								},
								orderBy: { order: 'asc' }
							},
							explanation: true,
							difficulty: true,
							correctNumericAnswer: true,
							questionType: true,
							isOpenEnded: true,
							answerTolerance: true
						}
					},
					lesson: {
						select: { id: true, name: true, subject: { select: { name: true } } }
					}
				}
			});

			// Get subject names
			const subjects = examPaper.subjectIds?.length 
				? await this.prisma.subject.findMany({
					where: { id: { in: examPaper.subjectIds } },
					select: { id: true, name: true }
				})
				: [];

		// Get practiced questions for this user and exam
		const practiceProgress = await this.prisma.practiceProgress.findFirst({
			where: {
				userId,
				contentType: 'PRACTICE_EXAM',
				contentId: examId
			},
			include: {
				sessions: {
					select: {
						questionId: true
					}
				}
			}
		});

		const practicedQuestionIds = practiceProgress?.sessions.map(s => s.questionId) || [];

		return {
			...examPaper,
			subjects,
			questions,
			questionCount: questions.length,
			practicedQuestionIds
		};
	} catch (error) {
		throw new Error(`Failed to fetch practice exam: ${error.message}`);
	}
}

	@Post('practice-exam/:examId/track')
	async trackPracticeSession(@Req() req: any, @Param('examId') examId: string) {
		const userId = req.user.id;

		try {
			// Check if exam paper exists
			const examPaper = await this.prisma.examPaper.findUnique({
				where: { id: examId },
				select: { id: true, questionIds: true }
			});

			if (!examPaper) {
				throw new Error('Exam paper not found');
			}

			// Upsert practice session tracking
			await this.prisma.practiceSession.upsert({
				where: {
					userId_examPaperId: {
						userId,
						examPaperId: examId
					}
				},
				update: {
					practicedAt: new Date()
				},
				create: {
					userId,
					examPaperId: examId,
					practicedAt: new Date()
				}
			});

			// Create or update practice progress
			await this.prisma.practiceProgress.upsert({
				where: {
					userId_contentType_contentId: {
						userId,
						contentType: 'PRACTICE_EXAM',
						contentId: examId
					}
				},
				update: {
					lastAccessedAt: new Date()
				},
				create: {
					userId,
					contentType: 'PRACTICE_EXAM',
					contentId: examId,
					totalQuestions: examPaper.questionIds?.length || 0,
					lastAccessedAt: new Date()
				}
			});

			return { success: true, message: 'Practice session tracked' };
		} catch (error) {
			throw new Error(`Failed to track practice session: ${error.message}`);
		}
	}

	@Post('practice-exam/:examId/question/:questionId/practice')
	async markQuestionAsPracticed(
		@Req() req: any,
		@Param('examId') examId: string,
		@Param('questionId') questionId: string
	) {
		const userId = req.user.id;

		try {
			// Handle direct practice (no exam paper)
			if (examId === 'direct-practice') {
				// Get filters from query params
				const subjectId = req.query?.subjectId;
				const lessonId = req.query?.lessonId;
				const topicId = req.query?.topicId;
				const subtopicId = req.query?.subtopicId;
				const questionType = req.query?.questionType;

				if (!subjectId) {
					throw new BadRequestException('Subject ID is required for direct practice');
				}

				// Create contentId based on filters
				const contentId = `direct-practice-${subjectId}${lessonId ? `-${lessonId}` : ''}${topicId ? `-${topicId}` : ''}${subtopicId ? `-${subtopicId}` : ''}${questionType ? `-${questionType}` : ''}`;

				// Get or create practice progress for direct practice
				const practiceProgress = await this.prisma.practiceProgress.upsert({
					where: {
						userId_contentType_contentId: {
							userId,
							contentType: 'DIRECT_PRACTICE',
							contentId: contentId
						}
					},
					update: {
						lastAccessedAt: new Date()
					},
					create: {
						userId,
						contentType: 'DIRECT_PRACTICE',
						contentId: contentId,
						totalQuestions: 0, // Will be updated as questions are practiced
						lastAccessedAt: new Date()
					}
				});

				// Check if question session already exists
				const existingSession = await this.prisma.practiceQuestionSession.findFirst({
					where: {
						progressId: practiceProgress.id,
						questionId: questionId
					}
				});

				if (existingSession) {
					// Update existing session
					await this.prisma.practiceQuestionSession.update({
						where: { id: existingSession.id },
						data: {
							attemptedAt: new Date()
						}
					});
				} else {
					// Create new session
					await this.prisma.practiceQuestionSession.create({
						data: {
							progressId: practiceProgress.id,
							questionId: questionId,
							attemptedAt: new Date()
						}
					});
				}

				return { success: true, message: 'Question marked as practiced' };
			}

			// Handle exam paper-based practice
			// Check if exam paper exists
			const examPaper = await this.prisma.examPaper.findUnique({
				where: { id: examId },
				select: { id: true, questionIds: true }
			});

			if (!examPaper) {
				throw new Error('Exam paper not found');
			}

			// Verify question belongs to this exam
			if (!examPaper.questionIds?.includes(questionId)) {
				throw new Error('Question does not belong to this exam');
			}

			// Get or create practice progress
			const practiceProgress = await this.prisma.practiceProgress.upsert({
				where: {
					userId_contentType_contentId: {
						userId,
						contentType: 'PRACTICE_EXAM',
						contentId: examId
					}
				},
				update: {
					lastAccessedAt: new Date()
				},
				create: {
					userId,
					contentType: 'PRACTICE_EXAM',
					contentId: examId,
					totalQuestions: examPaper.questionIds?.length || 0,
					lastAccessedAt: new Date()
				}
			});

			// Check if question session already exists
			const existingSession = await this.prisma.practiceQuestionSession.findFirst({
				where: {
					progressId: practiceProgress.id,
					questionId: questionId
				}
			});

			if (existingSession) {
				// Update existing session
				await this.prisma.practiceQuestionSession.update({
					where: { id: existingSession.id },
					data: {
						attemptedAt: new Date()
					}
				});
			} else {
				// Create new session
				await this.prisma.practiceQuestionSession.create({
					data: {
						progressId: practiceProgress.id,
						questionId: questionId,
						attemptedAt: new Date()
					}
				});
			}

			return { success: true, message: 'Question marked as practiced' };
		} catch (error) {
			throw new Error(`Failed to mark question as practiced: ${error.message}`);
		}
	}

	@Get('ai-usage')
	async getAiUsage(@Req() req: any) {
		const userId = req.user.id;
		return await this.subscriptionValidation.validateAiUsage(userId);
	}

	@Get('my-ai-questions')
	async getMyAIQuestions(
		@Req() req: any,
		@Query('page') page = '1',
		@Query('limit') limit = '10',
		@Query('search') search?: string,
		@Query('subjectId') subjectId?: string,
		@Query('difficulty') difficulty?: string
	) {
		const userId = req.user.id;
		const pageNum = parseInt(page);
		const limitNum = parseInt(limit);
		const skip = (pageNum - 1) * limitNum;

		// Build where clause - only user's AI-generated questions
		const where: any = {
			isAIGenerated: true,
			createdById: userId
		};

		if (search) {
			where.OR = [
				{ stem: { contains: search, mode: 'insensitive' } },
				{ explanation: { contains: search, mode: 'insensitive' } }
			];
		}

		if (subjectId) where.subjectId = subjectId;
		if (difficulty) where.difficulty = difficulty;

		const [questions, total] = await Promise.all([
			this.prisma.question.findMany({
				where,
				include: {
					options: {
						orderBy: { order: 'asc' }
					},
					subject: {
						select: {
							id: true,
							name: true,
							stream: {
								select: {
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
					}
				},
				orderBy: { createdAt: 'desc' },
				skip,
				take: limitNum,
			}),
			this.prisma.question.count({ where })
		]);

		return {
			questions,
			pagination: {
				currentPage: pageNum,
				totalPages: Math.ceil(total / limitNum),
				totalItems: total,
				itemsPerPage: limitNum
			}
		};
	}

	@Get('my-ai-tests')
	async getMyAITests(
		@Req() req: any,
		@Query('page') page = '1',
		@Query('limit') limit = '10',
		@Query('search') search?: string,
		@Query('subjectId') subjectId?: string
	) {
		const userId = req.user.id;
		const pageNum = parseInt(page);
		const limitNum = parseInt(limit);
		const skip = (pageNum - 1) * limitNum;

		// Build where clause - only user's AI-generated exam papers
		const where: any = {
			createdById: userId
		};

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

		return {
			examPapers: papers,
			pagination: {
				currentPage: pageNum,
				totalPages: Math.ceil(total / limitNum),
				totalItems: total,
				itemsPerPage: limitNum
			}
		};
	}

	@Delete('questions/:id')
	async deleteMyQuestion(@Req() req: any, @Param('id') id: string) {
		const userId = req.user.id;

		// Check if the question belongs to the user
		const question = await this.prisma.question.findFirst({
			where: {
				id,
				createdById: userId,
				isAIGenerated: true
			}
		});

		if (!question) {
			throw new NotFoundException('Question not found or you do not have permission to delete it');
		}

		// Delete the question (cascade will handle options)
		await this.prisma.question.delete({
			where: { id }
		});

		return { message: 'Question deleted successfully' };
	}

	@Delete('exam-papers/:id')
	async deleteMyExamPaper(@Req() req: any, @Param('id') id: string) {
		const userId = req.user.id;

		// Check if the exam paper belongs to the user
		const examPaper = await this.prisma.examPaper.findFirst({
			where: {
				id,
				createdById: userId
			}
		});

		if (!examPaper) {
			throw new NotFoundException('Exam paper not found or you do not have permission to delete it');
		}

		// Delete the exam paper (cascade will handle submissions)
		await this.prisma.examPaper.delete({
			where: { id }
		});

		return { message: 'Exam paper deleted successfully' };
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
	async getTopics(@Req() req: any, @Query('subjectId') subjectId?: string, @Query('lessonId') lessonId?: string) {
		const userId = req.user.id;
		
		// Get user's stream
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { streamId: true }
		});

		if (!user?.streamId) {
			throw new ForbiddenException('No stream assigned to user');
		}

		const where: any = {
			subject: {
				streamId: user.streamId
			}
		};

		if (subjectId) {
			where.subjectId = subjectId;
		}

		if (lessonId) {
			where.lessonId = lessonId;
		}
		
		return this.prisma.topic.findMany({
			where,
			orderBy: { name: 'asc' },
			include: {
				subject: {
					select: { name: true }
				},
				lesson: {
					select: { name: true }
				},
				_count: {
					select: { questions: true }
				}
			}
		});
	}

	@Get('subtopics')
	async getSubtopics(@Req() req: any, @Query('topicId') topicId?: string, @Query('subjectId') subjectId?: string) {
		const userId = req.user.id;
		
		// Get user's stream
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { streamId: true }
		});

		if (!user?.streamId) {
			throw new ForbiddenException('No stream assigned to user');
		}

		const where: any = {
			topic: {
				subject: {
					streamId: user.streamId
				}
			}
		};
		
		if (topicId) {
			where.topicId = topicId;
		} else if (subjectId) {
			where.topic = { 
				subjectId,
				subject: {
					streamId: user.streamId
				}
			};
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
		@Query('lessonId') lessonId?: string,
		@Query('topicId') topicId?: string,
		@Query('subtopicId') subtopicId?: string,
		@Query('difficulty') difficulty?: string,
		@Query('questionType') questionType?: string
	) {
		const where: any = {};
		
		if (subjectId) where.subjectId = subjectId;
		if (lessonId) where.lessonId = lessonId;
		if (topicId) where.topicId = topicId;
		if (subtopicId) where.subtopicId = subtopicId;
		if (difficulty && difficulty !== 'MIXED') where.difficulty = difficulty;
		
		// Filter by question type: PYQ = isPreviousYear: true, LMS = isPreviousYear: false, ALL = no filter
		if (questionType === 'PYQ') {
			where.isPreviousYear = true;
		} else if (questionType === 'LMS') {
			where.isPreviousYear = false;
		}
		// If questionType is 'ALL' or undefined, no filter is applied

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

	@Get('practice-questions')
	async getPracticeQuestions(
		@Req() req: any,
		@Query('subjectId') subjectId?: string,
		@Query('lessonId') lessonId?: string,
		@Query('topicId') topicId?: string,
		@Query('subtopicId') subtopicId?: string,
		@Query('questionType') questionType?: string
	) {
		const userId = req.user.id;
		
		if (!subjectId) {
			throw new BadRequestException('Subject ID is required');
		}

		// Build where clause for question selection
		const where: any = {
			subjectId: subjectId
		};

		if (lessonId) where.lessonId = lessonId;
		if (topicId) where.topicId = topicId;
		if (subtopicId) where.subtopicId = subtopicId;
		
		// Filter by question type: PYQ = isPreviousYear: true, LMS = isPreviousYear: false
		if (questionType === 'PYQ') {
			where.isPreviousYear = true;
		} else if (questionType === 'LMS') {
			where.isPreviousYear = false;
		}
		// If questionType is 'ALL' or undefined, no filter is applied

		// Fetch all questions matching the criteria
		const questions = await this.prisma.question.findMany({
			where,
			include: {
				options: {
					orderBy: { order: 'asc' }
				},
				lesson: {
					select: {
						id: true,
						name: true,
						subject: {
							select: { name: true }
						}
					}
				},
				subQuestions: {
					include: {
						options: {
							orderBy: { order: 'asc' }
						}
					}
				}
			},
			orderBy: {
				createdAt: 'desc'
			}
		});

		if (questions.length === 0) {
			return {
				questions: [],
				totalQuestions: 0,
				practicedQuestionIds: []
			};
		}

		// Get practiced question IDs for this user
		// For direct practice, we use a contentId based on the filters
		const contentId = `direct-practice-${subjectId}${lessonId ? `-${lessonId}` : ''}${topicId ? `-${topicId}` : ''}${subtopicId ? `-${subtopicId}` : ''}${questionType ? `-${questionType}` : ''}`;
		
		const practiceProgress = await this.prisma.practiceProgress.findUnique({
			where: {
				userId_contentType_contentId: {
					userId,
					contentType: 'DIRECT_PRACTICE',
					contentId: contentId
				}
			},
			include: {
				sessions: {
					select: {
						questionId: true
					}
				}
			}
		});

		const practicedQuestionIds = practiceProgress?.sessions.map(s => s.questionId) || [];

		// Format questions to match practice-exam response format
		const formattedQuestions = questions.map((question: any) => ({
			id: question.id,
			stem: question.stem,
			options: question.options.map((option: any) => ({
				id: option.id,
				text: option.text,
				isCorrect: option.isCorrect,
				order: option.order
			})),
			explanation: question.explanation,
			difficulty: question.difficulty,
			yearAppeared: question.yearAppeared,
			lessonId: question.lessonId,
			correctNumericAnswer: question.correctNumericAnswer,
			questionType: question.questionType,
			isOpenEnded: question.isOpenEnded,
			answerTolerance: question.answerTolerance,
			parentQuestionId: question.parentQuestionId,
			lesson: question.lesson,
			subQuestions: question.subQuestions ? question.subQuestions.map((subQ: any) => ({
				id: subQ.id,
				stem: subQ.stem,
				options: subQ.options.map((option: any) => ({
					id: option.id,
					text: option.text,
					isCorrect: option.isCorrect,
					order: option.order
				})),
				explanation: subQ.explanation,
				difficulty: subQ.difficulty,
				correctNumericAnswer: subQ.correctNumericAnswer,
				questionType: subQ.questionType,
				isOpenEnded: subQ.isOpenEnded,
				answerTolerance: subQ.answerTolerance
			})) : undefined
		}));

		return {
			questions: formattedQuestions,
			totalQuestions: formattedQuestions.length,
			practicedQuestionIds: practicedQuestionIds
		};
	}

	@Get('lessons')
	async getLessons(@Req() req: any, @Query('subjectId') subjectId?: string) {
		const userId = req.user.id;
		
		// Get user's stream
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { streamId: true }
		});

		if (!user?.streamId) {
			throw new ForbiddenException('No stream assigned to user');
		}

		const where: any = {
			subject: {
				streamId: user.streamId
			}
		};

		if (subjectId) {
			where.subjectId = subjectId;
		}

		return this.prisma.lesson.findMany({
			where,
			orderBy: { order: 'asc' },
			select: {
				id: true,
				name: true,
				description: true,
				order: true,
				_count: {
					select: { questions: true }
				}
			}
		});
	}

} 