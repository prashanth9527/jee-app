import { PrismaService } from '../prisma/prisma.service';
export declare class AdminSubtopicsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(page?: string, limit?: string, search?: string, topicId?: string, subjectId?: string): Promise<{
        subtopics: ({
            topic: {
                id: string;
                name: string;
                subject: {
                    id: string;
                    name: string;
                    stream: {
                        id: string;
                        name: string;
                        code: string;
                    };
                };
            };
        } & {
            id: string;
            name: string;
            description: string | null;
            topicId: string;
            createdAt: Date;
            updatedAt: Date;
        })[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
        };
    }>;
    create(body: {
        topicId: string;
        name: string;
        description?: string;
    }): import(".prisma/client").Prisma.Prisma__SubtopicClient<{
        id: string;
        name: string;
        description: string | null;
        topicId: string;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, body: {
        name?: string;
        description?: string;
    }): import(".prisma/client").Prisma.Prisma__SubtopicClient<{
        id: string;
        name: string;
        description: string | null;
        topicId: string;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__SubtopicClient<{
        id: string;
        name: string;
        description: string | null;
        topicId: string;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
