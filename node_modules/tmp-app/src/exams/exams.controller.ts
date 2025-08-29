import { Body, Controller, Get, Param, Post, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { ExamsService } from './exams.service';

@UseGuards(JwtAuthGuard)
@Controller('exams')
export class ExamsController {
	constructor(private readonly exams: ExamsService) {}

	@Post('papers')
	createPaper(@Body() body: { title: string; description?: string; subjectIds?: string[]; topicIds?: string[]; subtopicIds?: string[]; questionIds?: string[]; timeLimitMin?: number }) {
		return this.exams.createPaper(body);
	}

	@Post('papers/:paperId/start')
	start(@Req() req: any, @Param('paperId') paperId: string) {
		return this.exams.startSubmission(req.user.id, paperId);
	}

	@Post('submissions/:submissionId/answer')
	submit(@Param('submissionId') submissionId: string, @Body() body: { questionId: string; selectedOptionId?: string }) {
		return this.exams.submitAnswer(submissionId, body.questionId, body.selectedOptionId || null);
	}

	@Get('submissions/:submissionId')
	async getSubmission(@Req() req: any, @Param('submissionId') submissionId: string) {
		const submission = await this.exams.getSubmission(submissionId);
		
		// Check if user owns this submission
		if (submission.userId !== req.user.id) {
			throw new ForbiddenException('You can only access your own exam submissions');
		}
		
		return submission;
	}

	@Get('submissions/:submissionId/questions')
	async getSubmissionQuestions(@Req() req: any, @Param('submissionId') submissionId: string) {
		const submission = await this.exams.getSubmission(submissionId);
		
		// Check if user owns this submission
		if (submission.userId !== req.user.id) {
			throw new ForbiddenException('You can only access your own exam submissions');
		}
		
		return this.exams.getSubmissionQuestions(submissionId);
	}

	@Get('submissions/:submissionId/results')
	async getExamResults(@Req() req: any, @Param('submissionId') submissionId: string) {
		const submission = await this.exams.getSubmission(submissionId);
		
		// Check if user owns this submission
		if (submission.userId !== req.user.id) {
			throw new ForbiddenException('You can only access your own exam submissions');
		}
		
		return this.exams.getExamResults(submissionId);
	}

	@Post('submissions/:submissionId/finalize')
	finalize(@Param('submissionId') submissionId: string) {
		return this.exams.finalize(submissionId);
	}

	@Get('analytics/subjects')
	analyticsSubjects(@Req() req: any) {
		return this.exams.analyticsBySubject(req.user.id);
	}

	@Get('analytics/topics')
	analyticsTopics(@Req() req: any) {
		return this.exams.analyticsByTopic(req.user.id);
	}

	@Get('analytics/subtopics')
	analyticsSubtopics(@Req() req: any) {
		return this.exams.analyticsBySubtopic(req.user.id);
	}
} 