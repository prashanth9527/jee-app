import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProcessingStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { MathpixService } from './mathpix.service';
import { PDFProcessorService } from './pdf-processor.service';

export interface FindAllOptions {
  page: number;
  limit: number;
  status?: string;
  recordType?: string;
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
    private readonly mathpixService: MathpixService,
    private readonly pdfProcessorService: PDFProcessorService
  ) {}

  async findAll(options: FindAllOptions) {
    const { page, limit, status, recordType, search, sortBy, sortOrder } = options;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (status && status !== 'all') {
      where.processingStatus = status.toUpperCase() as ProcessingStatus;
    }

    if (recordType && recordType !== 'all') {
      where.recordType = recordType.toLowerCase();
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

      if (questionsData.questions.length === 0) {
        this.logger.warn('No questions found in JSON data');
        return {
          importedCount: 0,
          totalQuestions: 0
        };
      }

      let importedCount = 0;

      // Import each question
      for (const questionData of questionsData.questions) {
        try {
          // Validate required fields
          if (!questionData.stem || questionData.stem.trim() === '') {
            this.logger.warn('Skipping question with empty stem');
            continue;
          }

          this.logger.log(`Processing question: ${questionData.stem?.substring(0, 50)}...`);
          
          let subjectId: string | null = null;
          let lessonId: string | null = null;
          let topicId: string | null = null;
          let subtopicId: string | null = null;

          // Handle Subject (must belong to a Stream)
          if (questionData.subject) {
            this.logger.log(`Processing subject: ${questionData.subject}`);
            // First, ensure we have a default stream for JEE
            const defaultStream = await this.prisma.stream.upsert({
              where: { code: 'JEE' },
              update: {},
              create: {
                name: 'JEE (Joint Entrance Examination)',
                code: 'JEE',
                description: 'Joint Entrance Examination preparation'
              }
            });

            // Create or find subject
            const subject = await this.prisma.subject.upsert({
              where: {
                streamId_name: {
                  streamId: defaultStream.id,
                  name: questionData.subject
                }
              },
              update: {},
              create: {
                name: questionData.subject,
                streamId: defaultStream.id
              }
            });
            subjectId = subject.id;
          }

          // Handle Lesson (optional, but if provided, must be under a subject)
          if (questionData.lesson && subjectId) {
            this.logger.log(`Processing lesson: ${questionData.lesson}`);
            const lesson = await this.prisma.lesson.findFirst({
              where: {
                name: questionData.lesson,
                subjectId: subjectId
              }
            });

            if (lesson) {
              lessonId = lesson.id;
            } else {
              // Find the next available order number for this subject
              const lastLesson = await this.prisma.lesson.findFirst({
                where: { subjectId: subjectId },
                orderBy: { order: 'desc' }
              });
              const nextOrder = lastLesson ? lastLesson.order + 1 : 0;
              
              // Create new lesson
              const newLesson = await this.prisma.lesson.create({
                data: {
                  name: questionData.lesson.trim(),
                  subjectId: subjectId,
                  order: nextOrder
                }
              });
              lessonId = newLesson.id;
            }
          }

          // Handle Topic (optional, but if provided, must be under a lesson)
          if (questionData.topic && lessonId && subjectId) {
            this.logger.log(`Processing topic: ${questionData.topic}`);
            const topic = await this.prisma.topic.findFirst({
              where: {
                name: questionData.topic,
                lessonId: lessonId,
                subjectId: subjectId
              }
            });

            if (topic) {
              topicId = topic.id;
            } else {
              // Find the next available order number for this lesson
              const lastTopic = await this.prisma.topic.findFirst({
                where: { lessonId: lessonId },
                orderBy: { order: 'desc' }
              });
              const nextOrder = lastTopic ? lastTopic.order + 1 : 0;
              
              // Create new topic
              const newTopic = await this.prisma.topic.create({
                data: {
                  name: questionData.topic.trim(),
                  lessonId: lessonId,
                  subjectId: subjectId,
                  order: nextOrder
                }
              });
              topicId = newTopic.id;
            }
          }

          // Handle Subtopic (optional, but if provided, must be under a topic)
          if (questionData.subtopic && topicId) {
            this.logger.log(`Processing subtopic: ${questionData.subtopic}`);
            const subtopic = await this.prisma.subtopic.findFirst({
              where: {
                name: questionData.subtopic,
                topicId: topicId
              }
            });

            if (subtopic) {
              subtopicId = subtopic.id;
            } else {
              // Find the next available order number for this topic
              const lastSubtopic = await this.prisma.subtopic.findFirst({
                where: { topicId: topicId },
                orderBy: { order: 'desc' }
              });
              const nextOrder = lastSubtopic ? lastSubtopic.order + 1 : 0;
              
              // Create new subtopic
              const newSubtopic = await this.prisma.subtopic.create({
                data: {
                  name: questionData.subtopic.trim(),
                  topicId: topicId,
                  order: nextOrder
                }
              });
              subtopicId = newSubtopic.id;
            }
          }
          
          // Create question in database
          const question = await this.prisma.question.create({
            data: {
              stem: questionData.stem || '',
              explanation: questionData.explanation || '',
              tip_formula: questionData.tip_formula || '',
              difficulty: questionData.difficulty || 'MEDIUM',
              yearAppeared: questionData.yearAppeared || new Date().getFullYear(),
              isPreviousYear: questionData.isPreviousYear || false,
              subjectId: subjectId,
              lessonId: lessonId,
              topicId: topicId,
              subtopicId: subtopicId,
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
          this.logger.log(`Successfully imported question with hierarchy: Subject=${subjectId}, Lesson=${lessonId}, Topic=${topicId}, Subtopic=${subtopicId}`);
        } catch (error) {
          this.logger.error(`Error importing question ${questionData.id || 'unknown'}:`, error);
          this.logger.error(`Question data:`, JSON.stringify(questionData, null, 2));
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
        this.logger.error('Mathpix API credentials not configured');
        throw new Error('Mathpix API credentials not configured. Please set MATHPIX_APP_ID and MATHPIX_APP_KEY environment variables.');
      }
      
      this.logger.log('Mathpix API credentials are configured');
      
      // Find the record by ID
      const record = await this.prisma.pDFProcessorCache.findUnique({
        where: { id }
      });

      if (!record) {
        throw new Error(`Record not found for ID: ${id}`);
      }

      // Use the same approach as the working PDF processor
      // First, try to get the file path from the PDF list (like the working implementation)
      const pdfs = await this.pdfProcessorService.listPDFs();
      const pdf = pdfs.find(p => p.fileName === record.fileName);
      
      let filePath = record.filePath; // fallback to database path
      
      if (pdf && pdf.filePath) {
        filePath = pdf.filePath;
        this.logger.log(`Using file path from PDF list: ${filePath}`);
      } else {
        this.logger.log(`Using file path from database: ${filePath}`);
        
        // If database path doesn't work, try to construct it like the working implementation
        if (!fs.existsSync(filePath)) {
          const contentDir = path.join(process.cwd(), 'content');
          const constructedPath = path.join(contentDir, record.fileName);
          this.logger.log(`Trying constructed path: ${constructedPath}`);
          
          if (fs.existsSync(constructedPath)) {
            filePath = constructedPath;
            this.logger.log(`Using constructed file path: ${filePath}`);
          }
        }
      }

      this.logger.log(`Final file path: ${filePath}`);
      this.logger.log(`File exists: ${fs.existsSync(filePath)}`);

      // Check if PDF file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`PDF file not found: ${filePath}`);
      }

      // Process with Mathpix using the existing service (same as working implementation)
      const result = await this.mathpixService.processPdfWithMathpixByFileName(record.fileName, filePath);
      
      this.logger.log(`Mathpix processing completed for cache ID: ${id}, success: ${result.success}`);
      
      return result;
    } catch (error) {
      this.logger.error('Error processing with Mathpix:', error);
      throw error;
    }
  }
}
