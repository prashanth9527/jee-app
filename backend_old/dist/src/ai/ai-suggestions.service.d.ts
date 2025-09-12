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
    confidence: number;
}
export interface SuggestionRequest {
    userId: string;
    limit?: number;
    includeWeakAreas?: boolean;
    includeStrongAreas?: boolean;
    focusOnRecentPerformance?: boolean;
}
export declare class AISuggestionsService {
    private configService;
    private prisma;
    private readonly logger;
    private readonly openaiApiKey;
    private readonly openaiBaseUrl;
    constructor(configService: ConfigService, prisma: PrismaService);
    generatePersonalizedSuggestions(request: SuggestionRequest): Promise<AISuggestion[]>;
    private analyzeStudentPerformance;
    private generateAISuggestions;
    private buildSuggestionPrompt;
    private callOpenAI;
    private parseSuggestionResponse;
    private generateRuleBasedSuggestions;
    getSuggestionHistory(userId: string, limit?: number): Promise<any[]>;
    markSuggestionAsFollowed(suggestionId: string, userId: string): Promise<void>;
}
