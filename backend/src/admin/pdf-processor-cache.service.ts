import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MathpixService } from './mathpix.service';
import { PDFProcessorService } from './pdf-processor.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PDFProcessorCacheService {
  private readonly logger = new Logger(PDFProcessorCacheService.name);

  constructor(
    private prisma: PrismaService,
    private mathpixService: MathpixService,
    private pdfProcessorService: PDFProcessorService,
  ) {}

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    recordType?: string;
    search?: string;
    sortBy: string;
    sortOrder: string;
  }) {
    const { page, limit, status, recordType, search, sortBy, sortOrder } = params;
    
    // Build where clause
    const where: any = {};
    
    if (status) {
      where.processingStatus = status;
    }
    
    if (recordType) {
      where.recordType = recordType;
    }
    
    if (search) {
      where.fileName = {
        contains: search,
        mode: 'insensitive'
      };
    }
    
    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;
    
    // Get total count
    const total = await this.prisma.pDFProcessorCache.count({ where });
    
    // Get paginated results
    const data = await this.prisma.pDFProcessorCache.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        _count: {
          select: {
            logs: true,
            questions: true
          }
        }
      }
    });
    
    // Transform the data to include counts
    const transformedData = data.map(record => ({
      ...record,
      logsCount: record._count.logs,
      questionsCount: record._count.questions
    }));
    
    return {
      data: transformedData,
      total
    };
  }

  async findOne(id: string) {
    return this.prisma.pDFProcessorCache.findUnique({
      where: { id }
    });
  }

  async create(data: any) {
    return this.prisma.pDFProcessorCache.create({
      data
    });
  }

  async update(id: string, data: any) {
    return this.prisma.pDFProcessorCache.update({
      where: { id },
      data
    });
  }

  async delete(id: string) {
    return this.prisma.pDFProcessorCache.delete({
      where: { id }
    });
  }

  async getStats() {
    const total = await this.prisma.pDFProcessorCache.count();
    const completed = await this.prisma.pDFProcessorCache.count({
      where: { processingStatus: 'COMPLETED' }
    });
    const pending = await this.prisma.pDFProcessorCache.count({
      where: { processingStatus: 'PENDING' }
    });
    const failed = await this.prisma.pDFProcessorCache.count({
      where: { processingStatus: 'FAILED' }
    });

    return {
      total,
      completed,
      pending,
      failed,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  async getLogs(cacheId: string) {
    return this.prisma.pDFProcessorLog.findMany({
      where: { cacheId },
      orderBy: { createdAt: 'desc' }
    });
  }

  async processWithMathpixToHtml(id: string) {
    try {
      this.logger.log(`Starting Mathpix HTML processing for cache ID: ${id}`);
      
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
      const pdf = pdfs.find((p: any) => p.fileName === record.fileName);
      
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

      // Process with Mathpix to HTML
      const result = await this.mathpixService.processPdfWithMathpixToHtml(id);
      
      this.logger.log(`Mathpix HTML processing completed for cache ID: ${id}, success: ${result.success}`);
      
      return result;
    } catch (error) {
      this.logger.error('Error processing with Mathpix to HTML:', error);
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
      const pdf = pdfs.find((p: any) => p.fileName === record.fileName);
      
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

      // Process with Mathpix
      const result = await this.mathpixService.processPdfWithMathpix(id);
      
      this.logger.log(`Mathpix processing completed for cache ID: ${id}, success: ${result.success}`);
      
      return result;
    } catch (error) {
      this.logger.error('Error processing with Mathpix:', error);
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

      // Delete all questions associated with this cache
      const deletedQuestions = await this.prisma.question.deleteMany({
        where: { pdfProcessorCacheId: id }
      });

      this.logger.log(`Deleted ${deletedQuestions.count} questions for cache ID: ${id}`);

      // Update record with import timestamp
      await this.prisma.pDFProcessorCache.update({
        where: { id },
        data: { 
          importedAt: null,
          processingStatus: 'PENDING'
        }
      });
      
      return {
        success: true,
        deletedCount: deletedQuestions.count,
        message: `Successfully deleted ${deletedQuestions.count} questions`
      };
    } catch (error) {
      this.logger.error('Error deleting questions:', error);
      throw error;
    }
  }

  async syncFilesFromContentFolder() {
    try {
      this.logger.log('Starting sync of files from content folder');
      
      const contentDir = path.join(process.cwd(), 'content');
      
      if (!fs.existsSync(contentDir)) {
        throw new Error(`Content directory not found: ${contentDir}`);
      }
      
      // Get all PDF files from content directory
      const files = fs.readdirSync(contentDir).filter(file => 
        file.toLowerCase().endsWith('.pdf')
      );
      
      let synced = 0;
      let updated = 0;
      let skipped = 0;
      
      for (const fileName of files) {
        const filePath = path.join(contentDir, fileName);
        const stats = fs.statSync(filePath);
        
        // Check if record already exists
        const existingRecord = await this.prisma.pDFProcessorCache.findUnique({
          where: { fileName }
        });
        
        if (existingRecord) {
          // Update file size if different
          if (existingRecord.fileSize !== stats.size) {
            await this.prisma.pDFProcessorCache.update({
              where: { id: existingRecord.id },
              data: { 
                fileSize: stats.size,
                filePath: filePath
              }
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          // Create new record
          await this.prisma.pDFProcessorCache.create({
            data: {
              fileName,
              filePath,
              fileSize: stats.size,
              recordType: 'pyq',
              processingStatus: 'PENDING'
            }
          });
          synced++;
        }
      }
      
      this.logger.log(`Sync completed: ${synced} synced, ${updated} updated, ${skipped} skipped`);
      
      return {
        success: true,
        synced,
        updated,
        skipped,
        message: `Sync completed: ${synced} files synced, ${updated} files updated, ${skipped} duplicates skipped`
      };
    } catch (error) {
      this.logger.error('Error syncing files:', error);
      throw error;
    }
  }
/*
  async importQuestionsFromJson(id: string) {
    try {
      this.logger.log(`Starting import of questions from JSON for cache ID: ${id}`);
      
      const record = await this.prisma.pDFProcessorCache.findUnique({
        where: { id }
      });

      if (!record) {
        throw new Error(`Record not found for ID: ${id}`);
      }

      if (!record.jsonContent) {
        throw new Error('No JSON content found for this record');
      }

      // Parse JSON content
      const jsonData = JSON.parse(record.jsonContent);
      const questions = jsonData.questions || [];

      let importedCount = 0;

      for (const questionData of questions) {
        try {
          // Don't include 'id' field - let Prisma generate new IDs
          await this.prisma.question.create({
            data: {
              stem: questionData.stem || '',
              explanation: questionData.explanation || '',
              tip_formula: questionData.tip_formula || '',
              difficulty: questionData.difficulty || 'MEDIUM',
              yearAppeared: questionData.yearAppeared || null,
              isPreviousYear: questionData.isPreviousYear || false,
              isAIGenerated: true,
              aiPrompt: 'PDF Processor Cache Import',
              status: 'underreview',
              pdfProcessorCacheId: id,
              options: {
                create: (questionData.options || []).map((option: any, index: number) => ({
                  text: option.text || '',
                  isCorrect: option.isCorrect || false,
                  order: Number(index)
                }))
              }
            }
          });
          importedCount++;
        } catch (error) {
          this.logger.error(`Error importing question: ${error.message}`);
        }
      }

      // Update record with import timestamp
      await this.prisma.pDFProcessorCache.update({
        where: { id },
        data: { 
          importedAt: new Date(),
          processingStatus: 'COMPLETED'
        }
      });

      this.logger.log(`Successfully imported ${importedCount} questions for cache ID: ${id}`);
      
      return {
        success: true,
        importedCount,
        message: `Successfully imported ${importedCount} questions`
      };
    } catch (error) {
      this.logger.error('Error importing questions from JSON:', error);
      throw error;
    }
  }
  */

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
          
          // Handle Formula - create/find in Formula table if tip_formula exists
          let formulaId: string | null = null;
          if (questionData.tip_formula && questionData.tip_formula.trim() !== '') {
            this.logger.log(`Processing formula: ${questionData.tip_formula.substring(0, 50)}...`);
            
             // Check if formula already exists (by content and subject)
             const existingFormula = await this.prisma.formula.findFirst({
               where: {
                 formula: questionData.tip_formula,
                 subject: subjectId
               }
             });

            if (existingFormula) {
              formulaId = existingFormula.id;
              this.logger.log(`Using existing formula ID: ${formulaId}`);
            } else {
               // Create new formula
               const newFormula = await this.prisma.formula.create({
                 data: {
                   title: questionData.tip_formula.substring(0, 100), // Use first 100 chars as title
                   formula: questionData.tip_formula,
                   subject: subjectId,
                   topicId: topicId,
                   subtopicId: subtopicId
                 }
               });
              formulaId = newFormula.id;
              this.logger.log(`Created new formula with ID: ${formulaId}`);
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
               formulaid: formulaId, // Link to Formula table
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
        data: { 
          importedAt: new Date(),
          processingStatus: 'COMPLETED'
        }
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

  async processWithChatGPT(id: string, latexFilePath: string) {
    try {
      this.logger.log(`Starting ChatGPT processing for cache ID: ${id}`);
      
      const record = await this.prisma.pDFProcessorCache.findUnique({
        where: { id }
      });

      if (!record) {
        throw new Error(`Record not found for ID: ${id}`);
      }

      // This would integrate with ChatGPT processing
      // For now, return a placeholder response
      return {
        success: true,
        message: 'ChatGPT processing completed',
        questionsCount: 0,
        chunksProcessed: 0,
        totalChunks: 0,
        jsonContent: record.jsonContent
      };
    } catch (error) {
      this.logger.error('Error processing with ChatGPT:', error);
      throw error;
    }
  }

  async processWithClaude(id: string, latexFilePath: string) {
    try {
      this.logger.log(`Starting Claude processing for cache ID: ${id}`);
      
      const record = await this.prisma.pDFProcessorCache.findUnique({
        where: { id }
      });

      if (!record) {
        throw new Error(`Record not found for ID: ${id}`);
      }

      // This would integrate with Claude processing
      // For now, return a placeholder response
      return {
        success: true,
        message: 'Claude processing completed',
        questionsCount: 0,
        chunksProcessed: 0,
        jsonContent: record.jsonContent
      };
    } catch (error) {
      this.logger.error('Error processing with Claude:', error);
      throw error;
    }
  }

  async remove(id: string) {
    try {
      this.logger.log(`Starting deletion of cache record: ${id}`);
      
      const deleted = await this.prisma.pDFProcessorCache.delete({
        where: { id }
      });

      this.logger.log(`Successfully deleted cache record: ${id}`);
      
      return {
        success: true,
        deleted,
        message: 'Cache record deleted successfully'
      };
    } catch (error) {
      this.logger.error('Error deleting cache record:', error);
      throw error;
    }
  }

  async saveLMSContent(id: string, htmlContent: string, jsonContent: string) {
    try {
      this.logger.log(`Starting save LMS content for cache ID: ${id}`);
      
      const record = await this.prisma.pDFProcessorCache.findUnique({
        where: { id }
      });

      if (!record) {
        throw new Error(`Record not found for ID: ${id}`);
      }

      if (record.recordType !== 'lms') {
        throw new Error('This function is only available for LMS records');
      }

      // Parse JSON content to extract lesson structure
      const jsonData = JSON.parse(jsonContent);
      
      // Create LMS content entry
      const lmsContent = await this.prisma.lMSContent.create({
        data: {
          title: jsonData.lesson_title || 'Unknown Lesson',
          description: `Content generated from PDF: ${record.fileName}`,
          contentType: 'TEXT',
          status: 'DRAFT',
          contentData: {
            htmlContent: htmlContent,
            jsonContent: jsonContent,
            pdfProcessorCacheId: id
          },
          lessonId: jsonData.lesson_id || null
        }
      });

      // Update the PDF processor cache with LMS content ID
      await this.prisma.pDFProcessorCache.update({
        where: { id },
        data: { 
          lmsContentId: lmsContent.id,
          importedAt: new Date(),
          processingStatus: 'COMPLETED'
        }
      });

      this.logger.log(`Successfully saved LMS content for cache ID: ${id}`);
      
      return {
        success: true,
        lmsContent,
        message: 'LMS content saved successfully'
      };
    } catch (error) {
      this.logger.error('Error saving LMS content:', error);
      throw error;
    }
  }

  async deleteLMSContent(id: string) {
    try {
      this.logger.log(`Starting delete LMS content for cache ID: ${id}`);
      
      const record = await this.prisma.pDFProcessorCache.findUnique({
        where: { id }
      });

      if (!record) {
        throw new Error(`Record not found for ID: ${id}`);
      }

      if (!record.lmsContentId) {
        throw new Error('No LMS content found for this record');
      }

      // Delete the LMS content
      await this.prisma.lMSContent.delete({
        where: { id: record.lmsContentId }
      });

      // Update the PDF processor cache to remove LMS content ID
      await this.prisma.pDFProcessorCache.update({
        where: { id },
        data: { 
          lmsContentId: null,
          importedAt: null,
          processingStatus: 'PENDING'
        }
      });

      this.logger.log(`Successfully deleted LMS content for cache ID: ${id}`);
      
      return {
        success: true,
        message: 'LMS content deleted successfully'
      };
    } catch (error) {
      this.logger.error('Error deleting LMS content:', error);
      throw error;
    }
  }

  async previewLMSContent(id: string) {
    try {
      this.logger.log(`Starting preview LMS content for cache ID: ${id}`);
      
      const record = await this.prisma.pDFProcessorCache.findUnique({
        where: { id }
      });

      if (!record) {
        throw new Error(`Record not found for ID: ${id}`);
      }

      if (!record.lmsContentId) {
        this.logger.error(`No LMS content ID found for record: ${id}`);
        throw new Error('No LMS content found for this record');
      }

      // Query LMS content directly since the relation might not be working
      const lmsContent = await this.prisma.lMSContent.findUnique({
        where: { id: record.lmsContentId }
      });

      if (!lmsContent) {
        this.logger.error(`LMS content not found for ID: ${record.lmsContentId}`);
        throw new Error('LMS content not found');
      }

      // this.logger.log(`Successfully retrieved LMS content for cache ID: ${id}`);
      // this.logger.log(`Record lmsContentId: ${record.lmsContentId}`);
      // this.logger.log(`LMS Content: ${JSON.stringify(lmsContent, null, 2)}`);
      // this.logger.log(`Record htmlContent length: ${record.htmlContent?.length || 0}`);
      // this.logger.log(`Record jsonContent length: ${record.jsonContent?.length || 0}`);
      
      return {
        success: true,
        data: {
          lmsContent: lmsContent,
          htmlContent: record.htmlContent,
          jsonContent: record.jsonContent
        },
        message: 'LMS content retrieved successfully'
      };
    } catch (error) {
      this.logger.error('Error previewing LMS content:', error);
      throw error;
    }
  }

  async approveLMSContent(id: string, publishData?: any) {
    try {
      this.logger.log(`Starting approve LMS content for cache ID: ${id}`);
      
      const record = await this.prisma.pDFProcessorCache.findUnique({
        where: { id }
      });

      if (!record) {
        throw new Error(`Record not found for ID: ${id}`);
      }

      if (!record.lmsContentId) {
        this.logger.error(`No LMS content ID found for record: ${id}`);
        throw new Error('No LMS content found for this record');
      }

      // Prepare update data
      const updateData: any = { 
        status: 'PUBLISHED',
        updatedAt: new Date()
      };

      // Add categorization data if provided
      if (publishData) {
        if (publishData.streamId) updateData.streamId = publishData.streamId;
        if (publishData.subjectId) updateData.subjectId = publishData.subjectId;
        if (publishData.lessonId) updateData.lessonId = publishData.lessonId;
        if (publishData.topicId) updateData.topicId = publishData.topicId;
        if (publishData.subtopicId) updateData.subtopicId = publishData.subtopicId;

        // Generate title based on selected categorization
        const titleParts = [];
        
        if (publishData.subjectId) {
          const subject = await this.prisma.subject.findUnique({
            where: { id: publishData.subjectId },
            select: { name: true }
          });
          if (subject) titleParts.push(subject.name);
        }

        if (publishData.lessonId) {
          const lesson = await this.prisma.lesson.findUnique({
            where: { id: publishData.lessonId },
            select: { name: true }
          });
          if (lesson) titleParts.push(lesson.name);
        }

        if (publishData.topicId) {
          const topic = await this.prisma.topic.findUnique({
            where: { id: publishData.topicId },
            select: { name: true }
          });
          if (topic) titleParts.push(topic.name);
        }

        if (publishData.subtopicId) {
          const subtopic = await this.prisma.subtopic.findUnique({
            where: { id: publishData.subtopicId },
            select: { name: true }
          });
          if (subtopic) titleParts.push(subtopic.name);
        }

        // Update title if we have categorization data
        if (titleParts.length > 0) {
          updateData.title = titleParts.join(' → ');
        }
      }

      // Update LMS content status to PUBLISHED
      const updatedLmsContent = await this.prisma.lMSContent.update({
        where: { id: record.lmsContentId },
        data: updateData
      });

      this.logger.log(`Successfully published LMS content for cache ID: ${id}`);
      
      return {
        success: true,
        data: {
          lmsContent: updatedLmsContent
        },
        message: 'LMS content published successfully'
      };
    } catch (error) {
      this.logger.error('Error publishing LMS content:', error);
      throw error;
    }
  }

  async getStreams() {
    try {
      const streams = await this.prisma.stream.findMany({
        select: {
          id: true,
          name: true,
          description: true
        },
        orderBy: { name: 'asc' }
      });
      return streams;
    } catch (error) {
      this.logger.error('Error fetching streams:', error);
      throw error;
    }
  }

  async getSubjects(streamId?: string) {
    try {
      const whereClause = streamId ? { streamId } : {};
      const subjects = await this.prisma.subject.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          streamId: true
        },
        orderBy: { name: 'asc' }
      });
      return subjects;
    } catch (error) {
      this.logger.error('Error fetching subjects:', error);
      throw error;
    }
  }

  async getLessons(subjectId?: string) {
    try {
      const whereClause = subjectId ? { subjectId } : {};
      const lessons = await this.prisma.lesson.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          subjectId: true
        },
        orderBy: { name: 'asc' }
      });
      return lessons;
    } catch (error) {
      this.logger.error('Error fetching lessons:', error);
      throw error;
    }
  }

  async getTopics(lessonId?: string) {
    try {
      const whereClause = lessonId ? { lessonId } : {};
      const topics = await this.prisma.topic.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          lessonId: true
        },
        orderBy: { name: 'asc' }
      });
      return topics;
    } catch (error) {
      this.logger.error('Error fetching topics:', error);
      throw error;
    }
  }

  async getSubtopics(topicId?: string) {
    try {
      const whereClause = topicId ? { topicId } : {};
      const subtopics = await this.prisma.subtopic.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          topicId: true
        },
        orderBy: { name: 'asc' }
      });
      return subtopics;
    } catch (error) {
      this.logger.error('Error fetching subtopics:', error);
      throw error;
    }
  }
}