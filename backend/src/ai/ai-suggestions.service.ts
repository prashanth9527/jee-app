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
  private readonly openaiModel: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    this.openaiModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
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
    try {
      // Get comprehensive performance data from multiple sources
      const [examData, lessonProgress, practiceData] = await Promise.all([
        // Exam performance data
        this.prisma.$queryRawUnsafe(`
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
          HAVING COUNT(a.id) >= 1
          ORDER BY "lastAttempted" DESC, "score" ASC
        `, userId) as unknown as any[],

        // Lesson progress data
        this.prisma.lessonProgress.findMany({
          where: { userId },
          include: {
            lesson: {
              include: {
                subject: true,
                topics: {
                  include: {
                    subtopics: true
                  }
                }
              }
            }
          }
        }),

        // Practice session data - simplified for now
        this.prisma.userSession.findMany({
          where: { userId }
        })
      ]);

      // Process exam data
      const examPerformance = examData.map(item => ({
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

      // Process lesson progress data
      const lessonPerformance = lessonProgress.map(progress => ({
        subjectId: progress.lesson.subject.id,
        subjectName: progress.lesson.subject.name,
        topicId: undefined,
        topicName: undefined,
        subtopicId: undefined,
        subtopicName: undefined,
        totalQuestions: 0,
        correctAnswers: 0,
        score: (progress as any).completionPercentage || 0,
        difficulty: 'EASY' as 'EASY' | 'MEDIUM' | 'HARD',
        lastAttempted: (progress as any).updatedAt || new Date()
      }));

      // Process practice session data - simplified
      const practicePerformance = practiceData.map(session => ({
        subjectId: 'general',
        subjectName: 'General Practice',
        topicId: undefined,
        topicName: undefined,
        subtopicId: undefined,
        subtopicName: undefined,
        totalQuestions: 0,
        correctAnswers: 0,
        score: 50, // Default score for practice sessions
        difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
        lastAttempted: (session as any).lastActivityAt || new Date()
      }));

      // Combine all performance data
      const allPerformance = [...examPerformance, ...lessonPerformance, ...practicePerformance];

      // If no data available, return sample data for demonstration
      if (allPerformance.length === 0) {
        return this.getSamplePerformanceData();
      }

      return allPerformance;
    } catch (error) {
      this.logger.error('Error analyzing student performance:', error);
      // Return sample data as fallback
      return this.getSamplePerformanceData();
    }
  }

  private getSamplePerformanceData(): PerformanceAnalysis[] {
    return [
      {
        subjectId: 'math-1',
        subjectName: 'Mathematics',
        topicId: 'algebra-1',
        topicName: 'Algebra',
        subtopicId: 'quadratic-1',
        subtopicName: 'Quadratic Equations',
        totalQuestions: 15,
        correctAnswers: 8,
        score: 53.33,
        difficulty: 'MEDIUM',
        lastAttempted: new Date()
      },
      {
        subjectId: 'physics-1',
        subjectName: 'Physics',
        topicId: 'mechanics-1',
        topicName: 'Mechanics',
        subtopicId: 'newton-1',
        subtopicName: "Newton's Laws",
        totalQuestions: 12,
        correctAnswers: 7,
        score: 58.33,
        difficulty: 'HARD',
        lastAttempted: new Date()
      },
      {
        subjectId: 'chemistry-1',
        subjectName: 'Chemistry',
        topicId: 'organic-1',
        topicName: 'Organic Chemistry',
        subtopicId: 'hydrocarbons-1',
        subtopicName: 'Hydrocarbons',
        totalQuestions: 20,
        correctAnswers: 16,
        score: 80.00,
        difficulty: 'MEDIUM',
        lastAttempted: new Date()
      }
    ];
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
        model: this.openaiModel,

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
      const specificActions = this.getSpecificActionsForArea(area);
      suggestions.push({
        type: 'FOCUS_AREA',
        priority: 'HIGH',
        subjectId: area.subjectId,
        subjectName: area.subjectName,
        topicId: area.topicId,
        topicName: area.topicName,
        subtopicId: area.subtopicId,
        subtopicName: area.subtopicName,
        reason: `The student struggles with ${area.subjectName}${area.topicName ? ` > ${area.topicName}` : ''}${area.subtopicName ? ` > ${area.subtopicName}` : ''}, scoring only ${area.score.toFixed(1)}% (${area.correctAnswers}/${area.totalQuestions} questions). This indicates a need for fundamental concept review and targeted practice.`,
        recommendedActions: specificActions,
        estimatedTimeToImprove: '2-4 weeks',
        confidence: 85
      });
    });

    // Find areas for practice (score 60-80%)
    const practiceAreas = performanceData.filter(p => p.score >= 60 && p.score < 80);
    practiceAreas.forEach(area => {
      const specificActions = this.getPracticeActionsForArea(area);
      suggestions.push({
        type: 'PRACTICE_AREA',
        priority: 'MEDIUM',
        subjectId: area.subjectId,
        subjectName: area.subjectName,
        topicId: area.topicId,
        topicName: area.topicName,
        subtopicId: area.subtopicId,
        subtopicName: area.subtopicName,
        reason: `The student shows moderate understanding of ${area.subjectName}${area.topicName ? ` > ${area.topicName}` : ''}${area.subtopicName ? ` > ${area.subtopicName}` : ''} with ${area.score.toFixed(1)}% accuracy. Regular practice and concept reinforcement will help achieve mastery.`,
        recommendedActions: specificActions,
        estimatedTimeToImprove: '1-2 weeks',
        confidence: 75
      });
    });

    // Find strong areas for advanced practice
    const strongAreas = performanceData.filter(p => p.score >= 80);
    strongAreas.forEach(area => {
      const specificActions = this.getAdvancedActionsForArea(area);
      suggestions.push({
        type: 'ADVANCED_AREA',
        priority: 'LOW',
        subjectId: area.subjectId,
        subjectName: area.subjectName,
        topicId: area.topicId,
        topicName: area.topicName,
        subtopicId: area.subtopicId,
        subtopicName: area.subtopicName,
        reason: `The student demonstrates strong mastery of ${area.subjectName}${area.topicName ? ` > ${area.topicName}` : ''}${area.subtopicName ? ` > ${area.subtopicName}` : ''} with ${area.score.toFixed(1)}% accuracy. This area is ready for advanced challenges and can be used to build confidence.`,
        recommendedActions: specificActions,
        estimatedTimeToImprove: 'Ongoing',
        confidence: 90
      });
    });

    return suggestions.slice(0, request.limit || 10);
  }

  private getSpecificActionsForArea(area: PerformanceAnalysis): string[] {
    const actions: string[] = [];
    
    if (area.subjectName === 'Mathematics') {
      if (area.topicName?.includes('Algebra') || area.subtopicName?.includes('Quadratic')) {
        actions.push('Review the basic concepts of quadratic equations and practice factorization techniques');
        actions.push('Solve a set of 20 basic quadratic equations focusing on factorization method');
        actions.push('Practice problems involving the quadratic formula and its application in finding roots');
      } else if (area.topicName?.includes('Calculus')) {
        actions.push('Master the fundamental concepts of limits and derivatives');
        actions.push('Practice differentiation rules and their applications');
        actions.push('Solve integration problems step by step');
      } else {
        actions.push('Review fundamental mathematical concepts and formulas');
        actions.push('Practice basic problem-solving techniques');
        actions.push('Focus on understanding the underlying principles');
      }
    } else if (area.subjectName === 'Physics') {
      if (area.topicName?.includes('Mechanics') || area.subtopicName?.includes('Newton')) {
        actions.push('Review Newton\'s laws of motion with practical examples');
        actions.push('Practice free-body diagrams and force analysis');
        actions.push('Solve problems involving inclined planes and friction');
      } else if (area.topicName?.includes('Electromagnetism')) {
        actions.push('Understand the basic concepts of electric and magnetic fields');
        actions.push('Practice problems involving Coulomb\'s law and electric potential');
        actions.push('Study electromagnetic induction and Faraday\'s law');
      } else {
        actions.push('Review fundamental physics concepts and laws');
        actions.push('Practice problem-solving with step-by-step solutions');
        actions.push('Focus on understanding physical principles');
      }
    } else if (area.subjectName === 'Chemistry') {
      if (area.topicName?.includes('Organic')) {
        actions.push('Master the nomenclature of organic compounds');
        actions.push('Practice reaction mechanisms and electron flow');
        actions.push('Study functional groups and their properties');
      } else if (area.topicName?.includes('Physical')) {
        actions.push('Review thermodynamics and chemical equilibrium');
        actions.push('Practice problems involving gas laws and kinetics');
        actions.push('Understand phase transitions and colligative properties');
      } else {
        actions.push('Review fundamental chemistry concepts');
        actions.push('Practice balancing chemical equations');
        actions.push('Focus on understanding atomic structure and bonding');
      }
    } else {
      actions.push('Review fundamental concepts in this subject');
      actions.push('Practice more questions in this area');
      actions.push('Seek additional study materials and resources');
    }

    return actions;
  }

  private getPracticeActionsForArea(area: PerformanceAnalysis): string[] {
    return [
      'Increase practice frequency with timed sessions',
      'Focus on time management during problem-solving',
      'Review common mistakes and error patterns',
      'Practice mixed difficulty problems',
      'Take regular practice tests to track progress'
    ];
  }

  private getAdvancedActionsForArea(area: PerformanceAnalysis): string[] {
    return [
      'Attempt harder questions and advanced problems',
      'Help other students understand this topic',
      'Explore related advanced topics and applications',
      'Participate in competitive problem-solving',
      'Create study materials for others'
    ];
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