import { PrismaService } from '../prisma/prisma.service';
export declare class AdminSubjectsController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): import(".prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        streamId: string;
        name: string;
        description: string | null;
    }[]>;
    create(body: {
        name: string;
        description?: string;
    }): import(".prisma/client").Prisma.Prisma__SubjectClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        streamId: string;
        name: string;
        description: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    update(id: string, body: {
        name?: string;
        description?: string;
    }): import(".prisma/client").Prisma.Prisma__SubjectClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        streamId: string;
        name: string;
        description: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
    remove(id: string): import(".prisma/client").Prisma.Prisma__SubjectClient<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        streamId: string;
        name: string;
        description: string | null;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import(".prisma/client").Prisma.PrismaClientOptions>;
}
