import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PracticeService {
  constructor(private prisma: PrismaService) {}

  async getContentTree(userId: string) {
    // Get user's stream to scope content
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streamId: true }
    });

    // Single optimized query to get the entire content tree with progress data
    const subjects = await this.prisma.subject.findMany({
      where: user?.streamId ? { streamId: user.streamId } : undefined,
      include: {
        lessons: {
          include: {
            topics: {
              include: {
                subtopics: {
                  include: {
                    _count: {
                      select: { questions: true }
                    }
                  }
                },
                _count: {
                  select: { questions: true }
                }
              }
            },
            _count: {
              select: { questions: true }
            }
          }
        },
        _count: {
          select: { questions: true }
        }
      }
    });

    // Get user's practice progress for all content
    const userProgress = await this.prisma.practiceProgress.findMany({
      where: { userId },
      select: {
        contentType: true,
        contentId: true,
        completedQuestions: true,
        totalQuestions: true
      }
    });

    // Create a map for quick progress lookup
    const progressMap = new Map();
    userProgress.forEach(progress => {
      progressMap.set(`${progress.contentType}-${progress.contentId}`, progress);
    });

    // Transform the data into the tree structure
    return subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      type: 'subject',
      questionCount: subject._count.questions,
      completedCount: 0, // Subjects don't have direct progress
      isExpanded: false,
      isSelected: false,
      children: subject.lessons.map(lesson => {
        const lessonProgress = progressMap.get(`lesson-${lesson.id}`);
        return {
          id: lesson.id,
          name: lesson.name,
          type: 'lesson',
          questionCount: lesson._count.questions,
          completedCount: lessonProgress?.completedQuestions || 0,
          isExpanded: false,
          isSelected: false,
          parentId: subject.id,
          children: lesson.topics.map(topic => {
            const topicProgress = progressMap.get(`topic-${topic.id}`);
            return {
              id: topic.id,
              name: topic.name,
              type: 'topic',
              questionCount: topic._count.questions,
              completedCount: topicProgress?.completedQuestions || 0,
              isExpanded: false,
              isSelected: false,
              parentId: lesson.id,
              children: topic.subtopics.map(subtopic => {
                const subtopicProgress = progressMap.get(`subtopic-${subtopic.id}`);
                return {
                  id: subtopic.id,
                  name: subtopic.name,
                  type: 'subtopic',
                  questionCount: subtopic._count.questions,
                  completedCount: subtopicProgress?.completedQuestions || 0,
                  isExpanded: false,
                  isSelected: false,
                  parentId: topic.id,
                  children: []
                };
              })
            };
          })
        };
      })
    }));
  }

  async getContentQuestions(contentType: string, contentId: string, userId: string) {
    // Validate content type
    if (!['lesson', 'topic', 'subtopic'].includes(contentType)) {
      throw new NotFoundException('Invalid content type');
    }

    // Build where clause based on content type
    const whereClause: any = {};
    if (contentType === 'lesson') {
      whereClause.lessonId = contentId;
    } else if (contentType === 'topic') {
      whereClause.topicId = contentId;
    } else if (contentType === 'subtopic') {
      whereClause.subtopicId = contentId;
    }

    // Get questions
    const questions = await this.prisma.question.findMany({
      where: {
        ...whereClause,
        status: 'approved', // Only approved questions
      },
      include: {
        options: {
          orderBy: { order: 'asc' }
        },
        subQuestions: {
          include: {
            options: {
              orderBy: { order: 'asc' }
            }
          }
        }
      },
      orderBy: [
        { difficulty: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    return questions;
  }

  async startPracticeProgress(
    data: {
      contentType: 'lesson' | 'topic' | 'subtopic';
      contentId: string;
      totalQuestions: number;
    },
    userId: string
  ) {
    // Check if progress already exists
    const existingProgress = await this.prisma.practiceProgress.findUnique({
      where: {
        userId_contentType_contentId: {
          userId,
          contentType: data.contentType,
          contentId: data.contentId
        }
      }
    });

    if (existingProgress) {
      // Update last accessed time
      return this.prisma.practiceProgress.update({
        where: { id: existingProgress.id },
        data: { lastAccessedAt: new Date() }
      });
    }

    // Create new progress
    return this.prisma.practiceProgress.create({
      data: {
        userId,
        contentType: data.contentType,
        contentId: data.contentId,
        totalQuestions: data.totalQuestions,
        visitedQuestions: [],
        lastAccessedAt: new Date()
      }
    });
  }

  async getPracticeProgress(contentType: string, contentId: string, userId: string) {
    const progress = await this.prisma.practiceProgress.findUnique({
      where: {
        userId_contentType_contentId: {
          userId,
          contentType: contentType as 'lesson' | 'topic' | 'subtopic',
          contentId
        }
      },
      include: {
        sessions: {
          include: {
            question: {
              include: {
                options: {
                  orderBy: { order: 'asc' }
                }
              }
            }
          }
        }
      }
    });

    return progress;
  }

  async updatePracticeProgress(
    progressId: string,
    data: {
      currentQuestionIndex: number;
      completedQuestions: number;
      visitedQuestions: string[];
      isCompleted?: boolean;
    },
    userId: string
  ) {
    // Verify ownership
    const progress = await this.prisma.practiceProgress.findFirst({
      where: { id: progressId, userId }
    });

    if (!progress) {
      throw new ForbiddenException('Practice progress not found or access denied');
    }

    return this.prisma.practiceProgress.update({
      where: { id: progressId },
      data: {
        ...data,
        lastAccessedAt: new Date()
      }
    });
  }

  async createPracticeSession(
    data: {
      progressId: string;
      questionId: string;
      userAnswer?: any;
      isCorrect?: boolean;
      timeSpent?: number;
      isChecked?: boolean;
    },
    userId: string
  ) {
    // Verify progress ownership
    const progress = await this.prisma.practiceProgress.findFirst({
      where: { id: data.progressId, userId }
    });

    if (!progress) {
      throw new ForbiddenException('Practice progress not found or access denied');
    }

    // Check if session already exists
    const existingSession = await this.prisma.practiceQuestionSession.findFirst({
      where: {
        progressId: data.progressId,
        questionId: data.questionId
      }
    });

    if (existingSession) {
      return this.updatePracticeSession(existingSession.id, {
        userAnswer: data.userAnswer,
        isCorrect: data.isCorrect,
        timeSpent: data.timeSpent,
        isChecked: data.isChecked
      }, userId);
    }

    return this.prisma.practiceQuestionSession.create({
      data: {
        progressId: data.progressId,
        questionId: data.questionId,
        userAnswer: data.userAnswer,
        isCorrect: data.isCorrect,
        timeSpent: data.timeSpent || 0,
        isChecked: data.isChecked || false
      }
    });
  }

  async updatePracticeSession(
    sessionId: string,
    data: {
      userAnswer?: any;
      isCorrect?: boolean;
      timeSpent?: number;
      isChecked?: boolean;
    },
    userId: string
  ) {
    // Verify session ownership through progress
    const session = await this.prisma.practiceQuestionSession.findFirst({
      where: {
        id: sessionId,
        progress: { userId }
      }
    });

    if (!session) {
      throw new ForbiddenException('Practice session not found or access denied');
    }

    return this.prisma.practiceQuestionSession.update({
      where: { id: sessionId },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
  }

  async getPracticeHistory(userId: string) {
    const progressList = await this.prisma.practiceProgress.findMany({
      where: { userId },
      orderBy: { lastAccessedAt: 'desc' },
      include: {
        sessions: {
          include: {
            question: {
              select: {
                id: true,
                stem: true,
                difficulty: true
              }
            }
          }
        }
      }
    });

    return progressList;
  }

  async deletePracticeProgress(progressId: string, userId: string) {
    // Verify ownership
    const progress = await this.prisma.practiceProgress.findFirst({
      where: { id: progressId, userId }
    });

    if (!progress) {
      throw new ForbiddenException('Practice progress not found or access denied');
    }

    // Delete progress (sessions will be deleted due to cascade)
    return this.prisma.practiceProgress.delete({
      where: { id: progressId }
    });
  }

  async getContentStats(contentType: string, contentId: string, userId: string) {
    const progress = await this.getPracticeProgress(contentType, contentId, userId);
    
    if (!progress) {
      return {
        totalQuestions: 0,
        completedQuestions: 0,
        accuracy: 0,
        timeSpent: 0,
        lastAccessed: null
      };
    }

    // Calculate accuracy
    const totalAttempts = progress.sessions.length;
    const correctAttempts = progress.sessions.filter(s => s.isCorrect).length;
    const accuracy = totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

    // Calculate total time spent
    const timeSpent = progress.sessions.reduce((total, session) => total + session.timeSpent, 0);

    return {
      totalQuestions: progress.totalQuestions,
      completedQuestions: progress.completedQuestions,
      accuracy: Math.round(accuracy * 100) / 100,
      timeSpent,
      lastAccessed: progress.lastAccessedAt
    };
  }
}
