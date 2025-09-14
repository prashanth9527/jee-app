import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AwsService } from '../aws/aws.service';

export interface CreateLMSContentDto {
  title: string;
  description?: string;
  contentType: 'H5P' | 'SCORM' | 'FILE' | 'URL' | 'IFRAME' | 'YOUTUBE' | 'TEXT' | 'VIDEO' | 'AUDIO' | 'IMAGE' | 'QUIZ' | 'ASSIGNMENT';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
  accessType: 'FREE' | 'SUBSCRIPTION' | 'PREMIUM' | 'TRIAL';
  streamId?: string;
  subjectId?: string;
  topicId?: string;
  subtopicId?: string;
  isDripContent?: boolean;
  dripDelay?: number;
  dripDate?: string;
  duration?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  tags?: string[];
  contentData?: any;
  fileUrl?: string;
  externalUrl?: string;
  iframeCode?: string;
  youtubeId?: string;
  youtubeUrl?: string;
  h5pContent?: any;
  scormData?: any;
  parentId?: string;
  order?: number;
}

export interface UpdateLMSContentDto extends Partial<CreateLMSContentDto> {}

export interface LMSContentFilters {
  contentType?: string;
  status?: string;
  accessType?: string;
  streamId?: string;
  subjectId?: string;
  topicId?: string;
  subtopicId?: string;
  search?: string;
  page?: number;
  limit?: number;
  difficulty?: string;
  tags?: string[];
}

export interface LMSStats {
  totalContent: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byAccess: { access: string; count: number }[];
  totalViews: number;
  totalCompletions: number;
}

@Injectable()
export class LMSService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private awsService: AwsService,
  ) {}

  async createContent(data: CreateLMSContentDto) {
    // Validate stream exists if provided
    if (data.streamId) {
      const stream = await this.prisma.stream.findUnique({
        where: { id: data.streamId }
      });
      if (!stream) {
        throw new BadRequestException('Stream not found');
      }
    }

    // Validate subject exists if provided
    if (data.subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: data.subjectId }
      });
      if (!subject) {
        throw new BadRequestException('Subject not found');
      }
    }

    // Validate topic exists if provided
    if (data.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: data.topicId }
      });
      if (!topic) {
        throw new BadRequestException('Topic not found');
      }
    }

    // Validate subtopic exists if provided
    if (data.subtopicId) {
      const subtopic = await this.prisma.subtopic.findUnique({
        where: { id: data.subtopicId }
      });
      if (!subtopic) {
        throw new BadRequestException('Subtopic not found');
      }
    }

    // Validate parent content exists if provided
    if (data.parentId) {
      const parent = await this.prisma.lMSContent.findUnique({
        where: { id: data.parentId }
      });
      if (!parent) {
        throw new BadRequestException('Parent content not found');
      }
    }

    // Helper function to check if a value is valid (not null, undefined, or empty string)
    const isValidId = (id: any) => id && id !== null && id !== undefined && id.toString().trim() !== '';

    // Additional validation: if topicId is provided, ensure it exists
    if (isValidId(data.topicId)) {
      const topicExists = await this.prisma.topic.findUnique({
        where: { id: data.topicId }
      });
      if (!topicExists) {
        throw new BadRequestException(`Topic with ID ${data.topicId} not found`);
      }
    }

    // Additional validation: if subtopicId is provided, ensure it exists
    if (isValidId(data.subtopicId)) {
      const subtopicExists = await this.prisma.subtopic.findUnique({
        where: { id: data.subtopicId }
      });
      if (!subtopicExists) {
        throw new BadRequestException(`Subtopic with ID ${data.subtopicId} not found`);
      }
    }

    // Additional validation: if streamId is provided, ensure it exists
    if (isValidId(data.streamId)) {
      const streamExists = await this.prisma.stream.findUnique({
        where: { id: data.streamId }
      });
      if (!streamExists) {
        throw new BadRequestException(`Stream with ID ${data.streamId} not found`);
      }
    }

    // Additional validation: if subjectId is provided, ensure it exists
    if (isValidId(data.subjectId)) {
      const subjectExists = await this.prisma.subject.findUnique({
        where: { id: data.subjectId }
      });
      if (!subjectExists) {
        throw new BadRequestException(`Subject with ID ${data.subjectId} not found`);
      }
    }

    // Build the data object, only including foreign key fields if they have valid values
    const contentData: any = {
      title: data.title,
      description: data.description,
      contentType: data.contentType,
      status: data.status,
      accessType: data.accessType,
    };

    // Only include foreign key fields if they have valid values
    if (isValidId(data.streamId)) {
      contentData.streamId = data.streamId;
    }
    if (isValidId(data.subjectId)) {
      contentData.subjectId = data.subjectId;
    }
    if (isValidId(data.topicId)) {
      contentData.topicId = data.topicId;
    }
    if (isValidId(data.subtopicId)) {
      contentData.subtopicId = data.subtopicId;
    }
    if (isValidId(data.parentId)) {
      contentData.parentId = data.parentId;
    }

    // Add the remaining fields to contentData
    Object.assign(contentData, {
      isDripContent: data.isDripContent || false,
      dripDelay: data.dripDelay,
      dripDate: data.dripDate ? new Date(data.dripDate) : null,
      duration: data.duration,
      difficulty: data.difficulty,
      tags: data.tags || [],
      contentData: data.contentData,
      fileUrl: data.fileUrl,
      externalUrl: data.externalUrl,
      iframeCode: data.iframeCode,
      youtubeId: data.youtubeId,
      youtubeUrl: data.youtubeUrl,
      h5pContent: data.h5pContent,
      scormData: data.scormData,
      order: data.order || 0,
    });

    const content = await this.prisma.lMSContent.create({
      data: contentData,
      include: {
        stream: true,
        subject: true,
        topic: true,
        subtopic: true,
        parent: true,
        children: true,
        _count: {
          select: {
            progress: true,
          }
        }
      }
    });

    return content;
  }

  async updateContent(id: string, data: UpdateLMSContentDto) {
    const existingContent = await this.prisma.lMSContent.findUnique({
      where: { id }
    });

    if (!existingContent) {
      throw new NotFoundException('Content not found');
    }

    // Validate subject exists if provided
    if (data.subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: { id: data.subjectId }
      });
      if (!subject) {
        throw new BadRequestException('Subject not found');
      }
    }

    // Validate topic exists if provided
    if (data.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: data.topicId }
      });
      if (!topic) {
        throw new BadRequestException('Topic not found');
      }
    }

    // Validate subtopic exists if provided
    if (data.subtopicId) {
      const subtopic = await this.prisma.subtopic.findUnique({
        where: { id: data.subtopicId }
      });
      if (!subtopic) {
        throw new BadRequestException('Subtopic not found');
      }
    }

    const content = await this.prisma.lMSContent.update({
      where: { id },
      data: {
      ...data,
        dripDate: data.dripDate ? new Date(data.dripDate) : undefined,
      },
      include: {
        stream: true,
        subject: true,
        topic: true,
        subtopic: true,
        parent: true,
        children: true,
        _count: {
          select: {
            progress: true,
          }
        }
      }
    });

    return content;
  }

  async getContent(id: string) {
    const content = await this.prisma.lMSContent.findUnique({
      where: { id },
      include: {
        stream: true,
        subject: true,
        topic: true,
        subtopic: true,
        parent: true,
        children: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            progress: true,
          }
        }
      }
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  async getContentList(filters: LMSContentFilters) {
    const page = parseInt(filters.page?.toString() || '1');
    const limit = parseInt(filters.limit?.toString() || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (filters.contentType) {
      where.contentType = filters.contentType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.accessType) {
      where.accessType = filters.accessType;
    }

    if (filters.streamId) {
      where.streamId = filters.streamId;
    }

    if (filters.subjectId) {
      where.subjectId = filters.subjectId;
    }

    if (filters.topicId) {
      where.topicId = filters.topicId;
    }

    if (filters.subtopicId) {
      where.subtopicId = filters.subtopicId;
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { hasSome: [filters.search] } }
      ];
    }

    // Get total count
    const totalItems = await this.prisma.lMSContent.count({ where });
    const totalPages = Math.ceil(totalItems / limit);

    // Get content
    const content = await this.prisma.lMSContent.findMany({
      where,
      include: {
        stream: true,
        subject: true,
        topic: true,
        subtopic: true,
        parent: true,
        _count: {
          select: {
            progress: true,
            children: true,
          }
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit,
    });

    return {
      content,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async deleteContent(id: string) {
    const content = await this.prisma.lMSContent.findUnique({
      where: { id },
      include: {
        children: true,
        _count: {
          select: {
            progress: true,
          }
        }
      }
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (content.children.length > 0) {
      throw new BadRequestException('Cannot delete content with child content. Delete children first.');
    }

    // Delete file from S3 if exists
    if (content.fileUrl) {
      try {
        await this.awsService.deleteFile(content.fileUrl);
      } catch (error) {
        console.error('Error deleting file from S3:', error);
      }
    }

    await this.prisma.lMSContent.delete({
      where: { id }
    });

    return { message: 'Content deleted successfully' };
  }

  async bulkDeleteContent(contentIds: string[]) {
    const contents = await this.prisma.lMSContent.findMany({
      where: { id: { in: contentIds } },
      include: {
        children: true,
      }
    });

    // Check for content with children
    const contentWithChildren = contents.filter((content: any) => content.children.length > 0);
    if (contentWithChildren.length > 0) {
      throw new BadRequestException('Cannot delete content with child content. Delete children first.');
    }

    // Delete files from S3
    const fileUrls = contents.filter((content: any) => content.fileUrl).map((content: any) => content.fileUrl);
    for (const fileUrl of fileUrls) {
      if (fileUrl) {
        try {
          await this.awsService.deleteFile(fileUrl);
        } catch (error) {
          console.error('Error deleting file from S3:', error);
        }
      }
    }

    const result = await this.prisma.lMSContent.deleteMany({
      where: { id: { in: contentIds } }
    });

    return { message: `${result.count} content items deleted successfully` };
  }

  async bulkUpdateStatus(contentIds: string[], status: string) {
    const result = await this.prisma.lMSContent.updateMany({
      where: { id: { in: contentIds } },
      data: { status: status as any }
    });

    return { message: `${result.count} content items updated successfully` };
  }

  async getStats(): Promise<LMSStats> {
    const [
      totalContent,
      byType,
      byStatus,
      byAccess,
      totalViews,
      totalCompletions
    ] = await Promise.all([
      this.prisma.lMSContent.count(),
      this.prisma.lMSContent.groupBy({
        by: ['contentType'],
        _count: { contentType: true }
      }),
      this.prisma.lMSContent.groupBy({
        by: ['status'],
        _count: { status: true }
      }),
      this.prisma.lMSContent.groupBy({
        by: ['accessType'],
        _count: { accessType: true }
      }),
      this.prisma.lMSContent.aggregate({
        _sum: { views: true }
      }),
      this.prisma.lMSContent.aggregate({
        _sum: { completions: true }
      })
    ]);

    return {
      totalContent,
      byType: byType.map((item: any) => ({ type: item.contentType, count: item._count.contentType })),
      byStatus: byStatus.map((item: any) => ({ status: item.status, count: item._count.status })),
      byAccess: byAccess.map((item: any) => ({ access: item.accessType, count: item._count.accessType })),
      totalViews: totalViews._sum.views || 0,
      totalCompletions: totalCompletions._sum.completions || 0,
    };
  }

  async uploadFile(file: Express.Multer.File): Promise<{ url: string; fileName: string; fileSize: number; fileType: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large. Maximum size is 100MB.');
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'text/html',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'audio/mp3',
      'audio/wav',
      'audio/mpeg',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }

    const fileName = `lms-content/${Date.now()}-${file.originalname}`;
    const url = await this.awsService.uploadFile(file, 'lms-content');

    return {
      url,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype
    };
  }

  async getStudentContent(userId: string, filters: LMSContentFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // Get user's subscription info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          include: { plan: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Determine access types based on subscription
    const accessTypes = ['FREE'];
    if (user.subscriptions.length > 0) {
      const plan = user.subscriptions[0].plan;
      if (plan.name === 'PREMIUM') {
        accessTypes.push('SUBSCRIPTION', 'PREMIUM', 'TRIAL');
      } else if (plan.name === 'BASIC') {
        accessTypes.push('SUBSCRIPTION', 'TRIAL');
      }
    }

    // Build where clause
    const where: any = {
      status: 'PUBLISHED',
      accessType: { in: accessTypes }
    };

    if (filters.contentType) {
      where.contentType = filters.contentType;
    }

    if (filters.subjectId) {
      where.subjectId = filters.subjectId;
    }

    if (filters.topicId) {
      where.topicId = filters.topicId;
    }

    if (filters.subtopicId) {
      where.subtopicId = filters.subtopicId;
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags
      };
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { tags: { hasSome: [filters.search] } }
      ];
    }

    // Get total count
    const totalItems = await this.prisma.lMSContent.count({ where });
    const totalPages = Math.ceil(totalItems / limit);

    // Get content with progress
    const content = await this.prisma.lMSContent.findMany({
      where,
      include: {
        stream: true,
        subject: true,
        topic: true,
        subtopic: true,
        progress: {
          where: { userId },
          take: 1
        }
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: limit,
    });

    return {
      content,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async trackProgress(userId: string, contentId: string, progress: number, timeSpent?: number) {
    // Validate content exists
    const content = await this.prisma.lMSContent.findUnique({
      where: { id: contentId }
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    // Determine status based on progress
    let status = 'NOT_STARTED';
    if (progress > 0 && progress < 100) {
      status = 'IN_PROGRESS';
    } else if (progress >= 100) {
      status = 'COMPLETED';
    }

    // Upsert progress record
    const progressRecord = await this.prisma.lMSProgress.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId
        }
      },
      update: {
        progress,
        status: status as any,
        timeSpent: timeSpent ? { increment: timeSpent } : undefined,
        lastAccessedAt: new Date(),
        completedAt: progress >= 100 ? new Date() : undefined,
        attempts: { increment: 1 }
      },
      create: {
      userId,
      contentId,
      progress,
        status: status as any,
        timeSpent: timeSpent || 0,
        startedAt: new Date(),
        lastAccessedAt: new Date(),
        completedAt: progress >= 100 ? new Date() : undefined,
        attempts: 1
      }
    });

    // Update content completion count if completed
    if (progress >= 100 && status === 'COMPLETED') {
      await this.prisma.lMSContent.update({
        where: { id: contentId },
        data: {
          completions: { increment: 1 }
        }
      });
    }

    return progressRecord;
  }

  async getStudentProgress(userId: string) {
    const progress = await this.prisma.lMSProgress.findMany({
      where: { userId },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            contentType: true,
            duration: true,
            difficulty: true,
            subject: {
              select: { name: true }
            },
            topic: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { lastAccessedAt: 'desc' }
    });

    return progress;
  }

  async getContentAnalytics(contentId: string) {
    const content = await this.prisma.lMSContent.findUnique({
      where: { id: contentId },
      include: {
        subject: true,
        topic: true,
        subtopic: true
      }
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    const progress = await this.prisma.lMSProgress.findMany({
      where: { contentId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { lastAccessedAt: 'desc' }
    });

    const stats = {
      totalEnrollments: progress.length,
      completed: progress.filter(p => p.status === 'COMPLETED').length,
      inProgress: progress.filter(p => p.status === 'IN_PROGRESS').length,
      notStarted: progress.filter(p => p.status === 'NOT_STARTED').length,
      averageProgress: progress.length > 0 
        ? progress.reduce((sum, p) => sum + p.progress, 0) / progress.length 
        : 0,
      averageTimeSpent: progress.length > 0 
        ? progress.reduce((sum, p) => sum + p.timeSpent, 0) / progress.length 
        : 0
    };

    return {
      content,
      progress,
      stats
    };
  }

  async duplicateContent(id: string, newTitle?: string) {
    const originalContent = await this.prisma.lMSContent.findUnique({
      where: { id }
    });

    if (!originalContent) {
      throw new NotFoundException('Content not found');
    }

    const duplicatedContent = await this.prisma.lMSContent.create({
      data: {
        title: newTitle || `${originalContent.title} (Copy)`,
        description: originalContent.description,
        contentType: originalContent.contentType,
        status: 'DRAFT', // Always start as draft
        accessType: originalContent.accessType,
        streamId: originalContent.streamId,
        subjectId: originalContent.subjectId,
        topicId: originalContent.topicId,
        subtopicId: originalContent.subtopicId,
        isDripContent: originalContent.isDripContent,
        dripDelay: originalContent.dripDelay,
        dripDate: originalContent.dripDate,
        duration: originalContent.duration,
        difficulty: originalContent.difficulty,
        tags: originalContent.tags,
        contentData: originalContent.contentData as any,
        fileUrl: originalContent.fileUrl, // Note: This shares the same file
        externalUrl: originalContent.externalUrl,
        iframeCode: originalContent.iframeCode,
        youtubeId: originalContent.youtubeId,
        youtubeUrl: originalContent.youtubeUrl,
        h5pContent: originalContent.h5pContent as any,
        scormData: originalContent.scormData as any,
        parentId: originalContent.parentId,
        order: originalContent.order,
      },
      include: {
        stream: true,
        subject: true,
        topic: true,
        subtopic: true,
        parent: true
      }
    });

    return duplicatedContent;
  }

  async getStreams() {
    return await this.prisma.stream.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
  }
}






