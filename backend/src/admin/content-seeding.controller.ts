import { 
  BadRequestException, 
  Body, 
  Controller, 
  Post, 
  UploadedFile, 
  UseGuards, 
  UseInterceptors,
  Get,
  Param,
  Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ContentSeedingService } from './content-seeding.service';

@Controller('admin/content-seeding')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ContentSeedingController {
  constructor(private readonly contentSeedingService: ContentSeedingService) {}

  @Post('upload-pdf')
  @UseInterceptors(FileInterceptor('pdf', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.includes('pdf')) {
        return cb(new BadRequestException('Only PDF files are allowed'), false);
      }
      cb(null, true);
    },
  }))
  async uploadPdf(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No PDF file uploaded');
    }

    return this.contentSeedingService.processPdfFile(file);
  }

  @Post('bulk-import')
  async bulkImportQuestions(@Body() body: {
    questions: Array<{
      stem: string;
      explanation?: string;
      tip_formula?: string;
      difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
      yearAppeared?: number;
      subjectId?: string;
      topicId?: string;
      subtopicId?: string;
      options: Array<{
        text: string;
        isCorrect: boolean;
        order: number;
      }>;
      tagNames?: string[];
      solutionImages?: string[];
    }>;
    batchName?: string;
  }) {
    if (!body.questions || body.questions.length === 0) {
      throw new BadRequestException('No questions provided for import');
    }

    return this.contentSeedingService.bulkImportQuestions(body.questions, body.batchName);
  }

  @Get('processing-status/:jobId')
  async getProcessingStatus(@Param('jobId') jobId: string) {
    return this.contentSeedingService.getProcessingStatus(jobId);
  }

  @Get('extract-from-folder')
  async extractFromFolder(@Query('folderPath') folderPath: string) {
    if (!folderPath) {
      throw new BadRequestException('Folder path is required');
    }
    
    return this.contentSeedingService.processFolder(folderPath);
  }

  @Post('validate-questions')
  async validateQuestions(@Body() body: {
    questions: Array<{
      stem: string;
      options: Array<{
        text: string;
        isCorrect: boolean;
      }>;
    }>;
  }) {
    return this.contentSeedingService.validateQuestions(body.questions);
  }
}
