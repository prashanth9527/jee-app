import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessingStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { MathpixService } from './mathpix.service';

export interface FindAllOptions {
  page: number;
  limit: number;
  status?: string;
  search?: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface CacheStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retrying: number;
  uploading: number;
}

@Injectable()
export class PDFProcessorCacheService {
  private readonly logger = new Logger(PDFProcessorCacheService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mathpixService: MathpixService
  ) {}

  async findAll(options: FindAllOptions) {
    const { page, limit, status, search, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status && status !== 'all') {
      where.processingStatus = status.toUpperCase() as ProcessingStatus;
    }

    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { filePath: { contains: search, mode: 'insensitive' } },
        { errorMessage: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'fileName') {
      orderBy.fileName = sortOrder;
    } else if (sortBy === 'fileSize') {
      orderBy.fileSize = sortOrder;
    } else if (sortBy === 'processingStatus') {
      orderBy.processingStatus = sortOrder;
    } else if (sortBy === 'processingTimeMs') {
      orderBy.processingTimeMs = sortOrder;
    } else if (sortBy === 'retryCount') {
      orderBy.retryCount = sortOrder;
    } else if (sortBy === 'lastProcessedAt') {
      orderBy.lastProcessedAt = sortOrder;
    } else if (sortBy === 'importedAt') {
      orderBy.importedAt = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    try {
      const [data, total] = await Promise.all([
        this.prisma.pDFProcessorCache.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          include: {
            _count: {
              select: {
                logs: true,
                questions: true
              }
            }
          }
        }),
        this.prisma.pDFProcessorCache.count({ where })
      ]);

      return {
        data: data.map(record => ({
          ...record,
          logsCount: record._count.logs,
          questionsCount: record._count.questions
        })),
        total
      };
    } catch (error) {
      this.logger.error('Error fetching PDF processor cache records:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    try {
      const record = await this.prisma.pDFProcessorCache.findUnique({
        where: { id },
        include: {
          logs: {
            orderBy: { createdAt: 'desc' },
            take: 10
          },
          _count: {
            select: {
              logs: true,
              questions: true
            }
          }
        }
      });

      if (!record) {
        return null;
      }

      return {
        ...record,
        logsCount: record._count.logs,
        questionsCount: record._count.questions
      };
    } catch (error) {
      this.logger.error('Error fetching PDF processor cache record:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      const deleted = await this.prisma.pDFProcessorCache.delete({
        where: { id }
      });
      return deleted;
    } catch (error) {
      this.logger.error('Error deleting PDF processor cache record:', error);
      throw error;
    }
  }

  async getStats(): Promise<CacheStats> {
    try {
      const [
        total,
        pending,
        processing,
        completed,
        failed,
        retrying,
        uploading
      ] = await Promise.all([
        this.prisma.pDFProcessorCache.count(),
        this.prisma.pDFProcessorCache.count({ where: { processingStatus: 'PENDING' } }),
        this.prisma.pDFProcessorCache.count({ where: { processingStatus: 'PROCESSING' } }),
        this.prisma.pDFProcessorCache.count({ where: { processingStatus: 'COMPLETED' } }),
        this.prisma.pDFProcessorCache.count({ where: { processingStatus: 'FAILED' } }),
        this.prisma.pDFProcessorCache.count({ where: { processingStatus: 'RETRYING' } }),
        this.prisma.pDFProcessorCache.count({ where: { processingStatus: 'UPLOADING' } })
      ]);

      return {
        total,
        pending,
        processing,
        completed,
        failed,
        retrying,
        uploading
      };
    } catch (error) {
      this.logger.error('Error fetching cache statistics:', error);
      throw error;
    }
  }

  async syncFilesFromContentFolder() {
    try {
      this.logger.log('Starting sync of files from content folder...');
      
      // Get the root directory (two levels up from backend/src)
      const rootDir = path.join(__dirname, '../../../..');
      const contentDir = path.join(rootDir, 'content');
      
      this.logger.log(`Scanning content directory: ${contentDir}`);
      
      if (!fs.existsSync(contentDir)) {
        throw new Error(`Content directory does not exist: ${contentDir}`);
      }

      const pdfFiles = this.findPDFFiles(contentDir);
      this.logger.log(`Found ${pdfFiles.length} PDF files in content directory`);

      let synced = 0;
      let skipped = 0;

      for (const fileInfo of pdfFiles) {
        try {
          // Check if file already exists in database
          const existingRecord = await this.prisma.pDFProcessorCache.findFirst({
            where: {
              filePath: fileInfo.relativePath
            }
          });

          if (existingRecord) {
            this.logger.log(`Skipping existing file: ${fileInfo.relativePath}`);
            skipped++;
            continue;
          }

          // Create new record
          await this.prisma.pDFProcessorCache.create({
            data: {
              fileName: fileInfo.fileName,
              filePath: fileInfo.relativePath,
              fileSize: fileInfo.fileSize,
              processingStatus: ProcessingStatus.PENDING
            }
          });

          this.logger.log(`Synced new file: ${fileInfo.relativePath}`);
          synced++;
        } catch (error) {
          this.logger.error(`Error processing file ${fileInfo.relativePath}:`, error);
          // Continue with other files even if one fails
        }
      }

      this.logger.log(`Sync completed: ${synced} files synced, ${skipped} duplicates skipped`);
      
      return {
        synced,
        skipped,
        total: pdfFiles.length
      };
    } catch (error) {
      this.logger.error('Error syncing files from content folder:', error);
      throw error;
    }
  }

  private findPDFFiles(dir: string, basePath: string = ''): Array<{
    fileName: string;
    relativePath: string;
    fileSize: number;
  }> {
    const pdfFiles: Array<{
      fileName: string;
      relativePath: string;
      fileSize: number;
    }> = [];

    try {
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = basePath ? path.join(basePath, item) : item;
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          // Recursively search subdirectories
          const subFiles = this.findPDFFiles(fullPath, relativePath);
          pdfFiles.push(...subFiles);
        } else if (stat.isFile() && path.extname(item).toLowerCase() === '.pdf') {
          // Found a PDF file
          pdfFiles.push({
            fileName: item,
            relativePath: `content\\${relativePath}`, // Start with 'content\' as requested
            fileSize: stat.size
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error reading directory ${dir}:`, error);
    }

    return pdfFiles;
  }

  async importQuestionsFromJson(id: string) {
    try {
      this.logger.log(`Starting import of questions from JSON for record ID: ${id}`);
      
      // Find the record by ID
      const record = await this.prisma.pDFProcessorCache.findUnique({
        where: { id }
      });

      if (!record) {
        throw new Error(`Record not found for ID: ${id}`);
      }

      if (!record.jsonContent) {
        throw new Error('No JSON content found for this record');
      }

      // Parse the JSON content
      let questionsData;
      try {
        questionsData = JSON.parse(record.jsonContent);
      } catch (error) {
        throw new Error('Invalid JSON content');
      }

      if (!questionsData.questions || !Array.isArray(questionsData.questions)) {
        throw new Error('Invalid JSON structure: questions array not found');
      }

      let importedCount = 0;

      // Import each question
      for (const questionData of questionsData.questions) {
        try {
          // Create question in database
          const question = await this.prisma.question.create({
            data: {
              stem: questionData.stem || '',
              explanation: questionData.explanation || '',
              tip_formula: questionData.tip_formula || '',
              difficulty: questionData.difficulty || 'MEDIUM',
              yearAppeared: questionData.yearAppeared || new Date().getFullYear(),
              isPreviousYear: questionData.isPreviousYear || false,
              pdfProcessorCacheId: record.id
            }
          });

          // Create question options
          if (questionData.options && Array.isArray(questionData.options)) {
            for (let i = 0; i < questionData.options.length; i++) {
              const option = questionData.options[i];
              await this.prisma.questionOption.create({
                data: {
                  questionId: question.id,
                  text: option.text || '',
                  isCorrect: option.isCorrect || false,
                  order: i
                }
              });
            }
          }

          importedCount++;
        } catch (error) {
          this.logger.error(`Error importing question ${questionData.id}:`, error);
          // Continue with other questions even if one fails
        }
      }

      // Update the record to mark as imported
      await this.prisma.pDFProcessorCache.update({
        where: { id: record.id },
        data: { importedAt: new Date() }
      });

      this.logger.log(`Successfully imported ${importedCount} questions for file: ${record.fileName}`);
      
      return {
        importedCount,
        totalQuestions: questionsData.questions.length
      };
    } catch (error) {
      this.logger.error('Error importing questions from JSON:', error);
      throw error;
    }
  }

  async deleteQuestionsByCacheId(id: string) {
    try {
      this.logger.log(`Starting deletion of questions for cache ID: ${id}`);
      
      // Find the record to verify it exists
      const record = await this.prisma.pDFProcessorCache.findUnique({
        where: { id }
      });

      if (!record) {
        throw new Error(`Record not found for ID: ${id}`);
      }

      // Delete all questions associated with this cache ID
      const deleteResult = await this.prisma.question.deleteMany({
        where: {
          pdfProcessorCacheId: id
        }
      });

      // Update the record to clear the importedAt field
      await this.prisma.pDFProcessorCache.update({
        where: { id },
        data: { importedAt: null }
      });

      this.logger.log(`Successfully deleted ${deleteResult.count} questions for cache ID: ${id}`);
      
      return {
        deletedCount: deleteResult.count
      };
    } catch (error) {
      this.logger.error('Error deleting questions by cache ID:', error);
      throw error;
    }
  }

  async processWithMathpix(id: string) {
    try {
      this.logger.log(`Starting Mathpix processing for cache ID: ${id}`);
      
      // Check if Mathpix is configured
      if (!this.mathpixService.isConfigured()) {
        throw new Error('Mathpix API credentials not configured. Please set MATHPIX_APP_ID and MATHPIX_APP_KEY environment variables.');
      }
      
      // Find the record by ID
      const record = await this.prisma.pDFProcessorCache.findUnique({
        where: { id }
      });

      if (!record) {
        throw new Error(`Record not found for ID: ${id}`);
      }

      // Get the full file path
      const rootDir = path.join(__dirname, '../../../..');
      const fullFilePath = path.join(rootDir, record.filePath.replace(/\\/g, path.sep));

      this.logger.log(`Root directory: ${rootDir}`);
      this.logger.log(`Record file path: ${record.filePath}`);
      this.logger.log(`Full file path: ${fullFilePath}`);
      this.logger.log(`File exists: ${fs.existsSync(fullFilePath)}`);

      // Check if PDF file exists
      if (!fs.existsSync(fullFilePath)) {
        // Try alternative path construction
        const altFilePath = path.join(process.cwd(), record.filePath);
        this.logger.log(`Alternative file path: ${altFilePath}`);
        this.logger.log(`Alternative file exists: ${fs.existsSync(altFilePath)}`);
        
        if (fs.existsSync(altFilePath)) {
          this.logger.log(`Using alternative file path: ${altFilePath}`);
          const result = await this.mathpixService.processPdfWithMathpixByFileName(record.fileName, altFilePath);
          this.logger.log(`Mathpix processing completed for cache ID: ${id}, success: ${result.success}`);
          return result;
        }
        
        throw new Error(`PDF file not found: ${fullFilePath} or ${altFilePath}`);
      }

      // Process with Mathpix using the existing service
      const result = await this.mathpixService.processPdfWithMathpixByFileName(record.fileName, fullFilePath);
      
      this.logger.log(`Mathpix processing completed for cache ID: ${id}, success: ${result.success}`);
      
      return result;
    } catch (error) {
      this.logger.error('Error processing with Mathpix:', error);
      throw error;
    }
  }
}
