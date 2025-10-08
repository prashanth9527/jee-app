import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface AdaptiveQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topicId: string;
  subtopicId?: string;
  estimatedTime: number; // in seconds
  isAIGenerated: boolean;
  aiPrompt?: string;
}

export interface AdaptiveTestConfig {
  userId: string;
  subjectId?: string;
  topicId?: string;
  subtopicId?: string;
  questionCount: number;
  timeLimit?: number; // in minutes
  difficultyStart: 'EASY' | 'MEDIUM' | 'HARD';
  adaptiveMode: boolean;
  focusAreas?: string[];
}

export interface AdaptiveTestSession {
  sessionId: string;
  userId: string;
  questions: AdaptiveQuestion[];
  currentQuestionIndex: number;
  answers: Array<{
    questionId: string;
    answer: number;
    timeSpent: number;
    isCorrect: boolean;
    timestamp: Date;
  }>;
  difficultyProgression: Array<{
    questionIndex: number;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    reason: string;
  }>;
  estimatedScore: number;
  timeRemaining: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  startedAt: Date;
  completedAt?: Date;
}

export interface AssessmentResult {
  sessionId: string;
  userId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: number;
  averageTimePerQuestion: number;
  difficultyAnalysis: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
  };
  topicPerformance: Array<{
    topicId: string;
    topicName: string;
    score: number;
    questions: number;
  }>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  nextSteps: string[];
  confidenceLevel: number;
}

@Injectable()
export class AIAssessmentsService {
  private readonly logger = new Logger(AIAssessmentsService.name);
  private readonly openaiApiKey: string;
  private readonly openaiBaseUrl: string;
  private readonly openaiModel: string;
  private activeSessions = new Map<string, AdaptiveTestSession>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    this.openaiModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
  }

  async createAdaptiveTest(config: AdaptiveTestConfig): Promise<AdaptiveTestSession> {
    try {
      // Get user's performance history for adaptive difficulty
      const userPerformance = await this.analyzeUserPerformance(config.userId, config.subjectId);
      
      // Generate or select questions based on configuration
      const questions = await this.generateAdaptiveQuestions(config, userPerformance);
      
      // Create test session
      const session: AdaptiveTestSession = {
        sessionId: this.generateSessionId(),
        userId: config.userId,
        questions,
        currentQuestionIndex: 0,
        answers: [],
        difficultyProgression: [],
        estimatedScore: 0,
        timeRemaining: config.timeLimit ? config.timeLimit * 60 : 3600, // Default 1 hour
        status: 'ACTIVE',
        startedAt: new Date()
      };

      // Store session
      this.activeSessions.set(session.sessionId, session);

      // Save to database
      await this.saveTestSession(session);

      return session;
    } catch (error) {
      this.logger.error('Error creating adaptive test:', error);
      throw new Error('Failed to create adaptive test');
    }
  }

  async submitAnswer(sessionId: string, questionId: string, answer: number, timeSpent: number): Promise<AdaptiveTestSession> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Test session not found');
      }

      const question = session.questions.find(q => q.id === questionId);
      if (!question) {
        throw new Error('Question not found');
      }

      const isCorrect = answer === question.correctAnswer;
      
      // Add answer to session
      session.answers.push({
        questionId,
        answer,
        timeSpent,
        isCorrect,
        timestamp: new Date()
      });

      // Update difficulty progression if in adaptive mode
      if (session.questions.length > session.currentQuestionIndex + 1) {
        const nextDifficulty = await this.calculateNextDifficulty(session, isCorrect, timeSpent);
        session.difficultyProgression.push({
          questionIndex: session.currentQuestionIndex,
          difficulty: nextDifficulty,
          reason: this.getDifficultyReason(isCorrect, timeSpent)
        });

        // Adjust next question difficulty if needed
        if (session.questions[session.currentQuestionIndex + 1]) {
          session.questions[session.currentQuestionIndex + 1].difficulty = nextDifficulty;
        }
      }

      // Update estimated score
      session.estimatedScore = this.calculateEstimatedScore(session);

      // Update time remaining
      session.timeRemaining -= timeSpent;

      // Move to next question
      session.currentQuestionIndex++;

      // Check if test is complete
      if (session.currentQuestionIndex >= session.questions.length) {
        session.status = 'COMPLETED';
        session.completedAt = new Date();
        await this.completeTestSession(session);
      }

      // Save updated session
      await this.saveTestSession(session);

      return session;
    } catch (error) {
      this.logger.error('Error submitting answer:', error);
      throw new Error('Failed to submit answer');
    }
  }

  async getAssessmentResult(sessionId: string): Promise<AssessmentResult> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        throw new Error('Test session not found');
      }

      if (session.status !== 'COMPLETED') {
        throw new Error('Test session not completed');
      }

      const result = await this.generateAssessmentResult(session);
      
      // Save result to database
      await this.saveAssessmentResult(result);

      return result;
    } catch (error) {
      this.logger.error('Error getting assessment result:', error);
      throw new Error('Failed to get assessment result');
    }
  }

  async generateAIGeneratedQuestions(
    subjectId: string,
    topicId?: string,
    subtopicId?: string,
    count: number = 5,
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM'
  ): Promise<AdaptiveQuestion[]> {
    try {
      const context = await this.getQuestionContext(subjectId, topicId, subtopicId);
      const prompt = this.buildQuestionGenerationPrompt(context, count, difficulty);
      
      const aiResponse = await this.callOpenAI(prompt);
      const questions = this.parseAIQuestions(aiResponse, subjectId, topicId, subtopicId);

      return questions;
    } catch (error) {
      this.logger.error('Error generating AI questions:', error);
      throw new Error('Failed to generate AI questions');
    }
  }

  async pauseTestSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'PAUSED';
      await this.saveTestSession(session);
    }
  }

  async resumeTestSession(sessionId: string): Promise<AdaptiveTestSession> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error('Test session not found');
    }

    session.status = 'ACTIVE';
    await this.saveTestSession(session);
    return session;
  }

  private async analyzeUserPerformance(userId: string, subjectId?: string): Promise<any> {
    const whereClause: any = { userId };
    if (subjectId) {
      whereClause.question = {
        topic: { subjectId }
      };
    }

    const recentSubmissions = await       this.prisma.examAnswer.findMany({
        where: {
          submission: {
            userId: whereClause.userId
          },
          ...(subjectId && {
            question: {
              topic: { subjectId }
            }
          })
        },
        include: {
          question: {
            include: {
              topic: true,
              subtopic: true
            }
          },
          submission: true
        },
        orderBy: { submission: { startedAt: 'desc' } },
        take: 50
      });

    const performance = {
      averageScore: 0,
      averageTime: 0,
      difficultyPerformance: {
        EASY: { correct: 0, total: 0 },
        MEDIUM: { correct: 0, total: 0 },
        HARD: { correct: 0, total: 0 }
      },
      topicPerformance: new Map(),
      recentTrend: 'STABLE'
    };

    if (recentSubmissions.length === 0) {
      return performance;
    }

    // Calculate average score and time
    const correctAnswers = recentSubmissions.filter(s => s.isCorrect).length;
    performance.averageScore = (correctAnswers / recentSubmissions.length) * 100;
    
    const totalTime = recentSubmissions.reduce((sum, s) => sum + 0, 0); // ExamAnswer doesn't have timeSpent
    performance.averageTime = totalTime / recentSubmissions.length;

    // Analyze difficulty performance
    recentSubmissions.forEach(submission => {
      const difficulty = submission.question.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
      performance.difficultyPerformance[difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD'].total++;
      if (submission.isCorrect) {
        performance.difficultyPerformance[difficulty.toUpperCase() as 'EASY' | 'MEDIUM' | 'HARD'].correct++;
      }
    });

    // Analyze topic performance
    recentSubmissions.forEach(submission => {
      const topicId = submission.question.topicId;
      if (topicId && !performance.topicPerformance.has(topicId)) {
        performance.topicPerformance.set(topicId, { correct: 0, total: 0 });
      }
      if (topicId) {
        const topicPerf = performance.topicPerformance.get(topicId);
        topicPerf.total++;
        if (submission.isCorrect) {
          topicPerf.correct++;
        }
      }
    });

    // Calculate recent trend
    const recent = recentSubmissions.slice(0, 10);
    const older = recentSubmissions.slice(10, 20);
    
    if (recent.length > 0 && older.length > 0) {
      const recentScore = recent.filter((s: any) => s.isCorrect).length / recent.length;
      const olderScore = older.filter((s: any) => s.isCorrect).length / older.length;
      
      if (recentScore > olderScore + 0.1) {
        performance.recentTrend = 'IMPROVING';
      } else if (recentScore < olderScore - 0.1) {
        performance.recentTrend = 'DECLINING';
      }
    }

    return performance;
  }

  private async generateAdaptiveQuestions(config: AdaptiveTestConfig, userPerformance: any): Promise<AdaptiveQuestion[]> {
    const questions: AdaptiveQuestion[] = [];
    const questionPool = await this.getQuestionPool(config, userPerformance);
    
    // Select questions based on adaptive algorithm
    let currentDifficulty = config.difficultyStart;
    let questionsSelected = 0;

    while (questionsSelected < config.questionCount && questionsSelected < questionPool.length) {
      // Filter questions by current difficulty
      const availableQuestions = questionPool.filter(q => q.difficulty === currentDifficulty);
      
      if (availableQuestions.length > 0) {
        // Select random question from available pool
        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const selectedQuestion = availableQuestions[randomIndex];
        
        questions.push(selectedQuestion);
        
        // Remove selected question from pool
        const questionIndex = questionPool.findIndex(q => q.id === selectedQuestion.id);
        questionPool.splice(questionIndex, 1);
        
        questionsSelected++;
        
        // Adjust difficulty for next question based on adaptive algorithm
        if (config.adaptiveMode && questionsSelected < config.questionCount) {
          currentDifficulty = this.calculateNextDifficultyBasedOnPerformance(
            questions, 
            userPerformance, 
            currentDifficulty
          );
        }
      } else {
        // If no questions available for current difficulty, try next level
        if (currentDifficulty === 'EASY') currentDifficulty = 'MEDIUM';
        else if (currentDifficulty === 'MEDIUM') currentDifficulty = 'HARD';
        else break; // No more questions available
      }
    }

    return questions;
  }

  private async getQuestionPool(config: AdaptiveTestConfig, userPerformance: any): Promise<AdaptiveQuestion[]> {
    const whereClause: any = { isActive: true };
    
    if (config.subjectId) {
      whereClause.topic = { subjectId: config.subjectId };
    }
    if (config.topicId) {
      whereClause.topicId = config.topicId;
    }
    if (config.subtopicId) {
      whereClause.subtopicId = config.subtopicId;
    }

    const dbQuestions = await this.prisma.question.findMany({
      where: whereClause,
      include: {
        options: true,
        topic: true,
        subtopic: true
      },
      take: 100 // Limit to avoid performance issues
    });

    // Convert to AdaptiveQuestion format
    const questions: AdaptiveQuestion[] = dbQuestions.map(q => ({
      id: q.id,
      question: q.stem, // Use 'stem' instead of 'question'
      options: q.options.map(opt => opt.text),
      correctAnswer: q.options.findIndex(opt => opt.isCorrect),
      explanation: q.explanation || 'Explanation not available',
      difficulty: q.difficulty,
      topicId: q.topicId || '', // Handle null case
      subtopicId: q.subtopicId || undefined,
      estimatedTime: 120, // Default 2 minutes since estimatedTime doesn't exist
      isAIGenerated: q.isAIGenerated || false,
      aiPrompt: q.aiPrompt || undefined
    }));

    // Generate additional AI questions if needed
    if (questions.length < config.questionCount * 2) {
      try {
        const aiQuestions = await this.generateAIGeneratedQuestions(
          config.subjectId || '',
          config.topicId,
          config.subtopicId,
          Math.max(10, config.questionCount),
          config.difficultyStart
        );
        questions.push(...aiQuestions);
      } catch (error) {
        this.logger.warn('Failed to generate AI questions:', error);
      }
    }

    return questions;
  }

  private calculateNextDifficultyBasedOnPerformance(
    currentQuestions: AdaptiveQuestion[],
    userPerformance: any,
    currentDifficulty: 'EASY' | 'MEDIUM' | 'HARD'
  ): 'EASY' | 'MEDIUM' | 'HARD' {
    // Simple adaptive algorithm
    if (currentQuestions.length === 0) return currentDifficulty;

    const recentAnswers = currentQuestions.slice(-3); // Look at last 3 questions
    const correctRate = recentAnswers.filter(q => {
      // This would need actual answer data, simplified for now
      return Math.random() > 0.5; // Placeholder
    }).length / recentAnswers.length;

    if (correctRate >= 0.8 && currentDifficulty !== 'HARD') {
      return currentDifficulty === 'EASY' ? 'MEDIUM' : 'HARD';
    } else if (correctRate <= 0.4 && currentDifficulty !== 'EASY') {
      return currentDifficulty === 'HARD' ? 'MEDIUM' : 'EASY';
    }

    return currentDifficulty;
  }

  private async calculateNextDifficulty(session: AdaptiveTestSession, isCorrect: boolean, timeSpent: number): Promise<'EASY' | 'MEDIUM' | 'HARD'> {
    const recentAnswers = session.answers.slice(-3);
    const correctRate = recentAnswers.filter(a => a.isCorrect).length / Math.max(recentAnswers.length, 1);
    
    if (correctRate >= 0.8) {
      return 'HARD';
    } else if (correctRate <= 0.4) {
      return 'EASY';
    }
    
    return 'MEDIUM';
  }

  private getDifficultyReason(isCorrect: boolean, timeSpent: number): string {
    if (isCorrect && timeSpent < 60) {
      return 'Quick correct answer - increasing difficulty';
    } else if (isCorrect && timeSpent > 180) {
      return 'Correct but slow - maintaining difficulty';
    } else if (!isCorrect && timeSpent < 60) {
      return 'Quick incorrect answer - decreasing difficulty';
    } else {
      return 'Standard performance - maintaining difficulty';
    }
  }

  private calculateEstimatedScore(session: AdaptiveTestSession): number {
    if (session.answers.length === 0) return 0;
    
    const correctAnswers = session.answers.filter(a => a.isCorrect).length;
    return Math.round((correctAnswers / session.answers.length) * 100);
  }

  private async generateAssessmentResult(session: AdaptiveTestSession): Promise<AssessmentResult> {
    const totalQuestions = session.questions.length;
    const correctAnswers = session.answers.filter(a => a.isCorrect).length;
    const score = Math.round((correctAnswers / totalQuestions) * 100);
    
    const timeSpent = session.answers.reduce((sum, a) => sum + a.timeSpent, 0);
    const averageTimePerQuestion = Math.round(timeSpent / totalQuestions);

    // Analyze difficulty performance
    const difficultyAnalysis = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 }
    };

    session.answers.forEach(answer => {
      const question = session.questions.find(q => q.id === answer.questionId);
      if (question) {
        const diff = question.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard';
        difficultyAnalysis[diff].total++;
        if (answer.isCorrect) {
          difficultyAnalysis[diff].correct++;
        }
      }
    });

    // Analyze topic performance
    const topicPerformance = new Map();
    session.answers.forEach(answer => {
      const question = session.questions.find(q => q.id === answer.questionId);
      if (question) {
        if (!topicPerformance.has(question.topicId)) {
          topicPerformance.set(question.topicId, { correct: 0, total: 0, name: '' });
        }
        const topicPerf = topicPerformance.get(question.topicId);
        topicPerf.total++;
        if (answer.isCorrect) {
          topicPerf.correct++;
        }
        topicPerf.name = question.topicId; // Would need actual topic name
      }
    });

    const topicPerformanceArray = Array.from(topicPerformance.entries()).map(([topicId, data]) => ({
      topicId,
      topicName: data.name,
      score: Math.round((data.correct / data.total) * 100),
      questions: data.total
    }));

    // Generate AI-powered insights
    const insights = await this.generateAIInsights(session, score, difficultyAnalysis);

    return {
      sessionId: session.sessionId,
      userId: session.userId,
      totalQuestions,
      correctAnswers,
      score,
      timeSpent,
      averageTimePerQuestion,
      difficultyAnalysis,
      topicPerformance: topicPerformanceArray,
      strengths: insights.strengths,
      weaknesses: insights.weaknesses,
      recommendations: insights.recommendations,
      nextSteps: insights.nextSteps,
      confidenceLevel: insights.confidenceLevel
    };
  }

  private async generateAIInsights(session: AdaptiveTestSession, score: number, difficultyAnalysis: any): Promise<any> {
    try {
      const prompt = `
        Analyze this student's assessment performance and provide insights:
        
        Overall Score: ${score}%
        Total Questions: ${session.questions.length}
        Difficulty Performance:
        - Easy: ${difficultyAnalysis.easy.correct}/${difficultyAnalysis.easy.total}
        - Medium: ${difficultyAnalysis.medium.correct}/${difficultyAnalysis.medium.total}
        - Hard: ${difficultyAnalysis.hard.correct}/${difficultyAnalysis.hard.total}
        
        Provide:
        1. 3 key strengths
        2. 3 main weaknesses
        3. 5 specific recommendations
        4. 3 next steps
        5. Confidence level (0-100)
        
        Format as JSON.
      `;

      const response = await this.callOpenAI(prompt);
      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Error generating AI insights:', error);
      return {
        strengths: ['Good time management', 'Consistent performance'],
        weaknesses: ['Difficulty with complex problems', 'Need more practice'],
        recommendations: ['Practice more difficult problems', 'Review weak areas'],
        nextSteps: ['Focus on weak topics', 'Take more practice tests'],
        confidenceLevel: 75
      };
    }
  }

  private async getQuestionContext(subjectId: string, topicId?: string, subtopicId?: string): Promise<any> {
    const context: any = {};

    if (subjectId) {
      context.subject = await this.prisma.subject.findUnique({
        where: { id: subjectId },
        include: { stream: true }
      });
    }

    if (topicId) {
      context.topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
        include: { subject: true, lesson: true }
      });
    }

    if (subtopicId) {
      context.subtopic = await this.prisma.subtopic.findUnique({
        where: { id: subtopicId },
        include: { topic: { include: { subject: true } } }
      });
    }

    return context;
  }

  private buildQuestionGenerationPrompt(context: any, count: number, difficulty: string): string {
    let prompt = `Generate ${count} JEE-level multiple choice questions with 4 options each.`;
    
    if (context.subject) {
      prompt += ` Subject: ${context.subject.name}`;
    }
    if (context.topic) {
      prompt += ` Topic: ${context.topic.name}`;
    }
    if (context.subtopic) {
      prompt += ` Subtopic: ${context.subtopic.name}`;
    }
    
    prompt += ` Difficulty: ${difficulty}.`;
    prompt += ` Include detailed explanations for each answer.`;
    prompt += ` Format as JSON array with question, options, correctAnswer (0-3), explanation, and difficulty fields.`;

    return prompt;
  }

  private parseAIQuestions(response: string, subjectId: string, topicId?: string, subtopicId?: string): AdaptiveQuestion[] {
    try {
      const parsed = JSON.parse(response);
      return parsed.map((q: any, index: number) => ({
        id: `ai_${Date.now()}_${index}`,
        question: q.question,
        options: q.options || [],
        correctAnswer: q.correctAnswer || 0,
        explanation: q.explanation || 'Explanation not available',
        difficulty: q.difficulty || 'MEDIUM',
        topicId: topicId || '',
        subtopicId: subtopicId,
        estimatedTime: 120,
        isAIGenerated: true,
        aiPrompt: `AI Generated for ${subjectId}`
      }));
    } catch (error) {
      this.logger.error('Error parsing AI questions:', error);
      return [];
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
          model: this.openaiModel,

          messages: [
            {
              role: 'system',
              content: 'You are an expert JEE question generator. Create high-quality, challenging questions suitable for competitive exam preparation.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
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

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async saveTestSession(session: AdaptiveTestSession): Promise<void> {
    // In a real implementation, you'd save this to the database
    // For now, we're using in-memory storage
    this.activeSessions.set(session.sessionId, session);
  }

  private async completeTestSession(session: AdaptiveTestSession): Promise<void> {
    // Save completed session to database
    await this.prisma.examSubmission.create({
      data: {
        userId: session.userId,
        examPaperId: `adaptive_${session.sessionId}`, // Use examPaperId instead of paperId
        totalQuestions: session.questions.length,
        correctCount: session.answers.filter(a => a.isCorrect).length,
        scorePercent: session.estimatedScore,
        submittedAt: session.completedAt,
        answers: {
          create: session.answers.map(answer => ({
            questionId: answer.questionId,
            selectedOptionId: answer.answer.toString(), // Convert to string
            isCorrect: answer.isCorrect
          }))
        }
      }
    });
  }

  private async saveAssessmentResult(result: AssessmentResult): Promise<void> {
    // Save assessment result to database
    // This could be stored in a separate assessment_results table
    console.log('Assessment result saved:', result.sessionId);
  }
}
