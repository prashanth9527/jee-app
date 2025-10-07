import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalLessons: number;
  totalContent: number;
  totalQuestions: number;
  totalBadgesEarned: number;
  activeUsers: number;
  completionRate: number;
  // Additional stats for comprehensive dashboard
  totalSubjects: number;
  totalTopics: number;
  totalSubtopics: number;
  totalTags: number;
  totalExamPapers: number;
  totalSubmissions: number;
  activeSubscriptions: number;
  totalPlans: number;
  // Growth metrics
  userGrowthPercentage: number;
  questionGrowthPercentage: number;
  submissionGrowthPercentage: number;
  subscriptionGrowthPercentage: number;
}

export interface UserGrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
}

export interface LessonAnalyticsData {
  lessonId: string;
  lessonName: string;
  subjectName: string;
  totalStudents: number;
  completionRate: number;
  averageScore: number;
  averageTimeSpent: number;
  badgesEarned: number;
}

export interface SubjectPerformanceData {
  subjectId: string;
  subjectName: string;
  totalLessons: number;
  totalStudents: number;
  averageCompletionRate: number;
  averageScore: number;
  totalBadgesEarned: number;
}

export interface BadgeAnalyticsData {
  badgeType: string;
  badgeTitle: string;
  totalEarned: number;
  percentageOfUsers: number;
  recentEarnings: number; // Last 7 days
}

export interface TopPerformersData {
  userId: string;
  userName: string;
  totalBadges: number;
  averageScore: number;
  completedLessons: number;
  profilePicture?: string;
}

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(): Promise<DashboardStats> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalStudents,
      totalLessons,
      totalContent,
      totalQuestions,
      totalBadgesEarned,
      activeUsers,
      lessonProgressData,
      totalSubjects,
      totalTopics,
      totalSubtopics,
      totalTags,
      totalExamPapers,
      totalSubmissions,
      activeSubscriptions,
      totalPlans,
      // Growth data
      usersLastMonth,
      questionsLastMonth,
      submissionsLastMonth,
      subscriptionsLastMonth,
      usersPreviousMonth,
      questionsPreviousMonth,
      submissionsPreviousMonth,
      subscriptionsPreviousMonth
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'STUDENT' } }),
      this.prisma.lesson.count(),
      this.prisma.lMSContent.count(),
      this.prisma.question.count(),
      this.prisma.lessonBadge.count(),
      this.prisma.user.count({ 
        where: { 
          // lastLoginAt: { 
          //   gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          // } 
        } 
      }),
      this.prisma.lessonProgress.findMany({
        select: { status: true }
      }),
      this.prisma.subject.count(),
      this.prisma.topic.count(),
      this.prisma.subtopic.count(),
      this.prisma.tag.count(),
      this.prisma.examPaper.count(),
      this.prisma.examSubmission.count(),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
      this.prisma.plan.count(),
      // Growth data - last 30 days
      this.prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.question.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      this.prisma.examSubmission.count({ where: { startedAt: { gte: thirtyDaysAgo } } }),
      this.prisma.subscription.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      // Growth data - previous 30 days
      this.prisma.user.count({ 
        where: { 
          createdAt: { 
            gte: sixtyDaysAgo, 
            lt: thirtyDaysAgo 
          } 
        } 
      }),
      this.prisma.question.count({ 
        where: { 
          createdAt: { 
            gte: sixtyDaysAgo, 
            lt: thirtyDaysAgo 
          } 
        } 
      }),
      this.prisma.examSubmission.count({ 
        where: { 
          startedAt: { 
            gte: sixtyDaysAgo, 
            lt: thirtyDaysAgo 
          } 
        } 
      }),
      this.prisma.subscription.count({ 
        where: { 
          createdAt: { 
            gte: sixtyDaysAgo, 
            lt: thirtyDaysAgo 
          } 
        } 
      })
    ]);

    const totalProgressRecords = lessonProgressData.length;
    const completedRecords = lessonProgressData.filter(p => p.status === 'COMPLETED').length;
    const completionRate = totalProgressRecords > 0 ? (completedRecords / totalProgressRecords) * 100 : 0;

    // Calculate growth percentages
    const userGrowthPercentage = usersPreviousMonth > 0 ? 
      Math.round(((usersLastMonth - usersPreviousMonth) / usersPreviousMonth) * 100) : 0;
    const questionGrowthPercentage = questionsPreviousMonth > 0 ? 
      Math.round(((questionsLastMonth - questionsPreviousMonth) / questionsPreviousMonth) * 100) : 0;
    const submissionGrowthPercentage = submissionsPreviousMonth > 0 ? 
      Math.round(((submissionsLastMonth - submissionsPreviousMonth) / submissionsPreviousMonth) * 100) : 0;
    const subscriptionGrowthPercentage = subscriptionsPreviousMonth > 0 ? 
      Math.round(((subscriptionsLastMonth - subscriptionsPreviousMonth) / subscriptionsPreviousMonth) * 100) : 0;

    return {
      totalUsers,
      totalStudents,
      totalLessons,
      totalContent,
      totalQuestions,
      totalBadgesEarned,
      activeUsers,
      completionRate: Math.round(completionRate * 100) / 100,
      totalSubjects,
      totalTopics,
      totalSubtopics,
      totalTags,
      totalExamPapers,
      totalSubmissions,
      activeSubscriptions,
      totalPlans,
      userGrowthPercentage,
      questionGrowthPercentage,
      submissionGrowthPercentage,
      subscriptionGrowthPercentage
    };
  }

  async getUserGrowthData(days: number = 30): Promise<UserGrowthData[]> {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const users = await this.prisma.user.findMany({
      where: {
        createdAt: { gte: startDate }
      },
      select: {
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    const dataMap = new Map<string, { newUsers: number; totalUsers: number }>();
    
    // Initialize all dates
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      dataMap.set(dateStr, { newUsers: 0, totalUsers: 0 });
    }

    // Count users by date
    users.forEach(user => {
      const dateStr = user.createdAt.toISOString().split('T')[0];
      const existing = dataMap.get(dateStr);
      if (existing) {
        existing.newUsers++;
      }
    });

    // Calculate cumulative totals
    let runningTotal = await this.prisma.user.count({
      where: { createdAt: { lt: startDate } }
    });

    const result: UserGrowthData[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const data = dataMap.get(dateStr)!;
      
      runningTotal += data.newUsers;
      result.push({
        date: dateStr,
        newUsers: data.newUsers,
        totalUsers: runningTotal
      });
    }

    return result;
  }

  async getLessonAnalytics(): Promise<LessonAnalyticsData[]> {
    const lessons = await this.prisma.lesson.findMany({
      include: {
        subject: true,
        progress: {
          include: {
            badges: true
          }
        },
        _count: {
          select: {
            topics: true,
            lmsContent: true,
            questions: true
          }
        }
      }
    });

    return lessons.map(lesson => {
      const progressRecords = lesson.progress;
      const totalStudents = progressRecords.length;
      const completedStudents = progressRecords.filter(p => p.status === 'COMPLETED').length;
      const completionRate = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0;
      
      const scores = progressRecords
        .filter(p => p.averageScore !== null)
        .map(p => p.averageScore!);
      const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      
      const timeSpent = progressRecords
        .map(p => p.timeSpent)
        .reduce((sum, time) => sum + time, 0);
      const averageTimeSpent = totalStudents > 0 ? timeSpent / totalStudents : 0;
      
      const badgesEarned = progressRecords.reduce((sum, progress) => sum + progress.badges.length, 0);

      return {
        lessonId: lesson.id,
        lessonName: lesson.name,
        subjectName: lesson.subject.name,
        totalStudents,
        completionRate: Math.round(completionRate * 100) / 100,
        averageScore: Math.round(averageScore * 100) / 100,
        averageTimeSpent: Math.round(averageTimeSpent),
        badgesEarned
      };
    });
  }

  async getSubjectPerformanceData(): Promise<SubjectPerformanceData[]> {
    const subjects = await this.prisma.subject.findMany({
      include: {
        lessons: {
          include: {
            progress: {
              include: {
                badges: true
              }
            },
            _count: {
              select: {
                topics: true,
                lmsContent: true,
                questions: true
              }
            }
          }
        }
      }
    });

    return subjects.map(subject => {
      const lessons = subject.lessons;
      const totalLessons = lessons.length;
      
      const allProgress = lessons.flatMap(lesson => lesson.progress);
      const totalStudents = new Set(allProgress.map(p => p.userId)).size;
      
      const completedProgress = allProgress.filter(p => p.status === 'COMPLETED');
      const completionRate = allProgress.length > 0 ? (completedProgress.length / allProgress.length) * 100 : 0;
      
      const scores = allProgress
        .filter(p => p.averageScore !== null)
        .map(p => p.averageScore!);
      const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      
      const totalBadgesEarned = allProgress.reduce((sum, progress) => sum + progress.badges.length, 0);

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        totalLessons,
        totalStudents,
        averageCompletionRate: Math.round(completionRate * 100) / 100,
        averageScore: Math.round(averageScore * 100) / 100,
        totalBadgesEarned
      };
    });
  }

  async getBadgeAnalytics(): Promise<BadgeAnalyticsData[]> {
    const badgeStats = await this.prisma.lessonBadge.groupBy({
      by: ['badgeType'],
      _count: {
        id: true
      }
    });

    const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const totalStudents = await this.prisma.user.count({ where: { role: 'STUDENT' } });

    const badgeTitles: Record<string, string> = {
      COMPLETION: 'Lesson Master',
      SPEED_DEMON: 'Speed Demon',
      PERFECT_SCORE: 'Perfect Score',
      PERSEVERANCE: 'Perseverance',
      EARLY_BIRD: 'Early Bird',
      NIGHT_OWL: 'Night Owl',
      STREAK_MASTER: 'Streak Master',
      TOP_PERFORMER: 'Top Performer',
      CONTENT_EXPLORER: 'Content Explorer',
      QUIZ_MASTER: 'Quiz Master'
    };

    const results = await Promise.all(
      badgeStats.map(async (stat) => {
        const recentEarnings = await this.prisma.lessonBadge.count({
          where: {
            badgeType: stat.badgeType,
            earnedAt: { gte: recentDate }
          }
        });

        return {
          badgeType: stat.badgeType,
          badgeTitle: badgeTitles[stat.badgeType] || stat.badgeType,
          totalEarned: stat._count.id,
          percentageOfUsers: totalStudents > 0 ? Math.round((stat._count.id / totalStudents) * 100 * 100) / 100 : 0,
          recentEarnings
        };
      })
    );

    return results.sort((a, b) => b.totalEarned - a.totalEarned);
  }

  async getTopPerformers(limit: number = 10): Promise<TopPerformersData[]> {
    const topPerformers = await this.prisma.lessonProgress.findMany({
      where: {
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
        badges: true,
        lesson: true
      },
      orderBy: [
        { averageScore: 'desc' },
        { completedAt: 'asc' }
      ]
    });

    // Group by user and calculate aggregated stats
    const userStats = new Map<string, {
      userId: string;
      userName: string;
      profilePicture?: string;
      totalBadges: number;
      totalScore: number;
      scoreCount: number;
      completedLessons: number;
    }>();

    topPerformers.forEach(progress => {
      const userId = progress.userId;
      const existing = userStats.get(userId);
      
      if (existing) {
        existing.totalBadges += progress.badges.length;
        existing.completedLessons++;
        if (progress.averageScore) {
          existing.totalScore += progress.averageScore;
          existing.scoreCount++;
        }
      } else {
        userStats.set(userId, {
          userId: progress.user.id,
          userName: progress.user.fullName || 'Unknown',
          profilePicture: progress.user.profilePicture || undefined,
          totalBadges: progress.badges.length,
          totalScore: progress.averageScore || 0,
          scoreCount: progress.averageScore ? 1 : 0,
          completedLessons: 1
        });
      }
    });

    return Array.from(userStats.values())
      .map(user => ({
        userId: user.userId,
        userName: user.userName,
        profilePicture: user.profilePicture,
        totalBadges: user.totalBadges,
        averageScore: user.scoreCount > 0 ? Math.round((user.totalScore / user.scoreCount) * 100) / 100 : 0,
        completedLessons: user.completedLessons
      }))
      .sort((a, b) => b.totalBadges - a.totalBadges || b.averageScore - a.averageScore)
      .slice(0, limit);
  }

  async getEngagementMetrics() {
    const [
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      averageSessionTime,
      totalSessions
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          // lastLoginAt: {
          //   gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          // }
        }
      }),
      this.prisma.user.count({
        where: {
          // lastLoginAt: {
          //   gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          // }
        }
      }),
      this.prisma.user.count({
        where: {
          // lastLoginAt: {
          //   gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          // }
        }
      }),
      this.prisma.lessonProgress.aggregate({
        _avg: {
          timeSpent: true
        }
      }),
      this.prisma.lessonProgress.count()
    ]);

    return {
      dailyActiveUsers,
      weeklyActiveUsers,
      monthlyActiveUsers,
      averageSessionTime: Math.round(averageSessionTime._avg.timeSpent || 0),
      totalSessions
    };
  }

  async getContentPerformanceMetrics() {
    const [
      contentStats,
      lessonStats,
      questionStats
    ] = await Promise.all([
      this.prisma.lMSContent.aggregate({
        _avg: {
          views: true,
          completions: true
        },
        _sum: {
          views: true,
          completions: true
        }
      }),
      this.prisma.lessonProgress.aggregate({
        _avg: {
          progress: true,
          averageScore: true
        }
      }),
      this.prisma.question.groupBy({
        by: ['difficulty'],
        _count: {
          id: true
        }
      })
    ]);

    return {
      content: {
        averageViews: Math.round(contentStats._avg.views || 0),
        averageCompletions: Math.round(contentStats._avg.completions || 0),
        totalViews: contentStats._sum.views || 0,
        totalCompletions: contentStats._sum.completions || 0
      },
      lessons: {
        averageProgress: Math.round((lessonStats._avg.progress || 0) * 100) / 100,
        averageScore: Math.round((lessonStats._avg.averageScore || 0) * 100) / 100
      },
      questions: {
        byDifficulty: questionStats.map(stat => ({
          difficulty: stat.difficulty,
          count: stat._count.id
        }))
      }
    };
  }

  async getRecentActivities() {
    const [
      recentQuestions,
      recentSubmissions,
      recentSubscriptions,
      recentUsers
    ] = await Promise.all([
      this.prisma.question.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: true,
          createdBy: {
            select: { fullName: true }
          }
        }
      }),
      this.prisma.examSubmission.findMany({
        take: 5,
        orderBy: { startedAt: 'desc' },
        include: {
          user: {
            select: { fullName: true }
          },
          examPaper: {
            select: { title: true }
          }
        }
      }),
      this.prisma.subscription.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { fullName: true }
          },
          plan: {
            select: { name: true }
          }
        }
      }),
      this.prisma.user.findMany({
        take: 5,
        where: { role: 'STUDENT' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, fullName: true, createdAt: true }
      })
    ]);

    const activities: any[] = [];

    // Add recent questions
    recentQuestions.forEach(question => {
      activities.push({
        id: `question-${question.id}`,
        type: 'question',
        message: `New question added to ${question.subject?.name || 'Unknown Subject'}`,
        time: question.createdAt,
        icon: '📝',
        details: {
          questionId: question.id,
          subject: question.subject?.name,
          createdBy: question.createdBy?.fullName
        }
      });
    });

    // Add recent submissions
    recentSubmissions.forEach(submission => {
      activities.push({
        id: `submission-${submission.id}`,
        type: 'submission',
        message: `Student completed ${submission.examPaper?.title || 'exam'}`,
        time: submission.startedAt,
        icon: '✅',
        details: {
          submissionId: submission.id,
          examPaper: submission.examPaper?.title,
          student: submission.user?.fullName,
          score: submission.scorePercent
        }
      });
    });

    // Add recent subscriptions
    recentSubscriptions.forEach(subscription => {
      activities.push({
        id: `subscription-${subscription.id}`,
        type: 'subscription',
        message: `New subscription plan created: ${subscription.plan?.name || 'Unknown Plan'}`,
        time: subscription.createdAt,
        icon: '💳',
        details: {
          subscriptionId: subscription.id,
          plan: subscription.plan?.name,
          user: subscription.user?.fullName
        }
      });
    });

    // Add recent user registrations
    recentUsers.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        message: 'User registered for trial',
        time: user.createdAt,
        icon: '👤',
        details: {
          userId: user.id,
          userName: user.fullName
        }
      });
    });

    // Sort by time and return top 10
    return activities
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 10)
      .map(activity => ({
        ...activity,
        timeAgo: this.getTimeAgo(activity.time)
      }));
  }

  async getMonthlyUsersData(monthsNumber: number = 12): Promise<UserGrowthData[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - monthsNumber);

    const monthlyData: UserGrowthData[] = [];
    
    for (let i = 0; i < monthsNumber; i++) {
      const monthStart = new Date(startDate);
      monthStart.setMonth(startDate.getMonth() + i);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthStart.getMonth() + 1);

      const [newUsers, totalUsers] = await Promise.all([
        this.prisma.user.count({
          where: {
            createdAt: {
              gte: monthStart,
              lt: monthEnd
            }
          }
        }),
        this.prisma.user.count({
          where: {
            createdAt: {
              lt: monthEnd
            }
          }
        })
      ]);

      monthlyData.push({
        date: monthStart.toISOString().substring(0, 7), // YYYY-MM format
        newUsers,
        totalUsers
      });
    }

    return monthlyData;
  }

  async getRevenueData(monthsNumber: number = 12): Promise<any[]> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - monthsNumber);

    const monthlyData: any[] = [];
    
    for (let i = 0; i < monthsNumber; i++) {
      const monthStart = new Date(startDate);
      monthStart.setMonth(startDate.getMonth() + i);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthStart.getMonth() + 1);

      const subscriptions = await this.prisma.subscription.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lt: monthEnd
          },
          status: 'ACTIVE'
        },
        include: {
          plan: {
            select: {
              priceCents: true
            }
          }
        }
      });

      const totalRevenue = subscriptions.reduce((sum, sub) => sum + (sub.plan.priceCents || 0), 0);

      monthlyData.push({
        date: monthStart.toISOString().substring(0, 7), // YYYY-MM format
        revenue: totalRevenue / 100 // Convert cents to dollars
      });
    }

    return monthlyData;
  }

  private getTimeAgo(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  }
}
