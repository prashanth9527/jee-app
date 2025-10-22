import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('admin/pyq')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminPYQController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('stats')
  async getPYQStats() {
    const totalPYQ = await this.prisma.question.count({
      where: { isPreviousYear: true }
    });

    const byYear = await this.prisma.question.groupBy({
      by: ['yearAppeared'],
      where: { 
        isPreviousYear: true,
        yearAppeared: { not: null }
      },
      _count: {
        id: true
      },
      orderBy: {
        yearAppeared: 'desc'
      }
    });

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

    return {
      totalPYQ,
	byYear: byYear.map((item: any) => ({
        year: item.yearAppeared,
        count: item._count.id
      })),
	bySubject: bySubject.map((subject: any) => ({
        name: subject.name,
        count: subject._count.questions
      }))
    };
  }

  @Get('questions')
  async getPYQQuestions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('year') year?: string,
    @Query('subjectId') subjectId?: string,
    @Query('lessonId') lessonId?: string,
    @Query('topicId') topicId?: string,
    @Query('subtopicId') subtopicId?: string,
    @Query('search') search?: string
  ) {
    const currentPage = parseInt(page || '1');
    const itemsPerPage = parseInt(limit || '10');
    const skip = (currentPage - 1) * itemsPerPage;

    // Build where clause
    const where: any = {
      isPreviousYear: true,
      createdById: null
    };

    if (year) where.yearAppeared = parseInt(year);
    if (subjectId) where.subjectId = subjectId;
    if (lessonId) where.lessonId = lessonId;
    if (topicId) where.topicId = topicId;
    if (subtopicId) where.subtopicId = subtopicId;

    // Add search functionality
    if (search) {
      where.OR = [
        { stem: { contains: search, mode: 'insensitive' } },
        { explanation: { contains: search, mode: 'insensitive' } },
        { subject: { name: { contains: search, mode: 'insensitive' } } },
        { subject: { stream: { name: { contains: search, mode: 'insensitive' } } } },
        { subject: { stream: { code: { contains: search, mode: 'insensitive' } } } },
        { lesson: { name: { contains: search, mode: 'insensitive' } } },
        { topic: { name: { contains: search, mode: 'insensitive' } } },
        { subtopic: { name: { contains: search, mode: 'insensitive' } } }
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
        subject: {
          select: {
            id: true,
            name: true,
            stream: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        lesson: {
          select: {
            id: true,
            name: true,
            subject: {
              select: {
                id: true,
                name: true,
                stream: {
                  select: {
                    id: true,
                    name: true,
                    code: true
                  }
                }
              }
            }
          }
        },
        topic: {
          select: {
            id: true,
            name: true,
            lesson: {
              select: {
                id: true,
                name: true,
                subject: {
                  select: {
                    id: true,
                    name: true,
                    stream: {
                      select: {
                        id: true,
                        name: true,
                        code: true
                      }
                    }
                  }
                }
              }
            },
            subject: {
              select: {
                id: true,
                name: true,
                stream: {
                  select: {
                    id: true,
                    name: true,
                    code: true
                  }
                }
              }
            }
          }
        },
        subtopic: {
          select: {
            id: true,
            name: true,
            topic: {
              select: {
                id: true,
                name: true,
                lesson: {
                  select: {
                    id: true,
                    name: true,
                    subject: {
                      select: {
                        id: true,
                        name: true,
                        stream: {
                          select: {
                            id: true,
                            name: true,
                            code: true
                          }
                        }
                      }
                    }
                  }
                },
                subject: {
                  select: {
                    id: true,
                    name: true,
                    stream: {
                      select: {
                        id: true,
                        name: true,
                        code: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
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

  @Get(':id')
  async getPYQQuestion(@Param('id') id: string) {
    const question = await this.prisma.question.findUnique({
      where: { 
        id,
        isPreviousYear: true
      },
      include: {
        options: {
          orderBy: { order: 'asc' }
        },
        tags: { 
          include: { tag: true } 
        },
        subject: {
          select: {
            id: true,
            name: true,
            stream: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        },
        topic: true,
        subtopic: true
      }
    });

    if (!question) {
      throw new Error('PYQ Question not found');
    }

    return question;
  }

  @Post('questions')
  async createPYQQuestion(@Body() body: {
    stem: string;
    explanation?: string;
    tip_formula?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    yearAppeared: number;
    subjectId?: string;
    topicId?: string;
    subtopicId?: string;
    options: { text: string; isCorrect?: boolean; order?: number }[];
    tagNames?: string[];
  }) {
    const question = await this.prisma.question.create({
      data: {
        stem: body.stem,
        explanation: body.explanation,
        tip_formula: body.tip_formula,
        difficulty: body.difficulty || 'MEDIUM',
        yearAppeared: body.yearAppeared,
        isPreviousYear: true,
        subjectId: body.subjectId,
        topicId: body.topicId,
        subtopicId: body.subtopicId,
        options: {
          create: body.options.map((option, index) => ({
            text: option.text,
            isCorrect: !!option.isCorrect,
            order: option.order ?? index
          }))
        }
      }
    });

    // Add tags
    if (body.tagNames?.length) {
      for (const name of body.tagNames) {
        const tag = await this.prisma.tag.upsert({
          where: { name },
          update: {},
          create: { name }
        });
        await this.prisma.questionTag.create({
          data: { questionId: question.id, tagId: tag.id }
        });
      }
    }

    return this.prisma.question.findUnique({
      where: { id: question.id },
      include: {
        options: true,
        tags: { include: { tag: true } },
        subject: true,
        topic: true,
        subtopic: true
      }
    });
  }

  @Put('questions/:id')
  async updatePYQQuestion(
    @Param('id') id: string,
    @Body() body: {
      stem?: string;
      explanation?: string;
      tip_formula?: string;
      difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
      yearAppeared?: number;
      subjectId?: string;
      topicId?: string;
      subtopicId?: string;
      options?: { id?: string; text: string; isCorrect?: boolean; order?: number }[];
      tagNames?: string[];
    }
  ) {
    await this.prisma.question.update({
      where: { id },
      data: {
        stem: body.stem,
        explanation: body.explanation,
        tip_formula: body.tip_formula,
        difficulty: body.difficulty,
        yearAppeared: body.yearAppeared,
        subjectId: body.subjectId,
        topicId: body.topicId,
        subtopicId: body.subtopicId,
      }
    });

    // Update options
    if (body.options) {
      await this.prisma.questionOption.deleteMany({ where: { questionId: id } });
      await this.prisma.questionOption.createMany({
        data: body.options.map((option, index) => ({
          questionId: id,
          text: option.text,
          isCorrect: !!option.isCorrect,
          order: option.order ?? index
        }))
      });
    }

    // Update tags
    if (body.tagNames) {
      await this.prisma.questionTag.deleteMany({ where: { questionId: id } });
      for (const name of body.tagNames) {
        const tag = await this.prisma.tag.upsert({
          where: { name },
          update: {},
          create: { name }
        });
        await this.prisma.questionTag.create({
          data: { questionId: id, tagId: tag.id }
        });
      }
    }

    return this.prisma.question.findUnique({
      where: { id },
      include: {
        options: true,
        tags: { include: { tag: true } },
        subject: true,
        topic: true,
        subtopic: true
      }
    });
  }

  @Delete('questions/:id')
  async deletePYQQuestion(@Param('id') id: string) {
    return this.prisma.question.delete({ where: { id } });
  }

  @Post('bulk-import')
  @UseInterceptors(FileInterceptor('file'))
  async bulkImportPYQ(@UploadedFile() file: Express.Multer.File) {
    // This would implement CSV/Excel import functionality
    // For now, return a placeholder
    return {
      message: 'Bulk import functionality will be implemented here',
      fileName: file?.originalname
    };
  }

  @Post('mark-as-pyq')
  async markQuestionsAsPYQ(@Body() body: { questionIds: string[]; yearAppeared: number }) {
    const result = await this.prisma.question.updateMany({
      where: {
        id: { in: body.questionIds }
      },
      data: {
        isPreviousYear: true,
        yearAppeared: body.yearAppeared
      }
    });

    return {
      message: `Marked ${result.count} questions as Previous Year Questions`,
      updatedCount: result.count
    };
  }

  @Post('remove-pyq-status')
  async removePYQStatus(@Body() body: { questionIds: string[] }) {
    const result = await this.prisma.question.updateMany({
      where: {
        id: { in: body.questionIds }
      },
      data: {
        isPreviousYear: false,
        yearAppeared: null
      }
    });

    return {
      message: `Removed PYQ status from ${result.count} questions`,
      updatedCount: result.count
    };
  }
} 