import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('student/leaderboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class StudentLeaderboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getLeaderboard(@Req() req: any, @Query('type') type: string = 'overall') {
    const userId = req.user.id;

    // Get user's stream
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streamId: true, stream: { select: { name: true, code: true } } }
    });

    if (!user?.streamId) {
      throw new Error('User not assigned to any stream');
    }

    let leaderboardData;

    switch (type) {
      case 'practice-tests':
        leaderboardData = await this.getPracticeTestLeaderboard(user.streamId);
        break;
      case 'exam-papers':
        leaderboardData = await this.getExamPaperLeaderboard(user.streamId);
        break;
      case 'pyq':
        leaderboardData = await this.getPYQLeaderboard(user.streamId);
        break;
      case 'overall':
      default:
        leaderboardData = await this.getOverallLeaderboard(user.streamId);
        break;
    }

    // Get user's position
    const userPosition = leaderboardData.findIndex((entry: any) => entry.userId === userId) + 1;

    return {
      stream: user.stream,
      type,
      leaderboard: leaderboardData,
      userPosition: userPosition > 0 ? userPosition : null,
      totalStudents: leaderboardData.length
    };
  }

  private async getOverallLeaderboard(streamId: string) {
    // Get all students in the same stream with their performance metrics
    const students = await this.prisma.user.findMany({
      where: {
        streamId,
        role: 'STUDENT'
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        _count: {
          select: {
            examSubmissions: true
          }
        }
      },
      orderBy: {
        fullName: 'asc'
      }
    });

    // Calculate scores based on various metrics
    const leaderboard = await Promise.all(
	students.map(async (student: any) => {
        // Get average scores from exam submissions
        const examScores = await this.prisma.examSubmission.findMany({
          where: { userId: student.id },
          select: { scorePercent: true, totalQuestions: true, correctCount: true }
        });

        // Calculate overall score
	const totalScore = examScores.reduce((sum: number, submission: any) => sum + (submission.scorePercent || 0), 0);
        const totalTests = examScores.length;
        const averageScore = totalTests > 0 ? totalScore / totalTests : 0;

        // Calculate total correct answers
	const totalCorrect = examScores.reduce((sum: number, submission: any) => sum + submission.correctCount, 0);
	const totalQuestions = examScores.reduce((sum: number, submission: any) => sum + submission.totalQuestions, 0);

        return {
          userId: student.id,
          fullName: student.fullName,
          email: student.email,
          averageScore: Math.round(averageScore * 100) / 100,
          totalTests,
          totalCorrect,
          totalQuestions,
          examSubmissions: student._count.examSubmissions
        };
      })
    );

    // Sort by average score (descending) and then by total tests (descending)
    return leaderboard
      .sort((a, b) => {
        if (b.averageScore !== a.averageScore) {
          return b.averageScore - a.averageScore;
        }
        return b.totalTests - a.totalTests;
      })
      .slice(0, 50); // Top 50 students
  }

  private async getPracticeTestLeaderboard(streamId: string) {
    const students = await this.prisma.user.findMany({
      where: {
        streamId,
        role: 'STUDENT'
      },
      select: {
        id: true,
        fullName: true,
        email: true
      }
    });

    const leaderboard = await Promise.all(
	students.map(async (student: any) => {
        const practiceSubmissions = await this.prisma.examSubmission.findMany({
          where: { 
            userId: student.id
          },
          select: { scorePercent: true, totalQuestions: true, correctCount: true, startedAt: true }
        });

        const totalScore = practiceSubmissions.reduce((sum: number, submission: any) => sum + (submission.scorePercent || 0), 0);
        const averageScore = practiceSubmissions.length > 0 ? totalScore / practiceSubmissions.length : 0;

        return {
          userId: student.id,
          fullName: student.fullName,
          email: student.email,
          averageScore: Math.round(averageScore * 100) / 100,
          totalTests: practiceSubmissions.length,
          totalScore: Math.round(totalScore),
          lastTestDate: practiceSubmissions.length > 0 
            ? practiceSubmissions[practiceSubmissions.length - 1].startedAt 
            : null
        };
      })
    );

    return leaderboard
      .filter(entry => entry.totalTests > 0)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 50);
  }

  private async getExamPaperLeaderboard(streamId: string) {
    const students = await this.prisma.user.findMany({
      where: {
        streamId,
        role: 'STUDENT'
      },
      select: {
        id: true,
        fullName: true,
        email: true
      }
    });

    const leaderboard = await Promise.all(
	students.map(async (student: any) => {
        const examSubmissions = await this.prisma.examSubmission.findMany({
          where: { 
            userId: student.id
          },
          select: { scorePercent: true, totalQuestions: true, correctCount: true, startedAt: true }
        });

        const totalScore = examSubmissions.reduce((sum: number, submission: any) => sum + (submission.scorePercent || 0), 0);
        const averageScore = examSubmissions.length > 0 ? totalScore / examSubmissions.length : 0;

        return {
          userId: student.id,
          fullName: student.fullName,
          email: student.email,
          averageScore: Math.round(averageScore * 100) / 100,
          totalTests: examSubmissions.length,
          totalScore: Math.round(totalScore),
          lastTestDate: examSubmissions.length > 0 
            ? examSubmissions[examSubmissions.length - 1].startedAt 
            : null
        };
      })
    );

    return leaderboard
      .filter(entry => entry.totalTests > 0)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 50);
  }

  private async getPYQLeaderboard(streamId: string) {
    const students = await this.prisma.user.findMany({
      where: {
        streamId,
        role: 'STUDENT'
      },
      select: {
        id: true,
        fullName: true,
        email: true
      }
    });

    const leaderboard = await Promise.all(
	students.map(async (student: any) => {
        // Get PYQ-related submissions (questions marked as previous year)
        const pyqSubmissions = await this.prisma.examSubmission.findMany({
          where: { 
            userId: student.id
          },
          select: { scorePercent: true, totalQuestions: true, correctCount: true, startedAt: true }
        });

        const totalScore = pyqSubmissions.reduce((sum: number, submission: any) => sum + (submission.scorePercent || 0), 0);
        const averageScore = pyqSubmissions.length > 0 ? totalScore / pyqSubmissions.length : 0;

        return {
          userId: student.id,
          fullName: student.fullName,
          email: student.email,
          averageScore: Math.round(averageScore * 100) / 100,
          totalTests: pyqSubmissions.length,
          totalScore: Math.round(totalScore),
          lastTestDate: pyqSubmissions.length > 0 
            ? pyqSubmissions[pyqSubmissions.length - 1].startedAt 
            : null
        };
      })
    );

    return leaderboard
      .filter(entry => entry.totalTests > 0)
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 50);
  }
} 