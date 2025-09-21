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
   * Read and parse a JSON file from the seeds directory
   */
  async readJsonFile(filePath: string): Promise<JSONQuestion[]> {
    const fullPath = path.join(process.cwd(), 'prisma', 'seeds', filePath);
    
    if (!fs.existsSync(fullPath)) {
      throw new BadRequestException(`File not found: ${filePath}`);
    }

    try {
      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      const questions = JSON.parse(fileContent);
      
      if (!Array.isArray(questions)) {
        throw new BadRequestException('JSON file must contain an array of questions');
      }

      return questions;
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

      // Get or create default stream for JEE
      let defaultStream = await this.prisma.stream.findFirst({
        where: { name: { contains: 'JEE', mode: 'insensitive' } },
      });

      if (!defaultStream) {
        defaultStream = await this.prisma.stream.create({
          data: {
            name: 'JEE',
            code: 'JEE',
            description: 'Joint Entrance Examination',
          },
        });
      }

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
            let subject = await this.prisma.subject.findFirst({
              where: {
                name: { equals: questionData.subject, mode: 'insensitive' },
                streamId: defaultStream.id,
              },
            });

            if (!subject && createMissingSubjects) {
              subject = await this.prisma.subject.create({
                data: {
                  name: questionData.subject,
                  streamId: defaultStream.id,
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
