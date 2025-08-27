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
let ExamsService = class ExamsService {
    constructor(prisma) {
        this.prisma = prisma;
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
};
exports.ExamsService = ExamsService;
exports.ExamsService = ExamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ExamsService);
//# sourceMappingURL=exams.service.js.map