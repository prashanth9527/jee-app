import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
export declare class ExamsService {
    private readonly prisma;
    private readonly aiService;
    constructor(prisma: PrismaService, aiService: AIService);
    createPaper(data: {
        title: string;
        description?: string;
        subjectIds?: string[];
        topicIds?: string[];
        subtopicIds?: string[];
        questionIds?: string[];
        timeLimitMin?: number;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        title: string;
        subjectIds: string[];
        topicIds: string[];
        subtopicIds: string[];
        questionIds: string[];
        timeLimitMin: number | null;
    }>;
    generateQuestionsForPaper(paperId: string, limit?: number): Promise<any[]>;
    startSubmission(userId: string, paperId: string): Promise<{
        submissionId: string;
        questionIds: string[];
    }>;
    submitAnswer(submissionId: string, questionId: string, selectedOptionId: string | null): Promise<{
        id: string;
        isCorrect: boolean;
        questionId: string;
        submissionId: string;
        selectedOptionId: string | null;
    }>;
    finalize(submissionId: string): Promise<{
        id: string;
        startedAt: Date;
        submittedAt: Date | null;
        totalQuestions: number;
        correctCount: number;
        scorePercent: number | null;
        userId: string;
        examPaperId: string;
    }>;
    analyticsBySubject(userId: string): Promise<any[]>;
    analyticsByTopic(userId: string): Promise<any[]>;
    analyticsBySubtopic(userId: string): Promise<any[]>;
    getSubmission(submissionId: string): Promise<{
        id: string;
        userId: string;
        examPaper: {
            id: string;
            title: string;
            questionIds: string[];
            timeLimitMin: number | null;
        };
        startedAt: Date;
        totalQuestions: number;
        questionIds: string[];
    }>;
    getSubmissionQuestions(submissionId: string): Promise<({
        options: {
            id: string;
            text: string;
            isCorrect: boolean;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subjectId: string | null;
        topicId: string | null;
        subtopicId: string | null;
        stem: string;
        explanation: string | null;
        difficulty: import(".prisma/client").$Enums.Difficulty;
        yearAppeared: number | null;
        isPreviousYear: boolean;
        isAIGenerated: boolean;
        aiPrompt: string | null;
    })[]>;
    getExamResults(submissionId: string): Promise<{
        submission: {
            id: string;
            examPaper: {
                id: string;
                title: string;
                questionIds: string[];
                timeLimitMin: number | null;
            };
            startedAt: Date;
            submittedAt: Date | null;
            totalQuestions: number;
            correctCount: number;
            scorePercent: number | null;
        };
        answers: {
            questionId: string;
            question: {
                options: {
                    id: string;
                    text: string;
                    isCorrect: boolean;
                }[];
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                subjectId: string | null;
                topicId: string | null;
                subtopicId: string | null;
                stem: string;
                explanation: string | null;
                difficulty: import(".prisma/client").$Enums.Difficulty;
                yearAppeared: number | null;
                isPreviousYear: boolean;
                isAIGenerated: boolean;
                aiPrompt: string | null;
            };
            selectedOption: {
                id: string;
                text: string;
                isCorrect: boolean;
            } | null;
            isCorrect: boolean;
        }[];
    }>;
    generateAIPracticeTest(userId: string, request: {
        subjectId: string;
        topicId?: string;
        subtopicId?: string;
        questionCount: number;
        difficulty: 'EASY' | 'MEDIUM' | 'HARD';
        timeLimitMin: number;
    }): Promise<{
        examPaper: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            subjectIds: string[];
            topicIds: string[];
            subtopicIds: string[];
            questionIds: string[];
            timeLimitMin: number | null;
        };
        questions: ({
            options: {
                id: string;
                text: string;
                isCorrect: boolean;
                order: number;
                questionId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            subjectId: string | null;
            topicId: string | null;
            subtopicId: string | null;
            stem: string;
            explanation: string | null;
            difficulty: import(".prisma/client").$Enums.Difficulty;
            yearAppeared: number | null;
            isPreviousYear: boolean;
            isAIGenerated: boolean;
            aiPrompt: string | null;
        })[];
    }>;
    generateAIExplanation(questionId: string, userId: string, userAnswer?: string): Promise<{
        questionId: string;
        explanation: string;
        isAIGenerated: boolean;
    }>;
    generateManualPracticeTest(userId: string, request: {
        subjectId: string;
        topicId?: string;
        subtopicId?: string;
        questionCount: number;
        difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
        timeLimitMin: number;
    }): Promise<{
        examPaper: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            title: string;
            subjectIds: string[];
            topicIds: string[];
            subtopicIds: string[];
            questionIds: string[];
            timeLimitMin: number | null;
        };
        questions: ({
            options: {
                id: string;
                text: string;
                isCorrect: boolean;
                order: number;
                questionId: string;
            }[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            subjectId: string | null;
            topicId: string | null;
            subtopicId: string | null;
            stem: string;
            explanation: string | null;
            difficulty: import(".prisma/client").$Enums.Difficulty;
            yearAppeared: number | null;
            isPreviousYear: boolean;
            isAIGenerated: boolean;
            aiPrompt: string | null;
        })[];
    }>;
}
