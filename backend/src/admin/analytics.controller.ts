import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminAnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminAnalyticsController {
  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  @Get('dashboard')
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('user-growth')
  async getUserGrowthData(@Query('days') days?: string) {
    const daysNumber = days ? parseInt(days) : 30;
    return this.analyticsService.getUserGrowthData(daysNumber);
  }

  @Get('lessons')
  async getLessonAnalytics() {
    return this.analyticsService.getLessonAnalytics();
  }

  @Get('subjects')
  async getSubjectPerformanceData() {
    return this.analyticsService.getSubjectPerformanceData();
  }

  @Get('badges')
  async getBadgeAnalytics() {
    return this.analyticsService.getBadgeAnalytics();
  }

  @Get('top-performers')
  async getTopPerformers(@Query('limit') limit?: string) {
    const limitNumber = limit ? parseInt(limit) : 10;
    return this.analyticsService.getTopPerformers(limitNumber);
  }

  @Get('engagement')
  async getEngagementMetrics() {
    return this.analyticsService.getEngagementMetrics();
  }

  @Get('content-performance')
  async getContentPerformanceMetrics() {
    return this.analyticsService.getContentPerformanceMetrics();
  }
}