import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { LessonProgressService, LessonProgressData } from './lesson-progress.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('student/lesson-progress')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class StudentLessonProgressController {
  constructor(private readonly lessonProgressService: LessonProgressService) {}

  @Post(':lessonId/initialize')
  async initializeProgress(@Request() req: any, @Param('lessonId') lessonId: string) {
    return this.lessonProgressService.initializeLessonProgress(req.user.id, lessonId);
  }

  @Put(':lessonId/update')
  async updateProgress(
    @Request() req: any, 
    @Param('lessonId') lessonId: string,
    @Body() data: Omit<LessonProgressData, 'userId' | 'lessonId'>
  ) {
    return this.lessonProgressService.updateLessonProgress({
      userId: req.user.id,
      lessonId,
      ...data
    });
  }

  @Get(':lessonId')
  async getLessonProgress(@Request() req: any, @Param('lessonId') lessonId: string) {
    return this.lessonProgressService.getLessonProgress(req.user.id, lessonId);
  }

  @Get()
  async getUserProgress(@Request() req: any, @Query('subjectId') subjectId?: string) {
    return this.lessonProgressService.getUserLessonProgress(req.user.id, subjectId);
  }

  @Get('badges/earned')
  async getUserBadges(@Request() req: any) {
    return this.lessonProgressService.getUserBadges(req.user.id);
  }

  @Get('leaderboard')
  async getLeaderboard(
    @Request() req: any,
    @Query('subjectId') subjectId?: string,
    @Query('limit') limit?: string
  ) {
    return this.lessonProgressService.getLeaderboard(subjectId, limit ? parseInt(limit) : 50);
  }

  @Get(':lessonId/top-performers')
  async getTopPerformers(
    @Request() req: any,
    @Param('lessonId') lessonId: string,
    @Query('limit') limit?: string
  ) {
    return this.lessonProgressService.getTopPerformers(lessonId, limit ? parseInt(limit) : 10);
  }
}

@Controller('admin/lesson-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminLessonAnalyticsController {
  constructor(private readonly lessonProgressService: LessonProgressService) {}

  @Get('lesson/:lessonId')
  async getLessonAnalytics(@Param('lessonId') lessonId: string) {
    return this.lessonProgressService.getLessonAnalytics(lessonId);
  }

  @Get('subject/:subjectId')
  async getSubjectAnalytics(@Param('subjectId') subjectId: string) {
    return this.lessonProgressService.getSubjectAnalytics(subjectId);
  }

  @Get('lesson/:lessonId/top-performers')
  async getTopPerformers(
    @Param('lessonId') lessonId: string,
    @Query('limit') limit?: string
  ) {
    return this.lessonProgressService.getTopPerformers(lessonId, limit ? parseInt(limit) : 10);
  }

  @Get('leaderboard')
  async getGlobalLeaderboard(
    @Query('subjectId') subjectId?: string,
    @Query('limit') limit?: string
  ) {
    return this.lessonProgressService.getLeaderboard(subjectId, limit ? parseInt(limit) : 50);
  }

  @Get('user/:userId/progress')
  async getUserProgress(@Param('userId') userId: string, @Query('subjectId') subjectId?: string) {
    return this.lessonProgressService.getUserLessonProgress(userId, subjectId);
  }

  @Get('user/:userId/badges')
  async getUserBadges(@Param('userId') userId: string) {
    return this.lessonProgressService.getUserBadges(userId);
  }
}



