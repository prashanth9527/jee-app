import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';

interface AIQuestionRequest {
  subject: string;
  topic?: string;
  subtopic?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionCount: number;
}

interface AIQuestion {
  stem: string;
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options: {
    text: string;
    isCorrect: boolean;
  }[];
}

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private readonly openaiApiKey: string;
  private readonly openaiBaseUrl: string;

  constructor(
    private configService: ConfigService,
    private subscriptionValidation: SubscriptionValidationService
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY') || '';
    this.openaiBaseUrl = this.configService.get<string>('OPENAI_BASE_URL') || 'https://api.openai.com/v1';
  }

  async generateQuestions(request: AIQuestionRequest): Promise<AIQuestion[]> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const prompt = this.buildQuestionPrompt(request);
      const response = await this.callOpenAI(prompt);
      
      return this.parseAIResponse(response);
    } catch (error) {
      this.logger.error('Error generating AI questions:', error);
      throw new Error('Failed to generate AI questions');
    }
  }

  async generateExplanation(question: string, correctAnswer: string, userAnswer?: string): Promise<string> {
    if (!this.openaiApiKey) {
      return 'Explanation not available';
    }

    try {
      const prompt = this.buildExplanationPrompt(question, correctAnswer, userAnswer);
      const response = await this.callOpenAI(prompt);
      
      return this.parseExplanationResponse(response);
    } catch (error) {
      this.logger.error('Error generating explanation:', error);
      return 'Explanation not available';
    }
  }

  private buildQuestionPrompt(request: AIQuestionRequest): string {
    const { subject, topic, subtopic, difficulty, questionCount } = request;
    
    let context = `Generate ${questionCount} JEE (Joint Entrance Examination) level questions for ${subject}`;
    
    if (topic) {
      context += `, specifically on the topic: ${topic}`;
    }
    
    if (subtopic) {
      context += `, focusing on: ${subtopic}`;
    }
    
    context += `. The questions should be ${difficulty.toLowerCase()} difficulty level.`;

    return `You are an expert JEE tutor. ${context}

Please generate exactly ${questionCount} multiple-choice questions in the following JSON format:

[
  {
    "stem": "Question text here",
    "explanation": "Detailed explanation of the correct answer",
    "difficulty": "${difficulty}",
    "options": [
      {
        "text": "Option A text",
        "isCorrect": false
      },
      {
        "text": "Option B text", 
        "isCorrect": true
      },
      {
        "text": "Option C text",
        "isCorrect": false
      },
      {
        "text": "Option D text",
        "isCorrect": false
      }
    ]
  }
]

Requirements:
1. Each question must have exactly 4 options
2. Only one option should be marked as correct (isCorrect: true)
3. Questions should be relevant to JEE syllabus
4. Explanations should be educational and help students understand the concept
5. Return only valid JSON, no additional text

Generate the questions now:`;
  }

  private buildExplanationPrompt(question: string, correctAnswer: string, userAnswer?: string): string {
    let prompt = `You are an expert JEE tutor. Please provide a detailed explanation for this question:

Question: ${question}
Correct Answer: ${correctAnswer}`;

    if (userAnswer && userAnswer !== correctAnswer) {
      prompt += `\nStudent's Answer: ${userAnswer}`;
      prompt += `\n\nPlease explain why the student's answer is incorrect and provide the correct reasoning.`;
    } else {
      prompt += `\n\nPlease provide a detailed explanation of why this is the correct answer.`;
    }

    prompt += `\n\nMake the explanation educational and help the student understand the underlying concept.`;

    return prompt;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const response = await fetch(`${this.openaiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert JEE tutor with deep knowledge of Physics, Chemistry, and Mathematics. Provide accurate, educational content suitable for JEE preparation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
  }

  private parseAIResponse(response: string): AIQuestion[] {
    try {
      // Clean the response to extract JSON
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const questions = JSON.parse(jsonMatch[0]);
      
      // Validate the structure
      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }

      return questions.map((q, index) => {
        if (!q.stem || !q.options || !Array.isArray(q.options) || q.options.length !== 4) {
          throw new Error(`Invalid question structure at index ${index}`);
        }

        const correctOptions = q.options.filter((opt: any) => opt.isCorrect);
        if (correctOptions.length !== 1) {
          throw new Error(`Question ${index + 1} must have exactly one correct answer`);
        }

        return {
          stem: q.stem,
          explanation: q.explanation || 'Explanation not provided',
          difficulty: q.difficulty || 'MEDIUM',
          options: q.options.map((opt: any, optIndex: number) => ({
            text: opt.text,
            isCorrect: opt.isCorrect || false
          }))
        };
      });
    } catch (error) {
      this.logger.error('Error parsing AI response:', error);
      this.logger.error('Raw response:', response);
      throw new Error('Failed to parse AI response');
    }
  }

  private parseExplanationResponse(response: string): string {
    // Clean up the response and return the explanation
    return response.trim().replace(/^["']|["']$/g, '');
  }

  async validateSubscription(userId: string): Promise<{ hasAIAccess: boolean; planType: string }> {
    const hasAIAccess = await this.subscriptionValidation.hasAIAccess(userId);
    const status = await this.subscriptionValidation.validateStudentSubscription(userId);
    
    return {
      hasAIAccess,
      planType: status.planType || 'MANUAL'
    };
  }
} 