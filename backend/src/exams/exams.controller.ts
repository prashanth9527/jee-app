import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Req, 
  UseGuards,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ExamsService } from './exams.service';

@Controller('student/exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get(':id')
  async getExam(
    @Req() req: any,
    @Param('id') examId: string
  ) {
    return this.examsService.getExam(req.user.id, examId);
  }

  @Post(':id/submit')
  async submitExam(
    @Req() req: any,
    @Param('id') examId: string,
    @Body() body: {
      answers: Array<{
        questionId: string;
        optionId: string;
      }>;
    }
  ) {
    return this.examsService.submitExam(req.user.id, examId, body.answers);
  }

  @Get(':id/results')
  async getExamResults(
    @Req() req: any,
    @Param('id') examId: string
  ) {
    return this.examsService.getExamResults(req.user.id, examId);
  }

  @Post('papers/:id/start')
  async startExam(
    @Req() req: any,
    @Param('id') examId: string
  ) {
    return this.examsService.startExam(req.user.id, examId);
  }
}

// Papers Controller
@Controller('exams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class PapersController {
  constructor(private readonly examsService: ExamsService) {}

  @Post('papers/:id/start')
  async startExam(
    @Req() req: any,
    @Param('id') examId: string
  ) {
    return this.examsService.startExam(req.user.id, examId);
  }
}

// Submissions Controller
@Controller('exams/submissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class SubmissionsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get(':id')
  async getSubmission(
    @Req() req: any,
    @Param('id') submissionId: string
  ) {
    return this.examsService.getSubmission(req.user.id, submissionId);
  }

  @Get(':id/questions')
  async getSubmissionQuestions(
    @Req() req: any,
    @Param('id') submissionId: string
  ) {
    return this.examsService.getSubmissionQuestions(req.user.id, submissionId);
  }
}