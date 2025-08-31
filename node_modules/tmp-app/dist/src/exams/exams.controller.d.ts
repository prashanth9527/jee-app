import { ExamsService } from './exams.service';
export declare class ExamsController {
    private readonly exams;
    constructor(exams: ExamsService);
    createPaper(body: {
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
    start(req: any, paperId: string): Promise<{
        submissionId: string;
        questionIds: string[];
    }>;
    submit(submissionId: string, body: {
        questionId: string;
        selectedOptionId?: string;
    }): Promise<{
        id: string;
        isCorrect: boolean;
        questionId: string;
        submissionId: string;
        selectedOptionId: string | null;
    }>;
    getSubmission(req: any, submissionId: string): Promise<{
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
    getSubmissionQuestions(req: any, submissionId: string): Promise<({
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
    finalize(req: any, submissionId: string): Promise<{
        id: string;
        startedAt: Date;
        submittedAt: Date | null;
        totalQuestions: number;
        correctCount: number;
        scorePercent: number | null;
        userId: string;
        examPaperId: string;
    }>;
    getExamResults(req: any, submissionId: string): Promise<{
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
                alternativeExplanations: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    explanation: string;
                    questionId: string;
                    reportId: string | null;
                    source: string;
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
    analyticsBySubject(req: any): Promise<any[]>;
    analyticsByTopic(req: any): Promise<any[]>;
    analyticsBySubtopic(req: any): Promise<any[]>;
    generateAIPracticeTest(req: any, body: {
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
    generateAIExplanation(req: any, body: {
        questionId: string;
        userAnswer?: string;
    }): Promise<{
        questionId: string;
        explanation: string;
        isAIGenerated: boolean;
    }>;
    generateManualPracticeTest(req: any, body: {
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
