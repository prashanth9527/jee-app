import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DbSyncService {
  private readonly logger = new Logger(DbSyncService.name);
  private supabaseClient: PrismaClient | null = null;
  private neonClient: PrismaClient | null = null;
  private supabaseUrl: string | null = null;
  private neonUrl: string | null = null;

  constructor(private configService: ConfigService) {
    this.supabaseUrl = this.configService.get<string>('SUPABASE_DATABASE_URL') || null;
    this.neonUrl = this.configService.get<string>('NEON_DATABASE_URL') || null;
  }

  private getSupabaseClient(): PrismaClient {
    if (!this.supabaseClient && this.supabaseUrl) {
      // Temporarily override DATABASE_URL to create client with Supabase connection
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = this.supabaseUrl;
      this.supabaseClient = new PrismaClient();
      // Restore original URL
      if (originalUrl) {
        process.env.DATABASE_URL = originalUrl;
      } else {
        delete process.env.DATABASE_URL;
      }
    }
    if (!this.supabaseClient) {
      throw new Error('Supabase database URL not configured');
    }
    return this.supabaseClient;
  }

  private getNeonClient(): PrismaClient {
    if (!this.neonClient && this.neonUrl) {
      // Temporarily override DATABASE_URL to create client with Neon connection
      const originalUrl = process.env.DATABASE_URL;
      process.env.DATABASE_URL = this.neonUrl;
      this.neonClient = new PrismaClient();
      // Restore original URL
      if (originalUrl) {
        process.env.DATABASE_URL = originalUrl;
      } else {
        delete process.env.DATABASE_URL;
      }
    }
    if (!this.neonClient) {
      throw new Error('Neon database URL not configured');
    }
    return this.neonClient;
  }

  async syncDatabase(): Promise<{ success: boolean; message: string; details: any }> {
    const startTime = Date.now();
    const syncDetails: any = {
      tables: {},
      errors: [],
      totalRecords: 0,
      duration: 0,
    };

    try {
      // Validate connections
      if (!this.supabaseUrl) {
        throw new Error('Supabase database URL not configured');
      }
      if (!this.neonUrl) {
        throw new Error('Neon database URL not configured');
      }

      this.logger.log('Starting database sync from Supabase to Neon...');

      // Get clients (will create if needed)
      const supabaseClient = this.getSupabaseClient();
      const neonClient = this.getNeonClient();

      // Connect to both databases
      await supabaseClient.$connect();
      await neonClient.$connect();

      // Sync tables in order (respecting foreign key constraints)
      const syncOrder = [
        'Stream',
        'Subject',
        'Topic',
        'Subtopic',
        'Tag',
        'User',
        'Plan',
        'Lesson',
        'Question',
        'QuestionOption',
        'QuestionTag',
        'ExamPaper',
        'Subscription',
        'ExamSubmission',
        'ExamAnswer',
        'Otp',
        'ReferralCode',
        'Referral',
        'ReferralReward',
        'ReferralEmail',
        'PaymentOrder',
        'PaymentLog',
        'QuestionReport',
        'QuestionReportOption',
        'QuestionAlternativeExplanation',
        'SystemSettings',
        'LMSContent',
        'LessonProgress',
        'LessonBadge',
        'ExamBookmark',
        'PracticeSession',
        'PDFProcessorCache',
        'Blog',
        'BlogComment',
        'Formula',
      ];

      for (const modelName of syncOrder) {
        try {
          const result = await this.syncTable(modelName, supabaseClient, neonClient);
          syncDetails.tables[modelName] = result;
          syncDetails.totalRecords += result.synced;
          if (result.synced > 0 || result.errors > 0) {
            this.logger.log(`Synced ${modelName}: ${result.synced} records${result.errors > 0 ? `, ${result.errors} errors` : ''}`);
          }
        } catch (error: any) {
          // Check if error is due to table not existing
          if (error.message?.includes('does not exist')) {
            this.logger.warn(`Table ${modelName} does not exist, skipping...`);
            syncDetails.tables[modelName] = { synced: 0, errors: 0 };
            continue;
          }
          const errorMsg = `Error syncing ${modelName}: ${error.message}`;
          syncDetails.errors.push(errorMsg);
          this.logger.error(errorMsg);
        }
      }

      const duration = Date.now() - startTime;
      syncDetails.duration = duration;

      this.logger.log(`Database sync completed in ${duration}ms. Total records: ${syncDetails.totalRecords}`);

      return {
        success: syncDetails.errors.length === 0,
        message: syncDetails.errors.length === 0
          ? `Successfully synced ${syncDetails.totalRecords} records in ${duration}ms`
          : `Synced ${syncDetails.totalRecords} records with ${syncDetails.errors.length} errors`,
        details: syncDetails,
      };
    } catch (error: any) {
      this.logger.error(`Database sync failed: ${error.message}`, error.stack);
      syncDetails.errors.push(error.message);
      return {
        success: false,
        message: `Database sync failed: ${error.message}`,
        details: syncDetails,
      };
    } finally {
      // Disconnect clients
      try {
        await this.supabaseClient?.$disconnect();
        await this.neonClient?.$disconnect();
      } catch (error) {
        this.logger.error('Error disconnecting clients:', error);
      }
    }
  }

  private async syncTable(
    modelName: string,
    supabaseClient: PrismaClient,
    neonClient: PrismaClient
  ): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    try {
      // Get all records from Supabase
      const sourceRecords = await (supabaseClient as any)[modelName].findMany();

      if (sourceRecords.length === 0) {
        return { synced: 0, errors: 0 };
      }

      // Use transaction for batch operations
      await neonClient.$transaction(async (tx: any) => {
        for (const record of sourceRecords) {
          try {
            // Build where clause based on model type
            const where = this.buildWhereClause(modelName, record);
            
            if (!where) {
              // If we can't build a where clause, skip this record
              errors++;
              this.logger.warn(`Cannot build where clause for record in ${modelName}`);
              continue;
            }

            // Use upsert to handle existing records
            await tx[modelName].upsert({
              where,
              update: this.sanitizeRecord(record),
              create: this.sanitizeRecord(record),
            });
            synced++;
          } catch (error: any) {
            errors++;
            const recordId = record.id || `${record.questionId}_${record.tagId}` || 'unknown';
            this.logger.warn(`Error syncing record ${recordId} in ${modelName}: ${error.message}`);
          }
        }
      }, {
        timeout: 60000, // 60 second timeout for large tables
      });

      return { synced, errors };
    } catch (error: any) {
      // Check if error is due to table not existing
      if (error.message?.includes('does not exist')) {
        this.logger.warn(`Table ${modelName} does not exist in source database, skipping...`);
        return { synced: 0, errors: 0 }; // Don't treat as error, just skip
      }
      this.logger.error(`Error syncing table ${modelName}: ${error.message}`);
      throw error;
    }
  }

  private buildWhereClause(modelName: string, record: any): any {
    // Handle special cases for tables with composite unique keys
    switch (modelName) {
      case 'QuestionTag':
        // QuestionTag uses composite key: questionId + tagId
        if (record.questionId && record.tagId) {
          return {
            questionId_tagId: {
              questionId: record.questionId,
              tagId: record.tagId,
            },
          };
        }
        return null;

      default:
        // Default: use id field if it exists
        if (record.id) {
          return { id: record.id };
        }
        return null;
    }
  }

  private sanitizeRecord(record: any): any {
    // Remove Prisma metadata and convert to plain object
    const sanitized: any = {};
    for (const key in record) {
      if (key !== '_count' && key !== '__typename' && !key.startsWith('$')) {
        sanitized[key] = record[key];
      }
    }
    return sanitized;
  }

  async onModuleDestroy() {
    await this.supabaseClient?.$disconnect();
    await this.neonClient?.$disconnect();
  }
}

