import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
  Body,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../types/prisma.types';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.STUDENT)
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post(':questionId')
  async createBookmark(
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    return this.bookmarksService.createBookmark(req.user.id, questionId);
  }

  @Delete(':questionId')
  async removeBookmark(
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    return this.bookmarksService.removeBookmark(req.user.id, questionId);
  }

  @Get()
  async getUserBookmarks(
    @Request() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.bookmarksService.getUserBookmarks(req.user.id, page, limit);
  }

  @Get('status/:questionId')
  async isBookmarked(
    @Param('questionId') questionId: string,
    @Request() req: any,
  ) {
    const isBookmarked = await this.bookmarksService.isBookmarked(
      req.user.id,
      questionId,
    );
    return { questionId, isBookmarked };
  }

  @Post('status/batch')
  async getBookmarkStatus(
    @Body() body: { questionIds: string[] },
    @Request() req: any,
  ) {
    return this.bookmarksService.getBookmarkStatus(
      req.user.id,
      body.questionIds,
    );
  }

  @Get('subject/:subjectId')
  async getBookmarksBySubject(
    @Param('subjectId') subjectId: string,
    @Request() req: any,
  ) {
    return this.bookmarksService.getBookmarksBySubject(req.user.id, subjectId);
  }

  @Get('topic/:topicId')
  async getBookmarksByTopic(
    @Param('topicId') topicId: string,
    @Request() req: any,
  ) {
    return this.bookmarksService.getBookmarksByTopic(req.user.id, topicId);
  }
}
