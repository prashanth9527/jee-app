import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BlogsService } from './blogs.service';
import { CreateBlogDto, UpdateBlogDto, BlogFilters, CreateBlogCategoryDto, UpdateBlogCategoryDto } from './dto/blog.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { FileUploadService } from '../file-upload/file-upload.service';

@Controller('admin/blogs')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BlogsController {
  constructor(
    private readonly blogsService: BlogsService,
    private readonly fileUploadService: FileUploadService
  ) {}

  // ========================================
  // BLOG CATEGORIES
  // ========================================

  @Post('categories')
  @Roles('ADMIN')
  async createCategory(@Body() createCategoryDto: CreateBlogCategoryDto) {
    return this.blogsService.createCategory(createCategoryDto);
  }

  @Get('categories')
  async getCategories() {
    return this.blogsService.getCategories();
  }

  @Get('categories/:id')
  async getCategory(@Param('id') id: string) {
    return this.blogsService.getCategory(id);
  }

  @Put('categories/:id')
  @Roles('ADMIN')
  async updateCategory(@Param('id') id: string, @Body() updateCategoryDto: UpdateBlogCategoryDto) {
    return this.blogsService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  @Roles('ADMIN')
  async deleteCategory(@Param('id') id: string) {
    return this.blogsService.deleteCategory(id);
  }

  // ========================================
  // BLOGS
  // ========================================

  @Post()
  @Roles('ADMIN')
  async createBlog(@Body() createBlogDto: CreateBlogDto, @Request() req: any) {
    return this.blogsService.createBlog(createBlogDto, req.user.id);
  }

  @Get()
  async getBlogs(@Query() filters: BlogFilters) {
    return this.blogsService.getBlogs(filters);
  }

  @Get('stats')
  @Roles('ADMIN')
  async getBlogStats() {
    return this.blogsService.getBlogStats();
  }

  @Get(':id')
  async getBlog(@Param('id') id: string) {
    return this.blogsService.getBlog(id);
  }

  @Get('slug/:slug')
  async getBlogBySlug(@Param('slug') slug: string) {
    return this.blogsService.getBlogBySlug(slug);
  }

  @Put(':id')
  @Roles('ADMIN')
  async updateBlog(@Param('id') id: string, @Body() updateBlogDto: UpdateBlogDto, @Request() req: any) {
    return this.blogsService.updateBlog(id, updateBlogDto, req.user.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  async deleteBlog(@Param('id') id: string, @Request() req: any) {
    return this.blogsService.deleteBlog(id, req.user.id);
  }

  @Get(':id/analytics')
  @Roles('ADMIN')
  async getBlogAnalytics(@Param('id') id: string) {
    return this.blogsService.getBlogAnalytics(id);
  }

  // ========================================
  // BLOG INTERACTIONS
  // ========================================

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  async likeBlog(@Param('id') id: string, @Request() req: any) {
    return this.blogsService.likeBlog(id, req.user.id);
  }

  @Post(':id/bookmark')
  @UseGuards(JwtAuthGuard)
  async bookmarkBlog(@Param('id') id: string, @Request() req: any) {
    return this.blogsService.bookmarkBlog(id, req.user.id);
  }

  // ========================================
  // AI BLOG GENERATION
  // ========================================

  @Post('generate/from-news')
  @Roles('ADMIN')
  async generateBlogFromNews(
    @Body() body: { topic: string; streamId?: string; categoryId?: string },
    @Request() req: any
  ) {
    return this.blogsService.generateBlogFromNews(
      body.topic,
      req.user.id,
      body.streamId,
      body.categoryId
    );
  }

  @Post('generate/from-topic')
  @Roles('ADMIN')
  async generateBlogFromTopic(
    @Body() body: { topic: string; streamId?: string; categoryId?: string },
    @Request() req: any
  ) {
    return this.blogsService.generateBlogFromTopic(
      body.topic,
      req.user.id,
      body.streamId,
      body.categoryId
    );
  }

  @Post('generate/from-keywords')
  @Roles('ADMIN')
  async generateBlogFromKeywords(
    @Body() body: { keywords: string[]; streamId?: string; categoryId?: string },
    @Request() req: any
  ) {
    return this.blogsService.generateBlogFromKeywords(
      body.keywords,
      req.user.id,
      body.streamId,
      body.categoryId
    );
  }

  @Post('generate/titles')
  @Roles('ADMIN')
  async generateBlogTitles(@Body() body: { topic: string; streamId?: string }) {
    return this.blogsService.generateBlogTitles(body.topic, body.streamId);
  }

  @Post('generate/outline')
  @Roles('ADMIN')
  async generateBlogOutline(@Body() body: { topic: string; streamId?: string }) {
    return this.blogsService.generateBlogOutline(body.topic, body.streamId);
  }

  // ========================================
  // IMAGE UPLOAD
  // ========================================

  @Post('upload-image')
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit.');
    }

    try {
      const imageUrl = await this.fileUploadService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        'blog-images'
      );

      return {
        success: true,
        url: imageUrl,
        message: 'Image uploaded successfully'
      };
    } catch (error) {
      throw new BadRequestException('Failed to upload image: ' + error.message);
    }
  }
}

// Public blog endpoints (no authentication required)
@Controller('blogs')
export class PublicBlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  async getPublicBlogs(@Query() filters: BlogFilters) {
    // Only return published blogs for public access
    const publicFilters = { ...filters, status: 'PUBLISHED' as any };
    return this.blogsService.getBlogs(publicFilters);
  }

  @Get('categories')
  async getPublicCategories() {
    return this.blogsService.getCategories();
  }

  @Get('slug/:slug')
  async getPublicBlogBySlug(@Param('slug') slug: string) {
    return this.blogsService.getBlogBySlug(slug);
  }

  @Get('category/:categoryId')
  async getBlogsByCategory(@Param('categoryId') categoryId: string, @Query() filters: BlogFilters) {
    const categoryFilters = { ...filters, categoryId, status: 'PUBLISHED' as any };
    return this.blogsService.getBlogs(categoryFilters);
  }

  @Get('stream/:streamId')
  async getBlogsByStream(@Param('streamId') streamId: string, @Query() filters: BlogFilters) {
    const streamFilters = { ...filters, streamId, status: 'PUBLISHED' as any };
    return this.blogsService.getBlogs(streamFilters);
  }
}
