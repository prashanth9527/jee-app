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
exports.ExamsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ai_service_1 = require("../ai/ai.service");
const subscription_validation_service_1 = require("../subscriptions/subscription-validation.service");
let ExamsService = class ExamsService {
    constructor(prisma, aiService, subscriptionValidation) {
        this.prisma = prisma;
        this.aiService = aiService;
        this.subscriptionValidation = subscriptionValidation;
    }
    async createPaper(data) {
        return this.prisma.examPaper.create({ data: {
                title: data.title,
                description: data.description || null,
                subjectIds: data.subjectIds || [],
                topicIds: data.topicIds || [],
                subtopicIds: data.subtopicIds || [],
                questionIds: data.questionIds || [],
                timeLimitMin: data.timeLimitMin || null,
            } });
    }
    async generateQuestionsForPaper(paperId, limit = 50) {
        const paper = await this.prisma.examPaper.findUnique({ where: { id: paperId } });
        if (!paper)
            throw new common_1.NotFoundException('Paper not found');
        const where = {};
        if (paper.subjectIds?.length)
            where.subjectId = { in: paper.subjectIds };
        if (paper.topicIds?.length)
            where.topicId = { in: paper.topicIds };
        if (paper.subtopicIds?.length)
            where.subtopicId = { in: paper.subtopicIds };
        const questions = await this.prisma.question.findMany({ where, include: { options: true }, take: limit });
        return questions.map((q) => q.id);
    }
    async startSubmission(userId, paperId) {
        const paper = await this.prisma.examPaper.findUnique({ where: { id: paperId } });
        if (!paper)
            throw new common_1.NotFoundException('Paper not found');
        let questions = paper.questionIds;
        if (!questions || questions.length === 0) {
            questions = await this.generateQuestionsForPaper(paperId, 50);
        }
        const submission = await this.prisma.examSubmission.create({ data: {
                userId,
                examPaperId: paperId,
                totalQuestions: questions.length,
            } });
        return { submissionId: submission.id, questionIds: questions };
    }
    async submitAnswer(submissionId, questionId, selectedOptionId) {
        const question = await this.prisma.question.findUnique({ where: { id: questionId }, include: { options: true } });
        if (!question)
            throw new common_1.NotFoundException('Question not found');
        const selected = selectedOptionId ? await this.prisma.questionOption.findUnique({ where: { id: selectedOptionId } }) : null;
        const correct = question.options.find((o) => o.isCorrect);
        const isCorrect = !!(selected && correct && selected.id === correct.id);
        return this.prisma.examAnswer.upsert({
            where: { submissionId_questionId: { submissionId, questionId } },
            update: { selectedOptionId: selectedOptionId || null, isCorrect },
            create: { submissionId, questionId, selectedOptionId: selectedOptionId || null, isCorrect },
        });
    }
    async finalize(submissionId) {
        const submission = await this.prisma.examSubmission.findUnique({ where: { id: submissionId } });
        if (!submission)
            throw new common_1.NotFoundException('Submission not found');
        const answers = await this.prisma.examAnswer.findMany({ where: { submissionId } });
        const correctCount = answers.filter((a) => a.isCorrect).length;
        const total = submission.totalQuestions;
        const scorePercent = total > 0 ? (correctCount / total) * 100 : 0;
        return this.prisma.examSubmission.update({ where: { id: submissionId }, data: { submittedAt: new Date(), correctCount, scorePercent } });
    }
    async analyticsBySubject(userId) {
        const rows = await this.prisma.$queryRawUnsafe(`SELECT q."subjectId" as "subjectId", COUNT(*)::int as total, SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::int as correct
			 FROM "ExamAnswer" a
			 JOIN "Question" q ON q."id" = a."questionId"
			 JOIN "ExamSubmission" s ON s."id" = a."submissionId"
			 WHERE s."userId" = $1
			 GROUP BY q."subjectId"`, userId);
        return rows;
    }
    async analyticsByTopic(userId) {
        const rows = await this.prisma.$queryRawUnsafe(`SELECT q."topicId" as "topicId", COUNT(*)::int as total, SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::int as correct
			 FROM "ExamAnswer" a
			 JOIN "Question" q ON q."id" = a."questionId"
			 JOIN "ExamSubmission" s ON s."id" = a."submissionId"
			 WHERE s."userId" = $1
			 GROUP BY q."topicId"`, userId);
        return rows;
    }
    async analyticsBySubtopic(userId) {
        const rows = await this.prisma.$queryRawUnsafe(`SELECT q."subtopicId" as "subtopicId", COUNT(*)::int as total, SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::int as correct
			 FROM "ExamAnswer" a
			 JOIN "Question" q ON q."id" = a."questionId"
			 JOIN "ExamSubmission" s ON s."id" = a."submissionId"
			 WHERE s."userId" = $1
			 GROUP BY q."subtopicId"`, userId);
        return rows;
    }
    async getSubmission(submissionId) {
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
    async getSubmissionQuestions(submissionId) {
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
    async getExamResults(submissionId) {
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
    async generateAIPracticeTest(userId, request) {
        const aiUsage = await this.subscriptionValidation.validateAiUsage(userId);
        if (!aiUsage.canUseAi) {
            throw new common_1.ForbiddenException(aiUsage.message);
        }
        const aiAccess = await this.aiService.validateSubscription(userId);
        if (!aiAccess.hasAIAccess) {
            throw new Error('AI question generation requires AI-enabled subscription');
        }
        const subject = await this.prisma.subject.findUnique({
            where: { id: request.subjectId }
        });
        const topic = request.topicId ? await this.prisma.topic.findUnique({
            where: { id: request.topicId }
        }) : null;
        const subtopic = request.subtopicId ? await this.prisma.subtopic.findUnique({
            where: { id: request.subtopicId }
        }) : null;
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
        await this.subscriptionValidation.incrementAiUsage(userId);
        return {
            examPaper,
            questions: savedQuestions
        };
    }
    async generateAIExplanation(questionId, userId, userAnswer) {
        const aiAccess = await this.aiService.validateSubscription(userId);
        if (!aiAccess.hasAIAccess) {
            throw new Error('AI explanations require AI-enabled subscription');
        }
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
        const explanation = await this.aiService.generateExplanationWithTips(question.stem, correctAnswer, userAnswer, question.tip_formula || undefined);
        return {
            questionId,
            explanation,
            isAIGenerated: true
        };
    }
    async generateManualPracticeTest(userId, request) {
        const where = {
            subjectId: request.subjectId
        };
        if (request.topicId) {
            where.topicId = request.topicId;
        }
        if (request.subtopicId) {
            where.subtopicId = request.subtopicId;
        }
        if (request.difficulty !== 'MIXED') {
            where.difficulty = request.difficulty;
        }
        const questions = await this.prisma.question.findMany({
            where,
            include: {
                options: true
            },
            take: request.questionCount,
            orderBy: {
                id: 'asc'
            }
        });
        if (questions.length === 0) {
            throw new Error('No questions found for the selected criteria');
        }
        const subject = await this.prisma.subject.findUnique({
            where: { id: request.subjectId }
        });
        const topic = request.topicId ? await this.prisma.topic.findUnique({
            where: { id: request.topicId }
        }) : null;
        const subtopic = request.subtopicId ? await this.prisma.subtopic.findUnique({
            where: { id: request.subtopicId }
        }) : null;
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
};
exports.ExamsService = ExamsService;
exports.ExamsService = ExamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        ai_service_1.AIService,
        subscription_validation_service_1.SubscriptionValidationService])
], ExamsService);
//# sourceMappingURL=exams.service.js.map