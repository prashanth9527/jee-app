// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'error',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
      ],
    });

    // Listen to query events
    (this as any).$on('query', (e: any) => {
      console.log('🔍 Prisma Query:');
      console.log(`   Query: ${e.query}`);
      console.log(`   Params: ${e.params}`);
      
      // Replace placeholders with actual parameter values
      let formattedQuery = e.query;
      if (e.params && e.params.length > 0) {
        try {
          // Parse parameters from the params string
          const params = JSON.parse(e.params);
          if (Array.isArray(params)) {
            formattedQuery = this.formatQueryWithParams(e.query, params);
          }
        } catch (error) {
          // If parsing fails, show original params
          console.log(`   Raw Params: ${e.params}`);
        }
      }
      
      console.log(`   Formatted Query: ${formattedQuery}`);
      console.log(`   Duration: ${e.duration}ms`);
      console.log(`   Target: ${e.target}`);
      console.log('---');
    });

    // Listen to error events
    (this as any).$on('error', (e: any) => {
      console.error('❌ Prisma Error:');
      console.error(`   Message: ${e.message}`);
      console.error(`   Target: ${e.target}`);
      console.error('---');
    });

    // Listen to info events
    (this as any).$on('info', (e: any) => {
      console.log('ℹ️ Prisma Info:');
      console.log(`   Message: ${e.message}`);
      console.log(`   Target: ${e.target}`);
      console.log('---');
    });

    // Listen to warn events
    (this as any).$on('warn', (e: any) => {
      console.warn('⚠️ Prisma Warning:');
      console.warn(`   Message: ${e.message}`);
      console.warn(`   Target: ${e.target}`);
      console.warn('---');
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Prisma connected with query logging enabled');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🛑 Prisma disconnected');
  }

  // Enhanced helper to run raw SQL safely with logging
  async executeRaw(query: string, params?: any[]) {
    console.log('🔧 Executing Raw SQL:');
    console.log(`   Query: ${query}`);
    console.log(`   Params: ${JSON.stringify(params || [])}`);
    
    // Format query with actual parameter values
    const formattedQuery = this.formatQueryWithParams(query, params || []);
    console.log(`   Formatted Query: ${formattedQuery}`);
    console.log('---');
    
    const startTime = Date.now();
    try {
      const result = await this.$executeRawUnsafe(query, ...(params || []));
      const duration = Date.now() - startTime;
      console.log(`✅ Raw SQL executed successfully in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ Raw SQL failed after ${duration}ms:`, error);
      throw error;
    }
  }

  // Helper to format and display query statistics
  getQueryStats() {
    return {
      connectionStatus: 'connected', // Prisma handles connection state internally
      timestamp: new Date().toISOString()
    };
  }

  // Enhanced method to execute queries with detailed logging
  async executeWithLogging<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: any
  ): Promise<T> {
    const startTime = Date.now();
    console.log(`🚀 Starting ${operationName}:`);
    if (context) {
      console.log(`   Context: ${JSON.stringify(context, null, 2)}`);
    }
    console.log('---');

    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      console.log(`✅ ${operationName} completed successfully in ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ ${operationName} failed after ${duration}ms:`, error);
      throw error;
    }
  }

  // Utility method to format SQL queries with parameters
  private formatQueryWithParams(query: string, params: any[]): string {
    let formattedQuery = query;
    if (params && params.length > 0) {
      params.forEach((param: any, index: number) => {
        const placeholder = `$${index + 1}`;
        let value: string;
        
        if (param === null || param === undefined) {
          value = 'NULL';
        } else if (typeof param === 'string') {
          // Escape single quotes in strings
          const escapedParam = param.replace(/'/g, "''");
          value = `'${escapedParam}'`;
        } else if (typeof param === 'boolean') {
          value = param ? 'true' : 'false';
        } else if (param instanceof Date) {
          value = `'${param.toISOString()}'`;
        } else {
          value = String(param);
        }
        
        formattedQuery = formattedQuery.replace(new RegExp(`\\$${index + 1}\\b`, 'g'), value);
      });
    }
    return formattedQuery;
  }
}
