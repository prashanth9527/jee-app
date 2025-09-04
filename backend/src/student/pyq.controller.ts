import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('student/pyq')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class PYQController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('years')
  async getAvailableYears() {
    const years = await this.prisma.question.findMany({
      where: {
        isPreviousYear: true,
        yearAppeared: { not: null }
      },
      select: {
        yearAppeared: true
      },
      distinct: ['yearAppeared'],
      orderBy: {
        yearAppeared: 'desc'
      }
    });

    return years.map(y => y.yearAppeared).filter(Boolean);
  }

  @Get('subjects')
  async getSubjectsWithPYQ() {
    const subjects = await this.prisma.subject.findMany({
      where: {
        questions: {
          some: {
            isPreviousYear: true
          }
        }
      },
      include: {
        _count: {
          select: {
            questions: {
              where: {
                isPreviousYear: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return subjects;
  }

  @Get('topics')
  async getTopicsWithPYQ(@Query('subjectId') subjectId?: string) {
    const where: any = {
      questions: {
        some: {
          isPreviousYear: true
        }
      }
    };

    if (subjectId) {
      where.subjectId = subjectId;
    }

    const topics = await this.prisma.topic.findMany({
      where,
      include: {
        subject: true,
        _count: {
          select: {
            questions: {
              where: {
                isPreviousYear: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return topics;
  }

  @Get('questions')
  async getPYQQuestions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('year') year?: string,
    @Query('subjectId') subjectId?: string,
    @Query('topicId') topicId?: string,
    @Query('subtopicId') subtopicId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('search') search?: string
  ) {
    const currentPage = parseInt(page || '1');
    const itemsPerPage = parseInt(limit || '10');
    const skip = (currentPage - 1) * itemsPerPage;

    // Build where clause
    const where: any = {
      isPreviousYear: true
    };

    if (year) where.yearAppeared = parseInt(year);
    if (subjectId) where.subjectId = subjectId;
    if (topicId) where.topicId = topicId;
    if (subtopicId) where.subtopicId = subtopicId;
    if (difficulty) where.difficulty = difficulty;

    // Add search functionality
    if (search) {
      where.OR = [
        { stem: { contains: search, mode: 'insensitive' } },
        { explanation: { contains: search, mode: 'insensitive' } },
        { subject: { name: { contains: search, mode: 'insensitive' } } },
        { topic: { name: { contains: search, mode: 'insensitive' } } },
        { subtopic: { name: { contains: search, mode: 'insensitive' } } },
        { tags: { tag: { name: { contains: search, mode: 'insensitive' } } } }
      ];
    }

    // Get total count for pagination
    const totalItems = await this.prisma.question.count({ where });
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    // Get questions with pagination
    const questions = await this.prisma.question.findMany({
      where,
      include: {
        options: {
          orderBy: { order: 'asc' }
        },
        tags: { 
          include: { tag: true } 
        },
        subject: true,
        topic: true,
        subtopic: true
      },
      orderBy: [
        { yearAppeared: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: itemsPerPage,
    });

    return {
      questions,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      }
    };
  }

  @Get('questions/:id')
  async getPYQQuestion(@Param('id') id: string) {
    return this.prisma.question.findUnique({
      where: { id },
      include: {
        options: {
          orderBy: { order: 'asc' }
        },
        tags: { 
          include: { tag: true } 
        },
        subject: true,
        topic: true,
        subtopic: true
      }
    });
  }

  @Get('analytics')
  async getPYQAnalytics() {
    // Get total PYQ count
    const totalPYQ = await this.prisma.question.count({
      where: { isPreviousYear: true }
    });

    // Get PYQ count by year
    const byYear = await (this.prisma.question as any).groupBy({
      by: ['pyqYear'],
      where: { 
        isFromPYQ: true,
        pyqYear: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        pyqYear: 'desc'
      }
    });

    // Get PYQ count by subject
    const bySubject = await this.prisma.subject.findMany({
      include: {
        _count: {
          select: {
            questions: {
              where: { isPreviousYear: true }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Get PYQ count by difficulty
    const byDifficulty = await this.prisma.question.groupBy({
      by: ['difficulty'],
      where: { isPreviousYear: true },
      _count: {
        id: true
      }
    });

    return {
      totalPYQ,
      byYear: byYear.map((item: any) => ({
        year: item.pyqYear,
        count: item._count?.id || 0
      })),
      bySubject: bySubject.map(subject => ({
        name: subject.name,
        count: subject._count.questions
      })),
      byDifficulty: byDifficulty.map(item => ({
        difficulty: item.difficulty,
        count: item._count.id
      }))
    };
  }

  @Get('practice/generate')
  async generatePYQPracticeTest(
    @Query('year') year?: string,
    @Query('subjectId') subjectId?: string,
    @Query('topicId') topicId?: string,
    @Query('questionCount') questionCount?: string,
    @Query('difficulty') difficulty?: string
  ) {
    const count = parseInt(questionCount || '10');
    
    // Build where clause
    const where: any = {
      isPreviousYear: true
    };

    if (year) where.yearAppeared = parseInt(year);
    if (subjectId) where.subjectId = subjectId;
    if (topicId) where.topicId = topicId;
    if (difficulty && difficulty !== 'MIXED') where.difficulty = difficulty;

    // Get available questions
    const availableQuestions = await this.prisma.question.findMany({
      where,
      include: {
        options: {
          orderBy: { order: 'asc' }
        },
        subject: true,
        topic: true
      },
      orderBy: {
        yearAppeared: 'desc'
      }
    });

    // Randomly select questions
    const selectedQuestions = availableQuestions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count, availableQuestions.length));

    return {
      questions: selectedQuestions,
      totalQuestions: selectedQuestions.length,
      availableQuestions: availableQuestions.length
    };
  }
} 