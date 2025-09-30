import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { AIProviderFactory } from '../ai/ai-provider.factory';
import { AIProviderType } from '../ai/ai-provider.interface';

export interface PDFProcessingRequest {
  fileName: string;
  filePath?: string; // Full file path including subdirectories
  systemPrompt?: string;
  userPrompt?: string;
  aiProvider?: AIProviderType; // AI provider to use for processing
}

export interface PDFProcessingResponse {
  id: string;
  fileName: string;
  status: string;
  message: string;
  outputFilePath?: string;
  processedData?: any;
}

export interface ChatGPTResponse {
  questions: Array<{
    id: string;
    stem: string;
    options: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
    explanation: string;
    tip_formula?: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    subject: string;
    lesson?: string;
    topic?: string;
    subtopic?: string;
    yearAppeared?: number;
    isPreviousYear?: boolean;
    tags?: string[];
  }>;
  metadata: {
    totalQuestions: number;
    subjects: string[];
    topics: string[];
    difficultyDistribution: {
      easy: number;
      medium: number;
      hard: number;
    };
    processingTime: number;
  };
}

@Injectable()
export class PDFProcessorService {
  private readonly logger = new Logger(PDFProcessorService.name);
  private readonly contentDir = path.join(process.cwd(), '..', 'content', 'JEE', 'Previous Papers');
  private readonly processedDir = path.join(process.cwd(), '..', 'content', 'JEE', 'Processed');

  // Fixed system prompt for JEE question extraction
  private readonly defaultSystemPrompt = `You are an expert JEE (Joint Entrance Examination) question analyzer. Your task is to extract and structure questions from JEE previous year papers.

CRITICAL: You MUST respond with ONLY valid JSON. Do not include any explanatory text, comments, or markdown formatting. Start your response with { and end with }.

MANDATORY INSTRUCTIONS - CHUNKED PROCESSING:
1. **CHUNKED APPROACH** - You will process this PDF in chunks to ensure complete coverage.
2. **FIRST CHUNK (Pages 1-3)**: Read pages 1-3 and extract questions Q1-Q10. Focus only on these pages and questions.
3. **SECOND CHUNK (Pages 4-6)**: Read pages 4-6 and extract questions Q11-Q20. Continue from where you left off.
4. **THIRD CHUNK (Pages 7-12)**: Read pages 7-12 and extract questions Q21-Q30+. This is the final chunk.
5. **EXTRACT EVERY QUESTION** - Look for question numbers: Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11, Q12, Q13, Q14, Q15, Q16, Q17, Q18, Q19, Q20, Q21, Q22, Q23, Q24, Q25, Q26, Q27, Q28, Q29, Q30, etc.
6. **DO NOT STOP EARLY** - Continue reading even if questions seem repetitive or similar. Each question must be extracted.
7. **CHECK FOR MULTIPLE SECTIONS** - Some PDFs have multiple sections or parts. Read ALL sections in your assigned chunk.

TECHNICAL REQUIREMENTS:
6. Ensure ALL mathematical expressions are in LaTeX format using $$...$$ for display math
7. Each question must have exactly 4 options (A, B, C, D)
8. Mark exactly ONE option as correct
9. Provide detailed explanations for each answer
10. Generate a tip_formula for each question - this should be a key formula, concept, or shortcut that helps solve the question
11. Classify difficulty as EASY, MEDIUM, or HARD
12. Identify subject (Physics, Chemistry, Mathematics)
13. **MANDATORY LESSON FIELD**: Every question MUST have a "lesson" field. Identify the lesson/chapter for each question following this hierarchy:
    - For Chemistry: "Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry"
    - For Physics: "Mechanics", "Thermodynamics", "Electromagnetism", "Optics", "Modern Physics", "Waves"
    - For Mathematics: "Algebra", "Calculus", "Geometry", "Trigonometry", "Statistics", "Coordinate Geometry"
    - **DO NOT OMIT THE LESSON FIELD** - It is required for every question
14. Extract relevant topics and subtopics within that lesson
15. Include year information if available
16. Add relevant tags for better categorization
17. Set isPreviousYear to true for all questions (these are from previous year papers)

CRITICAL: MISSING CONTENT GENERATION:
18. **GENERATE MISSING OPTIONS**: If a question in the PDF has fewer than 4 options or missing options, you MUST generate the missing options as a JEE subject expert. Create plausible, realistic options that a student might consider, ensuring exactly 4 total options (A, B, C, D).
19. **GENERATE MISSING EXPLANATIONS**: If a question lacks a solution or explanation in the PDF, you MUST generate a detailed, step-by-step explanation as a JEE expert. Include the reasoning, formulas used, and why the correct answer is right.
20. **GENERATE MISSING CORRECT ANSWERS**: If the correct answer is not clearly marked in the PDF, you MUST determine the correct answer based on your expertise and mark it appropriately.
21. **EXPERT KNOWLEDGE**: Use your deep understanding of JEE concepts, formulas, and problem-solving techniques to fill any gaps in the PDF content.

FINAL VALIDATION - MANDATORY CHECKS:
- Count the questions in your response
- Ensure totalQuestions in metadata matches the actual count
- If you have fewer than 20 questions, you DEFINITELY missed some - re-read the entire PDF
- Verify every question has a "lesson" field
- Check that you read all pages of the PDF
- Ensure you didn't stop at page 1 or 2 - JEE papers are longer

CRITICAL REMINDER:
- JEE papers are typically 8-12 pages long
- Each page usually contains 2-4 questions
- If you only find 4 questions, you only read 1-2 pages
- You MUST read ALL pages to get all questions
- Look for question numbers in sequence: Q1, Q2, Q3, Q4, Q5, Q6, Q7, Q8, Q9, Q10, Q11, Q12, Q13, Q14, Q15, Q16, Q17, Q18, Q19, Q20, Q21, Q22, Q23, Q24, Q25, Q26, Q27, Q28, Q29, Q30

RESPOND WITH ONLY THIS JSON STRUCTURE (no other text):
{
  "questions": [
    {
      "id": "unique_id",
      "stem": "Question text with LaTeX math: $$\\frac{d}{dx}[x^2] = ?$$",
      "options": [
        {"id": "A", "text": "Option A with LaTeX: $$2x$$", "isCorrect": true},
        {"id": "B", "text": "Option B with LaTeX: $$x^2$$", "isCorrect": false},
        {"id": "C", "text": "Option C with LaTeX: $$2x^2$$", "isCorrect": false},
        {"id": "D", "text": "Option D with LaTeX: $$x$$", "isCorrect": false}
      ],
      "explanation": "Detailed explanation with LaTeX: $$\\frac{d}{dx}[x^2] = 2x$$ by power rule...",
      "tip_formula": "Power rule: $$\\frac{d}{dx}[x^n] = nx^{n-1}$$",
      "difficulty": "MEDIUM",
      "subject": "Mathematics",
      "lesson": "Calculus",
      "topic": "Differentiation",
      "subtopic": "Power Rule",
      "yearAppeared": 2023,
      "isPreviousYear": true,
      "tags": ["derivatives", "power-rule", "calculus"]
    }
  ],
  "metadata": {
    "totalQuestions": 90,
    "subjects": ["Physics", "Chemistry", "Mathematics"],
    "topics": ["Mechanics", "Organic Chemistry", "Calculus"],
    "difficultyDistribution": {"easy": 30, "medium": 45, "hard": 15},
    "processingTime": 120
  }
}`;

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiProviderFactory: AIProviderFactory
  ) {
    // Ensure processed directory exists
    if (!fs.existsSync(this.processedDir)) {
      fs.mkdirSync(this.processedDir, { recursive: true });
    }
  }

  async getAvailableAIProviders(): Promise<{ providers: AIProviderType[]; available: { [key: string]: boolean } }> {
    const providers = this.aiProviderFactory.getAvailableProviders();
    const available: { [key: string]: boolean } = {};
    
    for (const provider of providers) {
      available[provider] = this.aiProviderFactory.isProviderAvailable(provider);
    }
    
    return { providers, available };
  }

  async listPDFs(): Promise<Array<{ fileName: string; filePath: string; fileSize: number; status: string; importedAt?: Date }>> {
    try {
      const pdfFiles: Array<{ fileName: string; filePath: string; fileSize: number; status: string; importedAt?: Date }> = [];
      
      const scanDirectory = (dir: string, relativePath: string = '') => {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.join(dir, item);
          const itemRelativePath = path.join(relativePath, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDirectory(fullPath, itemRelativePath);
          } else if (item.toLowerCase().endsWith('.pdf')) {
            pdfFiles.push({
              fileName: item,
              filePath: itemRelativePath,
              fileSize: stat.size,
              status: 'PENDING'
            });
          }
        }
      };

      scanDirectory(this.contentDir);

      // Check processing status for each file
      for (const file of pdfFiles) {
        const cache = await this.prisma.pDFProcessorCache.findUnique({
          where: { fileName: file.fileName }
        });
        
        if (cache) {
          file.status = cache.processingStatus;
          file.importedAt = cache.importedAt || undefined;
        }
      }

      return pdfFiles;
    } catch (error) {
      this.logger.error('Error listing PDFs:', error);
      throw new BadRequestException('Failed to list PDF files');
    }
  }

  async processPDF(request: PDFProcessingRequest): Promise<PDFProcessingResponse> {
    const startTime = Date.now();
    let cache = await this.prisma.pDFProcessorCache.findUnique({
      where: { fileName: request.fileName }
    });

    try {
      // Create or update cache entry
      if (!cache) {
        const fullPath = request.filePath ? 
          path.join(this.contentDir, request.filePath) : 
          path.join(this.contentDir, request.fileName);
        if (!fs.existsSync(fullPath)) {
          throw new BadRequestException(`PDF file not found: ${request.fileName}`);
        }

        const stats = fs.statSync(fullPath);
        cache = await this.prisma.pDFProcessorCache.create({
          data: {
            fileName: request.fileName,
            filePath: fullPath,
            fileSize: stats.size,
            systemPrompt: request.systemPrompt || this.defaultSystemPrompt,
            userPrompt: request.userPrompt,
            processingStatus: 'PENDING'
          }
        });
      } else {
        // Update existing cache
        cache = await this.prisma.pDFProcessorCache.update({
          where: { id: cache.id },
          data: {
            systemPrompt: request.systemPrompt || this.defaultSystemPrompt,
            userPrompt: request.userPrompt,
            processingStatus: 'PENDING',
            retryCount: cache.retryCount + 1
          }
        });
      }

      await this.logEvent(cache.id, 'INFO', 'Starting PDF processing', { fileName: request.fileName });

      // Determine AI provider - use environment variable as default
      const defaultAIProvider = process.env.AI_SERVICE || 'openai';
      const aiProvider = (request.aiProvider || defaultAIProvider) as AIProviderType;
      const provider = this.aiProviderFactory.getProvider(aiProvider);
      
      await this.logEvent(cache.id, 'INFO', `Using AI provider: ${provider.name}`);

      // Step 1: Upload file to AI provider
      await this.logEvent(cache.id, 'FILE_UPLOAD', `Uploading file to ${provider.name}`);
      const fileUpload = await provider.uploadFile(cache.filePath);
      
      await this.prisma.pDFProcessorCache.update({
        where: { id: cache.id },
        data: {
          chatGptFileId: fileUpload.id,
          processingStatus: 'UPLOADING'
        }
      });

      await this.logEvent(cache.id, 'SUCCESS', 'File uploaded successfully', { fileId: fileUpload.id });

      // Step 2: Process with AI provider
      await this.logEvent(cache.id, 'FILE_PROCESSING', `Processing with ${provider.name}`);
      await this.prisma.pDFProcessorCache.update({
        where: { id: cache.id },
        data: { processingStatus: 'PROCESSING' }
      });

      let response;
      if (aiProvider === 'deepseek' && provider.processWithChunkedApproach) {
        // Use chunked approach for DeepSeek
        response = await provider.processWithChunkedApproach(cache.filePath, cache.systemPrompt!, cache.userPrompt || undefined);
      } else {
        // Use standard approach for OpenAI
        response = await provider.processPDF(cache.filePath, cache.systemPrompt!, cache.userPrompt || undefined);
      }
      
      await this.logEvent(cache.id, 'SUCCESS', `${provider.name} processing completed`, { 
        questionsCount: response.questions?.length || 0 
      });

      // Step 3: Validate and save response
      await this.logEvent(cache.id, 'VALIDATION', 'Validating response data');
      const validatedData = this.validateResponse(response);
      
      const outputFileName = `${path.parse(request.fileName).name}.json`;
      const outputFilePath = path.join(this.processedDir, outputFileName);
      
      fs.writeFileSync(outputFilePath, JSON.stringify(validatedData, null, 2));
      
      await this.logEvent(cache.id, 'SUCCESS', 'Response saved to file', { outputFilePath });

      // Step 4: Update cache with results
      const processingTime = Date.now() - startTime;
      await this.prisma.pDFProcessorCache.update({
        where: { id: cache.id },
        data: {
          processingStatus: 'COMPLETED',
          responseData: response,
          processedData: validatedData as any,
          outputFilePath: outputFilePath,
          processingTimeMs: processingTime,
          lastProcessedAt: new Date()
        }
      });

      return {
        id: cache.id,
        fileName: request.fileName,
        status: 'COMPLETED',
        message: 'PDF processed successfully',
        outputFilePath: outputFilePath,
        processedData: validatedData
      };

    } catch (error) {
      this.logger.error(`Error processing PDF ${request.fileName}:`, error);
      
      const processingTime = Date.now() - startTime;
      if (cache) {
        await this.prisma.pDFProcessorCache.update({
          where: { id: cache.id },
          data: {
            processingStatus: 'FAILED',
            errorMessage: error.message,
            processingTimeMs: processingTime,
            lastProcessedAt: new Date()
          }
        });

        await this.logEvent(cache.id, 'ERROR', 'Processing failed', { 
          error: error.message,
          processingTime 
        });
      }

      throw new BadRequestException(`Failed to process PDF: ${error.message}`);
    }
  }



  private validateResponse(data: any): ChatGPTResponse {
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format: not an object');
    }

    if (!Array.isArray(data.questions)) {
      throw new Error('Invalid response format: questions must be an array');
    }

    // Validate question count matches metadata
    const actualQuestionCount = data.questions.length;
    const metadataCount = data.metadata?.totalQuestions;
    
    if (metadataCount && actualQuestionCount !== metadataCount) {
      console.warn(`Question count mismatch: metadata says ${metadataCount} but actual count is ${actualQuestionCount}`);
      // Update metadata to match actual count
      data.metadata.totalQuestions = actualQuestionCount;
    }

    // Warn if too few questions found
    if (actualQuestionCount < 20) {
      console.warn(`WARNING: Only ${actualQuestionCount} questions found. JEE papers typically have 25-30 questions. GPT may not have read the entire PDF.`);
    }

    // Validate each question
    for (const question of data.questions) {
      if (!question.id || !question.stem || !Array.isArray(question.options)) {
        throw new Error('Invalid question format: missing required fields');
      }

      if (question.options.length !== 4) {
        throw new Error('Each question must have exactly 4 options');
      }

      const correctOptions = question.options.filter((opt: any) => opt.isCorrect);
      if (correctOptions.length !== 1) {
        throw new Error('Each question must have exactly one correct option');
      }

      if (!['EASY', 'MEDIUM', 'HARD'].includes(question.difficulty)) {
        throw new Error('Invalid difficulty level');
      }

      if (!question.subject || !['Physics', 'Chemistry', 'Mathematics'].includes(question.subject)) {
        throw new Error('Invalid subject');
      }

      // Validate lesson field is present (mandatory)
      if (!question.lesson) {
        console.warn(`Question ${question.id} is missing lesson field - this is mandatory`);
      }

      // Validate tip_formula is present (optional but recommended)
      if (!question.tip_formula) {
        console.warn(`Question ${question.id} is missing tip_formula`);
      }

      // Validate isPreviousYear is set to true
      if (question.isPreviousYear !== true) {
        console.warn(`Question ${question.id} should have isPreviousYear set to true`);
      }
    }

    return data as ChatGPTResponse;
  }

  private async logEvent(cacheId: string, logType: string, message: string, data?: any) {
    try {
      await this.prisma.pDFProcessorLog.create({
        data: {
          cacheId,
          logType: logType as any,
          message,
          data: data ? JSON.stringify(data) : undefined
        }
      });
    } catch (error) {
      this.logger.error('Error logging event:', error);
    }
  }

  async getProcessingStatus(fileName: string) {
    const cache = await this.prisma.pDFProcessorCache.findUnique({
      where: { fileName },
      include: {
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    return cache;
  }

  async getProcessedFiles() {
    return this.prisma.pDFProcessorCache.findMany({
      where: { processingStatus: 'COMPLETED' },
      orderBy: { lastProcessedAt: 'desc' }
    });
  }

  async retryProcessing(fileName: string) {
    try {
      console.log(`Retrying processing for file: ${fileName}`);
      
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { fileName }
      });

      if (!cache) {
        console.log(`File not found in cache: ${fileName}`);
        throw new BadRequestException('File not found in cache');
      }

      if (cache.retryCount >= 10) {
        console.log(`Maximum retry attempts reached for file: ${fileName}`);
        throw new BadRequestException('Maximum retry attempts reached (10)');
      }

      console.log(`Cache found - retry count: ${cache.retryCount}, file path: ${cache.filePath}`);

      // Extract relative path from absolute path for retry
      let relativePath: string | undefined;
      if (cache.filePath) {
        // Convert absolute path back to relative path
        const contentDirPath = this.contentDir;
        if (cache.filePath.startsWith(contentDirPath)) {
          relativePath = path.relative(contentDirPath, cache.filePath);
          console.log(`Converted absolute path to relative: ${relativePath}`);
        }
      }

      console.log(`Starting retry processing with filePath: ${relativePath}`);

      return this.processPDF({
        fileName: cache.fileName,
        filePath: relativePath,
        systemPrompt: cache.systemPrompt || undefined,
        userPrompt: cache.userPrompt || undefined
      });
    } catch (error) {
      console.error(`Error in retryProcessing for ${fileName}:`, error);
      throw error;
    }
  }

  async getQuestionCount(fileName: string): Promise<number> {
    try {
      // Find the processed file
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { fileName }
      });

      if (!cache) {
        throw new BadRequestException('File not found in cache');
      }

      if (cache.processingStatus !== 'COMPLETED') {
        throw new BadRequestException('File processing not completed');
      }

      if (!cache.outputFilePath) {
        throw new BadRequestException('Output file path not found');
      }

      // Read the JSON file
      const jsonContent = fs.readFileSync(cache.outputFilePath, 'utf-8');
      const data = JSON.parse(jsonContent);

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new BadRequestException('Invalid JSON format: questions array not found');
      }

      return data.questions.length;
    } catch (error) {
      this.logger.error('Error getting question count:', error);
      throw error;
    }
  }

  async resetRetryCount(fileName: string) {
    try {
      console.log(`Resetting retry count for file: ${fileName}`);
      
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { fileName }
      });

      if (!cache) {
        throw new BadRequestException('File not found in cache');
      }

      const updatedCache = await this.prisma.pDFProcessorCache.update({
        where: { fileName },
        data: {
          retryCount: 0,
          processingStatus: 'PENDING',
          errorMessage: null,
          lastProcessedAt: null
        }
      });

      console.log(`Retry count reset for file: ${fileName}`);
      return updatedCache;
    } catch (error) {
      console.error(`Error resetting retry count for ${fileName}:`, error);
      throw error;
    }
  }

  async importProcessedJSON(fileName: string) {
    try {
      // Find the processed file
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { fileName }
      });

      if (!cache) {
        throw new BadRequestException('File not found in cache');
      }

      if (cache.processingStatus !== 'COMPLETED') {
        throw new BadRequestException('File processing not completed');
      }

      if (!cache.outputFilePath) {
        throw new BadRequestException('Output file path not found');
      }

      // Read the JSON file
      const jsonContent = fs.readFileSync(cache.outputFilePath, 'utf-8');
      const data = JSON.parse(jsonContent);

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new BadRequestException('Invalid JSON format: questions array not found');
      }

      let importedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      // Get JEE stream and subjects
      const jeeStream = await this.prisma.stream.findUnique({
        where: { code: 'JEE' }
      });

      if (!jeeStream) {
        throw new BadRequestException('JEE stream not found in database');
      }

      const subjects = await this.prisma.subject.findMany({
        where: { streamId: jeeStream.id }
      });

      const subjectMap = new Map(subjects.map(s => [s.name.toLowerCase(), s.id]));

      // Process each question
      for (const questionData of data.questions) {
        try {
          // Validate required fields
          if (!questionData.stem || !questionData.options || !Array.isArray(questionData.options)) {
            errors.push(`Question ${questionData.id}: Missing required fields`);
            skippedCount++;
            continue;
          }

          if (questionData.options.length !== 4) {
            errors.push(`Question ${questionData.id}: Must have exactly 4 options`);
            skippedCount++;
            continue;
          }

          const correctOptions = questionData.options.filter((opt: any) => opt.isCorrect);
          if (correctOptions.length !== 1) {
            errors.push(`Question ${questionData.id}: Must have exactly one correct option`);
            skippedCount++;
            continue;
          }

          // Find subject
          const subjectId = subjectMap.get(questionData.subject?.toLowerCase());
          if (!subjectId) {
            errors.push(`Question ${questionData.id}: Subject '${questionData.subject}' not found`);
            skippedCount++;
            continue;
          }

          // Find or create lesson, topic and subtopic following the hierarchy
          let lessonId: string | undefined;
          let topicId: string | undefined;
          let subtopicId: string | undefined;

          // Handle lesson (required for proper hierarchy)
          if (questionData.lesson) {
            const lesson = await this.prisma.lesson.findFirst({
              where: {
                name: { equals: questionData.lesson, mode: 'insensitive' },
                subjectId: subjectId
              }
            });

            if (lesson) {
              lessonId = lesson.id;
            } else {
              // Create new lesson
              const newLesson = await this.prisma.lesson.create({
                data: {
                  name: questionData.lesson,
                  subjectId: subjectId,
                  order: 0
                }
              });
              lessonId = newLesson.id;
            }
          } else {
            // If no lesson specified, find or create a default one
            let defaultLesson = await this.prisma.lesson.findFirst({
              where: {
                name: { equals: 'General', mode: 'insensitive' },
                subjectId: subjectId
              }
            });

            if (!defaultLesson) {
              defaultLesson = await this.prisma.lesson.create({
                data: {
                  name: 'General',
                  subjectId: subjectId,
                  order: 0
                }
              });
            }
            lessonId = defaultLesson.id;
          }

          // Handle topic (must be under a lesson)
          if (questionData.topic && lessonId) {
            const topic = await this.prisma.topic.findFirst({
              where: {
                name: { equals: questionData.topic, mode: 'insensitive' },
                lessonId: lessonId
              }
            });

            if (topic) {
              topicId = topic.id;
            } else {
              // Create new topic under the lesson
              const newTopic = await this.prisma.topic.create({
                data: {
                  name: questionData.topic,
                  subjectId: subjectId,
                  lessonId: lessonId
                }
              });
              topicId = newTopic.id;
            }

            // Handle subtopic (must be under a topic)
            if (questionData.subtopic && topicId) {
              const subtopic = await this.prisma.subtopic.findFirst({
                where: {
                  name: { equals: questionData.subtopic, mode: 'insensitive' },
                  topicId: topicId
                }
              });

              if (subtopic) {
                subtopicId = subtopic.id;
              } else {
                // Create new subtopic under the topic
                const newSubtopic = await this.prisma.subtopic.create({
                  data: {
                    name: questionData.subtopic,
                    topicId: topicId
                  }
                });
                subtopicId = newSubtopic.id;
              }
            }
          }

          // Create or find tags
          const tagIds: string[] = [];
          if (questionData.tags && Array.isArray(questionData.tags)) {
            for (const tagName of questionData.tags) {
              let tag = await this.prisma.tag.findUnique({
                where: { name: tagName }
              });

              if (!tag) {
                tag = await this.prisma.tag.create({
                  data: { name: tagName }
                });
              }
              tagIds.push(tag.id);
            }
          }

          // Create the question
          const question = await this.prisma.question.create({
            data: {
              stem: questionData.stem,
              explanation: questionData.explanation || null,
              tip_formula: questionData.tip_formula || null,
              difficulty: questionData.difficulty || 'MEDIUM',
              yearAppeared: questionData.yearAppeared || null,
              isPreviousYear: questionData.isPreviousYear || false,
              isAIGenerated: true,
              aiPrompt: 'Imported from PDF processor',
              // status: 'underreview', // Set status to underreview for review process
              // pdfProcessorCacheId: cache.id, // Link to PDF processing cache
              subjectId: subjectId,
              topicId: topicId || null,
              subtopicId: subtopicId || null,
              options: {
                create: questionData.options.map((opt: any, index: number) => ({
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                  order: index
                }))
              },
              tags: {
                create: tagIds.map(tagId => ({ tagId }))
              }
            }
          });

          importedCount++;

        } catch (error) {
          errors.push(`Question ${questionData.id}: ${error.message}`);
          skippedCount++;
        }
      }

      // Log the import
      await this.logEvent(cache.id, 'SUCCESS', `JSON import completed: ${importedCount} imported, ${skippedCount} skipped`, {
        importedCount,
        skippedCount,
        errors: errors.slice(0, 10) // Log first 10 errors
      });

      // Update the cache to mark as imported
      await this.prisma.pDFProcessorCache.update({
        where: { id: cache.id },
        data: { importedAt: new Date() }
      });

      return {
        importedCount,
        skippedCount,
        totalQuestions: data.questions.length,
        errors: errors.slice(0, 20), // Return first 20 errors
        cacheId: cache.id // Return cache ID for redirecting to review page
      };

    } catch (error) {
      this.logger.error('Error importing processed JSON:', error);
      throw error;
    }
  }
}
