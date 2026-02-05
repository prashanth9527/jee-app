import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('pyq')
export class PYQController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('public')
  async getPublicPYQ(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('year') year?: string,
    @Query('subject') subject?: string,
    @Query('difficulty') difficulty?: string,
  ) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {
      isPreviousYear: true,
    };

    if (year) {
      where.yearAppeared = parseInt(year);
    }

    if (subject) {
      where.subjectId = subject;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Get questions with pagination
    const [questions, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        include: {
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
          topic: {
            select: {
              id: true,
              name: true,
            },
          },
          subtopic: {
            select: {
              id: true,
              name: true,
            },
          },
          options: {
            select: {
              id: true,
              text: true,
              isCorrect: true,
              order: true,
            },
            orderBy: {
              order: 'asc',
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          { yearAppeared: 'desc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: limitNum,
      }),
      this.prisma.question.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      questions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalItems: total,
        itemsPerPage: limitNum,
      },
    };
  }

  @Get('analytics')
  async getAnalytics() {
    // Get total PYQ count
    const totalPYQ = await this.prisma.question.count({
      where: {
        isPreviousYear: true,
      },
    });

    // Get questions by year
    const byYear = await this.prisma.question.groupBy({
      by: ['yearAppeared'],
      where: {
        isPreviousYear: true,
        yearAppeared: { not: null },
      },
      _count: {
        id: true,
      },
      orderBy: {
        yearAppeared: 'desc',
      },
    });

    // Get questions by subject
    const bySubject = await this.prisma.question.groupBy({
      by: ['subjectId'],
      where: {
        isPreviousYear: true,
      },
      _count: {
        id: true,
      },
    });

    // Get subject names
    const subjectIds = bySubject.map(item => item.subjectId).filter((id): id is string => id !== null);
    const subjects = await this.prisma.subject.findMany({
      where: {
        id: { in: subjectIds },
      },
      select: {
        id: true,
        name: true,
      },
    });

    const subjectMap = new Map(subjects.map(s => [s.id, s.name]));

    // Get questions by difficulty
    const byDifficulty = await this.prisma.question.groupBy({
      by: ['difficulty'],
      where: {
        isPreviousYear: true,
      },
      _count: {
        id: true,
      },
    });

    return {
      totalPYQ,
      byYear: byYear.map(item => ({
        year: item.yearAppeared,
        count: item._count?.id || 0,
      })),
      bySubject: bySubject.map(item => ({
        name: subjectMap.get(item.subjectId || '') || 'Unknown',
        count: item._count?.id || 0,
      })),
      byDifficulty: byDifficulty.map(item => ({
        difficulty: item.difficulty,
        count: item._count?.id || 0,
      })),
    };
  }
}
