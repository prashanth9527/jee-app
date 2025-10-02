import { 
  Controller, 
  Get, 
  Post, 
  Put,
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
import * as fs from 'fs';
import { join } from 'path';
import * as path from 'path';
import { PDFProcessorService, PDFProcessingRequest } from './pdf-processor.service';
import { MathpixService } from './mathpix.service';
import { ZipProcessorService } from './zip-processor.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/pdf-processor')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EXPERT')
export class PDFProcessorController {
  constructor(
    private readonly pdfProcessorService: PDFProcessorService,
    private readonly mathpixService: MathpixService,
    private readonly zipProcessorService: ZipProcessorService
  ) {}

  @Get('ai-providers')
  async getAvailableAIProviders() {
    try {
      const providers = await this.pdfProcessorService.getAvailableAIProviders();
      return {
        success: true,
        data: providers
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get available AI providers',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('list')
  async listPDFs() {
    try {
      const pdfs = await this.pdfProcessorService.listPDFs();
      const currentAIService = process.env.AI_SERVICE || 'openai';
      return {
        success: true,
        data: pdfs,
        total: pdfs.length,
        currentAIService
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

  @Post('import/:cacheId')
  async importProcessedJSON(@Param('cacheId') cacheId: string) {
    try {
      const result = await this.pdfProcessorService.importProcessedJSON(cacheId);
      
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

  @Post('update-questions/:cacheId')
  async updateQuestionsFromJson(
    @Param('cacheId') cacheId: string,
    @Body() body: { jsonContent: string }
  ) {
    try {
      const result = await this.pdfProcessorService.updateQuestionsFromJson(cacheId, body.jsonContent);
      
      return {
        success: true,
        message: `Update completed: ${result.importedCount} new questions imported, ${result.updatedCount} questions updated, ${result.skippedCount} skipped`,
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to update questions from JSON',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('mark-completed/:cacheId')
  async markAsCompleted(@Param('cacheId') cacheId: string) {
    try {
      const result = await this.pdfProcessorService.markAsCompleted(cacheId);
      
      return {
        success: true,
        message: 'File marked as completed successfully',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to mark file as completed',
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

  @Get('json-status/:fileName')
  async getJsonStatus(@Param('fileName') fileName: string) {
    try {
      const result = await this.pdfProcessorService.getJsonStatus(fileName);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get JSON status',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('save-json/:fileName')
  async saveJsonContent(
    @Param('fileName') fileName: string,
    @Body() body: { jsonContent: string }
  ) {
    try {
      if (!body.jsonContent) {
        throw new BadRequestException('jsonContent is required');
      }

      const result = await this.pdfProcessorService.saveJsonContent(fileName, body.jsonContent);
      
      return {
        success: true,
        message: 'JSON content saved successfully',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to save JSON content',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('upload-json/:fileName')
  async uploadJsonToProcessed(@Param('fileName') fileName: string) {
    try {
      const result = await this.pdfProcessorService.uploadJsonToProcessed(fileName);
      
      return {
        success: true,
        message: 'JSON uploaded to Processed folder successfully',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to upload JSON to Processed folder',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Mathpix endpoints
  @Post('process-mathpix-file/:fileName')
  async processFileWithMathpix(@Param('fileName') fileName: string) {
    try {
      // Get the file path from the PDF list
      const pdfs = await this.pdfProcessorService.listPDFs();
      const pdf = pdfs.find(p => p.fileName === fileName);
      
      if (!pdf) {
        throw new BadRequestException('PDF file not found');
      }

      const result = await this.mathpixService.processPdfWithMathpixByFileName(fileName, pdf.filePath);
      
      return {
        success: result.success,
        message: result.success ? 'PDF processed with Mathpix successfully' : 'Mathpix processing failed',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to process PDF with Mathpix',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('latex-content/:cacheId')
  async getLatexContent(@Param('cacheId') cacheId: string) {
    try {
      const result = await this.mathpixService.getLatexContent(cacheId);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get LaTeX content',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('mathpix-config')
  async getMathpixConfig() {
    try {
      const isConfigured = this.mathpixService.isConfigured();
      
      return {
        success: true,
        data: { 
          isConfigured,
          message: isConfigured ? 'Mathpix is configured' : 'Mathpix credentials not configured'
        }
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get Mathpix configuration',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('serve-file/:fileName')
  async serveFile(@Param('fileName') fileName: string, @Res() res: Response) {
    try {
      // Get the file path from the PDF list
      const pdfs = await this.pdfProcessorService.listPDFs();
      const pdf = pdfs.find(p => p.fileName === fileName);
      
      if (!pdf) {
        throw new BadRequestException('PDF file not found');
      }

      // Check if file exists
      if (!fs.existsSync(pdf.filePath)) {
        throw new BadRequestException('File not found on disk');
      }

      // Set appropriate headers based on file type
      const fileExtension = path.extname(fileName).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (fileExtension === '.pdf') {
        contentType = 'application/pdf';
      } else if (fileExtension === '.tex') {
        contentType = 'text/plain';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(pdf.filePath);
      fileStream.pipe(res);

    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to serve file',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('serve-latex/:fileName')
  async serveLatexFile(@Param('fileName') fileName: string, @Res() res: Response) {
    try {
      // Get the file path from the PDF list
      const pdfs = await this.pdfProcessorService.listPDFs();
      const pdf = pdfs.find(p => p.fileName === fileName);
      
      if (!pdf || !pdf.latexFilePath) {
        throw new BadRequestException('LaTeX file not found');
      }

      // Check if LaTeX file exists
      if (!fs.existsSync(pdf.latexFilePath)) {
        throw new BadRequestException('LaTeX file not found on disk');
      }

      // Set headers for LaTeX file
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `inline; filename="${fileName.replace('.pdf', '.tex')}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(pdf.latexFilePath);
      fileStream.pipe(res);

    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to serve LaTeX file',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('mark-completed/:cacheId')
  async markPDFAsCompleted(@Param('cacheId') cacheId: string) {
    try {
      const result = await this.pdfProcessorService.markPDFAsCompleted(cacheId);
      
      return {
        success: true,
        message: 'PDF marked as completed successfully',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to mark PDF as completed',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('process-zip/:cacheId')
  async processZipFile(@Param('cacheId') cacheId: string) {
    try {
      const result = await this.zipProcessorService.processZipFile(cacheId);
      
      return {
        success: result.success,
        message: result.success ? 'ZIP file processed successfully' : 'Failed to process ZIP file',
        data: result
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to process ZIP file',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('pending-zip-files')
  async getPendingZipFiles() {
    try {
      const pendingFiles = await this.zipProcessorService.getPendingZipFiles();
      
      return {
        success: true,
        data: pendingFiles,
        count: pendingFiles.length
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to get pending ZIP files',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

}
