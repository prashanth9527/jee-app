import { ConfigService } from '@nestjs/config';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';
import { PrismaService } from '../prisma/prisma.service';
interface AIQuestionRequest {
    subject: string;
    topic?: string;
    subtopic?: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    questionCount: number;
    existingTips?: string[];
}
interface AIQuestion {
    stem: string;
    explanation: string;
    tip_formula?: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    options: {
        text: string;
        isCorrect: boolean;
    }[];
}
export declare class AIService {
    private configService;
    private subscriptionValidation;
    private prisma;
    private readonly logger;
    private readonly openaiApiKey;
    private readonly openaiBaseUrl;
    constructor(configService: ConfigService, subscriptionValidation: SubscriptionValidationService, prisma: PrismaService);
    generateQuestions(request: AIQuestionRequest): Promise<AIQuestion[]>;
    generateExplanation(question: string, correctAnswer: string, userAnswer?: string): Promise<string>;
    generateExplanationWithTips(question: string, correctAnswer: string, userAnswer?: string, tipFormula?: string): Promise<string>;
    private buildQuestionPrompt;
    private buildExplanationPrompt;
    private buildExplanationPromptWithTips;
    private callOpenAI;
    private parseAIResponse;
    private parseExplanationResponse;
    validateSubscription(userId: string): Promise<{
        hasAIAccess: boolean;
        planType: string;
    }>;
    private fetchExistingTips;
    generateQuestionsWithTips(request: AIQuestionRequest & {
        subjectId: string;
        topicId?: string;
        subtopicId?: string;
    }): Promise<AIQuestion[]>;
}
export {};
