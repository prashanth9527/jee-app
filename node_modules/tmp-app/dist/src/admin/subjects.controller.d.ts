import { PrismaService } from '../prisma/prisma.service';
export declare class AdminSubjectsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): import(".prisma/client").Prisma.PrismaPromise<({
        stream: {
            id: string;
            name: string;
            code: string;
        };
        _count: {
            questions: number;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        streamId: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    create(body: {
        name: string;
        description?: string;
        streamId: string;
    }): import(".prisma/client").Prisma.Prisma__SubjectClient<{
        id: string;
        name: string;
        description: string | null;
        streamId: string;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, body: {
        name?: string;
        description?: string;
        streamId?: string;
    }): import(".prisma/client").Prisma.Prisma__SubjectClient<{
        id: string;
        name: string;
        description: string | null;
        streamId: string;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__SubjectClient<{
        id: string;
        name: string;
        description: string | null;
        streamId: string;
        createdAt: Date;
        updatedAt: Date;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
