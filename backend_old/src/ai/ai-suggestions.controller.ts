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

    // Check subscription status
    const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
    if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
      throw new ForbiddenException('Subscription required to access AI suggestions');
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

      return {
        success: true,
        data: {
          overall: {
            totalQuestions,
            correctAnswers: totalCorrect,
            score: Math.round(overallScore * 100) / 100
          },
          subjects: Object.values(subjectBreakdown),
          performanceData
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