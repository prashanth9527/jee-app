import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

export interface AILessonSummary {
  keyConcepts: string[];
  importantFormulas: string[];
  commonMistakes: string[];
  practiceTips: string[];
  relatedTopics: string[];
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedStudyTime: number; // in minutes
  prerequisites: string[];
  learningObjectives: string[];
}

export interface AITopicExplanation {
  overview: string;
  keyPoints: string[];
  detailedExplanation: string;
  examples: Array<{
    problem: string;
    solution: string;
    explanation: string;
  }>;
  visualAids: Array<{
    type: 'DIAGRAM' | 'CHART' | 'GRAPH' | 'FORMULA';
    description: string;
    content: string;
  }>;
  commonQuestions: Array<{
    question: string;
    answer: string;
  }>;
  practiceExercises: Array<{
    problem: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    hints: string[];
  }>;
}

export interface AIMicroLesson {
  lessonId: string;
  title: string;
  duration: number; // in minutes
  content: {
    introduction: string;
    mainContent: string;
    summary: string;
    keyTakeaways: string[];
  };
  interactiveElements: Array<{
    type: 'QUIZ' | 'EXERCISE' | 'REFLECTION';
    content: string;
    expectedResponse?: string;
  }>;
  assessment: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
  };
}

export interface ContentEnhancementRequest {
  contentId: string;
  enhancementType: 'SUMMARY' | 'EXPLANATION' | 'EXAMPLES' | 'VISUAL_AIDS' | 'PRACTICE_PROBLEMS';
  targetAudience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  focusAreas?: string[];
}

@Injectable()
export class ContentGenerationService {
  private readonly logger = new Logger(ContentGenerationService.name);
  private readonly openaiApiKey: string;
  private readonly openaiBaseUrl: string;
  private readonly openaiModel: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    this.openaiModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
  }

  async generateLessonSummary(lessonId: string): Promise<AILessonSummary> {
    try {
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          topics: {
            include: {
              subtopics: true,
              questions: {
                where: {},
                take: 10
              }
            }
          },
          lmsContent: true,
          subject: true
        }
      });

      if (!lesson) {
        throw new Error('Lesson not found');
      }

      const prompt = this.buildLessonSummaryPrompt(lesson);
      const aiResponse = await this.callOpenAI(prompt);
      
      return this.parseLessonSummaryResponse(aiResponse, lesson);
    } catch (error) {
      this.logger.error('Error generating lesson summary:', error);
      throw new Error('Failed to generate lesson summary');
    }
  }

  async generateTopicExplanation(topicId: string): Promise<AITopicExplanation> {
    try {
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
        include: {
          subtopics: true,
          questions: {
            where: {},
            include: {
              options: true
            }
          },
          subject: true,
          lesson: true
        }
      });

      if (!topic) {
        throw new Error('Topic not found');
      }

      const prompt = this.buildTopicExplanationPrompt(topic);
      const aiResponse = await this.callOpenAI(prompt);
      
      return this.parseTopicExplanationResponse(aiResponse, topic);
    } catch (error) {
      this.logger.error('Error generating topic explanation:', error);
      throw new Error('Failed to generate topic explanation');
    }
  }

  async generateMicroLesson(subtopicId: string): Promise<AIMicroLesson> {
    try {
      const subtopic = await this.prisma.subtopic.findUnique({
        where: { id: subtopicId },
        include: {
          topic: {
            include: {
              subject: true,
              lesson: true
            }
          },
          questions: {
            where: {},
            include: {
              options: true
            }
          }
        }
      });

      if (!subtopic) {
        throw new Error('Subtopic not found');
      }

      const prompt = this.buildMicroLessonPrompt(subtopic);
      const aiResponse = await this.callOpenAI(prompt);
      
      return this.parseMicroLessonResponse(aiResponse, subtopic);
    } catch (error) {
      this.logger.error('Error generating micro lesson:', error);
      throw new Error('Failed to generate micro lesson');
    }
  }

  async enhanceContent(request: ContentEnhancementRequest): Promise<any> {
    try {
      const content = await this.prisma.lMSContent.findUnique({
        where: { id: request.contentId },
        include: {
          topic: true,
          lesson: true,
          subject: true
        }
      });

      if (!content) {
        throw new Error('Content not found');
      }

      const prompt = this.buildEnhancementPrompt(content, request);
      const aiResponse = await this.callOpenAI(prompt);
      
      return this.parseEnhancementResponse(aiResponse, request);
    } catch (error) {
      this.logger.error('Error enhancing content:', error);
      throw new Error('Failed to enhance content');
    }
  }

  async generateSmartRecommendations(userId: string, subjectId?: string): Promise<any[]> {
    try {
      const userProgress = await this.prisma.lessonProgress.findMany({
        where: { userId },
        include: {
          lesson: {
            include: {
              subject: true,
              topics: {
                include: {
                  questions: {
                    include: {
                      // submissions: {
                      //   where: { userId }
                      // }
                    }
                  }
                }
              }
            }
          }
        }
      });

      const userWeaknesses = await this.analyzeUserWeaknesses(userProgress);
      const recommendations = await this.generateContentRecommendations(userWeaknesses, subjectId);

      return recommendations;
    } catch (error) {
      this.logger.error('Error generating smart recommendations:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  private buildLessonSummaryPrompt(lesson: any): string {
    const topics = lesson.topics.map((topic: any) => topic.name).join(', ');
    const subject = lesson.subject.name;
    const description = lesson.description || '';

    return `
      Generate a comprehensive lesson summary for a JEE preparation lesson:
      
      Subject: ${subject}
      Lesson: ${lesson.name}
      Description: ${description}
      Topics Covered: ${topics}
      
      Create a detailed summary including:
      1. Key concepts (5-7 most important concepts)
      2. Important formulas (if applicable)
      3. Common mistakes students make
      4. Practice tips for this lesson
      5. Related topics for further study
      6. Difficulty level assessment
      7. Estimated study time in minutes
      8. Prerequisites needed
      9. Learning objectives
      
      Format the response as JSON with the following structure:
      {
        "keyConcepts": ["concept1", "concept2", ...],
        "importantFormulas": ["formula1", "formula2", ...],
        "commonMistakes": ["mistake1", "mistake2", ...],
        "practiceTips": ["tip1", "tip2", ...],
        "relatedTopics": ["topic1", "topic2", ...],
        "difficultyLevel": "EASY|MEDIUM|HARD",
        "estimatedStudyTime": number,
        "prerequisites": ["prereq1", "prereq2", ...],
        "learningObjectives": ["objective1", "objective2", ...]
      }
    `;
  }

  private buildTopicExplanationPrompt(topic: any): string {
    const subject = topic.subject.name;
    const lesson = topic.lesson.name;
    const subtopics = topic.subtopics.map((st: any) => st.name).join(', ');

    return `
      Generate a comprehensive topic explanation for JEE preparation:
      
      Subject: ${subject}
      Lesson: ${lesson}
      Topic: ${topic.name}
      Description: ${topic.description || ''}
      Subtopics: ${subtopics}
      
      Create a detailed explanation including:
      1. Overview of the topic
      2. Key points to understand
      3. Detailed explanation with examples
      4. 3-5 worked examples with solutions
      5. Visual aids descriptions (diagrams, charts, etc.)
      6. Common questions and answers
      7. Practice exercises with hints
      
      Format the response as JSON with the specified structure.
      Make it suitable for JEE preparation level.
    `;
  }

  private buildMicroLessonPrompt(subtopic: any): string {
    const subject = subtopic.topic.subject.name;
    const topic = subtopic.topic.name;
    const lesson = subtopic.topic.lesson.name;

    return `
      Generate a micro-lesson (5-10 minutes) for JEE preparation:
      
      Subject: ${subject}
      Lesson: ${lesson}
      Topic: ${topic}
      Subtopic: ${subtopic.name}
      Description: ${subtopic.description || ''}
      
      Create a focused micro-lesson including:
      1. Brief introduction
      2. Main content (concise and clear)
      3. Summary of key points
      4. Key takeaways
      5. Interactive elements (quiz questions, exercises)
      6. Assessment questions with explanations
      
      Keep it focused, engaging, and suitable for quick learning.
      Format the response as JSON with the specified structure.
    `;
  }

  private buildEnhancementPrompt(content: any, request: ContentEnhancementRequest): string {
    const basePrompt = `
      Enhance the following content for JEE preparation:
      
      Content Title: ${content.title}
      Content Type: ${content.contentType}
      Subject: ${content.subject?.name || 'Unknown'}
      Topic: ${content.topic?.name || 'Unknown'}
      
      Enhancement Type: ${request.enhancementType}
      Target Audience: ${request.targetAudience}
      Focus Areas: ${request.focusAreas?.join(', ') || 'General'}
      
      Original Content: ${content.contentData ? JSON.stringify(content.contentData) : 'No content data'}
    `;

    switch (request.enhancementType) {
      case 'SUMMARY':
        return basePrompt + `
          Generate a concise summary highlighting key points and main concepts.
        `;
      case 'EXPLANATION':
        return basePrompt + `
          Provide detailed explanations with step-by-step reasoning.
        `;
      case 'EXAMPLES':
        return basePrompt + `
          Generate relevant examples and practice problems.
        `;
      case 'VISUAL_AIDS':
        return basePrompt + `
          Suggest visual aids, diagrams, and charts to enhance understanding.
        `;
      case 'PRACTICE_PROBLEMS':
        return basePrompt + `
          Create additional practice problems with varying difficulty levels.
        `;
      default:
        return basePrompt;
    }
  }

  private parseLessonSummaryResponse(response: string, lesson: any): AILessonSummary {
    try {
      const parsed = JSON.parse(response);
      return {
        keyConcepts: parsed.keyConcepts || [],
        importantFormulas: parsed.importantFormulas || [],
        commonMistakes: parsed.commonMistakes || [],
        practiceTips: parsed.practiceTips || [],
        relatedTopics: parsed.relatedTopics || [],
        difficultyLevel: parsed.difficultyLevel || 'MEDIUM',
        estimatedStudyTime: parsed.estimatedStudyTime || 60,
        prerequisites: parsed.prerequisites || [],
        learningObjectives: parsed.learningObjectives || []
      };
    } catch (error) {
      this.logger.error('Error parsing lesson summary response:', error);
      return this.getDefaultLessonSummary(lesson);
    }
  }

  private parseTopicExplanationResponse(response: string, topic: any): AITopicExplanation {
    try {
      const parsed = JSON.parse(response);
      return {
        overview: parsed.overview || 'Topic overview not available',
        keyPoints: parsed.keyPoints || [],
        detailedExplanation: parsed.detailedExplanation || 'Detailed explanation not available',
        examples: parsed.examples || [],
        visualAids: parsed.visualAids || [],
        commonQuestions: parsed.commonQuestions || [],
        practiceExercises: parsed.practiceExercises || []
      };
    } catch (error) {
      this.logger.error('Error parsing topic explanation response:', error);
      return this.getDefaultTopicExplanation(topic);
    }
  }

  private parseMicroLessonResponse(response: string, subtopic: any): AIMicroLesson {
    try {
      const parsed = JSON.parse(response);
      return {
        lessonId: subtopic.id,
        title: parsed.title || subtopic.name,
        duration: parsed.duration || 10,
        content: parsed.content || {
          introduction: 'Introduction not available',
          mainContent: 'Main content not available',
          summary: 'Summary not available',
          keyTakeaways: []
        },
        interactiveElements: parsed.interactiveElements || [],
        assessment: parsed.assessment || { questions: [] }
      };
    } catch (error) {
      this.logger.error('Error parsing micro lesson response:', error);
      return this.getDefaultMicroLesson(subtopic);
    }
  }

  private parseEnhancementResponse(response: string, request: ContentEnhancementRequest): any {
    try {
      return JSON.parse(response);
    } catch (error) {
      this.logger.error('Error parsing enhancement response:', error);
      return {
        type: request.enhancementType,
        content: response,
        success: false,
        error: 'Failed to parse AI response'
      };
    }
  }

  private async analyzeUserWeaknesses(userProgress: any[]): Promise<any[]> {
    const weaknesses = [];

    for (const progress of userProgress) {
      if (progress.averageScore && progress.averageScore < 70) {
        weaknesses.push({
          lessonId: progress.lessonId,
          lessonName: progress.lesson.name,
          subjectId: progress.lesson.subject.id,
          subjectName: progress.lesson.subject.name,
          score: progress.averageScore,
          topics: progress.lesson.topics.map((topic: any) => ({
            id: topic.id,
            name: topic.name,
            weakQuestions: 0 // Simplified for now since submissions don't exist
          }))
        });
      }
    }

    return weaknesses;
  }

  private async generateContentRecommendations(weaknesses: any[], subjectId?: string): Promise<any[]> {
    const recommendations = [];

    for (const weakness of weaknesses) {
      if (subjectId && weakness.subjectId !== subjectId) continue;

      const relevantContent = await this.prisma.lMSContent.findMany({
        where: {
          subjectId: weakness.subjectId,
          status: 'PUBLISHED',
          OR: weakness.topics.map((topic: any) => ({
            topicId: topic.id
          }))
        },
        take: 5
      });

      recommendations.push({
        type: 'WEAK_AREA_FOCUS',
        title: `Focus on ${weakness.lessonName}`,
        description: `Your average score is ${weakness.score}%. Recommended content to improve.`,
        content: relevantContent,
        priority: weakness.score < 50 ? 'HIGH' : 'MEDIUM'
      });
    }

    return recommendations;
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
              content: 'You are an expert JEE preparation tutor. Generate comprehensive, accurate, and educational content for students preparing for competitive exams.'
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

  private getDefaultLessonSummary(lesson: any): AILessonSummary {
    return {
      keyConcepts: ['Concept understanding', 'Problem solving'],
      importantFormulas: [],
      commonMistakes: ['Calculation errors', 'Concept confusion'],
      practiceTips: ['Practice regularly', 'Review mistakes'],
      relatedTopics: [],
      difficultyLevel: 'MEDIUM',
      estimatedStudyTime: 60,
      prerequisites: [],
      learningObjectives: ['Understand key concepts', 'Solve problems accurately']
    };
  }

  private getDefaultTopicExplanation(topic: any): AITopicExplanation {
    return {
      overview: `Overview of ${topic.name}`,
      keyPoints: ['Key point 1', 'Key point 2'],
      detailedExplanation: `Detailed explanation for ${topic.name}`,
      examples: [],
      visualAids: [],
      commonQuestions: [],
      practiceExercises: []
    };
  }

  private getDefaultMicroLesson(subtopic: any): AIMicroLesson {
    return {
      lessonId: subtopic.id,
      title: subtopic.name,
      duration: 10,
      content: {
        introduction: `Introduction to ${subtopic.name}`,
        mainContent: `Main content for ${subtopic.name}`,
        summary: `Summary of ${subtopic.name}`,
        keyTakeaways: ['Key takeaway 1', 'Key takeaway 2']
      },
      interactiveElements: [],
      assessment: { questions: [] }
    };
  }
}
