import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AwsService } from '../aws/aws.service';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
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
    private readonly aiProviderFactory: AIProviderFactory,
    private readonly awsService: AwsService
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

  async listPDFs(): Promise<Array<{ fileName: string; filePath: string; fileSize: number; status: string; importedAt?: Date; importedQuestionCount?: number; cacheId?: string; latexFilePath?: string; hasLatexContent?: boolean }>> {
    try {
      const pdfFiles: Array<{ fileName: string; filePath: string; fileSize: number; status: string; importedAt?: Date; importedQuestionCount?: number; cacheId?: string; latexFilePath?: string; hasLatexContent?: boolean }> = [];
      
      const scanDirectory = (dir: string, relativePath: string = '') => {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
          const fullPath = path.resolve(dir, item); // Use path.resolve for absolute path
          const itemRelativePath = path.join(relativePath, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            scanDirectory(fullPath, itemRelativePath);
          } else if (item.toLowerCase().endsWith('.pdf')) {
            pdfFiles.push({
              fileName: item,
              filePath: fullPath, // Store full absolute path
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
          file.cacheId = cache.id;
          file.latexFilePath = cache.latexFilePath || undefined;
          file.hasLatexContent = !!cache.latexContent;
          
          // Get count of imported questions if importedAt is set
          if (file.importedAt) {
            const importedCount = await this.prisma.question.count({
              where: { pdfProcessorCacheId: cache.id }
            });
            file.importedQuestionCount = importedCount;
          }
          
          console.log(`PDF ${file.fileName}: importedAt=${file.importedAt}, status=${file.status}, importedCount=${file.importedQuestionCount || 0}, latexFilePath=${file.latexFilePath}`);
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

  /**
   * Save JSON content to local file
   */
  private async saveJsonToFile(fileName: string, jsonContent: string): Promise<string> {
    try {
      // Create processed directory if it doesn't exist
      const processedDir = path.join(process.cwd(), 'content', 'Processed');
      if (!fs.existsSync(processedDir)) {
        fs.mkdirSync(processedDir, { recursive: true });
      }

      // Generate JSON file name (replace .pdf with .json)
      const jsonFileName = fileName.replace(/\.pdf$/i, '.json');
      const jsonFilePath = path.join(processedDir, jsonFileName);

      // Write JSON content to file with proper formatting
      const formattedJson = JSON.stringify(JSON.parse(jsonContent), null, 2);
      fs.writeFileSync(jsonFilePath, formattedJson, 'utf8');

      this.logger.log(`📋 JSON content saved locally to: ${jsonFilePath}`);

      // Upload to AWS and return AWS URL
      try {
        const fileBuffer = Buffer.from(formattedJson, 'utf8');
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: jsonFileName,
          encoding: '7bit',
          mimetype: 'application/json',
          buffer: fileBuffer,
          size: fileBuffer.length,
          stream: Readable.from(fileBuffer),
          destination: '',
          filename: jsonFileName,
          path: jsonFilePath,
        };

        const awsUrl = await this.awsService.uploadFileWithCustomName(mockFile, 'content/processed', jsonFileName);
        this.logger.log(`☁️ JSON file uploaded to AWS: ${awsUrl}`);
        
        // Return AWS URL for serving
        return awsUrl;
      } catch (awsError) {
        this.logger.error(`❌ Failed to upload JSON file to AWS: ${awsError.message}`);
        // Return local path as fallback
        return jsonFilePath;
      }

    } catch (error) {
      this.logger.error(`Failed to save JSON file:`, error);
      throw new Error(`Failed to save JSON file: ${error.message}`);
    }
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

  async importProcessedJSON(cacheId: string) {
    try {
      // Find the database record with JSON content using cache ID
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { id: cacheId }
      });

      if (!cache) {
        throw new BadRequestException('Database record not found for this cache ID');
      }

      if (!cache.jsonContent) {
        throw new BadRequestException('JSON content not found in database record');
      }

      // Parse the JSON content from database
      const data = JSON.parse(cache.jsonContent);

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
          let lessonName = questionData.lesson;
          if (!lessonName || lessonName.trim() === '') {
            lessonName = 'General';
          }
          
          const lesson = await this.prisma.lesson.findFirst({
            where: {
              name: { equals: lessonName.trim(), mode: 'insensitive' },
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
                name: lessonName.trim(),
                subjectId: subjectId,
                order: nextOrder
              }
            });
            lessonId = newLesson.id;
          }

          // Handle topic (must be under a lesson)
          if (questionData.topic && lessonId) {
            let topicName = questionData.topic;
            if (!topicName || topicName.trim() === '') {
              topicName = 'General';
            }
            
            const topic = await this.prisma.topic.findFirst({
              where: {
                name: { equals: topicName.trim(), mode: 'insensitive' },
                lessonId: lessonId
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
              
              // Create new topic under the lesson
              const newTopic = await this.prisma.topic.create({
                data: {
                  name: topicName.trim(),
                  subjectId: subjectId,
                  lessonId: lessonId,
                  order: nextOrder
                }
              });
              topicId = newTopic.id;
            }

            // Handle subtopic (must be under a topic)
            if (questionData.subtopic && topicId) {
              let subtopicName = questionData.subtopic;
              if (!subtopicName || subtopicName.trim() === '') {
                subtopicName = 'General';
              }
              
              const subtopic = await this.prisma.subtopic.findFirst({
                where: {
                  name: { equals: subtopicName.trim(), mode: 'insensitive' },
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
                
                // Create new subtopic under the topic
                const newSubtopic = await this.prisma.subtopic.create({
                  data: {
                    name: subtopicName.trim(),
                    topicId: topicId,
                    order: nextOrder
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

          // Check for duplicate question based on stem, subject, topic, and subtopic
          const existingQuestion = await this.prisma.question.findFirst({
            where: {
              stem: questionData.stem,
              subjectId: subjectId,
              topicId: topicId || null,
              subtopicId: subtopicId || null
            }
          });

          if (existingQuestion) {
            // Question already exists with same stem, subject, topic, subtopic - skip it
            skippedCount++;
            continue;
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
              status: 'underreview', // Set status to underreview for review process
              pdfProcessorCacheId: cache.id, // Link to PDF processing cache
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

  async updateQuestionsFromJson(cacheId: string, jsonContent: string) {
    try {
      // Find the database record using cache ID
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { id: cacheId }
      });

      if (!cache) {
        throw new BadRequestException('Database record not found for this cache ID');
      }

      // Parse the JSON content
      const data = JSON.parse(jsonContent);

      if (!data.questions || !Array.isArray(data.questions)) {
        throw new BadRequestException('Invalid JSON format: questions array not found');
      }

      let importedCount = 0;
      let updatedCount = 0;
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
          let lessonName = questionData.lesson;
          if (!lessonName || lessonName.trim() === '') {
            lessonName = 'General';
          }
          
          const lesson = await this.prisma.lesson.findFirst({
            where: {
              name: { equals: lessonName.trim(), mode: 'insensitive' },
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
                name: lessonName.trim(),
                subjectId: subjectId,
                order: nextOrder
              }
            });
            lessonId = newLesson.id;
          }

          // Handle topic (must be under a lesson)
          if (questionData.topic && lessonId) {
            let topicName = questionData.topic;
            if (!topicName || topicName.trim() === '') {
              topicName = 'General';
            }
            
            const topic = await this.prisma.topic.findFirst({
              where: {
                name: { equals: topicName.trim(), mode: 'insensitive' },
                lessonId: lessonId
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
              
              // Create new topic under the lesson
              const newTopic = await this.prisma.topic.create({
                data: {
                  name: topicName.trim(),
                  subjectId: subjectId,
                  lessonId: lessonId,
                  order: nextOrder
                }
              });
              topicId = newTopic.id;
            }

            // Handle subtopic (must be under a topic)
            if (questionData.subtopic && topicId) {
              let subtopicName = questionData.subtopic;
              if (!subtopicName || subtopicName.trim() === '') {
                subtopicName = 'General';
              }
              
              const subtopic = await this.prisma.subtopic.findFirst({
                where: {
                  name: { equals: subtopicName.trim(), mode: 'insensitive' },
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
                
                // Create new subtopic under the topic
                const newSubtopic = await this.prisma.subtopic.create({
                  data: {
                    name: subtopicName.trim(),
                    topicId: topicId,
                    order: nextOrder
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

          // Check for existing question based on stem, subject, topic, and subtopic
          const existingQuestion = await this.prisma.question.findFirst({
            where: {
              stem: questionData.stem,
              subjectId: subjectId,
              topicId: topicId || null,
              subtopicId: subtopicId || null
            },
            include: {
              options: true,
              tags: true
            }
          });

          if (existingQuestion) {
            // Update existing question
            await this.prisma.question.update({
              where: { id: existingQuestion.id },
              data: {
                explanation: questionData.explanation || null,
                tip_formula: questionData.tip_formula || null,
                difficulty: questionData.difficulty || 'MEDIUM',
                yearAppeared: questionData.yearAppeared || null,
                isPreviousYear: questionData.isPreviousYear || false,
                status: 'underreview', // Reset to underreview for re-review
                pdfProcessorCacheId: cache.id, // Link to PDF processing cache
                subjectId: subjectId,
                topicId: topicId || null,
                subtopicId: subtopicId || null,
                options: {
                  deleteMany: {}, // Delete existing options
                  create: questionData.options.map((opt: any, index: number) => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    order: index
                  }))
                },
                tags: {
                  deleteMany: {}, // Delete existing tags
                  create: tagIds.map(tagId => ({ tagId }))
                }
              }
            });

            updatedCount++;
          } else {
            // Create new question
            await this.prisma.question.create({
              data: {
                stem: questionData.stem,
                explanation: questionData.explanation || null,
                tip_formula: questionData.tip_formula || null,
                difficulty: questionData.difficulty || 'MEDIUM',
                yearAppeared: questionData.yearAppeared || null,
                isPreviousYear: questionData.isPreviousYear || false,
                isAIGenerated: true,
                aiPrompt: 'Updated from PDF processor',
                status: 'underreview', // Set status to underreview for review process
                pdfProcessorCacheId: cache.id, // Link to PDF processing cache
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
          }

        } catch (error) {
          errors.push(`Question ${questionData.id}: ${error.message}`);
          skippedCount++;
        }
      }

      // Log the update
      await this.logEvent(cache.id, 'SUCCESS', `JSON update completed: ${importedCount} imported, ${updatedCount} updated, ${skippedCount} skipped`, {
        importedCount,
        updatedCount,
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
        updatedCount,
        skippedCount,
        totalQuestions: data.questions.length,
        errors: errors.slice(0, 20), // Return first 20 errors
        cacheId: cache.id // Return cache ID for redirecting to review page
      };

    } catch (error) {
      this.logger.error('Error updating questions from JSON:', error);
      throw error;
    }
  }

  async markAsCompleted(cacheId: string) {
    try {
      // Find the database record using cache ID
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { id: cacheId }
      });

      if (!cache) {
        throw new BadRequestException('Database record not found for this cache ID');
      }

      // Check if already completed
      if (cache.processingStatus === 'COMPLETED') {
        this.logger.log(`File ${cache.fileName} is already marked as completed`);
        return {
          cacheId: cache.id,
          fileName: cache.fileName,
          previousStatus: cache.processingStatus,
          newStatus: 'COMPLETED',
          message: 'File was already marked as completed',
          updatedAt: cache.lastProcessedAt
        };
      }

      // Update the processing status to COMPLETED
      const updatedCache = await this.prisma.pDFProcessorCache.update({
        where: { id: cacheId },
        data: { 
          processingStatus: 'COMPLETED',
          lastProcessedAt: new Date()
        }
      });

      // Log the status change
      await this.logEvent(cacheId, 'SUCCESS', `File marked as completed: ${cache.fileName}`, {
        previousStatus: cache.processingStatus,
        newStatus: 'COMPLETED'
      });

      return {
        cacheId: updatedCache.id,
        fileName: updatedCache.fileName,
        previousStatus: cache.processingStatus,
        newStatus: 'COMPLETED',
        updatedAt: updatedCache.lastProcessedAt
      };

    } catch (error) {
      this.logger.error('Error marking file as completed:', error);
      throw error;
    }
  }

  async approveAllQuestions(cacheId: string) {
    try {
      // Find the database record using cache ID
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { id: cacheId }
      });

      if (!cache) {
        throw new BadRequestException('Database record not found for this cache ID');
      }

      // Update all questions with the given cacheId from 'underreview' to 'approved'
      const result = await this.prisma.question.updateMany({
        where: {
          pdfProcessorCacheId: cacheId,
          status: 'underreview'
        },
        data: {
          status: 'approved'
        }
      });

      // Log the approval action
      await this.logEvent(cacheId, 'SUCCESS', `Approved ${result.count} questions for file: ${cache.fileName}`, {
        approvedCount: result.count,
        cacheId: cacheId
      });

      this.logger.log(`Approved ${result.count} questions for PDFProcessorCache ${cacheId}`);

      return {
        cacheId: cacheId,
        fileName: cache.fileName,
        approvedCount: result.count,
        message: `Successfully approved ${result.count} questions`
      };

    } catch (error) {
      this.logger.error('Error approving questions:', error);
      throw error;
    }
  }

  async getJsonStatus(fileName: string) {
    try {
      // Check if JSON file exists in the same directory as PDF
      const pdfPath = this.findPDFPath(fileName);
      if (!pdfPath) {
        return {
          hasJsonFile: false,
          jsonContent: null,
          questionCount: 0
        };
      }

      const jsonFileName = fileName.replace('.pdf', '.json');
      const jsonPath = path.join(path.dirname(pdfPath), jsonFileName);
      
      let hasJsonFile = false;
      let jsonContent = null;
      let questionCount = 0;

      if (fs.existsSync(jsonPath)) {
        hasJsonFile = true;
        try {
          const jsonData = fs.readFileSync(jsonPath, 'utf8');
          const parsedData = JSON.parse(jsonData);
          jsonContent = jsonData;
          
          // Count questions
          if (parsedData.questions && Array.isArray(parsedData.questions)) {
            questionCount = parsedData.questions.length;
          }
        } catch (error) {
          this.logger.warn(`Error reading JSON file ${jsonPath}:`, error);
        }
      }

      // Also check if there's cached JSON content in the database
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { fileName }
      });

      if (cache && cache.jsonContent) {
        jsonContent = cache.jsonContent;
        if (!hasJsonFile) {
          hasJsonFile = true;
        }
        
        // Parse and count questions from cached content
        try {
          const parsedData = JSON.parse(cache.jsonContent);
          if (parsedData.questions && Array.isArray(parsedData.questions)) {
            questionCount = parsedData.questions.length;
          }
        } catch (error) {
          this.logger.warn(`Error parsing cached JSON content for ${fileName}:`, error);
        }
      }

      return {
        hasJsonFile,
        jsonContent,
        questionCount,
        databaseId: cache?.id || null
      };
    } catch (error) {
      this.logger.error('Error getting JSON status:', error);
      throw error;
    }
  }

  async saveJsonContent(fileName: string, jsonContent: string) {
    try {
      // Validate JSON content
      let parsedData;
      try {
        parsedData = JSON.parse(jsonContent);
      } catch (error) {
        throw new BadRequestException('Invalid JSON format');
      }

      // Validate that it has questions array
      if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
        throw new BadRequestException('JSON must contain a "questions" array');
      }

      // Convert local image paths to AWS URLs in JSON content
      const processedJsonContent = this.convertImagePathsToAwsUrls(jsonContent, fileName);
      const processedParsedData = JSON.parse(processedJsonContent);

      // Find or create cache entry
      let cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { fileName }
      });

      if (!cache) {
        // Create new cache entry
        const pdfPath = this.findPDFPath(fileName);
        if (!pdfPath) {
          throw new BadRequestException('PDF file not found');
        }

        const stats = fs.statSync(pdfPath);
        cache = await this.prisma.pDFProcessorCache.create({
          data: {
            fileName,
            filePath: pdfPath,
            fileSize: stats.size,
            processingStatus: 'PENDING',
            jsonContent: processedJsonContent
          }
        });
      } else {
        // Update existing cache entry
        cache = await this.prisma.pDFProcessorCache.update({
          where: { fileName },
          data: { jsonContent: processedJsonContent }
        });
      }

      // Save JSON content to local file
      const jsonFilePath = await this.saveJsonToFile(fileName, processedJsonContent);

      return {
        cacheId: cache.id,
        questionCount: processedParsedData.questions.length,
        jsonFilePath: jsonFilePath
      };
    } catch (error) {
      this.logger.error('Error saving JSON content:', error);
      throw error;
    }
  }

  async uploadJsonToProcessed(fileName: string) {
    try {
      // Get the cache entry with JSON content
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { fileName }
      });

      if (!cache || !cache.jsonContent) {
        throw new BadRequestException('No JSON content found for this file');
      }

      // Validate JSON content
      let parsedData;
      try {
        parsedData = JSON.parse(cache.jsonContent);
      } catch (error) {
        throw new BadRequestException('Invalid JSON format in cache');
      }

      // Create processed directory if it doesn't exist
      if (!fs.existsSync(this.processedDir)) {
        fs.mkdirSync(this.processedDir, { recursive: true });
      }

      // Save JSON file to processed directory
      const jsonFileName = fileName.replace('.pdf', '.json');
      const outputPath = path.join(this.processedDir, jsonFileName);
      
      fs.writeFileSync(outputPath, cache.jsonContent, 'utf8');

      // Update cache with processed data and output file path
      const updatedCache = await this.prisma.pDFProcessorCache.update({
        where: { fileName },
        data: {
          processedData: parsedData,
          outputFilePath: outputPath,
          processingStatus: 'COMPLETED',
          lastProcessedAt: new Date()
        }
      });

      // Log the upload
      await this.logEvent(cache.id, 'SUCCESS', `JSON uploaded to Processed folder: ${jsonFileName}`, {
        outputPath,
        questionCount: parsedData.questions.length
      });

      return {
        cacheId: cache.id,
        outputPath,
        questionCount: parsedData.questions.length
      };
    } catch (error) {
      this.logger.error('Error uploading JSON to Processed folder:', error);
      throw error;
    }
  }

  private findPDFPath(fileName: string): string | null {
    try {
      const findInDirectory = (dir: string): string | null => {
        if (!fs.existsSync(dir)) return null;
        
        const items = fs.readdirSync(dir);
        for (const item of items) {
          const fullPath = path.resolve(dir, item); // Use path.resolve for absolute path
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            const found = findInDirectory(fullPath);
            if (found) return found;
          } else if (item === fileName) {
            return fullPath; // Return full absolute path
          }
        }
        return null;
      };

      return findInDirectory(this.contentDir);
    } catch (error) {
      this.logger.error('Error finding PDF path:', error);
      return null;
    }
  }

  async markPDFAsCompleted(cacheId: string) {
    try {
      const updatedCache = await this.prisma.pDFProcessorCache.update({
        where: { id: cacheId },
        data: { 
          processingStatus: 'COMPLETED',
          lastProcessedAt: new Date()
        }
      });

      this.logger.log(`PDF cache ${cacheId} marked as completed`);
      return updatedCache;
    } catch (error) {
      this.logger.error('Error marking PDF as completed:', error);
      throw new BadRequestException('Failed to mark PDF as completed');
    }
  }

  /**
   * Convert local image paths to AWS URLs in JSON content
   */
  private convertImagePathsToAwsUrls(jsonContent: string, fileName: string): string {
    try {
      // Extract base filename without extension
      const baseFileName = fileName.replace(/\.pdf$/i, '');
      
      // Regular expression to match img tags with local paths
      const imgTagRegex = /<img\s+src=['"]([^'"]+)['"][^>]*\/?>/gi;
      
      // Replace local image paths with AWS URLs
      const processedContent = jsonContent.replace(imgTagRegex, (match, srcPath) => {
        // Check if it's already an AWS URL
        if (srcPath.includes('s3.') || srcPath.includes('amazonaws.com')) {
          return match; // Return as-is if already AWS URL
        }
        
        // Extract image filename from local path
        // Handle different path formats:
        // 1. "1759411848155-25-JAN-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION [1]/smile-0dd4c65377666450d1bda0fc4770226a22c2ee0b"
        // 2. "filename/image.jpg"
        let imageFileName = srcPath;
        if (srcPath.includes('/')) {
          imageFileName = srcPath.split('/').pop() || srcPath;
        }
        
        // Construct AWS URL
        const awsUrl = `https://rankora.s3.eu-north-1.amazonaws.com/content/images/${baseFileName}/${imageFileName}`;
        
        // Replace the src attribute
        return match.replace(srcPath, awsUrl);
      });
      
      this.logger.log(`✅ Converted local image paths to AWS URLs in JSON content for: ${fileName}`);
      return processedContent;
      
    } catch (error) {
      this.logger.error('Error converting image paths to AWS URLs:', error);
      // Return original content if conversion fails
      return jsonContent;
    }
  }

  async processLatexWithChatGPT(latexContent: string, fileName: string) {
    try {
      this.logger.log(`Processing LaTeX content with ChatGPT for file: ${fileName}`);
      
      // Get the system prompt (same as used in the Copy Prompt button)
      const systemPrompt = `You are an expert JEE (Joint Entrance Examination) question analyzer.  
I will provide you the full content of a \`.tex\` file containing JEE Physics, Chemistry, and Mathematics questions with solutions.  

Your task is to **extract and structure ALL questions into JSON format**.

---

### CRITICAL RULES
1. Respond with **ONLY valid JSON**. Do not include explanations or markdown. Start with \`{\` and end with \`}\`.  
2. Preserve **exactly the questions, options, and correct answers** from the \`.tex\` file.  
   - ❌ Do not fabricate or invent any question text or options.  
   - ✅ Only include content explicitly present in the provided \`.tex\` file.
3. **If the \`.tex\` file has fewer than 90 questions, output only those that appear.**
   - Do NOT generate filler or fake questions for missing ones.
4. All mathematical and chemical formulas must use LaTeX: $ ... $ (single dollar signs for inline math).
  **Preserve exactly the question text, math, and options** as they appear in the \`.tex\` file.
   - Keep all LaTeX math enclosed in single dollar signs \`$ ... $\`.
   - Preserve symbols, fractions, and expressions exactly.
5. **Do not skip ANY image references.** Every \`\\includegraphics\` in the \`.tex\` must be included in the JSON.   
   - Replace them with an HTML \`<img>\` tag.  
   - Format:  
     \`\`\`html
     <img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/FILENAME/IMAGE_FILE.EXT' />
     \`\`\`  
   - \`FILENAME\` = the \`.tex\` file's base name (without extension, and strip any trailing \`[1]\`, \`[2]\` etc).  
   - \`IMAGE_FILE\` = the original image filename from LaTeX (without extension).  
   - \`EXT\` =  
     - \`.png\` if the file name starts with \`smile-\`  
     - \`.jpg\` otherwise  
   - Example:  
     File: \`1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION.tex\`  
     \`\`\`latex
     \\includegraphics{2025_10_02_abc.png}
     \`\`\`  
     →  
     \`\`\`json
     "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION/2025_10_02_abc.jpg' />"
     \`\`\`  
   - Example:  
     File: \`smile-physics-paper.tex\`  
     \`\`\`latex
     \\includegraphics{diagram1}
     \`\`\`  
     →  
     \`\`\`json
     "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/smile-physics-paper/diagram1.png' />"
     \`\`\`  
6. Accept question numbering as \`Q1, Q2, …\` or \`1., 2., …\`.  
7. **Skip all promotional/branding content** (e.g., "Allen", "Best of Luck", headers/footers, watermarks, motivational lines). Keep only actual question data.

---

### CHUNKED PROCESSING
- Physics: **Q1–Q30**  
- Chemistry: **Q31–Q60**  
- Mathematics: **Q61–Q90**  
- Each subject must have **exactly 30 questions**.  
- If fewer appear in the \`.tex\`, do not generate realistic filler questions to complete the block.

---

### QUESTION CONTENT RULES
For each question:
- \`stem\`: must match the original question text from the \`.tex\`.  
- \`options\`: must match exactly the four options from the \`.tex\`.  
- \`isCorrect\`:  
  - If the correct answer is explicitly given in the \`.tex\`, preserve it.  
  - If missing, you may **generate the correct answer** as a subject expert.  
- \`explanation\`:  
  - If given in the file, preserve it.  
  - If missing, **generate a step-by-step reasoning** as a subject expert.  
- \`tip_formula\`:  
  - If given in the file, preserve it.  
  - If missing, **generate a key formula or shortcut**.  
- \`difficulty\`: assign as \`EASY\`, \`MEDIUM\`, or \`HARD\`.  
- Preserve all LaTeX math exactly.  

---

### CLASSIFICATION RULES
Use the official **JEE Main 2025 syllabus**:
- Physics (Units 1–20)  
- Chemistry (Units 1–20)  
- Mathematics (Units 1–14)  

Assign: **lesson → topic → subtopic**.  

---

### OUTPUT JSON FORMAT
\`\`\`json
{
  "questions": [
    {
      "id": "Q31",
      "stem": "If $\\phi(x)=\\frac{1}{\\sqrt{x}} \\int_{\\frac{\\pi}{4}}^{x}\\left(4 \\sqrt{2} \\sin t-3 \\phi^{\\prime}(t)\\right) dt, x>0$, then $\\phi^{\\prime}\\left(\\frac{\\pi}{4}\\right)$ is equal to :",
      "options": [
        {"id": "A", "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION/2025_10_02_8d455ea6d672c1411a66g-01.jpg' />", "isCorrect": false},
        {"id": "B", "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION/2025_10_02_8d455ea6d672c1411a66g-01(1).jpg' />", "isCorrect": false},
        {"id": "C", "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION/2025_10_02_8d455ea6d672c1411a66g-01(2).jpg' />", "isCorrect": true},
        {"id": "D", "text": "Defect-free lattice", "isCorrect": false}
      ],
      "explanation": "$\\phi^{\\prime}(x)=\\frac{1}{\\sqrt{x}}\\left[\\left(4 \\sqrt{2} \\sin x-3 \\phi^{\\prime}(x)\\right) .1-0\\right]-\\frac{1}{2} x^{-3 / 2}\\int_{\\frac{\\pi}{4}}^{x}\\left(4 \\sqrt{2} \\sin t-3 \\phi^{\\prime}(t)\\right) dt$, $\\phi^{\\prime}\\left(\\frac{\\pi}{4}\\right)=\\frac{2}{\\sqrt{\\pi}}\\left[4-3 \\phi^{\\prime}\\left(\\frac{\\pi}{4}\\right)\\right]+0$, $\\left(1+\\frac{6}{\\sqrt{\\pi}}\\right) \\phi^{\\prime}\\left(\\frac{\\pi}{4}\\right)=\\frac{8}{\\sqrt{\\pi}}$, $\\phi^{\\prime}\\left(\\frac{\\pi}{4}\\right)=\\frac{8}{\\sqrt{\\pi}+6}$",
      "tip_formula": "Charge neutrality: $\\\\Sigma q_{+} = \\\\Sigma q_{-}$",
      "difficulty": "MEDIUM",
      "subject": "Chemistry",
      "lesson": "Inorganic Chemistry",
      "topic": "Solid State",
      "subtopic": "Defects in Crystals",
      "yearAppeared": 2023,
      "isPreviousYear": true,
      "tags": ["solid-state", "defects", "charge-neutrality"]
    }
  ],
  "metadata": {
    "totalQuestions": 90,
    "subjects": ["Physics", "Chemistry", "Mathematics"],
    "difficultyDistribution": {"easy": 30, "medium": 45, "hard": 15}
  }
}
\`\`\`

### IMPORTANT ANTI-FABRICATION RULES
Only output questions explicitly detected in the .tex file.
If something cannot be confidently extracted, omit it.
Do NOT make up question text, options, or correct answers.
If the .tex includes fewer than 30 questions per subject, your output will have fewer entries.
Every extracted question must have originated verbatim from the .tex file content.

### CLASSIFICATION
For each extracted question, identify the appropriate:
subject (Physics, Chemistry, Mathematics)
lesson, topic, and subtopic based on JEE Main 2025 syllabus.
Do not guess if unclear — mark "lesson": "Unknown" etc. if uncertain.

### FINAL INSTRUCTION

Read the \`.tex\` file carefully and return **only the JSON output** in the schema above.  
Ensure exactly 30 questions, numbered sequentially (Q1–Q90), with lesson/topic/subtopic classification.  
Ignore and skip any **branding, coaching names, promotional headers/footers, or unrelated text**.  
Preserve **exactly the questions, options, and correct answers** from the \`.tex\` file.  
   - ❌ Do not fabricate or invent any question text or options.  
   - ✅ Use the same wording, LaTeX math, and image references as in the file.  
**Do not skip ANY image references.** Every \`\\includegraphics\` in the \`.tex\` must be included in the JSON.  
Use single dollar signs $ ... $ for all LaTeX math expressions.
Read the .tex file carefully.
Return only valid JSON, faithfully representing every question that truly exists in the source file.
Do not generate or hallucinate new data under any circumstances.`;

      // Use the existing AI provider to process the LaTeX content
      const provider = this.aiProviderFactory.getProvider('openai');
      if (!provider) {
        throw new Error('OpenAI provider not available');
      }

      // Check if the provider supports LaTeX processing
      if (!provider.processLatexContent) {
        throw new Error('LaTeX processing not supported by this AI provider');
      }

      // Process the LaTeX content with ChatGPT
      const response = await provider.processLatexContent(latexContent, systemPrompt);
      
      if (!response || !response.questions) {
        throw new Error('Invalid response from ChatGPT');
      }

      // Update the cache record with the JSON content
      const jsonContent = JSON.stringify(response, null, 2);
      
      // Find the record by fileName to get the correct ID
      const record = await this.prisma.pDFProcessorCache.findFirst({
        where: { fileName: fileName }
      });
      
      if (record) {
        await this.prisma.pDFProcessorCache.update({
          where: { id: record.id },
          data: {
            jsonContent: jsonContent,
            processingStatus: 'COMPLETED',
            lastProcessedAt: new Date()
          }
        });
      }

      this.logger.log(`Successfully processed LaTeX content with ChatGPT for file: ${fileName}`);
      
      return {
        success: true,
        jsonContent: jsonContent,
        questionsCount: response.questions?.length || 0,
        chunksProcessed: response.metadata?.processedChunks || 0,
        totalChunks: response.metadata?.totalChunks || 0,
        metadata: response.metadata
      };
      
    } catch (error) {
      this.logger.error('Error processing LaTeX with ChatGPT:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}
