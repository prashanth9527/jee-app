import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

export interface PerformanceAnalysis {
  subjectId: string;
  subjectName: string;
  topicId?: string;
  topicName?: string;
  subtopicId?: string;
  subtopicName?: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  lastAttempted: Date;
}

export interface AISuggestion {
  type: 'FOCUS_AREA' | 'PRACTICE_AREA' | 'REVISION_AREA' | 'ADVANCED_AREA';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  subjectId: string;
  subjectName: string;
  topicId?: string;
  topicName?: string;
  subtopicId?: string;
  subtopicName?: string;
  reason: string;
  recommendedActions: string[];
  estimatedTimeToImprove: string;
  confidence: number; // 0-100
}

export interface SuggestionRequest {
  userId: string;
  limit?: number;
  includeWeakAreas?: boolean;
  includeStrongAreas?: boolean;
  focusOnRecentPerformance?: boolean;
}

@Injectable()
export class AISuggestionsService {
  private readonly logger = new Logger(AISuggestionsService.name);
  private readonly openaiApiKey: string;
  private readonly openaiBaseUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
  }

  async generatePersonalizedSuggestions(request: SuggestionRequest): Promise<AISuggestion[]> {
    try {
      // 1. Analyze student performance data
      const performanceData = await this.analyzeStudentPerformance(request.userId);
      
      // 2. Generate AI-powered suggestions
      const suggestions = await this.generateAISuggestions(performanceData, request);
      
      // 3. Sort by priority and confidence
      return suggestions.sort((a, b) => {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      }).slice(0, request.limit || 10);
    } catch (error) {
      this.logger.error('Error generating AI suggestions:', error);
      throw new Error('Failed to generate personalized suggestions');
    }
  }

  private async analyzeStudentPerformance(userId: string): Promise<PerformanceAnalysis[]> {
    // Get comprehensive performance data
    const performanceData = await this.prisma.$queryRawUnsafe(`
      SELECT 
        s.id as "subjectId",
        s.name as "subjectName",
        t.id as "topicId",
        t.name as "topicName",
        st.id as "subtopicId",
        st.name as "subtopicName",
        q.difficulty,
        COUNT(a.id)::int as "totalQuestions",
        SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::int as "correctAnswers",
        ROUND(
          (SUM(CASE WHEN a."isCorrect" THEN 1 ELSE 0 END)::numeric / COUNT(a.id)::numeric) * 100, 
          2
        ) as "score",
        MAX(es."submittedAt") as "lastAttempted"
      FROM "ExamAnswer" a
      JOIN "Question" q ON q.id = a."questionId"
      JOIN "Subject" s ON s.id = q."subjectId"
      LEFT JOIN "Topic" t ON t.id = q."topicId"
      LEFT JOIN "Subtopic" st ON st.id = q."subtopicId"
      JOIN "ExamSubmission" es ON es.id = a."submissionId"
      WHERE es."userId" = $1 AND es."submittedAt" IS NOT NULL
      GROUP BY s.id, s.name, t.id, t.name, st.id, st.name, q.difficulty
      HAVING COUNT(a.id) >= 3
      ORDER BY "lastAttempted" DESC, "score" ASC
    `, userId) as any[];

    return performanceData.map(item => ({
      subjectId: item.subjectId,
      subjectName: item.subjectName,
      topicId: item.topicId || undefined,
      topicName: item.topicName || undefined,
      subtopicId: item.subtopicId || undefined,
      subtopicName: item.subtopicName || undefined,
      totalQuestions: item.totalQuestions,
      correctAnswers: item.correctAnswers,
      score: parseFloat(item.score) || 0,
      difficulty: item.difficulty as 'EASY' | 'MEDIUM' | 'HARD',
      lastAttempted: new Date(item.lastAttempted)
    }));
  }

  private async generateAISuggestions(
    performanceData: PerformanceAnalysis[], 
    request: SuggestionRequest
  ): Promise<AISuggestion[]> {
    if (!this.openaiApiKey) {
      // Fallback to rule-based suggestions if AI is not available
      return this.generateRuleBasedSuggestions(performanceData, request);
    }

    try {
      const prompt = this.buildSuggestionPrompt(performanceData, request);
      const response = await this.callOpenAI(prompt);
      return this.parseSuggestionResponse(response);
    } catch (error) {
      this.logger.error('Error calling OpenAI for suggestions:', error);
      // Fallback to rule-based suggestions
      return this.generateRuleBasedSuggestions(performanceData, request);
    }
  }

  private buildSuggestionPrompt(performanceData: PerformanceAnalysis[], request: SuggestionRequest): string {
    const performanceSummary = performanceData.map(p => 
      `${p.subjectName}${p.topicName ? ` > ${p.topicName}` : ''}${p.subtopicName ? ` > ${p.subtopicName}` : ''}: ${p.score}% (${p.correctAnswers}/${p.totalQuestions} questions, ${p.difficulty} difficulty)`
    ).join('\n');

    return `You are an expert JEE (Joint Entrance Examination) tutor. Analyze the following student performance data and provide personalized learning suggestions.

STUDENT PERFORMANCE DATA:
${performanceSummary}

REQUIREMENTS:
- Generate ${request.limit || 10} personalized suggestions
- Focus on areas where the student needs improvement
- Consider difficulty progression (Easy → Medium → Hard)
- Provide specific, actionable recommendations
- Include estimated time to improve each area
- Assign priority levels (HIGH, MEDIUM, LOW) based on urgency
- Categorize suggestions into: FOCUS_AREA, PRACTICE_AREA, REVISION_AREA, ADVANCED_AREA

OUTPUT FORMAT (JSON array):
[
  {
    "type": "FOCUS_AREA",
    "priority": "HIGH",
    "subjectId": "subject_id",
    "subjectName": "Subject Name",
    "topicId": "topic_id",
    "topicName": "Topic Name",
    "subtopicId": "subtopic_id",
    "subtopicName": "Subtopic Name",
    "reason": "Clear explanation of why this area needs attention",
    "recommendedActions": ["Action 1", "Action 2", "Action 3"],
    "estimatedTimeToImprove": "2-3 weeks",
    "confidence": 85
  }
]

Focus on providing practical, achievable suggestions that will help the student improve their JEE preparation.`;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert JEE tutor specializing in personalized learning recommendations. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private parseSuggestionResponse(response: string): AISuggestion[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const suggestions = JSON.parse(jsonMatch[0]);
      
      // Validate and transform suggestions
      return suggestions.map((s: any) => ({
        type: s.type || 'FOCUS_AREA',
        priority: s.priority || 'MEDIUM',
        subjectId: s.subjectId,
        subjectName: s.subjectName,
        topicId: s.topicId,
        topicName: s.topicName,
        subtopicId: s.subtopicId,
        subtopicName: s.subtopicName,
        reason: s.reason || 'Area identified for improvement',
        recommendedActions: Array.isArray(s.recommendedActions) ? s.recommendedActions : ['Practice more questions'],
        estimatedTimeToImprove: s.estimatedTimeToImprove || '1-2 weeks',
        confidence: Math.min(100, Math.max(0, s.confidence || 70))
      }));
    } catch (error) {
      this.logger.error('Error parsing AI suggestion response:', error);
      throw new Error('Failed to parse AI suggestions');
    }
  }

  private generateRuleBasedSuggestions(
    performanceData: PerformanceAnalysis[], 
    request: SuggestionRequest
  ): AISuggestion[] {
    const suggestions: AISuggestion[] = [];

    // Find weak areas (score < 60%)
    const weakAreas = performanceData.filter(p => p.score < 60);
    weakAreas.forEach(area => {
      suggestions.push({
        type: 'FOCUS_AREA',
        priority: 'HIGH',
        subjectId: area.subjectId,
        subjectName: area.subjectName,
        topicId: area.topicId,
        topicName: area.topicName,
        subtopicId: area.subtopicId,
        subtopicName: area.subtopicName,
        reason: `Low performance (${area.score}%) indicates need for focused practice`,
        recommendedActions: [
          'Review fundamental concepts',
          'Practice more questions in this area',
          'Seek additional study materials'
        ],
        estimatedTimeToImprove: '2-4 weeks',
        confidence: 85
      });
    });

    // Find areas for practice (score 60-80%)
    const practiceAreas = performanceData.filter(p => p.score >= 60 && p.score < 80);
    practiceAreas.forEach(area => {
      suggestions.push({
        type: 'PRACTICE_AREA',
        priority: 'MEDIUM',
        subjectId: area.subjectId,
        subjectName: area.subjectName,
        topicId: area.topicId,
        topicName: area.topicName,
        subtopicId: area.subtopicId,
        subtopicName: area.subtopicName,
        reason: `Moderate performance (${area.score}%) - practice needed for mastery`,
        recommendedActions: [
          'Increase practice frequency',
          'Focus on time management',
          'Review common mistakes'
        ],
        estimatedTimeToImprove: '1-2 weeks',
        confidence: 75
      });
    });

    // Find strong areas for advanced practice
    const strongAreas = performanceData.filter(p => p.score >= 80);
    strongAreas.forEach(area => {
      suggestions.push({
        type: 'ADVANCED_AREA',
        priority: 'LOW',
        subjectId: area.subjectId,
        subjectName: area.subjectName,
        topicId: area.topicId,
        topicName: area.topicName,
        subtopicId: area.subtopicId,
        subtopicName: area.subtopicName,
        reason: `Strong performance (${area.score}%) - ready for advanced challenges`,
        recommendedActions: [
          'Attempt harder questions',
          'Help other students',
          'Explore related advanced topics'
        ],
        estimatedTimeToImprove: 'Ongoing',
        confidence: 90
      });
    });

    return suggestions.slice(0, request.limit || 10);
  }

  async getSuggestionHistory(userId: string, limit = 20): Promise<any[]> {
    // This could be implemented to track suggestion effectiveness
    // For now, return empty array
    return [];
  }

  async markSuggestionAsFollowed(suggestionId: string, userId: string): Promise<void> {
    // This could be implemented to track which suggestions students follow
    // For now, just log the action
    this.logger.log(`Student ${userId} marked suggestion ${suggestionId} as followed`);
  }
} 