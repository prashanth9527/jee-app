import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  UseGuards, 
  BadRequestException,
  HttpException,
  HttpStatus 
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JsonImportService, ImportResult } from './json-import.service';

@Controller('admin/json-import')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class JsonImportController {
  constructor(private readonly jsonImportService: JsonImportService) {}

  /**
   * Get list of available JSON files in the seeds directory
   */
  @Get('files')
  async getAvailableFiles() {
    try {
      const files = await this.jsonImportService.getAvailableJsonFiles();
      return {
        success: true,
        files,
        count: files.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve JSON files',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Preview questions from a specific JSON file
   */
  @Get('preview')
  async previewQuestions(@Query('filePath') filePath: string) {
    if (!filePath) {
      throw new BadRequestException('filePath query parameter is required');
    }

    try {
      const preview = await this.jsonImportService.previewQuestions(filePath);
      return {
        success: true,
        ...preview,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to preview questions',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Import questions from a JSON file
   */
  @Post('import')
  async importQuestions(
    @Body() body: {
      filePath: string;
      options?: {
        skipDuplicates?: boolean;
        createMissingSubjects?: boolean;
        createMissingTopics?: boolean;
        createMissingSubtopics?: boolean;
      };
    },
  ) {
    const { filePath, options = {} } = body;

    if (!filePath) {
      throw new BadRequestException('filePath is required');
    }

    try {
      const result: ImportResult = await this.jsonImportService.importQuestionsFromFile(
        filePath,
        options,
      );

      return {
        success: result.success,
        message: result.success
          ? `Successfully imported ${result.imported} questions`
          : 'Import completed with errors',
        result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Import failed',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get import statistics
   */
  @Get('stats')
  async getImportStats() {
    try {
      const [
        totalQuestions,
        totalSubjects,
        totalTopics,
        totalSubtopics,
        totalTags,
        recentImports,
      ] = await Promise.all([
        this.jsonImportService['prisma'].question.count(),
        this.jsonImportService['prisma'].subject.count(),
        this.jsonImportService['prisma'].topic.count(),
        this.jsonImportService['prisma'].subtopic.count(),
        this.jsonImportService['prisma'].tag.count(),
        this.jsonImportService['prisma'].question.findMany({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
          select: {
            id: true,
            stem: true,
            createdAt: true,
            subject: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        }),
      ]);

      return {
        success: true,
        stats: {
          totalQuestions,
          totalSubjects,
          totalTopics,
          totalSubtopics,
          totalTags,
          recentImports,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retrieve import statistics',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validate JSON file format
   */
  @Post('validate')
  async validateJsonFile(@Body() body: { filePath: string }) {
    const { filePath } = body;

    if (!filePath) {
      throw new BadRequestException('filePath is required');
    }

    try {
      const questions = await this.jsonImportService.readJsonFile(filePath);
      const validationErrors: string[] = [];
      const validationWarnings: string[] = [];

      // Validate each question
      questions.forEach((question, index) => {
        // Required fields
        if (!question.stem || question.stem.trim() === '') {
          validationErrors.push(`Question ${index + 1}: Missing or empty stem`);
        }

        if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
          validationErrors.push(`Question ${index + 1}: Missing or invalid options`);
        } else {
          // Validate options
          question.options.forEach((option, optionIndex) => {
            if (!option.text || option.text.trim() === '') {
              validationErrors.push(`Question ${index + 1}, Option ${optionIndex + 1}: Missing or empty text`);
            }
            if (typeof option.isCorrect !== 'boolean') {
              validationErrors.push(`Question ${index + 1}, Option ${optionIndex + 1}: isCorrect must be boolean`);
            }
          });

          // Check if at least one option is correct
          const correctOptions = question.options.filter(opt => opt.isCorrect);
          if (correctOptions.length === 0) {
            validationWarnings.push(`Question ${index + 1}: No correct option marked`);
          } else if (correctOptions.length > 1) {
            validationWarnings.push(`Question ${index + 1}: Multiple correct options marked`);
          }
        }

        // Optional field validations
        if (question.difficulty && !['Easy', 'Medium', 'Hard'].includes(question.difficulty)) {
          validationWarnings.push(`Question ${index + 1}: Invalid difficulty level`);
        }

        if (question.yearAppeared && (question.yearAppeared < 1900 || question.yearAppeared > new Date().getFullYear() + 1)) {
          validationWarnings.push(`Question ${index + 1}: Invalid year appeared`);
        }
      });

      return {
        success: true,
        validation: {
          isValid: validationErrors.length === 0,
          totalQuestions: questions.length,
          errors: validationErrors,
          warnings: validationWarnings,
        },
      };
    } catch (error) {
      return {
        success: false,
        validation: {
          isValid: false,
          totalQuestions: 0,
          errors: [error.message],
          warnings: [],
        },
      };
    }
  }
}

