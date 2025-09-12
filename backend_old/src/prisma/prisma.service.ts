// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma connected');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🛑 Prisma disconnected');
  }

  // Optional helper to run raw SQL safely
  async executeRaw(query: string, params?: any[]) {
    return this.$executeRawUnsafe(query, ...(params || []));
  }
}
