import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';

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
  suggestedReadings?: Array<{
    id: string;
    title: string;
    type: string;
    description: string;
    subject: string;
    topic: string;
    url: string;
    difficulty: string;
  }>;
  relatedContent?: Array<{
    id: string;
    title: string;
    type: string;
    description: string;
    subject: string;
    topic: string;
    subtopic: string;
    url: string;
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
    private readonly configService: ConfigService,
    private readonly subscriptionValidationService: SubscriptionValidationService
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
    this.openaiModel = this.configService.get<string>('OPENAI_MODEL') || 'gpt-3.5-turbo';
  }

  async generateLessonSummary(lessonId: string, userId: string): Promise<AILessonSummary> {
    try {
      // Check AI subscription
      const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
      if (!aiAccess.canUseAi) {
        throw new Error('AI content generation requires AI_ENABLED subscription. Please upgrade your plan to use this feature.');
      }

      // Check if content already exists for this user and lesson
      const existingContent = await this.prisma.aIContentGeneration.findFirst({
        where: {
          userId,
          lessonId,
          contentType: 'LESSON_SUMMARY'
        }
      });

      if (existingContent) {
        this.logger.log('Returning existing lesson summary for user:', userId, 'lesson:', lessonId);
        return existingContent.contentData as unknown as AILessonSummary;
      }

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
      const generatedContent = this.parseLessonSummaryResponse(aiResponse, lesson);
      
      // Store the generated content
      await this.prisma.aIContentGeneration.create({
        data: {
          userId,
          lessonId,
          contentType: 'LESSON_SUMMARY',
          contentData: generatedContent as any
        }
      });

      // Record AI feature usage
      await this.recordAIFeatureUsage(userId, null, 'LESSON_SUMMARY');
      
      return generatedContent;
    } catch (error) {
      this.logger.error('Error generating lesson summary:', error);
      throw new Error('Failed to generate lesson summary');
    }
  }

  async generateTopicExplanation(topicId: string, userId: string): Promise<AITopicExplanation> {
    try {
      // Check AI subscription
      const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
      if (!aiAccess.canUseAi) {
        throw new Error('AI content generation requires AI_ENABLED subscription. Please upgrade your plan to use this feature.');
      }

      // Check if content already exists for this user and topic
      const existingContent = await this.prisma.aIContentGeneration.findFirst({
        where: {
          userId,
          topicId,
          contentType: 'TOPIC_EXPLANATION'
        }
      });

      if (existingContent) {
        this.logger.log('Returning existing topic explanation for user:', userId, 'topic:', topicId);
        return existingContent.contentData as unknown as AITopicExplanation;
      }

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
      const generatedContent = await this.parseTopicExplanationResponse(aiResponse, topic);
      
      // Store the generated content
      await this.prisma.aIContentGeneration.create({
        data: {
          userId,
          topicId,
          contentType: 'TOPIC_EXPLANATION',
          contentData: generatedContent as any
        }
      });

      // Record AI feature usage
      await this.recordAIFeatureUsage(userId, null, 'TOPIC_EXPLANATION');
      
      return generatedContent;
    } catch (error) {
      this.logger.error('Error generating topic explanation:', error);
      throw new Error('Failed to generate topic explanation');
    }
  }

  async generateMicroLesson(subtopicId: string, userId: string): Promise<AIMicroLesson> {
    try {
      // Check AI subscription
      const aiAccess = await this.subscriptionValidationService.validateAiUsage(userId);
      if (!aiAccess.canUseAi) {
        throw new Error('AI content generation requires AI_ENABLED subscription. Please upgrade your plan to use this feature.');
      }

      // Check if content already exists for this user and subtopic
      const existingContent = await this.prisma.aIContentGeneration.findFirst({
        where: {
          userId,
          subtopicId,
          contentType: 'MICRO_LESSON'
        }
      });

      if (existingContent) {
        this.logger.log('Returning existing micro lesson for user:', userId, 'subtopic:', subtopicId);
        return existingContent.contentData as unknown as AIMicroLesson;
      }

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
      const generatedContent = this.parseMicroLessonResponse(aiResponse, subtopic);
      
      // Store the generated content
      await this.prisma.aIContentGeneration.create({
        data: {
          userId,
          subtopicId,
          contentType: 'MICRO_LESSON',
          contentData: generatedContent as any
        }
      });

      // Record AI feature usage
      await this.recordAIFeatureUsage(userId, null, 'MICRO_LESSON');
      
      return generatedContent;
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

  private async parseTopicExplanationResponse(response: string, topic: any): Promise<AITopicExplanation> {
    try {
      this.logger.log('Parsing OpenAI response:', response);
      const parsed = JSON.parse(response);
      
      // Get database content
      const suggestedReadings = await this.getSuggestedReadings(topic);
      const relatedContent = await this.getRelatedContent(topic);
      const practiceQuestions = await this.getPracticeQuestions(topic);
      
      return {
        overview: parsed.overview || 'Topic overview not available',
        keyPoints: parsed.keyPoints || [],
        detailedExplanation: parsed.detailedExplanation || 'Detailed explanation not available',
        examples: parsed.examples || [],
        visualAids: parsed.visualAids || [],
        commonQuestions: parsed.commonQuestions || [],
        practiceExercises: parsed.practiceExercises || practiceQuestions,
        suggestedReadings: suggestedReadings,
        relatedContent: relatedContent
      };
    } catch (error) {
      this.logger.error('Error parsing topic explanation response:', error);
      this.logger.error('Raw response that failed to parse:', response);
      return await this.getDefaultTopicExplanation(topic);
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
      this.logger.error('OpenAI API key not configured');
      throw new Error('OpenAI API key not configured');
    }

    this.logger.log('Calling OpenAI with prompt:', prompt.substring(0, 200) + '...');

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

      if (!response.ok) {
        const errorData = await response.json();
        this.logger.error('OpenAI API error:', errorData);
        throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      this.logger.log('OpenAI response received:', data.choices[0]?.message?.content?.substring(0, 200) + '...');
      return data.choices[0].message.content;
    } catch (error) {
      this.logger.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  private getDefaultLessonSummary(lesson: any): AILessonSummary {
    const lessonName = lesson?.name || 'this lesson';
    const subjectName = lesson?.subject?.name || 'Mathematics';
    
    return {
      keyConcepts: [
        `Fundamental concepts of ${lessonName}`,
        `Problem-solving strategies for ${lessonName}`,
        `Application of ${lessonName} in JEE problems`,
        `Advanced techniques in ${lessonName}`
      ],
      importantFormulas: [
        `Key formula 1 for ${lessonName}`,
        `Key formula 2 for ${lessonName}`,
        `Derived formulas from ${lessonName}`
      ],
      commonMistakes: [
        'Calculation errors in complex problems',
        'Misunderstanding of fundamental concepts',
        'Incorrect application of formulas',
        'Sign errors in algebraic manipulations'
      ],
      practiceTips: [
        'Practice problems of varying difficulty levels',
        'Focus on understanding concepts before memorizing formulas',
        'Review and analyze your mistakes regularly',
        'Time management during practice sessions'
      ],
      relatedTopics: [
        `Prerequisites for ${lessonName}`,
        `Advanced topics building on ${lessonName}`,
        `Cross-connections with other ${subjectName} topics`
      ],
      difficultyLevel: 'MEDIUM',
      estimatedStudyTime: 90,
      prerequisites: [
        'Basic mathematical concepts',
        'Fundamental problem-solving skills'
      ],
      learningObjectives: [
        `Master the fundamental concepts of ${lessonName}`,
        `Develop problem-solving skills for ${lessonName}`,
        `Apply ${lessonName} concepts to JEE-level problems`,
        `Build confidence in ${lessonName} problem-solving`
      ]
    };
  }

  private async getDefaultTopicExplanation(topic: any): Promise<AITopicExplanation> {
    const topicName = topic?.name || 'this topic';
    const subjectName = topic?.subject?.name || 'Mathematics';
    
    // Get related content from database
    const relatedContent = await this.getRelatedContent(topic);
    const suggestedReadings = await this.getSuggestedReadings(topic);
    const practiceQuestions = await this.getPracticeQuestions(topic);
    
    return {
      overview: `${topicName} is a fundamental concept in ${subjectName} that forms the foundation for more advanced topics. Understanding ${topicName} is crucial for JEE preparation as it appears frequently in competitive exams.`,
      keyPoints: [
        `Understanding the basic principles of ${topicName}`,
        `Key formulas and theorems related to ${topicName}`,
        `Common problem-solving techniques for ${topicName}`,
        `Important applications of ${topicName} in real-world scenarios`
      ],
      detailedExplanation: `${topicName} is an essential topic in ${subjectName} that requires thorough understanding. This concept builds upon previous knowledge and serves as a foundation for more complex topics. Students should focus on understanding the underlying principles, memorizing key formulas, and practicing various types of problems to master this topic. Regular practice and conceptual clarity are essential for success in JEE examinations.`,
      examples: [
        {
          problem: `Example problem related to ${topicName}`,
          solution: `Step-by-step solution approach`,
          explanation: `Detailed explanation of the solution method`
        }
      ],
      visualAids: [
        {
          type: 'DIAGRAM',
          description: `Visual representation of ${topicName}`,
          content: `Diagram showing key concepts of ${topicName}`
        }
      ],
      commonQuestions: [
        {
          question: `What is the importance of ${topicName} in JEE preparation?`,
          answer: `${topicName} is crucial for JEE as it forms the foundation for many advanced topics and appears frequently in the examination.`
        },
        {
          question: `What are the key concepts to focus on in ${topicName}?`,
          answer: `Focus on understanding the basic principles, memorizing key formulas, and practicing various problem types.`
        }
      ],
      practiceExercises: practiceQuestions,
      suggestedReadings: suggestedReadings,
      relatedContent: relatedContent
    };
  }

  private getDefaultMicroLesson(subtopic: any): AIMicroLesson {
    const subtopicName = subtopic?.name || 'this subtopic';
    const topicName = subtopic?.topic?.name || 'the parent topic';
    
    return {
      lessonId: subtopic.id,
      title: subtopicName,
      duration: 15,
      content: {
        introduction: `Welcome to ${subtopicName}! This micro-lesson will help you understand the fundamental concepts of ${subtopicName} within the broader context of ${topicName}. This topic is essential for JEE preparation and builds upon previous knowledge.`,
        mainContent: `${subtopicName} is a crucial concept that students must master for JEE success. This topic involves understanding key principles, applying formulas correctly, and developing problem-solving strategies. The main content covers the theoretical foundation, practical applications, and common problem types that appear in competitive examinations.`,
        summary: `In this lesson, we covered the essential aspects of ${subtopicName}. Key points include understanding the fundamental principles, mastering the application of formulas, and developing effective problem-solving techniques. Regular practice and conceptual clarity are essential for success.`,
        keyTakeaways: [
          `Master the fundamental concepts of ${subtopicName}`,
          `Understand the practical applications of ${subtopicName}`,
          `Develop problem-solving strategies for ${subtopicName}`,
          `Build confidence through regular practice`
        ]
      },
      interactiveElements: [
        {
          type: 'QUIZ',
          // title: `Quick Check: ${subtopicName}`, // Remove title as it's not in the interface
          content: `Test your understanding of ${subtopicName} with this interactive quiz.`
        }
      ],
      assessment: { 
        questions: [
          {
            question: `What is the primary importance of ${subtopicName} in JEE preparation?`,
            options: [
              'It appears frequently in JEE exams',
              'It builds foundation for advanced topics',
              'It improves problem-solving skills',
              'All of the above'
            ],
            correctAnswer: 3,
            explanation: `${subtopicName} is crucial for JEE preparation as it appears frequently, builds foundation for advanced topics, and improves overall problem-solving skills.`
          }
        ]
      }
    };
  }

  private async recordAIFeatureUsage(userId: string, contentId: string | null, featureType: string): Promise<void> {
    try {
      await this.prisma.aIFeatureUsage.create({
        data: {
          userId,
          contentId: contentId || '',
          featureType: featureType as any,
          usageCount: 1
        }
      });
    } catch (error) {
      this.logger.error('Error recording AI feature usage:', error);
      // Don't throw error as this is not critical
    }
  }

  private async getRelatedContent(topic: any): Promise<any[]> {
    try {
      // Get related LMS content for this topic
      const relatedContent = await this.prisma.lMSContent.findMany({
        where: {
          topicId: topic.id,
          // isActive: true // Remove isActive as it doesn't exist in the schema
        },
        include: {
          subject: true,
          topic: true,
          subtopic: true
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return relatedContent.map(content => ({
        id: content.id,
        title: content.title,
        type: content.contentType,
        description: content.description,
        subject: (content as any).subject?.name || 'Unknown Subject',
        topic: (content as any).topic?.name || 'Unknown Topic',
        subtopic: (content as any).subtopic?.name || 'Unknown Subtopic',
        url: `/student/lms/content/${content.id}`
      }));
    } catch (error) {
      this.logger.error('Error getting related content:', error);
      return [];
    }
  }

  private async getSuggestedReadings(topic: any): Promise<any[]> {
    try {
      // Get suggested readings from LMS content
      const readings = await this.prisma.lMSContent.findMany({
        where: {
          topicId: topic.id,
          contentType: {
            in: ['VIDEO', 'TEXT'] // Use valid ContentType values
          },
          // isActive: true // Remove isActive as it doesn't exist in the schema
        },
        include: {
          subject: true,
          topic: true
        },
        take: 8,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return readings.map(reading => ({
        id: reading.id,
        title: reading.title,
        type: reading.contentType,
        description: reading.description,
        subject: reading.subjectId || 'Unknown Subject',
        topic: reading.topicId || 'Unknown Topic',
        url: `/student/lms/content/${reading.id}`,
        difficulty: reading.difficulty || 'MEDIUM'
      }));
    } catch (error) {
      this.logger.error('Error getting suggested readings:', error);
      return [];
    }
  }

  private async getPracticeQuestions(topic: any): Promise<any[]> {
    try {
      // Get practice questions for this topic
      const questions = await this.prisma.question.findMany({
        where: {
          topicId: topic.id,
          // isActive: true // Remove isActive as it doesn't exist in the schema
        },
        include: {
          options: true,
          subject: true,
          topic: true
        },
        take: 5,
        orderBy: {
          createdAt: 'desc'
        }
      });

      return questions.map(question => ({
        id: question.id,
        problem: question.stem,
        difficulty: question.difficulty,
        subject: question.subject?.name,
        topic: question.topic?.name,
        options: (question as any).options?.map((opt: any) => opt.text) || [],
        hints: [
          'Read the question carefully',
          'Identify the key concepts',
          'Apply the appropriate formula or method'
        ]
      }));
    } catch (error) {
      this.logger.error('Error getting practice questions:', error);
      return [];
    }
  }

  async checkContentExists(userId: string, contentType: string, id: string): Promise<{ exists: boolean; content?: any }> {
    try {
      const whereClause: any = {
        userId,
        contentType
      };

      if (contentType === 'LESSON_SUMMARY') {
        whereClause.lessonId = id;
      } else if (contentType === 'TOPIC_EXPLANATION') {
        whereClause.topicId = id;
      } else if (contentType === 'MICRO_LESSON') {
        whereClause.subtopicId = id;
      }

      const existingContent = await this.prisma.aIContentGeneration.findFirst({
        where: whereClause,
        include: {
          lesson: true,
          topic: true,
          subtopic: true
        }
      });

      return {
        exists: !!existingContent,
        content: existingContent?.contentData
      };
    } catch (error) {
      this.logger.error('Error checking content existence:', error);
      return { exists: false };
    }
  }

  async getUserGeneratedContent(userId: string): Promise<any[]> {
    try {
      const content = await this.prisma.aIContentGeneration.findMany({
        where: { userId },
        include: {
          lesson: {
            include: {
              subject: true
            }
          },
          topic: {
            include: {
              subject: true,
              lesson: true
            }
          },
          subtopic: {
            include: {
              topic: {
                include: {
                  subject: true,
                  lesson: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return content.map(item => ({
        id: item.id,
        contentType: item.contentType,
        contentData: item.contentData,
        createdAt: item.createdAt,
        lesson: item.lesson,
        topic: item.topic,
        subtopic: item.subtopic
      }));
    } catch (error) {
      this.logger.error('Error getting user generated content:', error);
      return [];
    }
  }
}
