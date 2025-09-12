import { PrismaService } from '../prisma/prisma.service';
export declare class StreamsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getAllStreams(): Promise<{
        id: string;
        name: string;
        description: string | null;
        code: string;
        _count: {
            subjects: number;
            users: number;
        };
    }[]>;
    getStreamSubjects(streamId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        _count: {
            questions: number;
            topics: number;
        };
    }[]>;
    getStreamById(streamId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        code: string;
        subjects: {
            id: string;
            name: string;
            description: string | null;
            _count: {
                questions: number;
                topics: number;
            };
        }[];
        _count: {
            users: number;
        };
    }>;
}
