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
    })[]>;
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
    analyticsSubjects(req: any): Promise<any[]>;
    analyticsTopics(req: any): Promise<any[]>;
    analyticsSubtopics(req: any): Promise<any[]>;
}
