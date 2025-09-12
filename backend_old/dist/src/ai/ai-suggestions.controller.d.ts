import { AISuggestionsService } from './ai-suggestions.service';
import { SubscriptionValidationService } from '../subscriptions/subscription-validation.service';
export declare class AISuggestionsController {
    private readonly aiSuggestionsService;
    private readonly subscriptionValidation;
    constructor(aiSuggestionsService: AISuggestionsService, subscriptionValidation: SubscriptionValidationService);
    getPersonalizedSuggestions(req: any, limit?: string, includeWeakAreas?: string, includeStrongAreas?: string, focusOnRecentPerformance?: string): Promise<{
        success: boolean;
        data: import("./ai-suggestions.service").AISuggestion[];
        metadata: {
            totalSuggestions: number;
            generatedAt: string;
            userId: any;
            subscriptionType: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data: never[];
        metadata: {
            totalSuggestions: number;
            generatedAt: string;
            userId: any;
            subscriptionType: string;
        };
    }>;
    getPerformanceAnalysis(req: any): Promise<{
        success: boolean;
        data: {
            overall: {
                totalQuestions: number;
                correctAnswers: number;
                score: number;
            };
            subjects: unknown[];
            performanceData: import("./ai-suggestions.service").PerformanceAnalysis[];
        };
        metadata: {
            generatedAt: string;
            userId: any;
            subscriptionType: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data: null;
        metadata: {
            generatedAt: string;
            userId: any;
            subscriptionType: string;
        };
    }>;
    getSuggestionHistory(req: any, limit?: string): Promise<{
        success: boolean;
        data: any[];
        metadata: {
            totalHistory: number;
            generatedAt: string;
            userId: any;
            subscriptionType: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data: never[];
        metadata: {
            totalHistory: number;
            generatedAt: string;
            userId: any;
            subscriptionType: string;
        };
    }>;
    markSuggestionAsFollowed(req: any, body: {
        suggestionId: string;
    }): Promise<{
        success: boolean;
        message: string;
        metadata: {
            suggestionId: string;
            userId: any;
            markedAt: string;
            subscriptionType: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        metadata: {
            suggestionId: string;
            userId: any;
            markedAt: string;
            subscriptionType: string;
        };
        message?: undefined;
    }>;
    getQuickInsights(req: any): Promise<{
        success: boolean;
        data: {
            topSuggestions: import("./ai-suggestions.service").AISuggestion[];
            performanceSummary: {
                overallScore: number;
                totalQuestions: number;
                totalCorrect: number;
                weakestArea: {
                    subject: string;
                    topic: string | undefined;
                    score: number;
                } | null;
                strongestArea: {
                    subject: string;
                    topic: string | undefined;
                    score: number;
                } | null;
            };
        };
        metadata: {
            generatedAt: string;
            userId: any;
            subscriptionType: string;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        data: null;
        metadata: {
            generatedAt: string;
            userId: any;
            subscriptionType: string;
        };
    }>;
}
