import { Controller, Get, Post, Param, Body, UseGuards, HttpException, HttpStatus, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { LmsSummaryService } from './lms-summary.service';

@Controller('student/lms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class LmsSummaryController {
  constructor(private readonly lmsSummaryService: LmsSummaryService) {}

  @Get('content/:id/summary')
  async getContentSummary(
    @Param('id') contentId: string,
    @Req() req: any
  ) {
    try {
      const summary = await this.lmsSummaryService.getContentSummary(contentId, req.user.id);
      return {
        success: true,
        data: {
          contentId,
          summary: summary?.contentSummary || null,
          mindMap: summary?.mindMap || null,
          videoLink: summary?.videoLink || null,
          hasSummary: !!summary?.contentSummary
        }
      };
    } catch (error) {
      console.error('Error getting content summary:', error);
      throw new HttpException(
        'Failed to retrieve content summary',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('content/:id/generate-summary')
  async generateContentSummary(
    @Param('id') contentId: string,
    @Req() req: any,
    @Body() body: { type: 'summary' | 'mindmap' | 'both' }
  ) {
    try {
      const { type = 'summary' } = body;
      
      const result = await this.lmsSummaryService.generateContentSummary(
        contentId, 
        req.user.id, 
        type
      );
      
      return {
        success: true,
        data: {
          contentId,
          summary: result.contentSummary,
          mindMap: result.mindMap,
          videoLink: result.videoLink,
          generatedAt: result.updatedAt
        }
      };
    } catch (error) {
      console.error('Error generating content summary:', error);
      throw new HttpException(
        error.message || 'Failed to generate content summary',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('content/:id/update-summary')
  async updateContentSummary(
    @Param('id') contentId: string,
    @Req() req: any,
    @Body() body: { 
      contentSummary?: string;
      mindMap?: string;
      videoLink?: string;
    }
  ) {
    try {
      const result = await this.lmsSummaryService.updateContentSummary(
        contentId,
        req.user.id,
        body
      );
      
      return {
        success: true,
        data: {
          contentId,
          summary: result.contentSummary,
          mindMap: result.mindMap,
          videoLink: result.videoLink,
          updatedAt: result.updatedAt
        }
      };
    } catch (error) {
      console.error('Error updating content summary:', error);
      throw new HttpException(
        'Failed to update content summary',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
