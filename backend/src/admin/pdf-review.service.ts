import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PDFProcessorService } from './pdf-processor.service';

@Injectable()
export class PDFReviewService {
  private readonly logger = new Logger(PDFReviewService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pdfProcessorService: PDFProcessorService
  ) {}

  async getQuestionsForReview(cacheId: string) {
    try {
      // Verify the cache exists
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { id: cacheId }
      });

      if (!cache) {
        throw new BadRequestException('PDF processing cache not found');
      }

      // Get all questions for this PDF cache
      const questions = await this.prisma.question.findMany({
        where: {
          pdfProcessorCacheId: cacheId
        },
        include: {
          subject: true,
          lesson: true,
          topic: true,
          subtopic: true,
          options: {
            orderBy: { order: 'asc' }
          },
          tags: {
            include: {
              tag: true
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      });

      // Add default status if not present
      const questionsWithStatus = questions.map(question => ({
        ...question,
        status: question.status || 'underreview'
      }));

      return {
        questions: questionsWithStatus,
        pdfCache: {
          fileName: cache.fileName,
          filePath: cache.filePath,
          latexFilePath: cache.latexFilePath
        }
      };
    } catch (error) {
      this.logger.error('Error getting questions for review:', error);
      throw error;
    }
  }

  async getQuestionById(cacheId: string, questionId: string) {
    try {
      // Verify the cache exists and question belongs to it
      const question = await this.prisma.question.findFirst({
        where: {
          id: questionId,
          pdfProcessorCacheId: cacheId
        },
        include: {
          subject: true,
          lesson: true,
          topic: true,
          subtopic: true,
          options: {
            orderBy: { order: 'asc' }
          },
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      return question;
    } catch (error) {
      this.logger.error('Error getting question by ID:', error);
      throw error;
    }
  }

  async approveQuestion(questionId: string) {
    try {
      const question = await this.prisma.question.update({
        where: { id: questionId },
        data: {
          status: 'approved'
        },
        include: {
          subject: true,
          lesson: true,
          topic: true,
          subtopic: true,
          options: {
            orderBy: { order: 'asc' }
          },
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      this.logger.log(`Question ${questionId} approved successfully`);
      return question;
    } catch (error) {
      this.logger.error('Error approving question:', error);
      throw error;
    }
  }

  async rejectQuestion(questionId: string) {
    try {
      const question = await this.prisma.question.update({
        where: { id: questionId },
        data: {
          status: 'rejected'
        },
        include: {
          subject: true,
          lesson: true,
          topic: true,
          subtopic: true,
          options: {
            orderBy: { order: 'asc' }
          },
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      this.logger.log(`Question ${questionId} rejected successfully`);
      return question;
    } catch (error) {
      this.logger.error('Error rejecting question:', error);
      throw error;
    }
  }

  async bulkApproveQuestions(questionIds: string[]) {
    try {
      const result = await this.prisma.question.updateMany({
        where: {
          id: { in: questionIds }
        },
        data: {
          status: 'approved'
        }
      });

      this.logger.log(`Bulk approved ${result.count} questions`);
      return {
        approvedCount: result.count,
        questionIds: questionIds
      };
    } catch (error) {
      this.logger.error('Error bulk approving questions:', error);
      throw error;
    }
  }

  async approveAllQuestions(cacheId: string) {
    try {
      // Verify the cache exists
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { id: cacheId }
      });

      if (!cache) {
        throw new BadRequestException('PDF processing cache not found');
      }

      const result = await this.prisma.question.updateMany({
        where: {
          pdfProcessorCacheId: cacheId,
          status: 'underreview'
        },
        data: {
          status: 'approved'
        }
      });

      this.logger.log(`Approved all ${result.count} questions for cache ${cacheId}`);
      
      // Mark PDF cache as completed
      await this.pdfProcessorService.markPDFAsCompleted(cacheId);
      
      return {
        approvedCount: result.count,
        cacheId: cacheId
      };
    } catch (error) {
      this.logger.error('Error approving all questions:', error);
      throw error;
    }
  }

  async updateQuestion(questionId: string, updateData: any) {
    try {
      // Validate the update data
      const allowedFields = [
        'stem', 'explanation', 'tip_formula', 'difficulty', 
        'yearAppeared', 'isPreviousYear', 'subjectId', 'lessonId', 
        'topicId', 'subtopicId'
      ];

      const filteredData: any = {};
      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      }

      // Handle options update if provided
      if (updateData.options && Array.isArray(updateData.options)) {
        // Delete existing options
        await this.prisma.questionOption.deleteMany({
          where: { questionId: questionId }
        });

        // Create new options
        filteredData.options = {
          create: updateData.options.map((opt: any, index: number) => ({
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: index
          }))
        };
      }

      // Handle tags update if provided
      if (updateData.tags && Array.isArray(updateData.tags)) {
        // Delete existing tags
        await this.prisma.questionTag.deleteMany({
          where: { questionId: questionId }
        });

        // Create or find tags and create new relations
        const tagIds: string[] = [];
        for (const tagName of updateData.tags) {
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

        filteredData.tags = {
          create: tagIds.map(tagId => ({ tagId }))
        };
      }

      const question = await this.prisma.question.update({
        where: { id: questionId },
        data: filteredData,
        include: {
          subject: true,
          lesson: true,
          topic: true,
          subtopic: true,
          options: {
            orderBy: { order: 'asc' }
          },
          tags: {
            include: {
              tag: true
            }
          }
        }
      });

      this.logger.log(`Question ${questionId} updated successfully`);
      return question;
    } catch (error) {
      this.logger.error('Error updating question:', error);
      throw error;
    }
  }

  async getReviewStats(cacheId: string) {
    try {
      // Verify the cache exists
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { id: cacheId }
      });

      if (!cache) {
        throw new BadRequestException('PDF processing cache not found');
      }

      // Get question counts by status
      // For now, return default stats since the new fields might not be available yet
      const total = await this.prisma.question.count({
        where: { pdfProcessorCacheId: cacheId }
      });

      // If no questions found with pdfProcessorCacheId, return zero stats
      if (total === 0) {
        return {
          total: 0,
          approved: 0,
          underreview: 0,
          rejected: 0,
          completionPercentage: 0
        };
      }

      // Try to get status-based counts, but handle errors gracefully
      let approved = 0;
      let underreview = 0;
      let rejected = 0;

      try {
        [approved, underreview, rejected] = await Promise.all([
          this.prisma.question.count({
            where: { 
              pdfProcessorCacheId: cacheId,
              status: 'approved'
            }
          }),
          this.prisma.question.count({
            where: { 
              pdfProcessorCacheId: cacheId,
              status: 'underreview'
            }
          }),
          this.prisma.question.count({
            where: { 
              pdfProcessorCacheId: cacheId,
              status: 'rejected'
            }
          })
        ]);
      } catch (error) {
        // If status field doesn't exist yet, assume all questions are under review
        this.logger.warn('Status field not available yet, assuming all questions are under review');
        underreview = total;
        approved = 0;
        rejected = 0;
      }

      return {
        total,
        approved,
        underreview,
        rejected,
        completionPercentage: total > 0 ? Math.round((approved / total) * 100) : 0
      };
    } catch (error) {
      this.logger.error('Error getting review stats:', error);
      throw error;
    }
  }

  async createExamFromQuestions(
    questionIds: string[],
    customTitle?: string,
    description?: string,
    timeLimitMin?: number,
    examType?: string,
    previousYear?: string
  ) {
    try {
      // Fetch questions to analyze their metadata
      const questions = await this.prisma.question.findMany({
        where: {
          id: { in: questionIds }
        },
        include: {
          subject: true,
          lesson: true,
          topic: true,
          subtopic: true
        }
      });

      if (questions.length === 0) {
        throw new BadRequestException('No questions found with the provided IDs');
      }

      // Generate automatic title if not provided
      let title = customTitle;
      if (!title) {
        title = this.generateExamTitle(questions);
      }

      // Collect unique subject, topic, and subtopic IDs
      const subjectIds = [...new Set(questions.map(q => q.subjectId).filter((id): id is string => id !== null))];
      const topicIds = [...new Set(questions.map(q => q.topicId).filter((id): id is string => id !== null))];
      const subtopicIds = [...new Set(questions.map(q => q.subtopicId).filter((id): id is string => id !== null))];

      // Calculate default time limit (2 minutes per question if not provided)
      const calculatedTimeLimit = timeLimitMin || questions.length * 2;

      // Create the exam paper
      const examPaper = await this.prisma.examPaper.create({
        data: {
          title,
          description: description || `Practice exam with ${questions.length} questions`,
          previousYear: previousYear || null,
          subjectIds,
          topicIds,
          subtopicIds,
          questionIds,
          timeLimitMin: calculatedTimeLimit,
          examType: (examType as any) || 'REGULAR'
        },
        include: {
          _count: {
            select: {
              submissions: true
            }
          }
        }
      });

      this.logger.log(`Created exam "${title}" with ${questions.length} questions`);

      return {
        examPaper,
        questionCount: questions.length,
        subjects: questions.map(q => q.subject?.name).filter(Boolean),
        topics: questions.map(q => q.topic?.name).filter(Boolean),
        subtopics: questions.map(q => q.subtopic?.name).filter(Boolean)
      };
    } catch (error) {
      this.logger.error('Error creating exam from questions:', error);
      throw error;
    }
  }

  private generateExamTitle(questions: any[]): string {
    // Analyze questions to generate a meaningful title
    const subjects = [...new Set(questions.map(q => q.subject?.name).filter(Boolean))];
    const lessons = [...new Set(questions.map(q => q.lesson?.name).filter(Boolean))];
    const topics = [...new Set(questions.map(q => q.topic?.name).filter(Boolean))];
    const subtopics = [...new Set(questions.map(q => q.subtopic?.name).filter(Boolean))];

    // Priority: Subtopic > Topic > Lesson > Subject (most specific to least specific)
    if (subtopics.length === 1) {
      // Single subtopic - most specific
      const subject = subjects.length === 1 ? subjects[0] : '';
      const topic = topics.length === 1 ? topics[0] : '';
      if (subject && topic) {
        return `${subject} - ${topic} - ${subtopics[0]} Practice`;
      }
      return `${subtopics[0]} - Practice Exam`;
    } else if (topics.length === 1) {
      // Single topic
      const subject = subjects.length === 1 ? subjects[0] : '';
      if (subject) {
        return `${subject} - ${topics[0]} Practice`;
      }
      return `${topics[0]} - Practice Exam`;
    } else if (lessons.length === 1) {
      // Single lesson
      const subject = subjects.length === 1 ? subjects[0] : '';
      if (subject) {
        return `${subject} - ${lessons[0]} Practice`;
      }
      return `${lessons[0]} - Practice Exam`;
    } else if (subjects.length === 1) {
      // Single subject
      return `${subjects[0]} - Practice Exam`;
    } else if (subjects.length > 1) {
      // Multiple subjects
      return `${subjects.join(', ')} - Mixed Practice`;
    } else {
      // Fallback to generic title with timestamp
      const date = new Date().toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      return `Practice Exam - ${date}`;
    }
  }
}
