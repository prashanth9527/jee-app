import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { CreateBlogDto, UpdateBlogDto, BlogFilters, CreateBlogCategoryDto, UpdateBlogCategoryDto } from './dto/blog.dto';

@Injectable()
export class BlogsService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  // ========================================
  // BLOG CATEGORIES
  // ========================================

  async createCategory(data: CreateBlogCategoryDto) {
    // Generate slug from name
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    return await this.prisma.blogCategory.create({
      data: {
        ...data,
        slug,
      },
      include: {
        _count: {
          select: {
            blogs: true,
          },
        },
      },
    });
  }

  async getCategories() {
    return await this.prisma.blogCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            blogs: true,
          },
        },
      },
    });
  }

  async getCategory(id: string) {
    const category = await this.prisma.blogCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            blogs: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Blog category not found');
    }

    return category;
  }

  async updateCategory(id: string, data: UpdateBlogCategoryDto) {
    const existingCategory = await this.prisma.blogCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new NotFoundException('Blog category not found');
    }

    // Generate slug if name is being updated
    let updateData: any = { ...data };
    if (data.name) {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      updateData.slug = slug;
    }

    return await this.prisma.blogCategory.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            blogs: true,
          },
        },
      },
    });
  }

  async deleteCategory(id: string) {
    // Check if category has blogs
    const blogCount = await this.prisma.blog.count({
      where: { categoryId: id },
    });

    if (blogCount > 0) {
      throw new BadRequestException('Cannot delete category with existing blogs');
    }

    return await this.prisma.blogCategory.delete({
      where: { id },
    });
  }

  // ========================================
  // BLOGS
  // ========================================

  async createBlog(data: CreateBlogDto, authorId: string) {
    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if slug already exists
    const existingBlog = await this.prisma.blog.findUnique({
      where: { slug },
    });

    if (existingBlog) {
      throw new BadRequestException('A blog with this title already exists');
    }

    // Validate category exists
    const category = await this.prisma.blogCategory.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new BadRequestException('Blog category not found');
    }

    // Set publishedAt if status is PUBLISHED
    const publishedAt = data.status === 'PUBLISHED' ? new Date() : null;

    // Convert metaKeywords array to string if provided
    const blogData: any = {
      ...data,
      slug,
      authorId,
      publishedAt,
    };

    if (data.metaKeywords) {
      blogData.metaKeywords = Array.isArray(data.metaKeywords) 
        ? data.metaKeywords.join(', ') 
        : data.metaKeywords;
    }

    return await this.prisma.blog.create({
      data: blogData,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
          },
        },
        category: true,
        stream: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            bookmarks: true,
          },
        },
      },
    });
  }

  async getBlogs(filters: BlogFilters) {
    const page = parseInt(filters.page?.toString() || '1');
    const limit = parseInt(filters.limit?.toString() || '10');
    const skip = (page - 1) * limit;

    const where: any = {};

    // Status filter
    if (filters.status) {
      where.status = filters.status;
    }

    // Category filter - support both ID and slug
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    } else if (filters.category) {
      // Find category by slug
      const category = await this.prisma.blogCategory.findFirst({
        where: { slug: filters.category },
        select: { id: true }
      });
      if (category) {
        where.categoryId = category.id;
      } else {
        // If category not found, return empty results
        where.categoryId = 'non-existent-id';
      }
    }

    // Stream filter - support both ID and code
    if (filters.streamId) {
      where.streamId = filters.streamId;
    } else if (filters.stream) {
      // Find stream by code
      const stream = await this.prisma.stream.findFirst({
        where: { code: filters.stream },
        select: { id: true }
      });
      if (stream) {
        where.streamId = stream.id;
      } else {
        // If stream not found, return empty results
        where.streamId = 'non-existent-id';
      }
    }

    // Subject filter
    if (filters.subjectId) {
      where.subjectId = filters.subjectId;
    }

    // Author filter
    if (filters.authorId) {
      where.authorId = filters.authorId;
    }

    // Search filter
    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { excerpt: { contains: filters.search, mode: 'insensitive' } },
        { content: { contains: filters.search, mode: 'insensitive' } },
        { tags: { has: filters.search } },
      ];
    }

    // Featured filter
    if (filters.featured !== undefined) {
      // Convert string to boolean if needed
      const featuredValue = typeof filters.featured === 'string' 
        ? filters.featured === 'true' 
        : filters.featured;
      where.featured = featuredValue;
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo);
      }
    }

    const [blogs, total] = await Promise.all([
      this.prisma.blog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
              profilePicture: true,
            },
          },
          category: true,
          stream: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          subject: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              comments: true,
              likes: true,
              bookmarks: true,
            },
          },
        },
      }),
      this.prisma.blog.count({ where }),
    ]);

    return {
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getBlog(id: string) {
    const blog = await this.prisma.blog.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
          },
        },
        category: true,
        stream: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          where: { status: 'APPROVED' },
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                profilePicture: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return blog;
  }

  async getBlogBySlug(slug: string) {
    const blog = await this.prisma.blog.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
          },
        },
        category: true,
        stream: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          where: { status: 'APPROVED' },
          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                profilePicture: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            bookmarks: true,
          },
        },
      },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    // Get related blogs (same category or stream, excluding current blog)
    const relatedBlogs = await this.prisma.blog.findMany({
      where: {
        AND: [
          { id: { not: blog.id } },
          { status: 'PUBLISHED' },
          {
            OR: [
              ...(blog.categoryId ? [{ categoryId: blog.categoryId }] : []),
              ...(blog.streamId ? [{ streamId: blog.streamId }] : []),
            ],
          },
        ],
      },
      take: 3,
      orderBy: { publishedAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Increment view count
    await this.prisma.blog.update({
      where: { id: blog.id },
      data: { viewCount: { increment: 1 } },
    });

    return {
      blog,
      relatedBlogs,
    };
  }

  async updateBlog(id: string, data: UpdateBlogDto, userId: string) {
    const existingBlog = await this.prisma.blog.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!existingBlog) {
      throw new NotFoundException('Blog not found');
    }

    // Check if user is the author or admin
    if (existingBlog.authorId !== userId) {
      throw new BadRequestException('You can only edit your own blogs');
    }

    // Generate slug if title is being updated
    let updateData: any = { ...data };
    if (data.title && data.title !== existingBlog.title) {
      const slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Check if new slug already exists
      const existingSlug = await this.prisma.blog.findUnique({
        where: { slug },
      });

      if (existingSlug && existingSlug.id !== id) {
        throw new BadRequestException('A blog with this title already exists');
      }

      updateData.slug = slug;
    }

    // Handle status changes
    if (data.status === 'PUBLISHED' && existingBlog.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date();
    }

    // Convert metaKeywords array to string if provided
    if (data.metaKeywords) {
      updateData.metaKeywords = Array.isArray(data.metaKeywords) 
        ? data.metaKeywords.join(', ') 
        : data.metaKeywords;
    }

    return await this.prisma.blog.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profilePicture: true,
          },
        },
        category: true,
        stream: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            bookmarks: true,
          },
        },
      },
    });
  }

  async deleteBlog(id: string, userId: string) {
    const existingBlog = await this.prisma.blog.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!existingBlog) {
      throw new NotFoundException('Blog not found');
    }

    // Check if user is the author or admin
    if (existingBlog.authorId !== userId) {
      throw new BadRequestException('You can only delete your own blogs');
    }

    return await this.prisma.blog.delete({
      where: { id },
    });
  }

  // ========================================
  // BLOG INTERACTIONS
  // ========================================

  async likeBlog(blogId: string, userId: string) {
    // Check if blog exists
    const blog = await this.prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    // Check if user already liked
    const existingLike = await this.prisma.blogLike.findUnique({
      where: {
        userId_blogId: {
          userId,
          blogId,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await this.prisma.blogLike.delete({
        where: { id: existingLike.id },
      });

      // Decrement like count
      await this.prisma.blog.update({
        where: { id: blogId },
        data: { likeCount: { decrement: 1 } },
      });

      return { liked: false };
    } else {
      // Like
      await this.prisma.blogLike.create({
        data: {
          userId,
          blogId,
        },
      });

      // Increment like count
      await this.prisma.blog.update({
        where: { id: blogId },
        data: { likeCount: { increment: 1 } },
      });

      return { liked: true };
    }
  }

  async bookmarkBlog(blogId: string, userId: string) {
    // Check if blog exists
    const blog = await this.prisma.blog.findUnique({
      where: { id: blogId },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    // Check if user already bookmarked
    const existingBookmark = await this.prisma.blogBookmark.findUnique({
      where: {
        userId_blogId: {
          userId,
          blogId,
        },
      },
    });

    if (existingBookmark) {
      // Remove bookmark
      await this.prisma.blogBookmark.delete({
        where: { id: existingBookmark.id },
      });

      return { bookmarked: false };
    } else {
      // Add bookmark
      await this.prisma.blogBookmark.create({
        data: {
          userId,
          blogId,
        },
      });

      return { bookmarked: true };
    }
  }

  // ========================================
  // BLOG ANALYTICS
  // ========================================

  async getBlogStats() {
    const [
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalViews,
      totalLikes,
      totalComments,
      recentBlogs,
      popularBlogs,
    ] = await Promise.all([
      this.prisma.blog.count(),
      this.prisma.blog.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.blog.count({ where: { status: 'DRAFT' } }),
      this.prisma.blog.aggregate({
        _sum: { viewCount: true },
      }),
      this.prisma.blog.aggregate({
        _sum: { likeCount: true },
      }),
      this.prisma.blogComment.count(),
      this.prisma.blog.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              fullName: true,
            },
          },
          category: true,
        },
      }),
      this.prisma.blog.findMany({
        take: 5,
        orderBy: { viewCount: 'desc' },
        include: {
          author: {
            select: {
              fullName: true,
            },
          },
          category: true,
        },
      }),
    ]);

    return {
      totalBlogs,
      publishedBlogs,
      draftBlogs,
      totalViews: totalViews._sum.viewCount || 0,
      totalLikes: totalLikes._sum.likeCount || 0,
      totalComments,
      recentBlogs,
      popularBlogs,
    };
  }

  async getBlogAnalytics(blogId: string) {
    const blog = await this.prisma.blog.findUnique({
      where: { id: blogId },
      include: {
        comments: {
          include: {
            author: {
              select: {
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        likes: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        bookmarks: {
          include: {
            user: {
              select: {
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!blog) {
      throw new NotFoundException('Blog not found');
    }

    return {
      blog,
      analytics: {
        views: blog.viewCount,
        likes: blog.likeCount,
        shares: blog.shareCount,
        comments: blog.comments.length,
        bookmarks: blog.bookmarks.length,
      },
    };
  }

  // ========================================
  // AI BLOG GENERATION
  // ========================================

  private async ensureDefaultCategory(): Promise<string> {
    // Find or create a default category
    let defaultCategory = await this.prisma.blogCategory.findFirst({
      where: { name: 'General' }
    });
    
    if (!defaultCategory) {
      defaultCategory = await this.prisma.blogCategory.create({
        data: {
          name: 'General',
          slug: 'general',
          description: 'General blog posts',
          color: '#6B7280',
          icon: '📝'
        }
      });
    }
    return defaultCategory.id;
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    // Generate base slug from title
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');

    let slug = baseSlug;
    let counter = 1;

    // Check if slug exists and increment counter until we find a unique one
    while (true) {
      const existingBlog = await this.prisma.blog.findUnique({
        where: { slug }
      });

      if (!existingBlog) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async generateBlogFromNews(topic: string, authorId: string, streamId?: string, categoryId?: string) {
    try {
      // Ensure we have a valid authorId
      if (!authorId) {
        // Find the first admin user as fallback
        const adminUser = await this.prisma.user.findFirst({
          where: { role: 'ADMIN' }
        });
        if (adminUser) {
          authorId = adminUser.id;
        } else {
          throw new Error('No admin user found to assign as author');
        }
      }

      // Get stream and category information
      const stream = streamId ? await this.prisma.stream.findUnique({ where: { id: streamId } }) : null;
      const category = categoryId ? await this.prisma.blogCategory.findUnique({ where: { id: categoryId } }) : null;

      const streamCode = stream?.code || 'JEE';
      const categoryName = category?.name || 'Study Tips';

      // Generate blog content using AI
      const generatedContent = await this.aiService.generateBlogFromNews(topic, streamCode);

      // Create blog with generated content
      const blogData: any = {
        title: generatedContent.title || `${topic} - Latest Updates for ${streamCode} Aspirants`,
        excerpt: generatedContent.excerpt || `Stay updated with the latest developments in ${topic} for ${streamCode} preparation.`,
        content: generatedContent.content || `<h1>${topic}</h1><p>Content generation in progress...</p>`,
        authorId,
        tags: generatedContent.tags || [topic, streamCode, 'Latest Updates'],
        metaTitle: generatedContent.metaTitle || generatedContent.title,
        metaDescription: generatedContent.metaDescription || generatedContent.excerpt,
        metaKeywords: generatedContent.metaKeywords || generatedContent.tags?.join(', '),
        status: 'DRAFT' as any, // Save as draft for review
      };

      // Only add categoryId and streamId if they exist
      if (categoryId) {
        blogData.categoryId = categoryId;
      }
      if (streamId) {
        blogData.streamId = streamId;
      }

      // Generate slug
      const slug = blogData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      console.log('Creating blog with data:', {
        ...blogData,
        slug,
        authorId,
        categoryId,
        streamId
      });

      return await this.prisma.blog.create({
        data: {
          ...blogData,
          slug,
        },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          category: true,
          stream: true,
        },
      });
    } catch (error) {
      console.error('Error generating blog from news:', error);
      throw new BadRequestException(`Failed to generate blog: ${error.message}`);
    }
  }

  async generateBlogFromTopic(topic: string, authorId: string, streamId?: string, categoryId?: string) {
    try {
      // Ensure we have a valid authorId
      if (!authorId) {
        // Find the first admin user as fallback
        const adminUser = await this.prisma.user.findFirst({
          where: { role: 'ADMIN' }
        });
        if (adminUser) {
          authorId = adminUser.id;
        } else {
          throw new Error('No admin user found to assign as author');
        }
      }

      // Get stream and category information
      const stream = streamId ? await this.prisma.stream.findUnique({ where: { id: streamId } }) : null;
      const category = categoryId ? await this.prisma.blogCategory.findUnique({ where: { id: categoryId } }) : null;

      const streamCode = stream?.code || 'JEE';
      const categoryName = category?.name || 'Study Tips';

      // Generate blog content using AI
      const generatedContent = await this.aiService.generateBlogFromTopic(topic, streamCode, categoryName);

      // Create blog with generated content
      const blogData: any = {
        title: generatedContent.title || `${topic} - Complete Guide for ${streamCode} Aspirants`,
        excerpt: generatedContent.excerpt || `Learn everything about ${topic} for ${streamCode} preparation.`,
        content: generatedContent.content || `<h1>${topic}</h1><p>Content generation in progress...</p>`,
        authorId,
        tags: generatedContent.tags || [topic, streamCode, categoryName],
        metaTitle: generatedContent.metaTitle || generatedContent.title,
        metaDescription: generatedContent.metaDescription || generatedContent.excerpt,
        metaKeywords: generatedContent.metaKeywords || generatedContent.tags?.join(', '),
        status: 'DRAFT' as any, // Save as draft for review
      };

      // Only add categoryId and streamId if they exist
      if (categoryId) {
        blogData.categoryId = categoryId;
      }
      if (streamId) {
        blogData.streamId = streamId;
      }

      // Generate slug
      const slug = blogData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      return await this.prisma.blog.create({
        data: {
          ...blogData,
          slug,
        },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          category: true,
          stream: true,
        },
      });
    } catch (error) {
      console.error('Error generating blog from topic:', error);
      throw new BadRequestException(`Failed to generate blog: ${error.message}`);
    }
  }

  async generateBlogFromKeywords(keywords: string[], authorId: string, streamId?: string, categoryId?: string) {
    try {
      // Ensure we have a valid authorId
      if (!authorId) {
        // Find the first admin user as fallback
        const adminUser = await this.prisma.user.findFirst({
          where: { role: 'ADMIN' }
        });
        if (adminUser) {
          authorId = adminUser.id;
        } else {
          throw new Error('No admin user found to assign as author');
        }
      }

      // Get stream and category information
      const stream = streamId ? await this.prisma.stream.findUnique({ where: { id: streamId } }) : null;
      const category = categoryId ? await this.prisma.blogCategory.findUnique({ where: { id: categoryId } }) : null;

      const streamCode = stream?.code || 'JEE';
      const categoryName = category?.name || 'Study Tips';

      // Generate blog content using AI
      const generatedContent = await this.aiService.generateBlogFromKeywords(keywords, streamCode);

      // Create blog with generated content
      const blogData: any = {
        title: generatedContent.title || `${keywords.join(', ')} - Essential Guide for ${streamCode} Aspirants`,
        excerpt: generatedContent.excerpt || `Comprehensive guide covering ${keywords.join(', ')} for ${streamCode} preparation.`,
        content: generatedContent.content || `<h1>${keywords.join(', ')}</h1><p>Content generation in progress...</p>`,
        authorId,
        tags: generatedContent.tags || [...keywords, streamCode],
        metaTitle: generatedContent.metaTitle || generatedContent.title,
        metaDescription: generatedContent.metaDescription || generatedContent.excerpt,
        metaKeywords: generatedContent.metaKeywords || generatedContent.tags?.join(', '),
        status: 'DRAFT' as any, // Save as draft for review
      };

      // Only add categoryId and streamId if they exist
      if (categoryId) {
        blogData.categoryId = categoryId;
      }
      if (streamId) {
        blogData.streamId = streamId;
      }

      // Generate slug
      const slug = blogData.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim('-');

      return await this.prisma.blog.create({
        data: {
          ...blogData,
          slug,
        },
        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          category: true,
          stream: true,
        },
      });
    } catch (error) {
      console.error('Error generating blog from keywords:', error);
      throw new BadRequestException(`Failed to generate blog: ${error.message}`);
    }
  }

  async generateBlogTitles(topic: string, streamId?: string) {
    try {
      const stream = streamId ? await this.prisma.stream.findUnique({ where: { id: streamId } }) : null;
      const streamCode = stream?.code || 'JEE';

      return await this.aiService.generateBlogTitle(topic, streamCode);
    } catch (error) {
      console.error('Error generating blog titles:', error);
      throw new BadRequestException(`Failed to generate blog titles: ${error.message}`);
    }
  }

  async generateBlogOutline(topic: string, streamId?: string) {
    try {
      const stream = streamId ? await this.prisma.stream.findUnique({ where: { id: streamId } }) : null;
      const streamCode = stream?.code || 'JEE';

      return await this.aiService.generateBlogOutline(topic, streamCode);
    } catch (error) {
      console.error('Error generating blog outline:', error);
      throw new BadRequestException(`Failed to generate blog outline: ${error.message}`);
    }
  }
}
