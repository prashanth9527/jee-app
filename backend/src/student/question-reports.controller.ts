import { Controller, Post, Body, UseGuards, Req, Get, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface CreateReportDto {
  questionId: string;
  reportType: 'INCORRECT_ANSWER' | 'INCORRECT_EXPLANATION' | 'SUGGESTED_EXPLANATION' | 'GRAMMATICAL_ERROR' | 'TECHNICAL_ERROR' | 'OTHER';
  reason: string;
  description?: string;
  alternativeExplanation?: string;
  suggestedAnswer?: string;
  suggestedOptions?: Array<{
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
}

@Controller('student/question-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class StudentQuestionReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async createReport(@Body() createReportDto: CreateReportDto, @Req() req: any) {
    const userId = req.user.id;

    // Verify the question exists
    const question = await this.prisma.question.findUnique({
      where: { id: createReportDto.questionId },
      include: {
        subject: {
          select: { name: true, stream: { select: { name: true } } }
        }
      }
    });

    if (!question) {
      throw new Error('Question not found');
    }

    // Create the report
    const report = await this.prisma.questionReport.create({
      data: {
        questionId: createReportDto.questionId,
        userId,
        reportType: createReportDto.reportType as any,
        reason: createReportDto.reason,
        description: createReportDto.description || '',
        alternativeExplanation: createReportDto.alternativeExplanation,
        suggestedAnswer: createReportDto.suggestedAnswer,
        suggestedOptions: createReportDto.suggestedOptions ? {
          create: createReportDto.suggestedOptions
        } : undefined
      },
      include: {
        question: {
          select: {
            id: true,
            stem: true,
            subject: {
              select: { name: true, stream: { select: { name: true } } }
            }
          }
        }
      }
    });

    return {
      message: 'Question report submitted successfully',
      report: {
        id: report.id,
        reportType: report.reportType,
        reason: report.reason,
        status: report.status,
        createdAt: report.createdAt,
        question: report.question
      }
    };
  }

  @Get('my-reports')
  async getMyReports(@Req() req: any) {
    const userId = req.user.id;

    const reports = await this.prisma.questionReport.findMany({
      where: { userId },
      include: {
        question: {
          select: {
            id: true,
            stem: true,
            subject: {
              select: { name: true, stream: { select: { name: true } } }
            }
          }
        },
        suggestedOptions: {
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return reports;
  }

  @Get('question/:questionId')
  async getQuestionReports(@Param('questionId') questionId: string, @Req() req: any) {
    const userId = req.user.id;

    // Get the question with all explanations
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        alternativeExplanations: {
          orderBy: { createdAt: 'asc' }
        },
        subject: {
          select: { name: true, stream: { select: { name: true } } }
        }
      }
    });

    if (!question) {
      throw new Error('Question not found');
    }

    // Get user's reports for this question
    const userReports = await this.prisma.questionReport.findMany({
      where: {
        questionId,
        userId
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      question: {
        id: question.id,
        stem: question.stem,
        explanation: question.explanation,
        alternativeExplanations: question.alternativeExplanations,
        subject: question.subject
      },
      userReports
    };
  }
} 