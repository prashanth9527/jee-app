import { PrismaService } from '../prisma/prisma.service';
export declare class AdminTopicsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(page?: string, limit?: string, search?: string, subjectId?: string): Promise<{
        topics: ({
            subject: {
                id: string;
                stream: {
                    id: string;
                    name: string;
                    code: string;
                };
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            description: string | null;
            subjectId: string;
        })[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalItems: number;
            itemsPerPage: number;
            hasNextPage: boolean;
            hasPreviousPage: boolean;
        };
    }>;
    create(body: {
        subjectId: string;
        name: string;
        description?: string;
    }): import(".prisma/client").Prisma.Prisma__TopicClient<{
        subject: {
            id: string;
            stream: {
                id: string;
                name: string;
                code: string;
            };
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        subjectId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, body: {
        name?: string;
        description?: string;
        subjectId?: string;
    }): import(".prisma/client").Prisma.Prisma__TopicClient<{
        subject: {
            id: string;
            stream: {
                id: string;
                name: string;
                code: string;
            };
            name: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        subjectId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__TopicClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        description: string | null;
        subjectId: string;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
