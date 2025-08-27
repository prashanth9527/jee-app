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
}
