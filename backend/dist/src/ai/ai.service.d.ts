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
export declare class AIService {
    private configService;
    private subscriptionValidation;
    private readonly logger;
    private readonly openaiApiKey;
    private readonly openaiBaseUrl;
    constructor(configService: ConfigService, subscriptionValidation: SubscriptionValidationService);
    generateQuestions(request: AIQuestionRequest): Promise<AIQuestion[]>;
    generateExplanation(question: string, correctAnswer: string, userAnswer?: string): Promise<string>;
    private buildQuestionPrompt;
    private buildExplanationPrompt;
    private callOpenAI;
    private parseAIResponse;
    private parseExplanationResponse;
    validateSubscription(userId: string): Promise<{
        hasAIAccess: boolean;
        planType: string;
    }>;
}
export {};
