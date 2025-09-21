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
    subjectsProcessed: number;
    subjectsCreated: number;
    subjectsSkipped: number;
    lessonsProcessed: number;
    lessonsCreated: number;
    lessonsSkipped: number;
    topicsProcessed: number;
    topicsCreated: number;
    topicsSkipped: number;
  };
}

export interface SyllabusSubject {
  subject: string;
  lessons: Array<{
    lesson: string;
    topics: string[];
  }>;
}

export interface SyllabusFile {
  path: string;
  name: string;
  directory: string;
  size: number;
  lastModified: Date;
}

@Injectable()
export class SyllabusImportService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get list of available syllabus JSON files in the seeds directory
   */
  async getAvailableSyllabusFiles(): Promise<SyllabusFile[]> {
    const seedsPath = path.join(process.cwd(), 'prisma', 'seeds');
    const files: SyllabusFile[] = [];

    try {
      const scanDirectory = (dir: string, relativePath: string = '') => {
        const items = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const item of items) {
          const fullPath = path.join(dir, item.name);
          const itemRelativePath = relativePath ? path.join(relativePath, item.name) : item.name;
          
          if (item.isDirectory()) {
            // Recursively scan subdirectories
            scanDirectory(fullPath, itemRelativePath);
          } else if (item.isFile() && item.name.toLowerCase().includes('syllabus') && item.name.endsWith('.json')) {
            const stats = fs.statSync(fullPath);
            files.push({
              path: itemRelativePath,
              name: item.name,
              directory: relativePath,
              size: stats.size,
              lastModified: stats.mtime,
            });
          }
        }
      };

      scanDirectory(seedsPath);
      return files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
    } catch (error) {
      throw new BadRequestException(`Failed to scan syllabus files: ${error.message}`);
    }
  }

  /**
   * Read and parse a syllabus JSON file
   */
  async readSyllabusFile(filePath: string): Promise<SyllabusSubject[]> {
    try {
      const fullPath = path.join(process.cwd(), 'prisma', 'seeds', filePath);
      
      if (!fs.existsSync(fullPath)) {
        throw new BadRequestException(`Syllabus file not found: ${filePath}`);
      }

      const fileContent = fs.readFileSync(fullPath, 'utf-8');
      const syllabusData = JSON.parse(fileContent);

      if (!Array.isArray(syllabusData)) {
        throw new BadRequestException('Syllabus file must contain an array of subjects');
      }

      return syllabusData;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException(`Invalid JSON format: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Validate syllabus data structure
   */
  validateSyllabusData(syllabusData: SyllabusSubject[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!Array.isArray(syllabusData)) {
      errors.push('Syllabus data must be an array');
      return { isValid: false, errors };
    }

    if (syllabusData.length === 0) {
      errors.push('Syllabus data cannot be empty');
      return { isValid: false, errors };
    }

    for (let i = 0; i < syllabusData.length; i++) {
      const subject = syllabusData[i];
      
      if (!subject.subject || typeof subject.subject !== 'string') {
        errors.push(`Subject ${i + 1}: Missing or invalid subject name`);
      }

      if (!subject.lessons || !Array.isArray(subject.lessons)) {
        errors.push(`Subject ${i + 1}: Missing or invalid lessons array`);
        continue;
      }

      for (let j = 0; j < subject.lessons.length; j++) {
        const lesson = subject.lessons[j];
        
        if (!lesson.lesson || typeof lesson.lesson !== 'string') {
          errors.push(`Subject ${i + 1}, Lesson ${j + 1}: Missing or invalid lesson name`);
        }

        if (!lesson.topics || !Array.isArray(lesson.topics)) {
          errors.push(`Subject ${i + 1}, Lesson ${j + 1}: Missing or invalid topics array`);
          continue;
        }

        for (let k = 0; k < lesson.topics.length; k++) {
          const topic = lesson.topics[k];
          if (!topic || typeof topic !== 'string') {
            errors.push(`Subject ${i + 1}, Lesson ${j + 1}, Topic ${k + 1}: Missing or invalid topic name`);
          }
        }
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Import syllabus data into the database
   */
  async importSyllabus(
    syllabusData: SyllabusSubject[],
    options: {
      createMissingSubjects?: boolean;
      createMissingLessons?: boolean;
      createMissingTopics?: boolean;
      skipDuplicates?: boolean;
    } = {}
  ): Promise<ImportResult> {
    const {
      createMissingSubjects = true,
      createMissingLessons = true,
      createMissingTopics = true,
      skipDuplicates = true,
    } = options;

    const result: ImportResult = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [],
      details: {
        subjectsProcessed: 0,
        subjectsCreated: 0,
        subjectsSkipped: 0,
        lessonsProcessed: 0,
        lessonsCreated: 0,
        lessonsSkipped: 0,
        topicsProcessed: 0,
        topicsCreated: 0,
        topicsSkipped: 0,
      },
    };

    try {
      // Get JEE stream
      const jeeStream = await this.prisma.stream.findFirst({
        where: { name: { equals: 'JEE', mode: 'insensitive' } },
      });

      if (!jeeStream) {
        throw new BadRequestException('JEE stream not found. Please create the JEE stream first.');
      }

      for (const subjectData of syllabusData) {
        result.details.subjectsProcessed++;

        try {
          // Handle subject
          let subject = await this.prisma.subject.findFirst({
            where: {
              name: { equals: subjectData.subject, mode: 'insensitive' },
              streamId: jeeStream.id,
            },
          });

          if (!subject && createMissingSubjects) {
            subject = await this.prisma.subject.create({
              data: {
                name: subjectData.subject,
                streamId: jeeStream.id,
                description: `Auto-created from syllabus import`,
              },
            });
            result.details.subjectsCreated++;
            result.imported++;
          } else if (!subject) {
            result.details.subjectsSkipped++;
            result.skipped++;
            result.errors.push(`Subject "${subjectData.subject}" not found and creation disabled`);
            continue;
          } else if (skipDuplicates) {
            result.details.subjectsSkipped++;
            result.skipped++;
            continue;
          }

          if (!subject) continue;

          // Handle lessons
          for (const lessonData of subjectData.lessons) {
            result.details.lessonsProcessed++;

            try {
              let lesson = await this.prisma.lesson.findFirst({
                where: {
                  name: { equals: lessonData.lesson, mode: 'insensitive' },
                  subjectId: subject.id,
                },
              });

              if (!lesson && createMissingLessons) {
                lesson = await this.prisma.lesson.create({
                  data: {
                    name: lessonData.lesson,
                    subjectId: subject.id,
                    description: `Auto-created from syllabus import`,
                    isActive: true,
                  },
                });
                result.details.lessonsCreated++;
                result.imported++;
              } else if (!lesson) {
                result.details.lessonsSkipped++;
                result.skipped++;
                result.errors.push(`Lesson "${lessonData.lesson}" not found and creation disabled`);
                continue;
              } else if (skipDuplicates) {
                result.details.lessonsSkipped++;
                result.skipped++;
                continue;
              }

              if (!lesson) continue;

              // Handle topics
              for (const topicName of lessonData.topics) {
                result.details.topicsProcessed++;

                try {
                  let topic = await this.prisma.topic.findFirst({
                    where: {
                      name: { equals: topicName, mode: 'insensitive' },
                      lessonId: lesson.id,
                    },
                  });

                  if (!topic && createMissingTopics) {
                    topic = await this.prisma.topic.create({
                      data: {
                        name: topicName,
                        lessonId: lesson.id,
                        subjectId: subject.id,
                        description: `Auto-created from syllabus import`,
                      },
                    });
                    result.details.topicsCreated++;
                    result.imported++;
                  } else if (!topic) {
                    result.details.topicsSkipped++;
                    result.skipped++;
                    result.errors.push(`Topic "${topicName}" not found and creation disabled`);
                  } else if (skipDuplicates) {
                    result.details.topicsSkipped++;
                    result.skipped++;
                  }
                } catch (error) {
                  result.errors.push(`Error processing topic "${topicName}": ${error.message}`);
                }
              }
            } catch (error) {
              result.errors.push(`Error processing lesson "${lessonData.lesson}": ${error.message}`);
            }
          }
        } catch (error) {
          result.errors.push(`Error processing subject "${subjectData.subject}": ${error.message}`);
        }
      }

      if (result.errors.length > 0) {
        result.success = false;
      }

      return result;
    } catch (error) {
      result.success = false;
      result.errors.push(`Import failed: ${error.message}`);
      return result;
    }
  }

  /**
   * Get preview of syllabus data (first few items)
   */
  async getSyllabusPreview(syllabusData: SyllabusSubject[], limit: number = 5): Promise<{
    subjects: number;
    totalLessons: number;
    totalTopics: number;
    sampleData: SyllabusSubject[];
  }> {
    const totalLessons = syllabusData.reduce((sum, subject) => sum + subject.lessons.length, 0);
    const totalTopics = syllabusData.reduce((sum, subject) => 
      sum + subject.lessons.reduce((lessonSum, lesson) => lessonSum + lesson.topics.length, 0), 0
    );

    return {
      subjects: syllabusData.length,
      totalLessons,
      totalTopics,
      sampleData: syllabusData.slice(0, limit),
    };
  }
}
