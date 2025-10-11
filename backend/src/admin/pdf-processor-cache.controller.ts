import { 
  Controller, 
  Get, 
  Post,
  Delete,
  Param, 
  Query, 
  Body,
  UseGuards,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { PDFProcessorCacheService } from './pdf-processor-cache.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/pdf-processor-cache')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'EXPERT')
export class PDFProcessorCacheController {
  constructor(
    private readonly pdfProcessorCacheService: PDFProcessorCacheService
  ) {}

  @Get()
  async getAllCacheRecords(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('status') status?: string,
    @Query('recordType') recordType?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy: string = 'createdAt',
    @Query('sortOrder') sortOrder: string = 'desc'
  ) {
    try {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      const sortOrderValue = sortOrder === 'asc' ? 'asc' : 'desc';

      const result = await this.pdfProcessorCacheService.findAll({
        page: pageNum,
        limit: limitNum,
        status,
        recordType,
        search,
        sortBy,
        sortOrder: sortOrderValue
      });

      return {
        success: true,
        data: result.data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNum),
          hasNext: pageNum < Math.ceil(result.total / limitNum),
          hasPrev: pageNum > 1
        }
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch PDF processor cache records',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('stats')
  async getCacheStats() {
    try {
      const stats = await this.pdfProcessorCacheService.getStats();
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch cache statistics',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('sync-files')
  async syncFiles() {
    try {
      const result = await this.pdfProcessorCacheService.syncFilesFromContentFolder();
      return {
        success: true,
        message: 'Files synced successfully',
        synced: result.synced,
        updated: result.updated,
        skipped: result.skipped,
        total: result.total
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to sync files from content folder',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/test-cors')
  async testCors(@Param('id') id: string) {
    return {
      success: true,
      message: 'CORS test successful',
      data: { id, timestamp: new Date().toISOString() }
    };
  }

  @Post(':id/test-post-cors')
  async testPostCors(@Param('id') id: string) {
    return {
      success: true,
      message: 'POST CORS test successful',
      data: { id, timestamp: new Date().toISOString() }
    };
  }

  @Post(':id/process-mathpix')
  async processWithMathpix(@Param('id') id: string) {
    try {
      console.log(`[Controller] Starting Mathpix processing for ID: ${id}`);
      const result = await this.pdfProcessorCacheService.processWithMathpix(id);
      console.log(`[Controller] Mathpix processing completed for ID: ${id}, success: ${result.success}`);
      return {
        success: result.success,
        message: result.success ? 'PDF processed with Mathpix successfully' : 'Mathpix processing failed',
        data: result
      };
    } catch (error) {
      console.error(`[Controller] Error processing Mathpix for ID: ${id}:`, error);
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

  @Post(':id/import-questions')
  async importQuestions(@Param('id') id: string) {
    try {
      const result = await this.pdfProcessorCacheService.importQuestionsFromJson(id);
      return {
        success: true,
        message: 'Questions imported successfully',
        importedCount: result.importedCount
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to import questions from JSON',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/process-chatgpt')
  async processWithChatGPT(@Param('id') id: string, @Body() body: { latexFilePath: string }) {
    try {
      console.log(`[Controller] Starting ChatGPT processing for ID: ${id}`);
      const result = await this.pdfProcessorCacheService.processWithChatGPT(id, body.latexFilePath);
      console.log(`[Controller] ChatGPT processing completed for ID: ${id}, success: ${result.success}`);
      return {
        success: result.success,
        message: result.success ? 'LaTeX file processed with ChatGPT successfully' : 'ChatGPT processing failed',
        jsonContent: result.jsonContent,
        questionsCount: result.questionsCount,
        chunksProcessed: result.chunksProcessed,
        totalChunks: result.totalChunks,
        metadata: result.metadata,
        data: result
      };
    } catch (error) {
      console.error(`[Controller] Error processing with ChatGPT for ID: ${id}:`, error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to process LaTeX file with ChatGPT',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/process-claude')
  async processWithClaude(@Param('id') id: string, @Body() body: { latexFilePath: string }) {
    try {
      console.log(`[Controller] Starting Claude processing for ID: ${id}`);
      const result = await this.pdfProcessorCacheService.processWithClaude(id, body.latexFilePath);
      console.log(`[Controller] Claude processing completed for ID: ${id}, success: ${result.success}`);
      return {
        success: result.success,
        message: result.success ? 'LaTeX file processed with Claude successfully' : 'Claude processing failed',
        jsonContent: result.jsonContent,
        questionsCount: result.questionsCount,
        chunksProcessed: result.chunksProcessed,
        metadata: result.metadata,
        data: result
      };
    } catch (error) {
      console.error(`[Controller] Error processing with Claude for ID: ${id}:`, error);
      throw new HttpException(
        {
          success: false,
          message: 'Failed to process LaTeX file with Claude',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id/delete-questions')
  async deleteQuestions(@Param('id') id: string) {
    try {
      const result = await this.pdfProcessorCacheService.deleteQuestionsByCacheId(id);
      return {
        success: true,
        message: 'Questions deleted successfully',
        deletedCount: result.deletedCount
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete questions',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async getCacheRecord(@Param('id') id: string) {
    try {
      const record = await this.pdfProcessorCacheService.findOne(id);
      if (!record) {
        throw new HttpException(
          {
            success: false,
            message: 'PDF processor cache record not found'
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: record
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to fetch PDF processor cache record',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  async deleteCacheRecord(@Param('id') id: string) {
    try {
      const deleted = await this.pdfProcessorCacheService.remove(id);
      if (!deleted) {
        throw new HttpException(
          {
            success: false,
            message: 'PDF processor cache record not found'
          },
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        message: 'PDF processor cache record deleted successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        {
          success: false,
          message: 'Failed to delete PDF processor cache record',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
