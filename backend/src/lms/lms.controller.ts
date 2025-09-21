import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseInterceptors, UploadedFile, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { LMSService, CreateLMSContentDto, UpdateLMSContentDto, LMSContentFilters } from './lms.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/lms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class LMSController {
  constructor(private readonly lmsService: LMSService) {}

  @Post('content')
  async createContent(@Body() data: CreateLMSContentDto) {
    return this.lmsService.createContent(data);
  }

  @Get('content')
  async getContentList(@Query() filters: LMSContentFilters) {
    return this.lmsService.getContentList(filters);
  }

  @Get('content/:id')
  async getContent(@Param('id') id: string) {
    return this.lmsService.getContent(id);
  }

  @Put('content/:id')
  async updateContent(@Param('id') id: string, @Body() data: UpdateLMSContentDto) {
    return this.lmsService.updateContent(id, data);
  }

  @Delete('content/:id')
  async deleteContent(@Param('id') id: string) {
    return this.lmsService.deleteContent(id);
  }

  @Delete('content/bulk')
  async bulkDeleteContent(@Body() body: { contentIds: string[] }) {
    return this.lmsService.bulkDeleteContent(body.contentIds);
  }

  @Put('content/bulk/status')
  async bulkUpdateStatus(@Body() body: { contentIds: string[]; status: string }) {
    return this.lmsService.bulkUpdateStatus(body.contentIds, body.status);
  }

  @Post('content/:id/duplicate')
  async duplicateContent(@Param('id') id: string, @Body() body?: { newTitle?: string }) {
    return this.lmsService.duplicateContent(id, body?.newTitle);
  }

  @Get('stats')
  async getStats() {
    return this.lmsService.getStats();
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.lmsService.uploadFile(file);
  }

  @Get('content/:id/analytics')
  async getContentAnalytics(@Param('id') id: string) {
    return this.lmsService.getContentAnalytics(id);
  }

  @Get('streams')
  async getStreams() {
    return this.lmsService.getStreams();
  }

  @Get('subjects')
  async getSubjects() {
    return this.lmsService['prisma'].subject.findMany({
      select: {
        id: true,
        name: true,
        streamId: true,
        stream: {
          select: {
            id: true,
            name: true,
            code: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  @Get('subjects/:subjectId/topics')
  async getTopics(@Param('subjectId') subjectId: string) {
    return this.lmsService['prisma'].topic.findMany({
      where: { subjectId },
      select: {
        id: true,
        name: true,
        description: true
      },
      orderBy: { name: 'asc' }
    });
  }

  @Get('topics/:topicId/subtopics')
  async getSubtopics(@Param('topicId') topicId: string) {
    return this.lmsService['prisma'].subtopic.findMany({
      where: { topicId },
      select: {
        id: true,
        name: true,
        description: true
      },
      orderBy: { name: 'asc' }
    });
  }

  // Lesson management endpoints
  @Post('lessons')
  async createLesson(@Body() data: { name: string; description?: string; subjectId: string; order?: number }) {
    return this.lmsService.createLesson(data);
  }

  @Get('lessons/:lessonId')
  async getLesson(@Param('lessonId') lessonId: string) {
    return this.lmsService.getLessonWithContent(lessonId);
  }

  @Put('lessons/:lessonId')
  async updateLesson(@Param('lessonId') lessonId: string, @Body() data: { name?: string; description?: string; order?: number; isActive?: boolean }) {
    return this.lmsService.updateLesson(lessonId, data);
  }

  @Delete('lessons/:lessonId')
  async deleteLesson(@Param('lessonId') lessonId: string) {
    return this.lmsService.deleteLesson(lessonId);
  }

  @Get('subjects/:subjectId/lessons')
  async getLessons(@Param('subjectId') subjectId: string) {
    return this.lmsService.getLessonsBySubject(subjectId);
  }

  @Get('lessons/:lessonId/topics')
  async getLessonTopics(@Param('lessonId') lessonId: string) {
    return this.lmsService['prisma'].topic.findMany({
      where: { lessonId },
      select: {
        id: true,
        name: true,
        description: true,
        order: true
      },
      orderBy: { order: 'asc' }
    });
  }
}

@Controller('student/lms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class StudentLMSController {
  constructor(private readonly lmsService: LMSService) {}

  @Get('content')
  async getStudentContent(@Request() req: any, @Query() filters: LMSContentFilters) {
    return this.lmsService.getStudentContent(req.user.id, filters);
  }

  @Get('content/:id')
  async getStudentContentById(@Request() req: any, @Param('id') id: string) {
    const content = await this.lmsService.getContent(id);
    
    // Check if user has access to this content
    const user = await this.lmsService['prisma'].user.findUnique({
      where: { id: req.user.id },
      include: { subscriptions: { include: { plan: true } } },
    });

    const accessTypes = ['FREE'];
    if (user && user.subscriptions && user.subscriptions.length > 0) {
      if (user.subscriptions[0].plan.name === 'PREMIUM') {
        accessTypes.push('SUBSCRIPTION', 'PREMIUM', 'TRIAL');
      } else if (user.subscriptions[0].plan.name === 'BASIC') {
        accessTypes.push('SUBSCRIPTION', 'TRIAL');
      }
    }

    if (!accessTypes.includes(content.accessType)) {
      throw new Error('Access denied. Upgrade your subscription to access this content.');
    }

    return content;
  }

  @Post('content/:id/progress')
  async trackProgress(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { progress: number }
  ) {
    return this.lmsService.trackProgress(req.user.id, id, body.progress);
  }

  @Get('progress')
  async getStudentProgress(@Request() req: any) {
    return this.lmsService.getStudentProgress(req.user.id);
  }
}
