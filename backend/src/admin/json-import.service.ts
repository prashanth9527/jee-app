import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  details: {
    questionsProcessed: number;
    questionsCreated: number;
    questionsSkipped: number;
    tagsCreated: number;
    subjectsCreated: number;
    topicsCreated: number;
    subtopicsCreated: number;
  };
}

export interface JSONQuestion {
  stem: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  explanation?: string;
  tip_formula?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  yearAppeared?: number;
  isPreviousYear?: boolean;
  isAIGenerated?: boolean;
  aiPrompt?: string;
  stream?: string;
  subject?: string;
  lesson?: string;
  topic?: string;
  subtopic?: string;
  tags?: string[];
}

@Injectable()
export class JsonImportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all available JSON files from the seeds directory
   */
  async getAvailableJsonFiles(): Promise<string[]> {
    const seedsPath = path.join(process.cwd(), 'prisma', 'seeds');
    const jsonFiles: string[] = [];

    const scanDirectory = (dir: string, relativePath: string = '') => {
      if (!fs.existsSync(dir)) {
        return;
      }

      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const itemRelativePath = path.join(relativePath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath, itemRelativePath);
        } else if (item.endsWith('.json')) {
          jsonFiles.push(itemRelativePath);
        }
      }
    };

    scanDirectory(seedsPath);
    return jsonFiles.sort();
  }

  /**
   * Read and parse a JSON file from the seeds directory, handling both direct question arrays and our converted format
   */
  async readJsonFile(filePath: string): Promise<JSONQuestion[]> {
    const fullPath = path.join(process.cwd(), 'prisma', 'seeds', filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new BadRequestException(`File not found: ${filePath}`);
    }

    try {
      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      const jsonData = JSON.parse(fileContent);

      // Handle our converted JSON format (with metadata and nested questions)
      if (jsonData.content && jsonData.content.questions && Array.isArray(jsonData.content.questions)) {
        return this.convertToStandardFormat(jsonData.content.questions);
      }
      
      // Handle direct question array format
      if (Array.isArray(jsonData)) {
        return this.convertToStandardFormat(jsonData);
      }

      throw new BadRequestException('JSON file must contain an array of questions');
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException(`Invalid JSON format in file: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Import questions from a JSON file
   */
  async importQuestionsFromFile(
    filePath: string,
    options: {
      skipDuplicates?: boolean;
      createMissingSubjects?: boolean;
      createMissingTopics?: boolean;
      createMissingSubtopics?: boolean;
    } = {}
  ): Promise<ImportResult> {
    const {
      skipDuplicates = true,
      createMissingSubjects = true,
      createMissingTopics = true,
      createMissingSubtopics = true,
    } = options;

    const result: ImportResult = {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [],
      details: {
        questionsProcessed: 0,
        questionsCreated: 0,
        questionsSkipped: 0,
        tagsCreated: 0,
        subjectsCreated: 0,
        topicsCreated: 0,
        subtopicsCreated: 0,
      },
    };

    try {
      const questions = await this.readJsonFile(filePath);
      result.details.questionsProcessed = questions.length;

      // Get or create default stream (will be determined per question)
      const getOrCreateStream = async (streamName: string) => {
        let stream = await this.prisma.stream.findFirst({
          where: { 
            OR: [
              { name: { equals: streamName, mode: 'insensitive' } },
              { code: { equals: streamName.toUpperCase(), mode: 'insensitive' } }
            ]
          },
        });

        if (!stream) {
          // Check if a stream with the same code already exists
          const existingStreamWithCode = await this.prisma.stream.findFirst({
            where: { code: { equals: streamName.toUpperCase(), mode: 'insensitive' } },
          });

          if (existingStreamWithCode) {
            // Use the existing stream if it has the same code
            stream = existingStreamWithCode;
          } else {
            // Create new stream only if no stream with same code exists
            stream = await this.prisma.stream.create({
              data: {
                name: streamName,
                code: streamName.toUpperCase(),
                description: `Auto-created stream: ${streamName}`,
              },
            });
          }
        }

        return stream;
      };

      for (const questionData of questions) {
        try {
          // Validate question data
          if (!questionData.stem || !questionData.options || !Array.isArray(questionData.options)) {
            result.errors.push(`Invalid question format: missing stem or options`);
            result.details.questionsSkipped++;
            continue;
          }

          // Check for duplicates if skipDuplicates is enabled
          if (skipDuplicates) {
            const existingQuestion = await this.prisma.question.findFirst({
              where: {
                stem: questionData.stem,
              },
            });

            if (existingQuestion) {
              result.details.questionsSkipped++;
              continue;
            }
          }

          // Handle subject
          let subjectId: string | null = null;
          if (questionData.subject) {
            // Determine stream for this question
            const streamName = questionData.stream || 'JEE'; // Default to JEE if no stream specified
            const stream = await getOrCreateStream(streamName);

            let subject = await this.prisma.subject.findFirst({
              where: {
                name: { equals: questionData.subject, mode: 'insensitive' },
                streamId: stream.id,
              },
            });

            if (!subject && createMissingSubjects) {
              subject = await this.prisma.subject.create({
                data: {
                  name: questionData.subject,
                  streamId: stream.id,
                  description: `Auto-created from JSON import`,
                },
              });
              result.details.subjectsCreated++;
            }

            subjectId = subject?.id || null;
          }

          // Handle topic
          let topicId: string | null = null;
          if (questionData.topic && subjectId) {
            // First, get or create a default lesson for the subject
            let defaultLesson = await this.prisma.lesson.findFirst({
              where: {
                name: { equals: 'General', mode: 'insensitive' },
                subjectId: subjectId,
              },
            });

            if (!defaultLesson && createMissingTopics) {
              defaultLesson = await this.prisma.lesson.create({
                data: {
                  name: 'General',
                  subjectId: subjectId,
                  description: `Auto-created default lesson from JSON import`,
                  order: 0,
                },
              });
            }

            if (defaultLesson) {
              let topic = await this.prisma.topic.findFirst({
                where: {
                  name: { equals: questionData.topic, mode: 'insensitive' },
                  subjectId: subjectId,
                  lessonId: defaultLesson.id,
                },
              });

              if (!topic && createMissingTopics) {
                topic = await this.prisma.topic.create({
                  data: {
                    name: questionData.topic,
                    subjectId: subjectId,
                    lessonId: defaultLesson.id,
                    description: `Auto-created from JSON import`,
                    order: 0,
                  },
                });
                result.details.topicsCreated++;
              }

              topicId = topic?.id || null;
            }
          }

          // Handle subtopic
          let subtopicId: string | null = null;
          if (questionData.subtopic && topicId) {
            let subtopic = await this.prisma.subtopic.findFirst({
              where: {
                name: { equals: questionData.subtopic, mode: 'insensitive' },
                topicId: topicId,
              },
            });

            if (!subtopic && createMissingSubtopics) {
              subtopic = await this.prisma.subtopic.create({
                data: {
                  name: questionData.subtopic,
                  topicId: topicId,
                  description: `Auto-created from JSON import`,
                },
              });
              result.details.subtopicsCreated++;
            }

            subtopicId = subtopic?.id || null;
          }

          // Create the question
          const question = await this.prisma.question.create({
            data: {
              stem: questionData.stem,
              explanation: questionData.explanation || null,
              tip_formula: questionData.tip_formula || null,
              difficulty: this.mapDifficulty(questionData.difficulty),
              yearAppeared: questionData.yearAppeared || null,
              isPreviousYear: questionData.isPreviousYear || false,
              isAIGenerated: questionData.isAIGenerated || false,
              aiPrompt: questionData.aiPrompt || null,
              subjectId: subjectId,
              topicId: topicId,
              subtopicId: subtopicId,
              options: {
                create: questionData.options.map((option, index) => ({
                  text: option.text,
                  isCorrect: option.isCorrect,
                  order: index,
                })),
              },
            },
          });

          // Handle tags
          if (questionData.tags && Array.isArray(questionData.tags)) {
            for (const tagName of questionData.tags) {
              if (tagName && typeof tagName === 'string') {
                let tag = await this.prisma.tag.findFirst({
                  where: { name: { equals: tagName, mode: 'insensitive' } },
                });

                if (!tag) {
                  tag = await this.prisma.tag.create({
                    data: { name: tagName },
                  });
                  result.details.tagsCreated++;
                }

                // Create question-tag relationship
                await this.prisma.questionTag.upsert({
                  where: {
                    questionId_tagId: {
                      questionId: question.id,
                      tagId: tag.id,
                    },
                  },
                  create: {
                    questionId: question.id,
                    tagId: tag.id,
                  },
                  update: {},
                });
              }
            }
          }

          result.details.questionsCreated++;
        } catch (error) {
          result.errors.push(`Error processing question: ${error.message}`);
          result.details.questionsSkipped++;
        }
      }

      result.imported = result.details.questionsCreated;
      result.skipped = result.details.questionsSkipped;
      result.success = result.errors.length === 0 || result.details.questionsCreated > 0;

    } catch (error) {
      result.errors.push(`Import failed: ${error.message}`);
    }

    return result;
  }

  /**
   * Map difficulty string to enum
   */
  private mapDifficulty(difficulty?: string): 'EASY' | 'MEDIUM' | 'HARD' {
    if (!difficulty) return 'MEDIUM';
    
    const upperDifficulty = difficulty.toUpperCase();
    if (upperDifficulty === 'EASY') return 'EASY';
    if (upperDifficulty === 'HARD') return 'HARD';
    return 'MEDIUM';
  }


  /**
   * Convert our question format to the standard JSONQuestion format
   */
  private convertToStandardFormat(questions: any[]): JSONQuestion[] {
    return questions.map((q, index) => {
      // Handle our converted format
      if (q.text) {
        // Extract options from the question text if options array is empty or invalid
        let options = [];
        if (q.options && Array.isArray(q.options) && q.options.length > 0) {
          options = q.options.map((opt: any) => ({
            text: opt.formattedText || opt.text || '',
            isCorrect: opt.isCorrect || false
          }));
        } else {
          // Try to extract options from the question text
          options = this.extractOptionsFromText(q.text);
        }

        return {
          stem: q.formattedText || q.text,
          options: options,
          explanation: q.explanation || '',
          tip_formula: q.tip_formula || '',
          difficulty: q.difficulty || 'Medium',
          yearAppeared: q.yearAppeared || new Date().getFullYear(),
          isPreviousYear: q.isPreviousYear || true,
          isAIGenerated: q.isAIGenerated || false,
          aiPrompt: q.aiPrompt || '',
          stream: 'JEE',
          subject: q.subject || 'Mathematics',
          lesson: q.lesson || 'General',
          topic: q.topic || 'General',
          subtopic: q.subtopic || '',
          tags: q.tags || []
        };
      }
      
      // Handle standard format
      return q;
    });
  }

  /**
   * Extract options from question text when options array is empty
   */
  private extractOptionsFromText(text: string): Array<{text: string, isCorrect: boolean}> {
    const options: Array<{text: string, isCorrect: boolean}> = [];
    
    // Look for patterns like (1) option1 (2) option2 (3) option3 (4) option4
    const optionPattern = /\((\d+)\)\s*([^(]+?)(?=\s*\(\d+\)|$)/g;
    let match;
    
    while ((match = optionPattern.exec(text)) !== null) {
      const optionNumber = match[1];
      const optionText = match[2].trim();
      
      if (optionText && optionText.length > 0) {
        options.push({
          text: `(${optionNumber}) ${optionText}`,
          isCorrect: false // We can't determine correctness from text alone
        });
      }
    }
    
    // If no options found with the pattern, create a single option with the full text
    if (options.length === 0) {
      options.push({
        text: text,
        isCorrect: false
      });
    }
    
    return options;
  }

  /**
   * Get preview of questions from a JSON file (first 5 questions)
   */
  async previewQuestions(filePath: string): Promise<{
    filePath: string;
    totalQuestions: number;
    sampleQuestions: JSONQuestion[];
    errors: string[];
  }> {
    try {
      const questions = await this.readJsonFile(filePath);
      const sampleQuestions = questions.slice(0, 5);
      
      return {
        filePath,
        totalQuestions: questions.length,
        sampleQuestions,
        errors: [],
      };
    } catch (error) {
      return {
        filePath,
        totalQuestions: 0,
        sampleQuestions: [],
        errors: [error.message],
      };
    }
  }
}
