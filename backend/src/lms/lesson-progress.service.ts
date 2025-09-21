import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BadgeType } from '@prisma/client';
import { MailerService } from '../auth/mailer.service';

export interface LessonProgressData {
  userId: string;
  lessonId: string;
  contentProgress?: {
    contentId: string;
    status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    progress: number;
    timeSpent?: number;
    score?: number;
  };
  topicProgress?: {
    topicId: string;
    completed: boolean;
  };
}

export interface LessonAnalytics {
  lessonId: string;
  totalStudents: number;
  completionRate: number;
  averageScore: number;
  averageTimeSpent: number;
  difficultyAnalysis: {
    easy: number;
    medium: number;
    hard: number;
  };
  progressDistribution: {
    notStarted: number;
    inProgress: number;
    completed: number;
  };
  badgeDistribution: Record<BadgeType, number>;
}

export interface BadgeCriteria {
  type: BadgeType;
  title: string;
  description: string;
  iconUrl?: string;
  condition: (progress: any) => boolean;
}

@Injectable()
export class LessonProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService
  ) {}

  // Badge criteria definitions
  private badgeCriteria: BadgeCriteria[] = [
    {
      type: 'COMPLETION',
      title: 'Lesson Master',
      description: 'Completed the entire lesson',
      iconUrl: '/badges/completion.svg',
      condition: (progress) => progress.status === 'COMPLETED'
    },
    {
      type: 'SPEED_DEMON',
      title: 'Speed Demon',
      description: 'Completed lesson in record time',
      iconUrl: '/badges/speed.svg',
      condition: (progress) => {
        const avgTimePerContent = progress.timeSpent / progress.totalContent;
        return progress.status === 'COMPLETED' && avgTimePerContent < 300; // Less than 5 min per content
      }
    },
    {
      type: 'PERFECT_SCORE',
      title: 'Perfect Score',
      description: 'Achieved 100% score in all assessments',
      iconUrl: '/badges/perfect.svg',
      condition: (progress) => progress.averageScore === 100 && progress.attempts > 0
    },
    {
      type: 'PERSEVERANCE',
      title: 'Perseverance',
      description: 'Completed lesson after multiple attempts',
      iconUrl: '/badges/perseverance.svg',
      condition: (progress) => progress.status === 'COMPLETED' && progress.attempts >= 5
    },
    {
      type: 'EARLY_BIRD',
      title: 'Early Bird',
      description: 'Started lesson early in the day',
      iconUrl: '/badges/early-bird.svg',
      condition: (progress) => {
        if (!progress.startedAt) return false;
        const hour = new Date(progress.startedAt).getHours();
        return hour >= 5 && hour <= 8;
      }
    },
    {
      type: 'NIGHT_OWL',
      title: 'Night Owl',
      description: 'Completed lesson late at night',
      iconUrl: '/badges/night-owl.svg',
      condition: (progress) => {
        if (!progress.completedAt) return false;
        const hour = new Date(progress.completedAt).getHours();
        return hour >= 22 || hour <= 2;
      }
    },
    {
      type: 'STREAK_MASTER',
      title: 'Streak Master',
      description: 'Completed lessons on consecutive days',
      iconUrl: '/badges/streak.svg',
      condition: (progress) => {
        // This would need to check user's lesson completion streak
        return progress.status === 'COMPLETED';
      }
    },
    {
      type: 'TOP_PERFORMER',
      title: 'Top Performer',
      description: 'Scored above 90% average',
      iconUrl: '/badges/top-performer.svg',
      condition: (progress) => (progress.averageScore || 0) >= 90
    },
    {
      type: 'CONTENT_EXPLORER',
      title: 'Content Explorer',
      description: 'Accessed all content in the lesson',
      iconUrl: '/badges/explorer.svg',
      condition: (progress) => progress.contentCompleted === progress.totalContent && progress.totalContent > 0
    },
    {
      type: 'QUIZ_MASTER',
      title: 'Quiz Master',
      description: 'Completed all quizzes with high scores',
      iconUrl: '/badges/quiz-master.svg',
      condition: (progress) => {
        return progress.averageScore >= 85 && progress.attempts > 0;
      }
    }
  ];

  async initializeLessonProgress(userId: string, lessonId: string) {
    // Get lesson details to set initial values
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        topics: true,
        lmsContent: true,
        _count: {
          select: {
            topics: true,
            lmsContent: true
          }
        }
      }
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Check if progress already exists
    const existingProgress = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      include: {
        badges: true
      }
    });

    if (existingProgress) {
      return existingProgress;
    }

    // Create new progress record
    const progress = await this.prisma.lessonProgress.create({
      data: {
        userId,
        lessonId,
        totalContent: lesson._count.lmsContent,
        totalTopics: lesson._count.topics,
        startedAt: new Date(),
        lastAccessedAt: new Date()
      },
      include: {
        badges: true
      }
    });
    
    return progress;
  }

  async updateLessonProgress(data: LessonProgressData) {
    const { userId, lessonId, contentProgress, topicProgress } = data;

    // Get current progress
    let progress = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      include: { badges: true }
    });

    if (!progress) {
      progress = await this.initializeLessonProgress(userId, lessonId);
    }

    // Update based on content progress
    if (contentProgress) {
      const updateData: any = {
        lastAccessedAt: new Date(),
        attempts: { increment: 1 }
      };

      // Update content progress
      if (contentProgress.status === 'COMPLETED') {
        updateData.contentCompleted = { increment: 1 };
      }

      // Update time spent
      if (contentProgress.timeSpent) {
        updateData.timeSpent = { increment: contentProgress.timeSpent };
      }

      // Update average score
      if (contentProgress.score !== undefined) {
        const currentTotal = (progress?.averageScore || 0) * (progress?.attempts || 0);
        const newAverage = (currentTotal + contentProgress.score) / ((progress?.attempts || 0) + 1);
        updateData.averageScore = newAverage;
      }

      progress = await this.prisma.lessonProgress.update({
        where: { userId_lessonId: { userId, lessonId } },
        data: updateData,
        include: { badges: true }
      });
    }

    // Update based on topic progress
    if (topicProgress && topicProgress.completed) {
      progress = await this.prisma.lessonProgress.update({
        where: { userId_lessonId: { userId, lessonId } },
        data: { topicsCompleted: { increment: 1 } },
        include: { badges: true }
      });
    }

    // Calculate overall progress
    const overallProgress = this.calculateOverallProgress(progress);
    
    // Update overall progress and status
    const updatedProgress = await this.prisma.lessonProgress.update({
      where: { userId_lessonId: { userId, lessonId } },
      data: {
        progress: overallProgress,
        status: overallProgress === 100 ? 'COMPLETED' : 
                overallProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
        completedAt: overallProgress === 100 ? new Date() : progress?.completedAt
      },
      include: { badges: true }
    });

    // Check and award badges
    await this.checkAndAwardBadges(userId, lessonId, updatedProgress);

    return updatedProgress;
  }

  private calculateOverallProgress(progress: any): number {
    const contentProgress = progress.totalContent > 0 ? 
      (progress.contentCompleted / progress.totalContent) * 60 : 0;
    
    const topicProgress = progress.totalTopics > 0 ? 
      (progress.topicsCompleted / progress.totalTopics) * 40 : 0;

    return Math.min(100, contentProgress + topicProgress);
  }

  async checkAndAwardBadges(userId: string, lessonId: string, progress: any) {
    const earnedBadges = [];

    for (const criteria of this.badgeCriteria) {
      // Check if user already has this badge
      const existingBadge = await this.prisma.lessonBadge.findUnique({
        where: {
          userId_lessonId_badgeType: {
            userId,
            lessonId,
            badgeType: criteria.type
          }
        }
      });

      if (existingBadge) continue;

      // Check if criteria is met
      if (criteria.condition(progress)) {
        const badge = await this.prisma.lessonBadge.create({
          data: {
            userId,
            lessonId,
            badgeType: criteria.type,
            title: criteria.title,
            description: criteria.description,
            iconUrl: criteria.iconUrl,
            metadata: {
              earnedAt: new Date().toISOString(),
              lessonProgress: progress.progress,
              averageScore: progress.averageScore
            }
          }
        });

        earnedBadges.push(badge);

        // Send email notification for the new badge
        await this.sendBadgeNotificationEmail(userId, badge, progress);
      }
    }

    return earnedBadges;
  }

  private async sendBadgeNotificationEmail(userId: string, badge: any, progress: any) {
    try {
      // Get user details
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, fullName: true }
      });

      if (!user || !user.email) {
        console.log(`[LessonProgressService] User ${userId} has no email, skipping badge notification`);
        return;
      }

      // Get lesson details
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: progress.lessonId },
        include: {
          subject: {
            include: {
              stream: true
            }
          }
        }
      });

      if (!lesson) {
        console.log(`[LessonProgressService] Lesson ${progress.lessonId} not found, skipping badge notification`);
        return;
      }

      // Send email notification
      await this.mailerService.sendBadgeAchievementEmail(user.email, {
        userName: user.fullName || 'Student',
        badgeTitle: badge.title,
        badgeDescription: badge.description || '',
        badgeType: badge.badgeType,
        lessonName: lesson.name,
        subjectName: lesson.subject.name,
        earnedAt: badge.earnedAt
      });

      console.log(`[LessonProgressService] Badge notification email sent to ${user.email} for badge: ${badge.title}`);
    } catch (error) {
      console.error(`[LessonProgressService] Failed to send badge notification email:`, error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  async getLessonProgress(userId: string, lessonId: string) {
    const progress = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
      include: {
        lesson: {
          include: {
            subject: true,
            topics: true,
            lmsContent: true
          }
        },
        badges: true,
        user: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true
          }
        }
      }
    });

    if (!progress) {
      return await this.initializeLessonProgress(userId, lessonId);
    }

    return progress;
  }

  async getUserLessonProgress(userId: string, subjectId?: string) {
    const where: any = { userId };
    
    if (subjectId) {
      where.lesson = { subjectId };
    }

    return this.prisma.lessonProgress.findMany({
      where,
      include: {
        lesson: {
          include: {
            subject: true,
            topics: true,
            _count: {
              select: {
                topics: true,
                lmsContent: true,
                questions: true
              }
            }
          }
        },
        badges: true
      },
      orderBy: { lastAccessedAt: 'desc' }
    });
  }

  async getLessonAnalytics(lessonId: string): Promise<LessonAnalytics> {
    // Get all progress records for this lesson
    const progressRecords = await this.prisma.lessonProgress.findMany({
      where: { lessonId },
      include: { badges: true }
    });

    const totalStudents = progressRecords.length;
    const completedStudents = progressRecords.filter(p => p.status === 'COMPLETED').length;
    const completionRate = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0;

    const averageScore = progressRecords
      .filter(p => p.averageScore !== null)
      .reduce((sum, p) => sum + (p.averageScore || 0), 0) / 
      Math.max(1, progressRecords.filter(p => p.averageScore !== null).length);

    const averageTimeSpent = progressRecords
      .reduce((sum, p) => sum + p.timeSpent, 0) / Math.max(1, totalStudents);

    // Difficulty analysis based on average scores
    const difficultyAnalysis = {
      easy: progressRecords.filter(p => (p.averageScore || 0) >= 80).length,
      medium: progressRecords.filter(p => (p.averageScore || 0) >= 60 && (p.averageScore || 0) < 80).length,
      hard: progressRecords.filter(p => (p.averageScore || 0) < 60).length
    };

    // Progress distribution
    const progressDistribution = {
      notStarted: progressRecords.filter(p => p.status === 'NOT_STARTED').length,
      inProgress: progressRecords.filter(p => p.status === 'IN_PROGRESS').length,
      completed: progressRecords.filter(p => p.status === 'COMPLETED').length
    };

    // Badge distribution
    const badgeDistribution: Record<BadgeType, number> = {
      COMPLETION: 0,
      SPEED_DEMON: 0,
      PERFECT_SCORE: 0,
      PERSEVERANCE: 0,
      EARLY_BIRD: 0,
      NIGHT_OWL: 0,
      STREAK_MASTER: 0,
      TOP_PERFORMER: 0,
      CONTENT_EXPLORER: 0,
      QUIZ_MASTER: 0
    };

    progressRecords.forEach(progress => {
      progress.badges.forEach(badge => {
        badgeDistribution[badge.badgeType]++;
      });
    });

    return {
      lessonId,
      totalStudents,
      completionRate,
      averageScore,
      averageTimeSpent,
      difficultyAnalysis,
      progressDistribution,
      badgeDistribution
    };
  }

  async getSubjectAnalytics(subjectId: string) {
    const lessons = await this.prisma.lesson.findMany({
      where: { subjectId },
      include: {
        progress: {
          include: { badges: true }
        },
        _count: {
          select: {
            progress: true,
            topics: true,
            lmsContent: true,
            questions: true
          }
        }
      }
    });

    const lessonAnalytics = await Promise.all(
      lessons.map(lesson => this.getLessonAnalytics(lesson.id))
    );

    const subjectStats = {
      totalLessons: lessons.length,
      totalStudents: lessonAnalytics.reduce((sum, analytics) => sum + analytics.totalStudents, 0),
      averageCompletionRate: lessonAnalytics.reduce((sum, analytics) => sum + analytics.completionRate, 0) / Math.max(1, lessons.length),
      averageScore: lessonAnalytics.reduce((sum, analytics) => sum + analytics.averageScore, 0) / Math.max(1, lessons.length),
      totalBadgesEarned: lessonAnalytics.reduce((sum, analytics) => 
        sum + Object.values(analytics.badgeDistribution).reduce((badgeSum, count) => badgeSum + count, 0), 0)
    };

    return {
      subjectId,
      lessons: lessonAnalytics,
      subjectStats
    };
  }

  async getTopPerformers(lessonId: string, limit = 10) {
    return this.prisma.lessonProgress.findMany({
      where: { 
        lessonId,
        status: 'COMPLETED'
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true
          }
        },
        badges: true
      },
      orderBy: [
        { averageScore: 'desc' },
        { completedAt: 'asc' }
      ],
      take: limit
    });
  }

  async getUserBadges(userId: string) {
    return this.prisma.lessonBadge.findMany({
      where: { userId },
      include: {
        lessonProgress: {
          include: {
            lesson: {
              include: {
                subject: true
              }
            }
          }
        }
      },
      orderBy: { earnedAt: 'desc' }
    });
  }

  async getLeaderboard(subjectId?: string, limit = 50) {
    const where: any = { status: 'COMPLETED' };
    
    if (subjectId) {
      where.lesson = { subjectId };
    }

    return this.prisma.lessonProgress.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profilePicture: true
          }
        },
        lesson: {
          include: {
            subject: true
          }
        },
        badges: true
      },
      orderBy: [
        { averageScore: 'desc' },
        { completedAt: 'asc' }
      ],
      take: limit
    });
  }
}
