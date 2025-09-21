import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface LearningInsight {
  type: 'PERFORMANCE_TREND' | 'LEARNING_PATTERN' | 'STRENGTH_WEAKNESS' | 'STUDY_EFFICIENCY' | 'CONCEPT_MASTERY';
  title: string;
  description: string;
  data: any;
  confidence: number;
  recommendations: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface DetailedLearningProfile {
  userId: string;
  learningStyle: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    reading: number;
  };
  optimalStudyTime: string;
  attentionSpan: number; // in minutes
  preferredContentTypes: string[];
  weakConcepts: Array<{
    conceptId: string;
    conceptName: string;
    difficulty: number;
    attempts: number;
    lastAttempted: Date;
  }>;
  strongConcepts: Array<{
    conceptId: string;
    conceptName: string;
    mastery: number;
    lastPracticed: Date;
  }>;
  learningVelocity: {
    topicsPerWeek: number;
    averageTimePerTopic: number;
    retentionRate: number;
  };
  performancePredictions: {
    nextTopicDifficulty: string;
    estimatedCompletionTime: number;
    successProbability: number;
  };
}

export interface ConceptMasteryMap {
  conceptId: string;
  conceptName: string;
  masteryLevel: number; // 0-100
  prerequisites: string[];
  dependentConcepts: string[];
  learningPath: string[];
  practiceRecommendations: string[];
}

@Injectable()
export class AdvancedAnalyticsService {
  private readonly logger = new Logger(AdvancedAnalyticsService.name);
  private readonly openaiApiKey: string;
  private readonly openaiBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
  }

  async generateDetailedLearningProfile(userId: string): Promise<DetailedLearningProfile> {
    try {
      // Gather comprehensive user data
      const userData = await this.gatherUserLearningData(userId);
      
      // Analyze learning patterns
      const learningStyle = await this.analyzeLearningStyle(userData);
      const optimalStudyTime = await this.analyzeOptimalStudyTime(userData);
      const attentionSpan = await this.analyzeAttentionSpan(userData);
      
      // Identify strengths and weaknesses
      const conceptAnalysis = await this.analyzeConceptMasteryData(userData);
      
      // Calculate learning velocity
      const learningVelocity = await this.calculateLearningVelocity(userData);
      
      // Generate performance predictions
      const predictions = await this.generatePerformancePredictions(userData);

      return {
        userId,
        learningStyle,
        optimalStudyTime,
        attentionSpan,
        preferredContentTypes: await this.identifyPreferredContentTypes(userData),
        weakConcepts: conceptAnalysis.weak,
        strongConcepts: conceptAnalysis.strong,
        learningVelocity,
        performancePredictions: predictions
      };
    } catch (error) {
      this.logger.error('Error generating detailed learning profile:', error);
      throw new Error('Failed to generate learning profile');
    }
  }

  async generateLearningInsights(userId: string): Promise<LearningInsight[]> {
    try {
      const userData = await this.gatherUserLearningData(userId);
      const insights: LearningInsight[] = [];

      // Performance trend analysis
      insights.push(await this.analyzePerformanceTrend(userData));
      
      // Learning pattern analysis
      insights.push(await this.analyzeLearningPattern(userData));
      
      // Strength and weakness analysis
      insights.push(await this.analyzeStrengthWeakness(userData));
      
      // Study efficiency analysis
      insights.push(await this.analyzeStudyEfficiency(userData));
      
      // Concept mastery analysis
      insights.push(await this.analyzeConceptMastery(userData));

      return insights.sort((a, b) => {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
    } catch (error) {
      this.logger.error('Error generating learning insights:', error);
      throw new Error('Failed to generate learning insights');
    }
  }

  async generateConceptMasteryMap(userId: string, subjectId: string): Promise<ConceptMasteryMap[]> {
    try {
      const userData = await this.gatherUserLearningData(userId);
      const concepts = await this.prisma.topic.findMany({
        where: { 
          subjectId
        },
        include: {
          subtopics: true,
          questions: {
            // include: {
            //   submissions: {
            //     where: { userId }
            //   }
            // }
          }
        }
      });

      const masteryMap: ConceptMasteryMap[] = [];

      for (const concept of concepts) {
        const mastery = await this.calculateConceptMastery(concept, userData);
        const prerequisites = await this.identifyPrerequisites(concept);
        const dependentConcepts = await this.identifyDependentConcepts(concept);
        const learningPath = await this.generateLearningPath(concept, mastery);
        const practiceRecommendations = await this.generatePracticeRecommendations(concept, mastery);

        masteryMap.push({
          conceptId: concept.id,
          conceptName: concept.name,
          masteryLevel: mastery,
          prerequisites,
          dependentConcepts,
          learningPath,
          practiceRecommendations
        });
      }

      return masteryMap;
    } catch (error) {
      this.logger.error('Error generating concept mastery map:', error);
      throw new Error('Failed to generate concept mastery map');
    }
  }

  async generateAILearningRecommendations(userId: string): Promise<string[]> {
    try {
      const profile = await this.generateDetailedLearningProfile(userId);
      const insights = await this.generateLearningInsights(userId);

      const prompt = `
        Analyze this student's learning profile and generate 5 personalized learning recommendations:
        
        Learning Style: ${JSON.stringify(profile.learningStyle)}
        Optimal Study Time: ${profile.optimalStudyTime}
        Attention Span: ${profile.attentionSpan} minutes
        Weak Concepts: ${profile.weakConcepts.map(c => c.conceptName).join(', ')}
        Strong Concepts: ${profile.strongConcepts.map(c => c.conceptName).join(', ')}
        Learning Velocity: ${profile.learningVelocity.topicsPerWeek} topics/week
        
        Key Insights:
        ${insights.map(i => `${i.title}: ${i.description}`).join('\n')}
        
        Generate specific, actionable recommendations for improving learning outcomes.
        Return as a JSON array of strings.
      `;

      const recommendations = await this.callOpenAI(prompt);
      return JSON.parse(recommendations);
    } catch (error) {
      this.logger.error('Error generating AI recommendations:', error);
      return ['Focus on your weak concepts', 'Maintain consistent study schedule', 'Practice regularly'];
    }
  }

  private async gatherUserLearningData(userId: string) {
    const [
      lessonProgress,
      examSubmissions,
      questionAttempts,
      studySessions,
      badges
    ] = await Promise.all([
      this.prisma.lessonProgress.findMany({
        where: { userId },
        include: {
          lesson: {
            include: {
              subject: true,
              topics: true
            }
          },
          badges: true
        }
      }),
      this.prisma.examSubmission.findMany({
        where: { userId },
        include: {
          answers: {
            include: {
              question: {
                include: {
                  topic: true,
                  subtopic: true
                }
              }
            }
          }
        }
      }),
      this.prisma.examAnswer.findMany({
        where: { 
          submission: {
            userId
          }
        },
        include: {
          question: {
            include: {
              topic: true,
              subtopic: true
            }
          },
          submission: true
        }
      }),
      this.prisma.userSession.findMany({
        where: { 
          userId,
          lastActivityAt: {
            gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
          }
        }
      }),
      this.prisma.lessonBadge.findMany({
        where: { userId }
      })
    ]);

    return {
      lessonProgress,
      examSubmissions,
      questionAttempts: questionAttempts.map(answer => ({
        question: answer.question,
        isCorrect: answer.isCorrect,
        timeSpent: 0, // ExamAnswer doesn't have timeSpent
        createdAt: answer.submission.startedAt
      })),
      studySessions,
      badges
    };
  }

  private async analyzeLearningStyle(userData: any) {
    // Analyze content type preferences, study patterns, etc.
    const contentTypes = userData.lessonProgress.map((p: any) => 
      p.lesson.lmsContent?.map((c: any) => c.contentType) || []
    ).flat();

    const typeCounts = contentTypes.reduce((acc: any, type: string) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Simple heuristic-based analysis
    return {
      visual: typeCounts['VIDEO'] || typeCounts['IMAGE'] || 0,
      auditory: typeCounts['AUDIO'] || 0,
      kinesthetic: typeCounts['QUIZ'] || typeCounts['ASSIGNMENT'] || 0,
      reading: typeCounts['TEXT'] || typeCounts['FILE'] || 0
    };
  }

  private async analyzeOptimalStudyTime(userData: any) {
    // Analyze when user is most active
    const sessionHours = userData.studySessions.map((session: any) => 
      new Date(session.lastActivityAt).getHours()
    );

    const hourCounts = sessionHours.reduce((acc: any, hour: number) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const peakHour = Object.keys(hourCounts).reduce((a, b) => 
      hourCounts[a] > hourCounts[b] ? a : b
    );

    return `${peakHour}:00`;
  }

  private async analyzeAttentionSpan(userData: any) {
    // Calculate average session duration
    const sessionDurations = userData.studySessions.map((session: any) => {
      const start = new Date(session.createdAt);
      const end = new Date(session.lastActivityAt);
      return (end.getTime() - start.getTime()) / (1000 * 60); // minutes
    });

    return Math.round(
      sessionDurations.reduce((sum: number, duration: number) => sum + duration, 0) / 
      Math.max(sessionDurations.length, 1)
    );
  }

  private async analyzeConceptMasteryData(userData: any) {
    const conceptPerformance = new Map();

    // Analyze question attempts
    userData.questionAttempts.forEach((attempt: any) => {
      const conceptId = attempt.question.topicId;
      const conceptName = attempt.question.topic.name;
      
      if (!conceptPerformance.has(conceptId)) {
        conceptPerformance.set(conceptId, {
          conceptId,
          conceptName,
          attempts: 0,
          correct: 0,
          totalTime: 0,
          lastAttempted: null
        });
      }

      const concept = conceptPerformance.get(conceptId);
      concept.attempts++;
      if (attempt.isCorrect) concept.correct++;
      concept.totalTime += attempt.timeSpent || 0;
      concept.lastAttempted = new Date(attempt.createdAt);
    });

    const weakConcepts = [];
    const strongConcepts = [];

    for (const [conceptId, data] of conceptPerformance) {
      const accuracy = data.correct / data.attempts;
      const avgTime = data.totalTime / data.attempts;

      if (accuracy < 0.6) {
        weakConcepts.push({
          conceptId,
          conceptName: data.conceptName,
          difficulty: Math.round((1 - accuracy) * 100),
          attempts: data.attempts,
          lastAttempted: data.lastAttempted
        });
      } else if (accuracy > 0.8 && data.attempts >= 5) {
        strongConcepts.push({
          conceptId,
          conceptName: data.conceptName,
          mastery: Math.round(accuracy * 100),
          lastPracticed: data.lastAttempted
        });
      }
    }

    return { weak: weakConcepts, strong: strongConcepts };
  }

  private async calculateLearningVelocity(userData: any) {
    const recentProgress = userData.lessonProgress.filter((p: any) => 
      new Date(p.lastAccessedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    const completedLessons = recentProgress.filter((p: any) => p.status === 'COMPLETED');
    const topicsPerWeek = (completedLessons.length / 4); // 4 weeks in a month

    const totalTime = recentProgress.reduce((sum: number, p: any) => sum + p.timeSpent, 0);
    const averageTimePerTopic = totalTime / Math.max(completedLessons.length, 1);

    // Calculate retention rate based on repeated attempts
    const retentionRate = await this.calculateRetentionRate(userData);

    return {
      topicsPerWeek: Math.round(topicsPerWeek * 10) / 10,
      averageTimePerTopic: Math.round(averageTimePerTopic / 60), // in minutes
      retentionRate: Math.round(retentionRate * 100) / 100
    };
  }

  private async calculateRetentionRate(userData: any) {
    // Analyze how often students need to retry concepts
    const retryCount = userData.questionAttempts.filter((attempt: any, index: number, arr: any[]) => {
      return arr.findIndex(a => a.questionId === attempt.questionId && a.id !== attempt.id) !== -1;
    }).length;

    const totalAttempts = userData.questionAttempts.length;
    return 1 - (retryCount / Math.max(totalAttempts, 1));
  }

  private async generatePerformancePredictions(userData: any) {
    const recentPerformance = userData.examSubmissions
      .filter((sub: any) => new Date(sub.submittedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .map((sub: any) => sub.score || 0);

    const avgScore = recentPerformance.reduce((sum: number, score: number) => sum + score, 0) / 
                    Math.max(recentPerformance.length, 1);

    let nextTopicDifficulty = 'MEDIUM';
    if (avgScore > 80) nextTopicDifficulty = 'HARD';
    else if (avgScore < 60) nextTopicDifficulty = 'EASY';

    const estimatedCompletionTime = await this.estimateCompletionTime(userData);
    const successProbability = Math.min(avgScore / 100, 0.95); // Cap at 95%

    return {
      nextTopicDifficulty,
      estimatedCompletionTime,
      successProbability: Math.round(successProbability * 100) / 100
    };
  }

  private async estimateCompletionTime(userData: any) {
    const recentProgress = userData.lessonProgress.filter((p: any) => 
      p.status === 'COMPLETED' && 
      new Date(p.completedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    );

    if (recentProgress.length === 0) return 60; // Default 1 hour

    const avgTime = recentProgress.reduce((sum: number, p: any) => sum + p.timeSpent, 0) / 
                   recentProgress.length;

    return Math.round(avgTime / 60); // Convert to minutes
  }

  private async identifyPreferredContentTypes(userData: any) {
    const contentTypes = userData.lessonProgress.map((p: any) => 
      p.lesson.lmsContent?.map((c: any) => c.contentType) || []
    ).flat();

    const typeCounts = contentTypes.reduce((acc: any, type: string) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return Object.keys(typeCounts)
      .sort((a, b) => typeCounts[b] - typeCounts[a])
      .slice(0, 3);
  }

  private async analyzePerformanceTrend(userData: any): Promise<LearningInsight> {
    const recentScores = userData.examSubmissions
      .sort((a: any, b: any) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime())
      .slice(-10)
      .map((sub: any) => sub.score || 0);

    if (recentScores.length < 3) {
      return {
        type: 'PERFORMANCE_TREND',
        title: 'Insufficient Data',
        description: 'Need more test attempts to analyze performance trends',
        data: recentScores,
        confidence: 0,
        recommendations: ['Take more practice tests to get insights'],
        priority: 'LOW'
      };
    }

    const trend = this.calculateTrend(recentScores);
    const isImproving = trend > 0.1;
    const isDeclining = trend < -0.1;

    let title = 'Performance Trend';
    let description = 'Your performance is stable';
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    let recommendations: any[] = [];

    if (isImproving) {
      title = 'Performance Improving';
      description = `Your scores are trending upward by ${Math.round(trend * 100)}% per test`;
      recommendations = ['Keep up the great work!', 'Continue current study methods'];
    } else if (isDeclining) {
      title = 'Performance Declining';
      description = `Your scores are trending downward by ${Math.round(Math.abs(trend) * 100)}% per test`;
      priority = 'HIGH';
      recommendations = ['Review recent topics', 'Take a break and return refreshed', 'Focus on fundamentals'];
    }

    return {
      type: 'PERFORMANCE_TREND',
      title,
      description,
      data: { scores: recentScores, trend },
      confidence: Math.min(recentScores.length * 10, 90),
      recommendations,
      priority
    };
  }

  private async analyzeLearningPattern(userData: any): Promise<LearningInsight> {
    const sessionPatterns = userData.studySessions.map((session: any) => ({
      hour: new Date(session.lastActivityAt).getHours(),
      day: new Date(session.lastActivityAt).getDay(),
      duration: (new Date(session.lastActivityAt).getTime() - new Date(session.createdAt).getTime()) / (1000 * 60)
    }));

    const avgDuration = sessionPatterns.reduce((sum: number, s: any) => sum + s.duration, 0) / 
                       Math.max(sessionPatterns.length, 1);

    let title = 'Learning Pattern';
    let description = `You study for an average of ${Math.round(avgDuration)} minutes per session`;
    let recommendations: any[] = [];

    if (avgDuration < 30) {
      description += '. Consider longer study sessions for better retention.';
      recommendations = ['Try 45-60 minute study sessions', 'Use Pomodoro technique'];
    } else if (avgDuration > 120) {
      description += '. Great focus! Make sure to take breaks.';
      recommendations = ['Take 10-minute breaks every hour', 'Stay hydrated during long sessions'];
    }

    return {
      type: 'LEARNING_PATTERN',
      title,
      description,
      data: { sessionPatterns, avgDuration },
      confidence: Math.min(sessionPatterns.length * 5, 80),
      recommendations,
      priority: 'MEDIUM'
    };
  }

  private async analyzeStrengthWeakness(userData: any): Promise<LearningInsight> {
    const conceptAnalysis = await this.analyzeConceptMasteryData(userData);
    
    return {
      type: 'STRENGTH_WEAKNESS',
      title: 'Strengths & Weaknesses',
      description: `You have ${conceptAnalysis.strong.length} strong concepts and ${conceptAnalysis.weak.length} areas needing improvement`,
      data: { strengths: conceptAnalysis.strong, weaknesses: conceptAnalysis.weak },
      confidence: 85,
      recommendations: [
        'Focus on weak concepts first',
        'Use strong concepts to build confidence',
        'Create a study plan balancing both'
      ],
      priority: conceptAnalysis.weak.length > 3 ? 'HIGH' : 'MEDIUM'
    };
  }

  private async analyzeStudyEfficiency(userData: any): Promise<LearningInsight> {
    const velocity = await this.calculateLearningVelocity(userData);
    
    return {
      type: 'STUDY_EFFICIENCY',
      title: 'Study Efficiency',
      description: `You complete ${velocity.topicsPerWeek} topics per week with ${Math.round(velocity.retentionRate * 100)}% retention`,
      data: velocity,
      confidence: 75,
      recommendations: velocity.topicsPerWeek < 2 ? 
        ['Increase study frequency', 'Focus on one topic at a time'] :
        ['Great pace! Maintain consistency', 'Consider advanced topics'],
      priority: 'MEDIUM'
    };
  }

  private async analyzeConceptMastery(userData: any): Promise<LearningInsight> {
    const masteryMap = await this.generateConceptMasteryMap(userData.userId, '');
    
    return {
      type: 'CONCEPT_MASTERY',
      title: 'Concept Mastery Overview',
      description: `You have mastered ${masteryMap.filter(c => c.masteryLevel > 80).length} concepts`,
      data: masteryMap,
      confidence: 80,
      recommendations: [
        'Review concepts with low mastery',
        'Practice advanced applications',
        'Connect related concepts'
      ],
      priority: 'MEDIUM'
    };
  }

  private calculateTrend(scores: number[]): number {
    if (scores.length < 2) return 0;
    
    const n = scores.length;
    const x = Array.from({length: n}, (_, i) => i);
    const y = scores;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  private async calculateConceptMastery(concept: any, userData: any): Promise<number> {
    const conceptAttempts = userData.questionAttempts.filter((attempt: any) => 
      attempt.question.topicId === concept.id
    );

    if (conceptAttempts.length === 0) return 0;

    const correctAttempts = conceptAttempts.filter((attempt: any) => attempt.isCorrect);
    const accuracy = correctAttempts.length / conceptAttempts.length;
    
    // Factor in recent performance more heavily
    const recentAttempts = conceptAttempts.filter((attempt: any) => 
      new Date(attempt.createdAt) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    );
    
    if (recentAttempts.length > 0) {
      const recentAccuracy = recentAttempts.filter((attempt: any) => attempt.isCorrect).length / recentAttempts.length;
      return Math.round((accuracy * 0.3 + recentAccuracy * 0.7) * 100);
    }
    
    return Math.round(accuracy * 100);
  }

  private async identifyPrerequisites(concept: any): Promise<string[]> {
    // Simple heuristic - in a real implementation, this would be more sophisticated
    return [];
  }

  private async identifyDependentConcepts(concept: any): Promise<string[]> {
    // Simple heuristic - in a real implementation, this would be more sophisticated
    return [];
  }

  private async generateLearningPath(concept: any, mastery: number): Promise<string[]> {
    if (mastery < 50) {
      return ['Review fundamentals', 'Practice basic problems', 'Take concept quiz'];
    } else if (mastery < 80) {
      return ['Practice medium problems', 'Review common mistakes', 'Take advanced quiz'];
    } else {
      return ['Solve complex problems', 'Teach others', 'Explore applications'];
    }
  }

  private async generatePracticeRecommendations(concept: any, mastery: number): Promise<string[]> {
    if (mastery < 50) {
      return ['Start with basic problems', 'Review theory', 'Watch explanatory videos'];
    } else if (mastery < 80) {
      return ['Practice mixed problems', 'Focus on weak areas', 'Time yourself'];
    } else {
      return ['Challenge problems', 'Real-world applications', 'Help struggling peers'];
    }
  }

  private async callOpenAI(prompt: string): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educational data analyst. Provide concise, actionable insights based on learning data.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      this.logger.error('OpenAI API call failed:', error);
      throw error;
    }
  }
}
