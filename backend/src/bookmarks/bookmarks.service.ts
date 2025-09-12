import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  async createBookmark(userId: string, questionId: string) {
    // Check if question exists
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        subject: true,
        topic: true,
        subtopic: true,
        options: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Check if bookmark already exists
    const existingBookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_questionId: {
          userId,
          questionId,
        },
      },
    });

    if (existingBookmark) {
      throw new ConflictException('Question is already bookmarked');
    }

    // Create bookmark
    const bookmark = await this.prisma.bookmark.create({
      data: {
        userId,
        questionId,
      },
      include: {
        question: {
          include: {
            subject: true,
            topic: true,
            subtopic: true,
            options: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
    });

    return bookmark;
  }

  async removeBookmark(userId: string, questionId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_questionId: {
          userId,
          questionId,
        },
      },
    });

    if (!bookmark) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.prisma.bookmark.delete({
      where: {
        userId_questionId: {
          userId,
          questionId,
        },
      },
    });

    return { message: 'Bookmark removed successfully' };
  }

  async getUserBookmarks(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      this.prisma.bookmark.findMany({
        where: { userId },
        include: {
          question: {
            include: {
              subject: true,
              topic: true,
              subtopic: true,
              options: true,
              tags: {
                include: {
                  tag: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.bookmark.count({
        where: { userId },
      }),
    ]);

    return {
      bookmarks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async isBookmarked(userId: string, questionId: string): Promise<boolean> {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_questionId: {
          userId,
          questionId,
        },
      },
    });

    return !!bookmark;
  }

  async getBookmarkStatus(userId: string, questionIds: string[]) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: {
        userId,
        questionId: {
          in: questionIds,
        },
      },
      select: {
        questionId: true,
      },
    });

    const bookmarkMap = new Map(
	bookmarks.map((bookmark: any) => [bookmark.questionId, true])
    );

    return questionIds.map((questionId) => ({
      questionId,
      isBookmarked: bookmarkMap.has(questionId),
    }));
  }

  async getBookmarksBySubject(userId: string, subjectId: string) {
    return this.prisma.bookmark.findMany({
      where: {
        userId,
        question: {
          subjectId,
        },
      },
      include: {
        question: {
          include: {
            subject: true,
            topic: true,
            subtopic: true,
            options: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBookmarksByTopic(userId: string, topicId: string) {
    return this.prisma.bookmark.findMany({
      where: {
        userId,
        question: {
          topicId,
        },
      },
      include: {
        question: {
          include: {
            subject: true,
            topic: true,
            subtopic: true,
            options: true,
            tags: {
              include: {
                tag: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
