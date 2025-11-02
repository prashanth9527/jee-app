import { 
  Controller, 
  Get, 
  Post, 
  Put,
  Body, 
  Param, 
  UseGuards,
  BadRequestException,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { PDFReviewService } from './pdf-review.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/pdf-review')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EXPERT')
export class PDFReviewController {
  constructor(private readonly pdfReviewService: PDFReviewService) {}

  @Get(':cacheId')
  async getQuestionsForReview(@Param('cacheId') cacheId: string) {
    try {
      const result = await this.pdfReviewService.getQuestionsForReview(cacheId);
      
      return {
        success: true,
        data: result.questions,
        pdfCache: result.pdfCache,
        total: result.questions.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get questions for review',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':cacheId/:questionId')
  async getQuestionById(@Param('cacheId') cacheId: string, @Param('questionId') questionId: string) {
    try {
      const question = await this.pdfReviewService.getQuestionById(cacheId, questionId);
      
      if (!question) {
        throw new BadRequestException('Question not found');
      }

      return {
        success: true,
        data: question
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get question',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('approve/:questionId')
  async approveQuestion(@Param('questionId') questionId: string) {
    try {
      const question = await this.pdfReviewService.approveQuestion(questionId);
      
      return {
        success: true,
        message: 'Question approved successfully',
        data: question
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to approve question',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('reject/:questionId')
  async rejectQuestion(@Param('questionId') questionId: string) {
    try {
      const question = await this.pdfReviewService.rejectQuestion(questionId);
      
      return {
        success: true,
        message: 'Question rejected successfully',
        data: question
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to reject question',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('bulk-approve')
  async bulkApproveQuestions(@Body() body: { questionIds: string[] }) {
    try {
      if (!body.questionIds || !Array.isArray(body.questionIds)) {
        throw new BadRequestException('questionIds must be an array');
      }

      const result = await this.pdfReviewService.bulkApproveQuestions(body.questionIds);
      
      return {
        success: true,
        message: `${result.approvedCount} questions approved successfully`,
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to bulk approve questions',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('approve-all/:cacheId')
  async approveAllQuestions(@Param('cacheId') cacheId: string) {
    try {
      const result = await this.pdfReviewService.approveAllQuestions(cacheId);
      
      return {
        success: true,
        message: `${result.approvedCount} questions approved successfully`,
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to approve all questions',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('update/:questionId')
  async updateQuestion(@Param('questionId') questionId: string, @Body() updateData: any) {
    try {
      const question = await this.pdfReviewService.updateQuestion(questionId, updateData);
      
      return {
        success: true,
        message: 'Question updated successfully',
        data: question
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update question',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats/:cacheId')
  async getReviewStats(@Param('cacheId') cacheId: string) {
    try {
      const stats = await this.pdfReviewService.getReviewStats(cacheId);
      
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get review stats',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('create-exam')
  async createExamFromQuestions(@Body() body: { 
    questionIds: string[]; 
    title?: string;
    description?: string;
    timeLimitMin?: number;
    examType?: string;
    previousYear?: string;
  }) {
    try {
      if (!body.questionIds || !Array.isArray(body.questionIds) || body.questionIds.length === 0) {
        throw new BadRequestException('questionIds array is required and must not be empty');
      }

      const result = await this.pdfReviewService.createExamFromQuestions(
        body.questionIds,
        body.title,
        body.description,
        body.timeLimitMin,
        body.examType,
        body.previousYear
      );
      
      return {
        success: true,
        message: 'Exam created successfully',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to create exam',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

