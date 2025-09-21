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
import { SyllabusImportService, ImportResult, SyllabusSubject } from './syllabus-import.service';

@Controller('admin/syllabus-import')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SyllabusImportController {
  constructor(private readonly syllabusImportService: SyllabusImportService) {}

  /**
   * Get list of available syllabus JSON files in the seeds directory
   */
  @Get('files')
  async getAvailableFiles() {
    try {
      const files = await this.syllabusImportService.getAvailableSyllabusFiles();
      return {
        success: true,
        files,
        count: files.length,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Read and validate a syllabus file
   */
  @Get('preview')
  async previewFile(@Query('file') filePath: string) {
    if (!filePath) {
      throw new BadRequestException('File path is required');
    }

    try {
      const syllabusData = await this.syllabusImportService.readSyllabusFile(filePath);
      const validation = this.syllabusImportService.validateSyllabusData(syllabusData);
      const preview = await this.syllabusImportService.getSyllabusPreview(syllabusData);

      return {
        success: true,
        filePath,
        validation,
        preview,
        sampleData: preview.sampleData,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * Import syllabus data into the database
   */
  @Post('import')
  async importSyllabus(
    @Body() body: {
      filePath: string;
      options?: {
        createMissingSubjects?: boolean;
        createMissingLessons?: boolean;
        createMissingTopics?: boolean;
        skipDuplicates?: boolean;
      };
    }
  ) {
    const { filePath, options = {} } = body;

    if (!filePath) {
      throw new BadRequestException('File path is required');
    }

    try {
      // Read and validate the file
      const syllabusData = await this.syllabusImportService.readSyllabusFile(filePath);
      const validation = this.syllabusImportService.validateSyllabusData(syllabusData);

      if (!validation.isValid) {
        throw new BadRequestException(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Import the data
      const result = await this.syllabusImportService.importSyllabus(syllabusData, options);

      return {
        success: result.success,
        message: result.success 
          ? 'Syllabus imported successfully' 
          : 'Syllabus import completed with errors',
        result,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST
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
        subjectsCount,
        lessonsCount,
        topicsCount,
        jeeStream
      ] = await Promise.all([
        this.syllabusImportService['prisma'].subject.count({
          where: {
            stream: { name: { equals: 'JEE', mode: 'insensitive' } }
          }
        }),
        this.syllabusImportService['prisma'].lesson.count({
          where: {
            subject: {
              stream: { name: { equals: 'JEE', mode: 'insensitive' } }
            }
          }
        }),
        this.syllabusImportService['prisma'].topic.count({
          where: {
            lesson: {
              subject: {
                stream: { name: { equals: 'JEE', mode: 'insensitive' } }
              }
            }
          }
        }),
        this.syllabusImportService['prisma'].stream.findFirst({
          where: { name: { equals: 'JEE', mode: 'insensitive' } }
        })
      ]);

      return {
        success: true,
        stats: {
          jeeStreamExists: !!jeeStream,
          subjects: subjectsCount,
          lessons: lessonsCount,
          topics: topicsCount,
        },
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Validate syllabus data without importing
   */
  @Post('validate')
  async validateSyllabusData(@Body() body: { syllabusData: SyllabusSubject[] }) {
    const { syllabusData } = body;

    if (!syllabusData) {
      throw new BadRequestException('Syllabus data is required');
    }

    try {
      const validation = this.syllabusImportService.validateSyllabusData(syllabusData);
      const preview = await this.syllabusImportService.getSyllabusPreview(syllabusData);

      return {
        success: true,
        validation,
        preview,
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
