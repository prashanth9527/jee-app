import { Controller, Get, Post, Body, Param, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdvancedAnalyticsService } from './advanced-analytics.service';
import { ContentGenerationService, ContentEnhancementRequest } from './content-generation.service';
import { AIAssessmentsService, AdaptiveTestConfig } from './ai-assessments.service';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';

@Controller('ai/advanced')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdvancedAIController {
  constructor(
    private readonly advancedAnalyticsService: AdvancedAnalyticsService,
    private readonly contentGenerationService: ContentGenerationService,
    private readonly aiAssessmentsService: AIAssessmentsService,
    private readonly subscriptionValidationService: SubscriptionValidationService
  ) {}

  // Advanced Analytics Endpoints
  @Get('analytics/learning-profile')
  @Roles('STUDENT')
  async getDetailedLearningProfile(@Req() req: any) {
    const userId = req.user.id;
    
    // Check AI access
    const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
    if (!aiAccess.canUseAi) {
      throw new Error('AI features require premium subscription');
    }

    return this.advancedAnalyticsService.generateDetailedLearningProfile(userId);
  }

  @Get('analytics/insights')
  @Roles('STUDENT')
  async getLearningInsights(@Req() req: any) {
    const userId = req.user.id;
    
    const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
    if (!aiAccess.canUseAi) {
      throw new Error('AI features require premium subscription');
    }

    return this.advancedAnalyticsService.generateLearningInsights(userId);
  }

  @Get('analytics/concept-mastery/:subjectId')
  @Roles('STUDENT')
  async getConceptMasteryMap(@Req() req: any, @Param('subjectId') subjectId: string) {
    const userId = req.user.id;
    
    const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
    if (!aiAccess.canUseAi) {
      throw new Error('AI features require premium subscription');
    }

    return this.advancedAnalyticsService.generateConceptMasteryMap(userId, subjectId);
  }

  @Get('analytics/recommendations')
  @Roles('STUDENT')
  async getAIRecommendations(@Req() req: any) {
    const userId = req.user.id;
    
    const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
    if (!aiAccess.canUseAi) {
      throw new Error('AI features require premium subscription');
    }

    return this.advancedAnalyticsService.generateAILearningRecommendations(userId);
  }

  // Content Generation Endpoints
  @Get('content/lesson-summary/:lessonId')
  @Roles('STUDENT')
  async getLessonSummary(@Req() req: any, @Param('lessonId') lessonId: string) {
    const userId = req.user.id;
    
    const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
    if (!aiAccess.canUseAi) {
      throw new Error('AI features require premium subscription');
    }

    return this.contentGenerationService.generateLessonSummary(lessonId);
  }

  @Get('content/topic-explanation/:topicId')
  @Roles('STUDENT')
  async getTopicExplanation(@Req() req: any, @Param('topicId') topicId: string) {
    const userId = req.user.id;
    
    const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
    if (!aiAccess.canUseAi) {
      throw new Error('AI features require premium subscription');
    }

    return this.contentGenerationService.generateTopicExplanation(topicId);
  }

  @Get('content/micro-lesson/:subtopicId')
  @Roles('STUDENT')
  async getMicroLesson(@Req() req: any, @Param('subtopicId') subtopicId: string) {
    const userId = req.user.id;
    
    const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
    if (!aiAccess.canUseAi) {
      throw new Error('AI features require premium subscription');
    }

    return this.contentGenerationService.generateMicroLesson(subtopicId);
  }

  @Post('content/enhance')
  @Roles('STUDENT')
  async enhanceContent(@Req() req: any, @Body() request: ContentEnhancementRequest) {
    const userId = req.user.id;
    
    const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
    if (!aiAccess.canUseAi) {
      throw new Error('AI features require premium subscription');
    }

    return this.contentGenerationService.enhanceContent(request);
  }

  @Get('content/recommendations')
  @Roles('STUDENT')
  async getSmartRecommendations(
    @Req() req: any,
    @Query('subjectId') subjectId?: string
  ) {
    const userId = req.user.id;
    
    const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
    if (!aiAccess.canUseAi) {
      throw new Error('AI features require premium subscription');
    }

    return this.contentGenerationService.generateSmartRecommendations(userId, subjectId);
  }

  // AI Assessments Endpoints
  @Post('assessments/create-adaptive-test')
  @Roles('STUDENT')
  async createAdaptiveTest(@Req() req: any, @Body() config: AdaptiveTestConfig) {
    const userId = req.user.id;
    
    const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
    if (!aiAccess.canUseAi) {
      throw new Error('AI features require premium subscription');
    }

    config.userId = userId;
    return this.aiAssessmentsService.createAdaptiveTest(config);
  }

  @Post('assessments/:sessionId/submit-answer')
  @Roles('STUDENT')
  async submitAnswer(
    @Req() req: any,
    @Param('sessionId') sessionId: string,
    @Body() body: { questionId: string; answer: number; timeSpent: number }
  ) {
    const userId = req.user.id;
    
    const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
    if (!aiAccess.canUseAi) {
      throw new Error('AI features require premium subscription');
    }

    return this.aiAssessmentsService.submitAnswer(
      sessionId,
      body.questionId,
      body.answer,
      body.timeSpent
    );
  }

  @Get('assessments/:sessionId/result')
  @Roles('STUDENT')
  async getAssessmentResult(@Req() req: any, @Param('sessionId') sessionId: string) {
    const userId = req.user.id;
    
    const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
    if (!aiAccess.canUseAi) {
      throw new Error('AI features require premium subscription');
    }

    return this.aiAssessmentsService.getAssessmentResult(sessionId);
  }

  @Post('assessments/:sessionId/pause')
  @Roles('STUDENT')
  async pauseTest(@Req() req: any, @Param('sessionId') sessionId: string) {
    const userId = req.user.id;
    
    const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
    if (!aiAccess.canUseAi) {
      throw new Error('AI features require premium subscription');
    }

    return this.aiAssessmentsService.pauseTestSession(sessionId);
  }

  @Post('assessments/:sessionId/resume')
  @Roles('STUDENT')
  async resumeTest(@Req() req: any, @Param('sessionId') sessionId: string) {
    const userId = req.user.id;
    
    const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
    if (!aiAccess.canUseAi) {
      throw new Error('AI features require premium subscription');
    }

    return this.aiAssessmentsService.resumeTestSession(sessionId);
  }

  @Post('assessments/generate-questions')
  @Roles('STUDENT')
  async generateAIQuestions(
    @Req() req: any,
    @Body() body: {
      subjectId: string;
      topicId?: string;
      subtopicId?: string;
      count: number;
      difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    }
  ) {
    const userId = req.user.id;
    
    const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
    if (!aiAccess.canUseAi) {
      throw new Error('AI features require premium subscription');
    }

    return this.aiAssessmentsService.generateAIGeneratedQuestions(
      body.subjectId,
      body.topicId,
      body.subtopicId,
      body.count,
      body.difficulty
    );
  }
}






