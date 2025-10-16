import { Controller, Get, Post, Body, Param, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AISuggestionsService } from './ai-suggestions.service';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';

@Controller('ai-suggestions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class AISuggestionsController {
  constructor(
    private readonly aiSuggestionsService: AISuggestionsService,
    private readonly subscriptionValidation: SubscriptionValidationService
  ) {}

  @Get('personalized')
  async getPersonalizedSuggestions(
    @Req() req: any,
    @Query('limit') limit = '10',
    @Query('includeWeakAreas') includeWeakAreas = 'true',
    @Query('includeStrongAreas') includeStrongAreas = 'true',
    @Query('focusOnRecentPerformance') focusOnRecentPerformance = 'true'
  ) {
    const userId = req.user.id;

    // Check subscription status - require AI_ENABLED for detailed suggestions
    const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
    if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
      throw new ForbiddenException('Subscription required to access AI suggestions');
    }

    // Check for AI_ENABLED subscription for detailed suggestions
    if (subscriptionStatus.planType !== 'AI_ENABLED') {
      throw new ForbiddenException('AI Detailed Suggestions require AI_ENABLED subscription. Please upgrade your plan.');
    }

    const request = {
      userId,
      limit: parseInt(limit),
      includeWeakAreas: includeWeakAreas === 'true',
      includeStrongAreas: includeStrongAreas === 'true',
      focusOnRecentPerformance: focusOnRecentPerformance === 'true'
    };

    try {
      const suggestions = await this.aiSuggestionsService.generatePersonalizedSuggestions(request);
      
      return {
        success: true,
        data: suggestions,
        metadata: {
          totalSuggestions: suggestions.length,
          generatedAt: new Date().toISOString(),
          userId,
          subscriptionType: subscriptionStatus.planType || 'TRIAL'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        metadata: {
          totalSuggestions: 0,
          generatedAt: new Date().toISOString(),
          userId,
          subscriptionType: subscriptionStatus.planType || 'TRIAL'
        }
      };
    }
  }

  @Get('performance-analysis')
  async getPerformanceAnalysis(@Req() req: any) {
    const userId = req.user.id;

    // Check subscription status
    const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
    if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
      throw new ForbiddenException('Subscription required to access performance analysis');
    }

    try {
      // Get detailed performance breakdown
      const performanceData = await this.aiSuggestionsService['analyzeStudentPerformance'](userId);
      
      // Calculate summary statistics
      const totalQuestions = performanceData.reduce((sum, p) => sum + p.totalQuestions, 0);
      const totalCorrect = performanceData.reduce((sum, p) => sum + p.correctAnswers, 0);
      const overallScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

      // Group by subject
      const subjectBreakdown = performanceData.reduce((acc, p) => {
        if (!acc[p.subjectId]) {
          acc[p.subjectId] = {
            subjectId: p.subjectId,
            subjectName: p.subjectName,
            totalQuestions: 0,
            correctAnswers: 0,
            topics: []
          };
        }
        
        acc[p.subjectId].totalQuestions += p.totalQuestions;
        acc[p.subjectId].correctAnswers += p.correctAnswers;
        
        if (p.topicId) {
          acc[p.subjectId].topics.push({
            topicId: p.topicId,
            topicName: p.topicName,
            subtopicId: p.subtopicId,
            subtopicName: p.subtopicName,
            totalQuestions: p.totalQuestions,
            correctAnswers: p.correctAnswers,
            score: p.score,
            difficulty: p.difficulty,
            lastAttempted: p.lastAttempted
          });
        }
        
        return acc;
      }, {} as any);

      // Calculate subject scores
      Object.values(subjectBreakdown).forEach((subject: any) => {
        subject.score = subject.totalQuestions > 0 
          ? (subject.correctAnswers / subject.totalQuestions) * 100 
          : 0;
      });

      // Calculate performance trends
      const performanceTrends = this.calculatePerformanceTrends(performanceData);
      
      // Generate insights
      const insights = this.generatePerformanceInsights(performanceData, subjectBreakdown);

      return {
        success: true,
        data: {
          overall: {
            totalQuestions,
            correctAnswers: totalCorrect,
            score: Math.round(overallScore * 100) / 100
          },
          subjects: Object.values(subjectBreakdown),
          performanceData,
          trends: performanceTrends,
          insights
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          userId,
          subscriptionType: subscriptionStatus.planType || 'TRIAL'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null,
        metadata: {
          generatedAt: new Date().toISOString(),
          userId,
          subscriptionType: subscriptionStatus.planType || 'TRIAL'
        }
      };
    }
  }

  private calculatePerformanceTrends(performanceData: any[]): any {
    // Group by difficulty and calculate trends
    const difficultyTrends = performanceData.reduce((acc, p) => {
      if (!acc[p.difficulty]) {
        acc[p.difficulty] = { total: 0, correct: 0, count: 0 };
      }
      acc[p.difficulty].total += p.totalQuestions;
      acc[p.difficulty].correct += p.correctAnswers;
      acc[p.difficulty].count += 1;
      return acc;
    }, {});

    // Calculate average scores by difficulty
    Object.keys(difficultyTrends).forEach(difficulty => {
      const trend = difficultyTrends[difficulty];
      trend.averageScore = trend.total > 0 ? (trend.correct / trend.total) * 100 : 0;
    });

    return {
      byDifficulty: difficultyTrends,
      totalAreas: performanceData.length,
      weakAreas: performanceData.filter(p => p.score < 60).length,
      strongAreas: performanceData.filter(p => p.score >= 80).length
    };
  }

  private generatePerformanceInsights(performanceData: any[], subjectBreakdown: any): any[] {
    const insights = [];

    // Find weakest subject
    const weakestSubject = Object.values(subjectBreakdown)
      .sort((a: any, b: any) => a.score - b.score)[0] as any;
    
    if (weakestSubject) {
      insights.push({
        type: 'WEAKNESS',
        title: 'Primary Focus Area',
        description: `${weakestSubject.subjectName} needs immediate attention with ${weakestSubject.score.toFixed(1)}% accuracy`,
        recommendation: 'Focus on fundamental concepts and practice more questions',
        priority: 'HIGH'
      });
    }

    // Find strongest subject
    const strongestSubject = Object.values(subjectBreakdown)
      .sort((a: any, b: any) => b.score - a.score)[0] as any;
    
    if (strongestSubject && strongestSubject.score > 80) {
      insights.push({
        type: 'STRENGTH',
        title: 'Strong Performance Area',
        description: `${strongestSubject.subjectName} shows excellent mastery with ${strongestSubject.score.toFixed(1)}% accuracy`,
        recommendation: 'Use this strength to build confidence and help others',
        priority: 'LOW'
      });
    }

    // Overall performance insight
    const averageScore = performanceData.reduce((sum, p) => sum + p.score, 0) / performanceData.length;
    if (averageScore < 60) {
      insights.push({
        type: 'IMPROVEMENT',
        title: 'Overall Performance Needs Improvement',
        description: `Average performance across all areas is ${averageScore.toFixed(1)}%`,
        recommendation: 'Focus on consistent practice and concept reinforcement',
        priority: 'HIGH'
      });
    } else if (averageScore > 80) {
      insights.push({
        type: 'EXCELLENCE',
        title: 'Excellent Overall Performance',
        description: `Average performance across all areas is ${averageScore.toFixed(1)}%`,
        recommendation: 'Continue current study methods and challenge yourself with advanced topics',
        priority: 'LOW'
      });
    }

    return insights;
  }

  @Get('history')
  async getSuggestionHistory(
    @Req() req: any,
    @Query('limit') limit = '20'
  ) {
    const userId = req.user.id;

    // Check subscription status
    const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
    if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
      throw new ForbiddenException('Subscription required to access suggestion history');
    }

    try {
      const history = await this.aiSuggestionsService.getSuggestionHistory(userId, parseInt(limit));
      
      return {
        success: true,
        data: history,
        metadata: {
          totalHistory: history.length,
          generatedAt: new Date().toISOString(),
          userId,
          subscriptionType: subscriptionStatus.planType || 'TRIAL'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: [],
        metadata: {
          totalHistory: 0,
          generatedAt: new Date().toISOString(),
          userId,
          subscriptionType: subscriptionStatus.planType || 'TRIAL'
        }
      };
    }
  }

  @Post('mark-followed')
  async markSuggestionAsFollowed(
    @Req() req: any,
    @Body() body: { suggestionId: string }
  ) {
    const userId = req.user.id;

    // Check subscription status
    const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
    if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
      throw new ForbiddenException('Subscription required to mark suggestions');
    }

    try {
      await this.aiSuggestionsService.markSuggestionAsFollowed(body.suggestionId, userId);
      
      return {
        success: true,
        message: 'Suggestion marked as followed successfully',
        metadata: {
          suggestionId: body.suggestionId,
          userId,
          markedAt: new Date().toISOString(),
          subscriptionType: subscriptionStatus.planType || 'TRIAL'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          suggestionId: body.suggestionId,
          userId,
          markedAt: new Date().toISOString(),
          subscriptionType: subscriptionStatus.planType || 'TRIAL'
        }
      };
    }
  }

  @Get('quick-insights')
  async getQuickInsights(@Req() req: any) {
    const userId = req.user.id;

    // Check subscription status
    const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
    if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
      throw new ForbiddenException('Subscription required to access quick insights');
    }

    try {
      // Get top 3 suggestions for quick insights
      const suggestions = await this.aiSuggestionsService.generatePersonalizedSuggestions({
        userId,
        limit: 3,
        includeWeakAreas: true,
        includeStrongAreas: false,
        focusOnRecentPerformance: true
      });

      // Get performance summary
      const performanceData = await this.aiSuggestionsService['analyzeStudentPerformance'](userId);
      const totalQuestions = performanceData.reduce((sum, p) => sum + p.totalQuestions, 0);
      const totalCorrect = performanceData.reduce((sum, p) => sum + p.correctAnswers, 0);
      const overallScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

      // Find weakest area
      const weakestArea = performanceData
        .filter(p => p.totalQuestions >= 5) // Only consider areas with sufficient data
        .sort((a, b) => a.score - b.score)[0];

      // Find strongest area
      const strongestArea = performanceData
        .filter(p => p.totalQuestions >= 5)
        .sort((a, b) => b.score - a.score)[0];

      return {
        success: true,
        data: {
          topSuggestions: suggestions,
          performanceSummary: {
            overallScore: Math.round(overallScore * 100) / 100,
            totalQuestions,
            totalCorrect,
            weakestArea: weakestArea ? {
              subject: weakestArea.subjectName,
              topic: weakestArea.topicName,
              score: weakestArea.score
            } : null,
            strongestArea: strongestArea ? {
              subject: strongestArea.subjectName,
              topic: strongestArea.topicName,
              score: strongestArea.score
            } : null
          }
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          userId,
          subscriptionType: subscriptionStatus.planType || 'TRIAL'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null,
        metadata: {
          generatedAt: new Date().toISOString(),
          userId,
          subscriptionType: subscriptionStatus.planType || 'TRIAL'
        }
      };
    }
  }
} 