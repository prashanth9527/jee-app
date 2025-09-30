import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query, 
  UseGuards,
  BadRequestException,
  HttpException,
  HttpStatus,
  Res,
  StreamableFile
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import { PDFProcessorService, PDFProcessingRequest } from './pdf-processor.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/pdf-processor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EXPERT')
export class PDFProcessorController {
  constructor(private readonly pdfProcessorService: PDFProcessorService) {}

  @Get('list')
  async listPDFs() {
    try {
      const pdfs = await this.pdfProcessorService.listPDFs();
      return {
        success: true,
        data: pdfs,
        total: pdfs.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to list PDF files',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('process')
  async processPDF(@Body() request: PDFProcessingRequest) {
    try {
      if (!request.fileName) {
        throw new BadRequestException('fileName is required');
      }

      const result = await this.pdfProcessorService.processPDF(request);
      
      return {
        success: true,
        message: 'PDF processing initiated successfully',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to process PDF',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('status/:fileName')
  async getProcessingStatus(@Param('fileName') fileName: string) {
    try {
      const status = await this.pdfProcessorService.getProcessingStatus(fileName);
      
      if (!status) {
        throw new BadRequestException('File not found in processing cache');
      }

      return {
        success: true,
        data: status
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get processing status',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('processed')
  async getProcessedFiles() {
    try {
      const files = await this.pdfProcessorService.getProcessedFiles();
      
      return {
        success: true,
        data: files,
        total: files.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get processed files',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('retry/:fileName')
  async retryProcessing(@Param('fileName') fileName: string) {
    try {
      const result = await this.pdfProcessorService.retryProcessing(fileName);
      
      return {
        success: true,
        message: 'PDF processing retry initiated successfully',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to retry PDF processing',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  async getProcessingStats() {
    try {
      const pdfs = await this.pdfProcessorService.listPDFs();
      
      const stats = {
        total: pdfs.length,
        pending: pdfs.filter(p => p.status === 'PENDING').length,
        processing: pdfs.filter(p => p.status === 'PROCESSING' || p.status === 'UPLOADING').length,
        completed: pdfs.filter(p => p.status === 'COMPLETED').length,
        failed: pdfs.filter(p => p.status === 'FAILED').length,
        retrying: pdfs.filter(p => p.status === 'RETRYING').length
      };

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get processing stats',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('download/:fileName')
  async downloadProcessedFile(@Param('fileName') fileName: string) {
    try {
      const status = await this.pdfProcessorService.getProcessingStatus(fileName);
      
      if (!status || status.processingStatus !== 'COMPLETED') {
        throw new BadRequestException('File not processed or processing not completed');
      }

      if (!status.outputFilePath) {
        throw new BadRequestException('Output file path not found');
      }

      return {
        success: true,
        data: {
          fileName: fileName,
          outputFilePath: status.outputFilePath,
          downloadUrl: `/api/admin/pdf-processor/download-file/${fileName}`
        }
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get download info',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('download-file/:fileName')
  async downloadFile(@Param('fileName') fileName: string, @Res() res: Response) {
    try {
      const status = await this.pdfProcessorService.getProcessingStatus(fileName);
      
      if (!status || status.processingStatus !== 'COMPLETED') {
        throw new BadRequestException('File not processed or processing not completed');
      }

      if (!status.outputFilePath) {
        throw new BadRequestException('Output file path not found');
      }

      // Set headers for file download
      const downloadFileName = fileName.replace('.pdf', '.json');
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);

      // Create and pipe the file stream
      const fileStream = createReadStream(status.outputFilePath);
      fileStream.pipe(res);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to download file',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('question-count/:fileName')
  async getQuestionCount(@Param('fileName') fileName: string) {
    try {
      const count = await this.pdfProcessorService.getQuestionCount(fileName);
      
      return {
        success: true,
        data: { questionCount: count }
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get question count',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('import/:fileName')
  async importProcessedJSON(@Param('fileName') fileName: string) {
    try {
      const result = await this.pdfProcessorService.importProcessedJSON(fileName);
      
      return {
        success: true,
        message: `Import completed: ${result.importedCount} questions imported, ${result.skippedCount} skipped`,
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to import processed JSON',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('reset-retry/:fileName')
  async resetRetryCount(@Param('fileName') fileName: string) {
    try {
      const result = await this.pdfProcessorService.resetRetryCount(fileName);
      
      return {
        success: true,
        message: 'Retry count reset successfully',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to reset retry count',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

}
