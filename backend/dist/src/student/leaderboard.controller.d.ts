import { PrismaService } from '../prisma/prisma.service';
export declare class StudentLeaderboardController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getLeaderboard(req: any, type?: string): Promise<{
        stream: {
            name: string;
            code: string;
        } | null;
        type: string;
        leaderboard: {
            userId: string;
            fullName: string;
            email: string;
            averageScore: number;
            totalTests: number;
            totalScore: number;
            lastTestDate: Date | null;
        }[] | {
            userId: string;
            fullName: string;
            email: string;
            averageScore: number;
            totalTests: number;
            totalCorrect: number;
            totalQuestions: number;
            examSubmissions: number;
        }[];
        userPosition: number | null;
        totalStudents: number;
    }>;
    private getOverallLeaderboard;
    private getPracticeTestLeaderboard;
    private getExamPaperLeaderboard;
    private getPYQLeaderboard;
}
