import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';

@Injectable()
export class ExamsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly aiService: AIService,
		private readonly subscriptionValidation: SubscriptionValidationService
	) {}

	async createPaper(data: { title: string; description?: string; subjectIds?: string[]; topicIds?: string[]; subtopicIds?: string[]; questionIds?: string[]; timeLimitMin?: number }) {
		return this.prisma.examPaper.create({ data: {
			title: data.title,
			description: data.description || null,
			subjectIds: data.subjectIds || [],
			topicIds: data.topicIds || [],
			subtopicIds: data.subtopicIds || [],
			questionIds: data.questionIds || [],
			timeLimitMin: data.timeLimitMin || null,
		}});
	}

	async generateQuestionsForPaper(paperId: string, limit = 50) {
		const paper = await this.prisma.examPaper.findUnique({ where: { id: paperId } });
		if (!paper) throw new NotFoundException('Paper not found');
		const where: any = {};
		if (paper.subjectIds?.length) where.subjectId = { in: paper.subjectIds };
		if (paper.topicIds?.length) where.topicId = { in: paper.topicIds };
		if (paper.subtopicIds?.length) where.subtopicId = { in: paper.subtopicIds };
		const questions = await this.prisma.question.findMany({ where, include: { options: true }, take: limit });
		return questions.map((q: any) => q.id);
	}

	async startSubmission(userId: string, paperId: string) {
		const paper = await this.prisma.examPaper.findUnique({ where: { id: paperId } });
		if (!paper) throw new NotFoundException('Paper not found');
		let questions = paper.questionIds;
		if (!questions || questions.length === 0) {
			questions = await this.generateQuestionsForPaper(paperId, 50);
		}
		const submission = await this.prisma.examSubmission.create({ data: {
			userId,
			examPaperId: paperId,
			totalQuestions: questions.length,
		}});
		return { submissionId: submission.id, questionIds: questions };
	}

	async submitAnswer(submissionId: string, questionId: string, selectedOptionId: string | null) {
		const question = await this.prisma.question.findUnique({ where: { id: questionId }, include: { options: true } });
		if (!question) throw new NotFoundException('Question not found');
		const selected = selectedOptionId ? await this.prisma.questionOption.findUnique({ where: { id: selectedOptionId } }) : null;
		const correct = (question.options as any[]).find((o: any) => o.isCorrect);
		const isCorrect = !!(selected && correct && (selected as any).id === (correct as any).id);
		return this.prisma.examAnswer.upsert({
			where: { submissionId_questionId: { submissionId, questionId } },
			update: { selectedOptionId: selectedOptionId || null, isCorrect },
			create: { submissionId, questionId, selectedOptionId: selectedOptionId || null, isCorrect },
		});
	}

	async finalize(submissionId: string) {
		const submission = await this.prisma.examSubmission.findUnique({ where: { id: submissionId } });
		if (!submission) throw new NotFoundException('Submission not found');
		const answers = await this.prisma.examAnswer.findMany({ where: { submissionId } });
		const correctCount = (answers as any[]).filter((a: any) => a.isCorrect).length;
		const total = submission.totalQuestions as any as number;
		const scorePercent = total > 0 ? (correctCount / total) * 100 : 0;
		return this.prisma.examSubmission.update({ where: { id: submissionId }, data: { submittedAt: new Date(), correctCount, scorePercent } });
	}

	async analyticsBySubject(userId: string) {
		const rows = await this.prisma.$queryRawUnsafe(
			`SELECT q."subjectId" as "subjectId", COUNT(*)::int as total, SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::int as correct
			 FROM "ExamAnswer" a
			 JOIN "Question" q ON q."id" = a."questionId"
			 JOIN "ExamSubmission" s ON s."id" = a."submissionId"
			 WHERE s."userId" = $1
			 GROUP BY q."subjectId"`,
			userId
		) as any[];
		return rows;
	}

	async analyticsByTopic(userId: string) {
		const rows = await this.prisma.$queryRawUnsafe(
			`SELECT q."topicId" as "topicId", COUNT(*)::int as total, SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::int as correct
			 FROM "ExamAnswer" a
			 JOIN "Question" q ON q."id" = a."questionId"
			 JOIN "ExamSubmission" s ON s."id" = a."submissionId"
			 WHERE s."userId" = $1
			 GROUP BY q."topicId"`,
			userId
		) as any[];
		return rows;
	}

	async analyticsBySubtopic(userId: string) {
		const rows = await this.prisma.$queryRawUnsafe(
			`SELECT q."subtopicId" as "subtopicId", COUNT(*)::int as total, SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::int as correct
			 FROM "ExamAnswer" a
			 JOIN "Question" q ON q."id" = a."questionId"
			 JOIN "ExamSubmission" s ON s."id" = a."submissionId"
			 WHERE s."userId" = $1
			 GROUP BY q."subtopicId"`,
			userId
		) as any[];
		return rows;
	}

	async getSubmission(submissionId: string) {
		const submission = await this.prisma.examSubmission.findUnique({
			where: { id: submissionId },
			include: {
				examPaper: {
					select: {
						id: true,
						title: true,
						timeLimitMin: true,
						questionIds: true,
					}
				}
			}
		});

		if (!submission) {
			throw new Error('Submission not found');
		}

		return {
			id: submission.id,
			userId: submission.userId,
			examPaper: submission.examPaper,
			startedAt: submission.startedAt,
			totalQuestions: submission.totalQuestions,
			questionIds: submission.examPaper.questionIds,
		};
	}

	async getSubmissionQuestions(submissionId: string) {
		const submission = await this.prisma.examSubmission.findUnique({
			where: { id: submissionId },
			include: {
				examPaper: {
					select: { questionIds: true }
				}
			}
		});

		if (!submission) {
			throw new Error('Submission not found');
		}

		const questions = await this.prisma.question.findMany({
			where: { id: { in: submission.examPaper.questionIds } },
			include: {
				options: {
					select: {
						id: true,
						text: true,
						isCorrect: true,
					}
				}
			},
			orderBy: { createdAt: 'asc' }
		});

		return questions;
	}

	async getExamResults(submissionId: string) {
		const submission = await this.prisma.examSubmission.findUnique({
			where: { id: submissionId },
			include: {
				examPaper: {
					select: {
						id: true,
						title: true,
						timeLimitMin: true,
						questionIds: true,
					}
				},
				answers: {
					include: {
						question: {
							include: {
								options: {
									select: {
										id: true,
										text: true,
										isCorrect: true,
									}
								},
								alternativeExplanations: {
									orderBy: { createdAt: 'asc' }
								}
							}
						},
						selectedOption: {
							select: {
								id: true,
								text: true,
								isCorrect: true,
							}
						}
					}
				}
			}
		});

		if (!submission) {
			throw new Error('Submission not found');
		}

		return {
			submission: {
				id: submission.id,
				examPaper: submission.examPaper,
				startedAt: submission.startedAt,
				submittedAt: submission.submittedAt,
				totalQuestions: submission.totalQuestions,
				correctCount: submission.correctCount,
				scorePercent: submission.scorePercent,
			},
			answers: submission.answers.map(answer => ({
				questionId: answer.questionId,
				question: answer.question,
				selectedOption: answer.selectedOption,
				isCorrect: answer.isCorrect,
			}))
		};
	}

	async generateAIPracticeTest(userId: string, request: {
		subjectId: string;
		topicId?: string;
		subtopicId?: string;
		questionCount: number;
		difficulty: 'EASY' | 'MEDIUM' | 'HARD';
		timeLimitMin: number;
	}) {
		// Check AI usage limits
		const aiUsage = await this.subscriptionValidation.validateAiUsage(userId);
		if (!aiUsage.canUseAi) {
			throw new ForbiddenException(aiUsage.message);
		}

		// Check if user has AI access
		const aiAccess = await this.aiService.validateSubscription(userId);
		if (!aiAccess.hasAIAccess) {
			throw new Error('AI question generation requires AI-enabled subscription');
		}

		// Get subject, topic, and subtopic names
		const subject = await this.prisma.subject.findUnique({
			where: { id: request.subjectId }
		});

		const topic = request.topicId ? await this.prisma.topic.findUnique({
			where: { id: request.topicId }
		}) : null;

		const subtopic = request.subtopicId ? await this.prisma.subtopic.findUnique({
			where: { id: request.subtopicId }
		}) : null;

		// Generate AI questions with tips integration
		const aiQuestions = await this.aiService.generateQuestionsWithTips({
			subject: subject?.name || 'General',
			topic: topic?.name,
			subtopic: subtopic?.name,
			difficulty: request.difficulty,
			questionCount: request.questionCount,
			subjectId: request.subjectId,
			topicId: request.topicId,
			subtopicId: request.subtopicId
		});

		// Save AI questions to database
		const savedQuestions = [];
		for (const aiQuestion of aiQuestions) {
			const question = await this.prisma.question.create({
				data: {
					stem: aiQuestion.stem,
					explanation: aiQuestion.explanation,
					tip_formula: aiQuestion.tip_formula,
					difficulty: aiQuestion.difficulty,
					subjectId: request.subjectId,
					topicId: request.topicId,
					subtopicId: request.subtopicId,
					isAIGenerated: true,
					aiPrompt: `Generated for ${subject?.name}${topic ? ` - ${topic.name}` : ''}${subtopic ? ` - ${subtopic.name}` : ''} (${request.difficulty})`,
					options: {
						create: aiQuestion.options.map((opt, index) => ({
							text: opt.text,
							isCorrect: opt.isCorrect,
							order: index
						}))
					}
				},
				include: {
					options: true
				}
			});
			savedQuestions.push(question);
		}

		// Create exam paper with AI questions
		const examPaper = await this.prisma.examPaper.create({
			data: {
				title: `AI Practice Test - ${subject?.name}${topic ? ` - ${topic.name}` : ''}${subtopic ? ` - ${subtopic.name}` : ''}`,
				description: `AI-generated practice test with ${request.questionCount} ${request.difficulty.toLowerCase()} questions`,
				subjectIds: [request.subjectId],
				topicIds: request.topicId ? [request.topicId] : [],
				subtopicIds: request.subtopicId ? [request.subtopicId] : [],
				questionIds: savedQuestions.map(q => q.id),
				timeLimitMin: request.timeLimitMin
			}
		});

		// Increment AI usage
		await this.subscriptionValidation.incrementAiUsage(userId);

		return {
			examPaper,
			questions: savedQuestions
		};
	}

	async generateAIExplanation(questionId: string, userId: string, userAnswer?: string) {
		// Check if user has AI access
		const aiAccess = await this.aiService.validateSubscription(userId);
		if (!aiAccess.hasAIAccess) {
			throw new Error('AI explanations require AI-enabled subscription');
		}

		// Get question details
		const question = await this.prisma.question.findUnique({
			where: { id: questionId },
			include: {
				options: {
					where: { isCorrect: true },
					take: 1
				}
			}
		});

		if (!question) {
			throw new Error('Question not found');
		}

		const correctAnswer = question.options[0]?.text || '';
		
		// Generate AI explanation with tips integration
		const explanation = await this.aiService.generateExplanationWithTips(
			question.stem,
			correctAnswer,
			userAnswer,
			question.tip_formula || undefined
		);

		return {
			questionId,
			explanation,
			isAIGenerated: true
		};
	}

	async generateManualPracticeTest(userId: string, request: {
		subjectId: string;
		topicId?: string;
		subtopicId?: string;
		questionCount: number;
		difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
		timeLimitMin: number;
	}) {
		// Build where clause for question selection
		const where: any = {
			subjectId: request.subjectId
		};

		if (request.topicId) {
			where.topicId = request.topicId;
		}

		if (request.subtopicId) {
			where.subtopicId = request.subtopicId;
		}

		// Filter by difficulty if not mixed
		if (request.difficulty !== 'MIXED') {
			where.difficulty = request.difficulty;
		}

		// Get questions from database
		const questions = await this.prisma.question.findMany({
			where,
			include: {
				options: true
			},
			take: request.questionCount,
			orderBy: {
				// Random selection for variety
				id: 'asc'
			}
		});

		if (questions.length === 0) {
			throw new Error('No questions found for the selected criteria');
		}

		// Get subject, topic, and subtopic names for paper title
		const subject = await this.prisma.subject.findUnique({
			where: { id: request.subjectId }
		});

		const topic = request.topicId ? await this.prisma.topic.findUnique({
			where: { id: request.topicId }
		}) : null;

		const subtopic = request.subtopicId ? await this.prisma.subtopic.findUnique({
			where: { id: request.subtopicId }
		}) : null;

		// Create exam paper with selected questions
		const examPaper = await this.prisma.examPaper.create({
			data: {
				title: `Practice Test - ${subject?.name}${topic ? ` - ${topic.name}` : ''}${subtopic ? ` - ${subtopic.name}` : ''}`,
				description: `Practice test with ${questions.length} ${request.difficulty.toLowerCase()} questions from database`,
				subjectIds: [request.subjectId],
				topicIds: request.topicId ? [request.topicId] : [],
				subtopicIds: request.subtopicId ? [request.subtopicId] : [],
				questionIds: questions.map(q => q.id),
				timeLimitMin: request.timeLimitMin
			}
		});

		return {
			examPaper,
			questions
		};
	}
} 