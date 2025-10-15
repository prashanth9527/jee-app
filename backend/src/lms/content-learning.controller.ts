import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Body, 
  Param, 
  Query, 
  Req, 
  UseGuards,
  BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ContentLearningService, AIQuestionRequest } from './content-learning.service';

@Controller('student/content-learning')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class ContentLearningController {
  constructor(private readonly contentLearningService: ContentLearningService) {}

  // ==================== NOTES MANAGEMENT ====================

  @Post('notes/:contentId')
  async saveNotes(
    @Req() req: any,
    @Param('contentId') contentId: string,
    @Body() body: { notes: string }
  ) {
    if (!body.notes) {
      throw new BadRequestException('Notes content is required');
    }

    return this.contentLearningService.saveNotes(req.user.id, contentId, body.notes);
  }

  @Get('notes/:contentId')
  async getNotes(
    @Req() req: any,
    @Param('contentId') contentId: string
  ) {
    return this.contentLearningService.getNotes(req.user.id, contentId);
  }

  // ==================== AI QUESTION GENERATION ====================

  @Post('generate-questions')
  async generateAIQuestions(
    @Req() req: any,
    @Body() body: AIQuestionRequest
  ) {
    console.log('Generate AI Questions request:', {
      userId: req.user?.id,
      body,
      headers: req.headers
    });

    if (!body.contentId) {
      console.error('Content ID is missing from request body');
      throw new BadRequestException('Content ID is required');
    }

    try {
      const result = await this.contentLearningService.generateAIQuestions(req.user.id, {
        contentId: body.contentId,
        difficulty: body.difficulty || 'MEDIUM',
        questionCount: body.questionCount || 5,
        questionTypes: body.questionTypes || []
      });
      
      console.log('AI Questions generated successfully:', result);
      return result;
    } catch (error) {
      console.error('Error generating AI questions:', error);
      throw error;
    }
  }

  // ==================== PERFORMANCE ANALYSIS ====================

  @Post('analyze-performance/:contentId')
  async analyzePerformance(
    @Req() req: any,
    @Param('contentId') contentId: string
  ) {
    return this.contentLearningService.analyzePerformance(req.user.id, contentId);
  }

  @Get('performance-analysis/:contentId')
  async getPerformanceAnalysis(
    @Req() req: any,
    @Param('contentId') contentId: string
  ) {
    return this.contentLearningService.getPerformanceAnalysis(req.user.id, contentId);
  }

  // ==================== CONTENT EXAMS ====================

  @Post('create-questions')
  async createQuestions(
    @Req() req: any,
    @Body() body: {
      contentId: string;
      questions: Array<{
        stem: string;
        options: Array<{
          text: string;
          isCorrect: boolean;
        }>;
        explanation: string;
        difficulty: string;
        topic: string;
        subtopic?: string;
      }>;
    }
  ) {
    return this.contentLearningService.createQuestions(req.user.id, body.contentId, body.questions);
  }

  @Post('create-exam/:contentId')
  async createContentExam(
    @Req() req: any,
    @Param('contentId') contentId: string,
    @Body() body: {
      questionIds: string[];
      title: string;
      description?: string;
      timeLimitMin?: number;
    }
  ) {
    return this.contentLearningService.createContentExam(
      req.user.id,
      contentId,
      body.questionIds,
      body.title,
      body.description,
      body.timeLimitMin
    );
  }

  @Get('exams/:contentId')
  async getContentExams(
    @Param('contentId') contentId: string,
    @Query('examType') examType?: string
  ) {
    return this.contentLearningService.getContentExams(contentId, examType);
  }
}
