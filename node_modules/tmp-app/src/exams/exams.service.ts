import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExamsService {
	constructor(private readonly prisma: PrismaService) {}

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
} 