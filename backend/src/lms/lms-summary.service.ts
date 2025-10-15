import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OpenAIService } from '../ai/openai.service';

@Injectable()
export class LmsSummaryService {
  constructor(
    private prisma: PrismaService,
    private openaiService: OpenAIService
  ) {}

  async getContentSummary(contentId: string, userId: string) {
    // First verify the content exists and user has access
    const content = await this.prisma.lMSContent.findFirst({
      where: {
        id: contentId,
        // Add any access control logic here if needed
      },
      select: {
        id: true,
        title: true,
        description: true,
        contentData: true,
        contentType: true,
        contentSummary: true,
        mindMap: true,
        videoLink: true,
        updatedAt: true
      }
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  async generateContentSummary(
    contentId: string, 
    userId: string, 
    type: 'summary' | 'mindmap' | 'both' = 'summary'
  ) {
    // Get the content with all necessary data
    const content = await this.prisma.lMSContent.findFirst({
      where: {
        id: contentId,
      },
      select: {
        id: true,
        title: true,
        description: true,
        contentData: true,
        contentType: true,
        contentSummary: true,
        mindMap: true,
        videoLink: true
      }
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Prepare content for AI analysis
    const contentText = this.extractContentText(content);
    
    let contentSummary = content.contentSummary;
    let mindMap = content.mindMap;

    try {
      // Generate summary if requested and not already exists
      if ((type === 'summary' || type === 'both') && !contentSummary) {
        contentSummary = await this.openaiService.generateContentSummary(
          contentText,
          content.title,
          content.contentType
        );
      }

      // Generate mind map if requested and not already exists
      if ((type === 'mindmap' || type === 'both') && !mindMap) {
        mindMap = await this.openaiService.generateMindMap(
          contentText,
          content.title
        );
      }

      // Update the content with generated summaries
      const updatedContent = await this.prisma.lMSContent.update({
        where: { id: contentId },
        data: {
          contentSummary: contentSummary || content.contentSummary,
          mindMap: mindMap || content.mindMap,
        },
        select: {
          id: true,
          contentSummary: true,
          mindMap: true,
          videoLink: true,
          updatedAt: true
        }
      });

      return updatedContent;
    } catch (error) {
      console.error('Error generating AI content:', error);
      throw new Error('Failed to generate content summary. Please try again.');
    }
  }

  async updateContentSummary(
    contentId: string,
    userId: string,
    updateData: {
      contentSummary?: string;
      mindMap?: string;
      videoLink?: string;
    }
  ) {
    // Verify content exists
    const content = await this.prisma.lMSContent.findFirst({
      where: { id: contentId }
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Update the content
    const updatedContent = await this.prisma.lMSContent.update({
      where: { id: contentId },
      data: {
        ...(updateData.contentSummary !== undefined && { contentSummary: updateData.contentSummary }),
        ...(updateData.mindMap !== undefined && { mindMap: updateData.mindMap }),
        ...(updateData.videoLink !== undefined && { videoLink: updateData.videoLink }),
      },
      select: {
        id: true,
        contentSummary: true,
        mindMap: true,
        videoLink: true,
        updatedAt: true
      }
    });

    return updatedContent;
  }

  private extractContentText(content: any): string {
    let text = '';
    
    // Add title
    text += `Title: ${content.title}\n\n`;
    
    // Add description if available
    if (content.description) {
      text += `Description: ${content.description}\n\n`;
    }
    
    // Extract text from contentData based on content type
    if (content.contentData) {
      if (content.contentType === 'TEXT' && content.contentData.htmlContent) {
        // For HTML content, we'll extract text (remove HTML tags)
        text += this.stripHtmlTags(content.contentData.htmlContent);
      } else if (content.contentData.text) {
        text += content.contentData.text;
      } else if (content.contentData.content) {
        text += content.contentData.content;
      } else if (typeof content.contentData === 'string') {
        text += content.contentData;
      }
    }
    
    return text.trim();
  }

  private stripHtmlTags(html: string): string {
    // Simple HTML tag removal - in production, you might want to use a proper HTML parser
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }
}

