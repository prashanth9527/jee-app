import { Controller, Get, Post, Body, Param, UseGuards, Req, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

interface ReviewReportDto {
  status: 'APPROVED' | 'REJECTED';
  reviewNotes?: string;
}

@Controller('admin/question-reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminQuestionReportsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getReports(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10'
  ) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (type && type !== 'all') {
      where.reportType = type;
    }

    const [reports, total] = await Promise.all([
      this.prisma.questionReport.findMany({
        where,
        include: {
          question: {
            select: {
              id: true,
              stem: true,
              explanation: true,
              subject: {
                select: { name: true, stream: { select: { name: true, code: true } } }
              }
            }
          },
          user: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          suggestedOptions: {
            orderBy: { order: 'asc' }
          },
          reviewedBy: {
            select: {
              id: true,
              fullName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      this.prisma.questionReport.count({ where })
    ]);

    return {
      reports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    };
  }

  @Get('stats')
  async getReportStats() {
    const [total, pending, approved, rejected] = await Promise.all([
      this.prisma.questionReport.count(),
      this.prisma.questionReport.count({ where: { status: 'PENDING' } }),
      this.prisma.questionReport.count({ where: { status: 'APPROVED' } }),
      this.prisma.questionReport.count({ where: { status: 'REJECTED' } })
    ]);

    const typeStats = await this.prisma.questionReport.groupBy({
      by: ['reportType'],
      _count: {
        reportType: true
      }
    });

    return {
      total,
      pending,
      approved,
      rejected,
      typeStats: typeStats.map(stat => ({
        type: stat.reportType,
        count: stat._count.reportType
      }))
    };
  }

  @Get(':id')
  async getReport(@Param('id') id: string) {
    const report = await this.prisma.questionReport.findUnique({
      where: { id },
      include: {
        question: {
          select: {
            id: true,
            stem: true,
            explanation: true,
            options: {
              orderBy: { order: 'asc' }
            },
            subject: {
              select: { name: true, stream: { select: { name: true, code: true } } }
            }
          }
        },
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        suggestedOptions: {
          orderBy: { order: 'asc' }
        },
        reviewedBy: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    if (!report) {
      throw new Error('Report not found');
    }

    return report;
  }

  @Post(':id/review')
  async reviewReport(
    @Param('id') id: string,
    @Body() reviewDto: ReviewReportDto,
    @Req() req: any
  ) {
    const reviewerId = req.user.id;

    const report = await this.prisma.questionReport.findUnique({
      where: { id },
      include: {
        question: true
      }
    });

    if (!report) {
      throw new Error('Report not found');
    }

    if (report.status !== 'PENDING') {
      throw new Error('Report has already been reviewed');
    }

    // Start a transaction to handle the review and potential explanation addition
    const result = await this.prisma.$transaction(async (prisma) => {
      // Update the report
      const updatedReport = await prisma.questionReport.update({
        where: { id },
        data: {
          status: reviewDto.status,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
          reviewNotes: reviewDto.reviewNotes
        }
      });

      // If approved and it's a suggested explanation, add it to alternative explanations
      if (reviewDto.status === 'APPROVED' && report.reportType === 'SUGGESTED_EXPLANATION' && report.alternativeExplanation) {
        await prisma.questionAlternativeExplanation.create({
          data: {
            questionId: report.questionId,
            explanation: report.alternativeExplanation,
            source: 'REPORT_APPROVED',
            reportId: report.id
          }
        });
      }

      return updatedReport;
    });

    return {
      message: `Report ${reviewDto.status.toLowerCase()} successfully`,
      report: result
    };
  }

  @Get('question/:questionId/explanations')
  async getQuestionExplanations(@Param('questionId') questionId: string) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        alternativeExplanations: {
          orderBy: { createdAt: 'asc' }
        },
        reports: {
          where: { status: 'PENDING' },
          include: {
            user: {
              select: { fullName: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!question) {
      throw new Error('Question not found');
    }

    return {
      question: {
        id: question.id,
        stem: question.stem,
        explanation: question.explanation
      },
      alternativeExplanations: question.alternativeExplanations,
      pendingReports: question.reports
    };
  }
} 