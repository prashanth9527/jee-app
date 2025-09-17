import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import * as fs from 'fs';
import * as path from 'path';

// PDF processing libraries (you'll need to install these)
// npm install pdf-parse pdf2pic
const pdfParse = require('pdf-parse');
const pdf2pic = require('pdf2pic');

@Injectable()
export class ContentSeedingService {
  private readonly logger = new Logger(ContentSeedingService.name);
  private processingJobs = new Map<string, any>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  async processPdfFile(file: Express.Multer.File): Promise<any> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize job status
    this.processingJobs.set(jobId, {
      status: 'processing',
      progress: 0,
      totalQuestions: 0,
      processedQuestions: 0,
      errors: [],
      results: null,
      startedAt: new Date(),
    });

    try {
      // Process PDF asynchronously
      this.processPdfAsync(file, jobId);
      
      return {
        jobId,
        message: 'PDF processing started',
        status: 'processing'
      };
    } catch (error) {
      this.logger.error('Error starting PDF processing:', error);
      this.processingJobs.set(jobId, {
        status: 'failed',
        error: error.message,
        startedAt: new Date(),
      });
      throw new BadRequestException('Failed to start PDF processing');
    }
  }

  private async processPdfAsync(file: Express.Multer.File, jobId: string) {
    try {
      const job = this.processingJobs.get(jobId);
      job.progress = 10;
      job.status = 'extracting_text';

      // Extract text from PDF
      const pdfData = await pdfParse(file.buffer);
      const extractedText = pdfData.text;
      
      job.progress = 30;
      job.status = 'parsing_questions';

      // Parse questions from text
      const questions = await this.parseQuestionsFromText(extractedText, file.originalname);
      
      job.progress = 60;
      job.totalQuestions = questions.length;
      job.status = 'processing_questions';

      // Process each question
      const processedQuestions = [];
      for (let i = 0; i < questions.length; i++) {
        try {
          const processedQuestion = await this.processQuestion(questions[i], file.originalname);
          processedQuestions.push(processedQuestion);
          job.processedQuestions = i + 1;
          job.progress = 60 + (40 * (i + 1) / questions.length);
        } catch (error) {
          job.errors.push({
            questionIndex: i,
            error: error.message,
            question: questions[i]
          });
        }
      }

      job.progress = 100;
      job.status = 'completed';
      job.results = {
        totalQuestions: questions.length,
        processedQuestions: processedQuestions.length,
        errors: job.errors.length,
        questions: processedQuestions
      };

    } catch (error) {
      this.logger.error('Error processing PDF:', error);
      const job = this.processingJobs.get(jobId);
      job.status = 'failed';
      job.error = error.message;
    }
  }

  private async parseQuestionsFromText(text: string, filename: string): Promise<any[]> {
    // Extract metadata from filename
    const metadata = this.extractMetadataFromFilename(filename);
    
    // Split text into potential questions
    const questionBlocks = this.splitIntoQuestionBlocks(text);
    
    const questions = [];
    
    for (const block of questionBlocks) {
      try {
        const question = await this.parseQuestionBlock(block, metadata);
        if (question) {
          questions.push(question);
        }
      } catch (error) {
        this.logger.warn('Failed to parse question block:', error.message);
      }
    }
    
    return questions;
  }

  private extractMetadataFromFilename(filename: string): any {
    // Parse filename like "2201-Mathematics Paper+With+Sol. Evening.pdf"
    const metadata: any = {
      year: null,
      subject: null,
      session: null,
      shift: null
    };

    // Extract year (first 4 digits)
    const yearMatch = filename.match(/(\d{4})/);
    if (yearMatch) {
      metadata.year = parseInt(yearMatch[1]);
    }

    // Extract subject
    if (filename.toLowerCase().includes('mathematics') || filename.toLowerCase().includes('maths')) {
      metadata.subject = 'Mathematics';
    } else if (filename.toLowerCase().includes('physics')) {
      metadata.subject = 'Physics';
    } else if (filename.toLowerCase().includes('chemistry')) {
      metadata.subject = 'Chemistry';
    }

    // Extract session and shift
    if (filename.toLowerCase().includes('morning')) {
      metadata.shift = 'Morning';
    } else if (filename.toLowerCase().includes('evening')) {
      metadata.shift = 'Evening';
    }

    return metadata;
  }

  private splitIntoQuestionBlocks(text: string): string[] {
    // Split text into question blocks based on common patterns
    const patterns = [
      /Q\.?\s*\d+\./gi,  // Q.1, Q1., Q 1.
      /Question\s*\d+\./gi,  // Question 1.
      /\d+\.\s*[A-Z]/g,  // 1. A particle... (JEE format)
      /\d+\.\s*Let/g,    // 1. Let... (JEE format)
    ];

    let blocks: string[] = [];
    
    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      if (matches.length > 0) {
        blocks = this.splitTextByPattern(text, pattern);
        break;
      }
    }

    // If no pattern found, try to split by double newlines
    if (blocks.length === 0) {
      blocks = text.split(/\n\s*\n/).filter(block => block.trim().length > 50);
    }

    return blocks.slice(0, 50); // Limit to first 50 potential questions
  }

  private splitTextByPattern(text: string, pattern: RegExp): string[] {
    const parts = text.split(pattern);
    const blocks: string[] = [];
    
    for (let i = 1; i < parts.length; i++) {
      let block = parts[i].trim();
      if (block.length > 100) { // Minimum question length
        
        // Look for the next question number to properly split
        const nextQuestionMatch = block.match(/(\d+\.\s+[A-Z])/);
        if (nextQuestionMatch) {
          const nextQuestionIndex = block.indexOf(nextQuestionMatch[0]);
          block = block.substring(0, nextQuestionIndex).trim();
        }
        
        // Also look for "Ans." which typically marks the end of a question
        const answerMatch = block.match(/Ans\.\s*\((\d+)\)/i);
        if (answerMatch) {
          const answerIndex = block.indexOf(answerMatch[0]);
          const solutionStart = block.indexOf('Sol.', answerIndex);
          if (solutionStart !== -1) {
            block = block.substring(0, solutionStart).trim();
          }
        }
        
        if (block.length > 50) {
          blocks.push(block);
        }
      }
    }
    
    return blocks;
  }

  private async parseQuestionBlock(block: string, metadata: any): Promise<any> {
    // Extract question stem
    const stem = this.extractQuestionStem(block);
    if (!stem) return null;

    // Extract options
    const options = this.extractOptions(block);
    if (options.length < 2) return null;

    // Extract explanation/solution
    const explanation = this.extractExplanation(block);

    // Determine difficulty (basic heuristic)
    const difficulty = this.determineDifficulty(stem, options);

    // Get subject ID
    const subjectId = await this.getSubjectId(metadata.subject);

    return {
      stem: this.cleanText(stem),
      explanation: explanation ? this.cleanText(explanation) : null,
      difficulty,
      yearAppeared: metadata.year,
      isPreviousYear: true,
      subjectId,
      options: options.map((option, index) => ({
        text: this.cleanText(option.text),
        isCorrect: option.isCorrect,
        order: index
      })),
      tagNames: this.generateTags(metadata)
    };
  }

  private extractQuestionStem(block: string): string | null {
    // Remove options and extract the main question
    const lines = block.split('\n');
    let stem = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Stop at option patterns
      if (this.isOptionLine(trimmedLine)) {
        break;
      }
      
      // Skip empty lines and question numbers
      if (trimmedLine && !trimmedLine.match(/^Q\.?\s*\d+\.?\s*$/i)) {
        stem += trimmedLine + ' ';
      }
    }
    
    return stem.trim() || null;
  }

  private extractOptions(block: string): Array<{text: string, isCorrect: boolean}> {
    const options: Array<{text: string, isCorrect: boolean}> = [];
    
    let correctAnswer = null;
    
    // Look for answer key - JEE format: "Ans. (1)" or "Ans. (2)"
    const answerMatch = block.match(/Ans\.\s*\((\d+)\)/i);
    if (answerMatch) {
      correctAnswer = answerMatch[1];
    }
    
    // Also check for old format
    if (!correctAnswer) {
      const oldAnswerMatch = block.match(/answer[:\s]*([a-d])/i);
      if (oldAnswerMatch) {
        correctAnswer = oldAnswerMatch[1].toLowerCase();
      }
    }
    
    // Try to find all options using regex pattern matching
    // Look for patterns like: (1) 5 (2) 4 (3) 3 (4) 8
    const optionPattern = /\((\d+)\)\s+([^(]+?)(?=\s*\(\d+\)|$)/g;
    let match;
    
    while ((match = optionPattern.exec(block)) !== null) {
      options.push({
        text: match[2].trim(),
        isCorrect: false
      });
    }
    
    // If we didn't find enough options with the above pattern, try line-by-line parsing
    if (options.length < 2) {
      const lines = block.split('\n');
      let inOptionsSection = false;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (this.isOptionLine(trimmedLine)) {
          inOptionsSection = true;
          
          // Handle JEE format with multiple options on same line: (1) 5 (2) 4 (3) 3 (4) 8
          const jeeOptionsMatch = trimmedLine.match(/\((\d+)\)\s+([^(]+?)(?:\s*\((\d+)\)\s+([^(]+?))?(?:\s*\((\d+)\)\s+([^(]+?))?(?:\s*\((\d+)\)\s+([^(]+?))?/g);
          if (jeeOptionsMatch) {
            // Extract all options from this line
            const allOptions = trimmedLine.match(/\((\d+)\)\s+([^(]+?)(?=\s*\(\d+\)|$)/g);
            if (allOptions) {
              for (const optionStr of allOptions) {
                const optionMatch = optionStr.match(/\((\d+)\)\s+(.+)/);
                if (optionMatch) {
                  options.push({
                    text: optionMatch[2].trim(),
                    isCorrect: false
                  });
                }
              }
            }
          } else {
            // Handle single option or traditional format
            const option = this.parseOptionLine(trimmedLine);
            if (option) {
              options.push(option);
            }
          }
        } else if (inOptionsSection && trimmedLine && !this.isOptionLine(trimmedLine)) {
          // Continue option text on next line
          if (options.length > 0) {
            options[options.length - 1].text += ' ' + trimmedLine;
          }
        }
      }
    }
    
    // Mark correct answer
    if (correctAnswer && options.length > 0) {
      // Handle JEE format (1, 2, 3, 4)
      if (/^\d+$/.test(correctAnswer)) {
        const correctIndex = parseInt(correctAnswer) - 1;
        if (correctIndex >= 0 && correctIndex < options.length) {
          options[correctIndex].isCorrect = true;
        }
      } else {
        // Handle old format (a, b, c, d)
        const correctIndex = correctAnswer.charCodeAt(0) - 'a'.charCodeAt(0);
        if (correctIndex >= 0 && correctIndex < options.length) {
          options[correctIndex].isCorrect = true;
        }
      }
    }
    
    return options;
  }

  private isOptionLine(line: string): boolean {
    // Check for JEE format: (1) 5 (2) 4 (3) 3 (4) 8
    const jeeFormat = /\(\d+\)\s+\d+/;
    // Check for traditional format: a) option or (a) option
    const traditionalFormat = /^[a-d]\)\s+/.test(line) || /^\([a-d]\)\s+/.test(line);
    
    return jeeFormat.test(line) || traditionalFormat;
  }

  private parseOptionLine(line: string): {text: string, isCorrect: boolean} | null {
    // Handle JEE format: (1) 5 (2) 4 (3) 3 (4) 8
    const jeeMatch = line.match(/\((\d+)\)\s+([^(]+?)(?:\s*\(\d+\)|$)/g);
    if (jeeMatch && jeeMatch.length >= 2) {
      // This line contains multiple options, extract them all
      const options: Array<{text: string, isCorrect: boolean}> = [];
      for (const match of jeeMatch) {
        const optionMatch = match.match(/\((\d+)\)\s+(.+)/);
        if (optionMatch) {
          options.push({
            text: optionMatch[2].trim(),
            isCorrect: false
          });
        }
      }
      // Return the first option, others will be handled by subsequent calls
      return options[0] || null;
    }
    
    // Handle single option in JEE format: (1) 5
    const singleJeeMatch = line.match(/\((\d+)\)\s+(.+)/);
    if (singleJeeMatch) {
      return {
        text: singleJeeMatch[2].trim(),
        isCorrect: false
      };
    }
    
    // Handle traditional format: a) option or (a) option
    const traditionalMatch = line.match(/^[a-d]\)\s+(.+)/i) || line.match(/^\([a-d]\)\s+(.+)/i);
    if (traditionalMatch) {
      return {
        text: traditionalMatch[1].trim(),
        isCorrect: false
      };
    }
    
    return null;
  }

  private extractExplanation(block: string): string | null {
    // Look for solution/explanation sections
    const solutionPatterns = [
      /solution[:\s]*(.+?)(?=\n\n|\n[A-Z]|$)/is,
      /explanation[:\s]*(.+?)(?=\n\n|\n[A-Z]|$)/is,
      /answer[:\s]*(.+?)(?=\n\n|\n[A-Z]|$)/is
    ];
    
    for (const pattern of solutionPatterns) {
      const match = block.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  private determineDifficulty(stem: string, options: Array<{text: string, isCorrect: boolean}>): 'EASY' | 'MEDIUM' | 'HARD' {
    // Basic heuristic based on question length and complexity
    const stemLength = stem.length;
    const hasMath = /[+\-*/=<>(){}[\]]/.test(stem);
    const hasComplexTerms = /(derivative|integral|matrix|eigenvalue|quantum|thermodynamic)/i.test(stem);
    
    if (hasComplexTerms || stemLength > 200) {
      return 'HARD';
    } else if (hasMath || stemLength > 100) {
      return 'MEDIUM';
    } else {
      return 'EASY';
    }
  }

  private async getSubjectId(subjectName: string): Promise<string | null> {
    if (!subjectName) return null;
    
    const subject = await this.prisma.subject.findFirst({
      where: {
        name: {
          contains: subjectName,
          mode: 'insensitive'
        }
      }
    });
    
    return subject?.id || null;
  }

  private generateTags(metadata: any): string[] {
    const tags = ['Previous Year', 'JEE Mains'];
    
    if (metadata.year) {
      tags.push(`JEE ${metadata.year}`);
    }
    
    if (metadata.shift) {
      tags.push(metadata.shift);
    }
    
    return tags;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
      .replace(/\n+/g, ' ')  // Replace newlines with spaces
      .trim();
  }

  private async processQuestion(questionData: any, filename: string): Promise<any> {
    // Convert LaTeX expressions in stem and explanation
    questionData.stem = this.convertToLatex(questionData.stem);
    if (questionData.explanation) {
      questionData.explanation = this.convertToLatex(questionData.explanation);
    }
    
    // Convert LaTeX in options
    questionData.options = questionData.options.map((option: any) => ({
      ...option,
      text: this.convertToLatex(option.text)
    }));
    
    return questionData;
  }

  private convertToLatex(text: string): string {
    // Convert common mathematical expressions to LaTeX
    // This is a basic implementation - you might want to use a more sophisticated library
    
    // Convert fractions
    text = text.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');
    
    // Convert superscripts
    text = text.replace(/(\w+)\^(\d+)/g, '$1^{$2}');
    
    // Convert subscripts
    text = text.replace(/(\w+)_(\d+)/g, '$1_{$2}');
    
    // Convert square roots
    text = text.replace(/√\(([^)]+)\)/g, '\\sqrt{$1}');
    
    // Convert Greek letters
    const greekLetters: {[key: string]: string} = {
      'alpha': '\\alpha',
      'beta': '\\beta',
      'gamma': '\\gamma',
      'delta': '\\delta',
      'epsilon': '\\epsilon',
      'theta': '\\theta',
      'lambda': '\\lambda',
      'mu': '\\mu',
      'pi': '\\pi',
      'sigma': '\\sigma',
      'phi': '\\phi',
      'omega': '\\omega'
    };
    
    for (const [greek, latex] of Object.entries(greekLetters)) {
      text = text.replace(new RegExp(`\\b${greek}\\b`, 'gi'), latex);
    }
    
    return text;
  }

  async bulkImportQuestions(questions: any[], batchName?: string): Promise<any> {
    const results = {
      total: questions.length,
      successful: 0,
      failed: 0,
      errors: [] as any[],
      questionIds: [] as string[]
    };

    for (let i = 0; i < questions.length; i++) {
      try {
        const question = await this.createQuestion(questions[i]);
        results.successful++;
        results.questionIds.push(question.id);
      } catch (error) {
        results.failed++;
        results.errors.push({
          index: i,
          error: error.message,
          question: questions[i]
        });
      }
    }

    this.logger.log(`Bulk import completed: ${results.successful}/${results.total} questions imported successfully`);
    
    return results;
  }

  private async createQuestion(questionData: any): Promise<any> {
    const { options, tagNames, ...questionFields } = questionData;
    
    // Create the question
    const question = await this.prisma.question.create({
      data: {
        ...questionFields,
        options: {
          create: options.map((option: any) => ({
            text: option.text,
            isCorrect: option.isCorrect,
            order: option.order
          }))
        }
      }
    });

    // Add tags
    if (tagNames && tagNames.length > 0) {
      for (const tagName of tagNames) {
        const tag = await this.prisma.tag.upsert({
          where: { name: tagName },
          update: {},
          create: { name: tagName }
        });
        
        await this.prisma.questionTag.create({
          data: {
            questionId: question.id,
            tagId: tag.id
          }
        });
      }
    }

    return question;
  }

  getProcessingStatus(jobId: string): any {
    const job = this.processingJobs.get(jobId);
    if (!job) {
      throw new BadRequestException('Job not found');
    }
    
    return job;
  }

  async processFolder(folderPath: string): Promise<any> {
    if (!fs.existsSync(folderPath)) {
      throw new BadRequestException('Folder does not exist');
    }

    const files = fs.readdirSync(folderPath).filter(file => file.toLowerCase().endsWith('.pdf'));
    const results = {
      totalFiles: files.length,
      processedFiles: 0,
      totalQuestions: 0,
      errors: [] as any[]
    };

    for (const file of files) {
      try {
        const filePath = path.join(folderPath, file);
        const fileBuffer = fs.readFileSync(filePath);
        
        const mockFile: Express.Multer.File = {
          fieldname: 'pdf',
          originalname: file,
          encoding: '7bit',
          mimetype: 'application/pdf',
          buffer: fileBuffer,
          size: fileBuffer.length,
          stream: null as any,
          destination: '',
          filename: file,
          path: filePath
        };

        const jobId = `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.processPdfFile(mockFile);
        
        results.processedFiles++;
      } catch (error) {
        results.errors.push({
          file,
          error: error.message
        });
      }
    }

    return results;
  }

  async validateQuestions(questions: any[]): Promise<any> {
    const validationResults = {
      valid: 0,
      invalid: 0,
      errors: [] as any[]
    };

    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const errors = [];

      // Validate stem
      if (!question.stem || question.stem.trim().length < 10) {
        errors.push('Question stem is too short or missing');
      }

      // Validate options
      if (!question.options || question.options.length < 2) {
        errors.push('Question must have at least 2 options');
      } else {
        const correctOptions = question.options.filter((opt: any) => opt.isCorrect);
        if (correctOptions.length !== 1) {
          errors.push('Question must have exactly one correct option');
        }
      }

      if (errors.length > 0) {
        validationResults.invalid++;
        validationResults.errors.push({
          index: i,
          errors
        });
      } else {
        validationResults.valid++;
      }
    }

    return validationResults;
  }
}
