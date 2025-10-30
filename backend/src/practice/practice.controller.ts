import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { PracticeService } from './practice.service';

@Controller('student/practice')
@UseGuards(JwtAuthGuard)
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get('content-tree')
  async getContentTree(@Request() req: any) {
    return this.practiceService.getContentTree(req.user.id);
  }

  @Get('content/:contentType/:contentId/questions')
  async getContentQuestions(
    @Param('contentType') contentType: string,
    @Param('contentId') contentId: string,
    @Request() req: any
  ) {
    return this.practiceService.getContentQuestions(contentType, contentId, req.user.id);
  }

  @Post('progress/start')
  async startPracticeProgress(
    @Body() data: {
      contentType: 'lesson' | 'topic' | 'subtopic';
      contentId: string;
      totalQuestions: number;
    },
    @Request() req: any
  ) {
    return this.practiceService.startPracticeProgress(data, req.user.id);
  }

  @Get('progress/:contentType/:contentId')
  async getPracticeProgress(
    @Param('contentType') contentType: string,
    @Param('contentId') contentId: string,
    @Request() req: any
  ) {
    return this.practiceService.getPracticeProgress(contentType, contentId, req.user.id);
  }

  @Put('progress/:progressId/update')
  async updatePracticeProgress(
    @Param('progressId') progressId: string,
    @Body() data: {
      currentQuestionIndex: number;
      completedQuestions: number;
      visitedQuestions: string[];
      isCompleted?: boolean;
    },
    @Request() req: any
  ) {
    return this.practiceService.updatePracticeProgress(progressId, data, req.user.id);
  }

  @Post('session')
  async createPracticeSession(
    @Body() data: {
      progressId: string;
      questionId: string;
      userAnswer?: any;
      isCorrect?: boolean;
      timeSpent?: number;
      isChecked?: boolean;
    },
    @Request() req: any
  ) {
    return this.practiceService.createPracticeSession(data, req.user.id);
  }

  @Put('session/:sessionId')
  async updatePracticeSession(
    @Param('sessionId') sessionId: string,
    @Body() data: {
      userAnswer?: any;
      isCorrect?: boolean;
      timeSpent?: number;
      isChecked?: boolean;
    },
    @Request() req: any
  ) {
    return this.practiceService.updatePracticeSession(sessionId, data, req.user.id);
  }

  @Get('history')
  async getPracticeHistory(@Request() req: any) {
    return this.practiceService.getPracticeHistory(req.user.id);
  }

  @Delete('progress/:progressId')
  async deletePracticeProgress(
    @Param('progressId') progressId: string,
    @Request() req: any
  ) {
    return this.practiceService.deletePracticeProgress(progressId, req.user.id);
  }

  @Get('stats/:contentType/:contentId')
  async getContentStats(
    @Param('contentType') contentType: string,
    @Param('contentId') contentId: string,
    @Request() req: any
  ) {
    return this.practiceService.getContentStats(contentType, contentId, req.user.id);
  }
}