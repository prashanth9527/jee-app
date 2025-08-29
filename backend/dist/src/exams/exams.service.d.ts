import { PrismaService } from '../prisma/prisma.service';
export declare class ExamsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
            };
            selectedOption: {
                id: string;
                text: string;
                isCorrect: boolean;
            } | null;
            isCorrect: boolean;
        }[];
    }>;
}
