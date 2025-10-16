import { Controller, Get, Post, Put, Param, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('student/lms')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STUDENT')
export class StudentLMSController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('hierarchy')
  async getLearningHierarchy(@Req() req: any) {
    const userId = req.user.id;
    
    // Get user's stream
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streamId: true }
    });

    if (!user?.streamId) {
      throw new ForbiddenException('No stream assigned to user');
    }

    // Get subjects with progress
    const subjects = await this.prisma.subject.findMany({
      where: {
        streamId: user.streamId,
        lmsContent: {
          some: { status: 'PUBLISHED' }
        }
      },
      include: {
        lessons: {
          where: {
            lmsContent: {
              some: { status: 'PUBLISHED' }
            }
          },
          include: {
            topics: {
              where: {
                lmsContent: {
                  some: { status: 'PUBLISHED' }
                }
              },
              include: {
                subtopics: {
                  where: {
                    lmsContent: {
                      some: { status: 'PUBLISHED' }
                    }
                  },
                  include: {
                    lmsContent: {
                      where: { status: 'PUBLISHED' },
                      orderBy: { order: 'asc' },
                      include: {
                        progress: {
                          where: { userId },
                          select: {
                            id: true,
                            status: true,
                            progress: true,
                            completedAt: true
                          }
                        }
                      }
                    }
                  },
                  orderBy: { order: 'asc' }
                },
                lmsContent: {
                  where: { status: 'PUBLISHED' },
                  orderBy: { order: 'asc' },
                  include: {
                    progress: {
                      where: { userId },
                      select: {
                        id: true,
                        status: true,
                        progress: true,
                        completedAt: true
                      }
                    }
                  }
                }
              },
              orderBy: { order: 'asc' }
            },
            lmsContent: {
              where: { status: 'PUBLISHED' },
              orderBy: { order: 'asc' },
              include: {
                progress: {
                  where: { userId },
                  select: {
                    id: true,
                    status: true,
                    progress: true,
                    completedAt: true
                  }
                }
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        lmsContent: {
          where: { status: 'PUBLISHED' },
          orderBy: { order: 'asc' },
          include: {
            progress: {
              where: { userId },
              select: {
                id: true,
                status: true,
                progress: true,
                completedAt: true
              }
            }
          }
        },
        // progress: {
        //   where: { userId },
        //   select: {
        //     id: true,
        //     status: true,
        //     progress: true,
        //     completedAt: true
        //   }
        // }
      },
      orderBy: { name: 'asc' }
    });

    return subjects;
  }

  @Get('content')
  async getLearningContent(
    @Req() req: any,
    @Query('subjectId') subjectId?: string,
    @Query('lessonId') lessonId?: string,
    @Query('topicId') topicId?: string,
    @Query('subtopicId') subtopicId?: string
  ) {
    const userId = req.user.id;
    
    // Get user's stream
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streamId: true }
    });

    if (!user?.streamId) {
      throw new ForbiddenException('No stream assigned to user');
    }

    // Build where clause
    const where: any = {
      status: 'PUBLISHED',
      subject: {
        streamId: user.streamId
      }
    };

    if (subjectId) where.subjectId = subjectId;
    if (lessonId) where.lessonId = lessonId;
    if (topicId) where.topicId = topicId;
    if (subtopicId) where.subtopicId = subtopicId;

    const content = await this.prisma.lMSContent.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true }
        },
        lesson: {
          select: { id: true, name: true }
        },
        topic: {
          select: { id: true, name: true }
        },
        subtopic: {
          select: { id: true, name: true }
        },
        progress: {
          where: { userId },
          select: {
            id: true,
            status: true,
            completedAt: true,
            progress: true
          }
        }
      },
      orderBy: [
        { subject: { name: 'asc' } },
        { lesson: { order: 'asc' } },
        { topic: { order: 'asc' } },
        { order: 'asc' }
      ]
    });

    return content;
  }

  @Get('subjects')
  async getSubjects(@Req() req: any) {
    const userId = req.user.id;
    
    // Get user's stream
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streamId: true }
    });

    if (!user?.streamId) {
      throw new ForbiddenException('No stream assigned to user');
    }

    const subjects = await this.prisma.subject.findMany({
      where: {
        streamId: user.streamId,
        lmsContent: {
          some: {
            status: 'PUBLISHED'
          }
        }
      },
      include: {
        _count: {
          select: {
            lmsContent: {
              where: { status: 'PUBLISHED' }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return subjects;
  }

  @Get('lessons')
  async getLessons(@Req() req: any, @Query('subjectId') subjectId?: string) {
    const userId = req.user.id;
    
    // Get user's stream
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streamId: true }
    });

    if (!user?.streamId) {
      throw new ForbiddenException('No stream assigned to user');
    }

    const where: any = {
      subject: {
        streamId: user.streamId
      },
      lmsContent: {
        some: {
          status: 'PUBLISHED'
        }
      }
    };

    if (subjectId) {
      where.subjectId = subjectId;
    }

    const lessons = await this.prisma.lesson.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            lmsContent: {
              where: { status: 'PUBLISHED' }
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    return lessons;
  }

  @Get('topics')
  async getTopics(@Req() req: any, @Query('subjectId') subjectId?: string, @Query('lessonId') lessonId?: string) {
    const userId = req.user.id;
    
    // Get user's stream
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streamId: true }
    });

    if (!user?.streamId) {
      throw new ForbiddenException('No stream assigned to user');
    }

    const where: any = {
      subject: {
        streamId: user.streamId
      },
      lmsContent: {
        some: {
          status: 'PUBLISHED'
        }
      }
    };

    if (subjectId) where.subjectId = subjectId;
    if (lessonId) where.lessonId = lessonId;

    const topics = await this.prisma.topic.findMany({
      where,
      include: {
        subject: {
          select: { id: true, name: true }
        },
        lesson: {
          select: { id: true, name: true }
        },
        _count: {
          select: {
            lmsContent: {
              where: { status: 'PUBLISHED' }
            }
          }
        }
      },
      orderBy: { order: 'asc' }
    });

    return topics;
  }

  @Get('subtopics')
  async getSubtopics(@Req() req: any, @Query('subjectId') subjectId?: string, @Query('topicId') topicId?: string) {
    const userId = req.user.id;
    
    // Get user's stream
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streamId: true }
    });

    if (!user?.streamId) {
      throw new ForbiddenException('No stream assigned to user');
    }

    const where: any = {
      topic: {
        subject: {
          streamId: user.streamId
        }
      },
      lmsContent: {
        some: {
          status: 'PUBLISHED'
        }
      }
    };

    if (subjectId) {
      where.topic = {
        ...where.topic,
        subjectId: subjectId
      };
    }

    if (topicId) {
      where.topicId = topicId;
    }

    const subtopics = await this.prisma.subtopic.findMany({
      where,
      include: {
        topic: {
          select: {
            id: true,
            name: true,
            subject: {
              select: { id: true, name: true }
            }
          }
        },
        _count: {
          select: {
            lmsContent: {
              where: { status: 'PUBLISHED' }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return subtopics;
  }

  @Get('content/:id')
  async getContent(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.id;
    
    // Get user's stream
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streamId: true }
    });

    if (!user?.streamId) {
      throw new ForbiddenException('No stream assigned to user');
    }

    const content = await this.prisma.lMSContent.findFirst({
      where: {
        id,
        status: 'PUBLISHED',
        subject: {
          streamId: user.streamId
        }
      },
      include: {
        subject: {
          select: { id: true, name: true }
        },
        lesson: {
          select: { id: true, name: true }
        },
        topic: {
          select: { id: true, name: true }
        },
        subtopic: {
          select: { id: true, name: true }
        },
        progress: {
          where: { userId },
          select: {
            id: true,
            status: true,
            completedAt: true,
            progress: true
          }
        }
      }
    });

    if (!content) {
      throw new ForbiddenException('Content not found or not accessible');
    }

    return content;
  }

  @Post('content/:id/progress')
  async updateProgress(
    @Param('id') id: string,
    @Req() req: any,
    @Query('status') status: string,
    @Query('progressPercent') progressPercent?: string
  ) {
    const userId = req.user.id;
    
    // Get user's stream
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streamId: true }
    });

    if (!user?.streamId) {
      throw new ForbiddenException('No stream assigned to user');
    }

    // Verify content exists and is accessible
    const content = await this.prisma.lMSContent.findFirst({
      where: {
        id,
        status: 'PUBLISHED',
        subject: {
          streamId: user.streamId
        }
      },
      include: {
        subject: true,
        lesson: true,
        topic: true,
        subtopic: true
      }
    });

    if (!content) {
      throw new ForbiddenException('Content not found or not accessible');
    }

    // Update or create progress
    const progress = await this.prisma.lMSProgress.upsert({
      where: {
        userId_contentId: {
          userId,
          contentId: id
        }
      },
      update: {
        status: status as any,
        progress: progressPercent ? parseInt(progressPercent) : undefined,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        lastAccessedAt: new Date()
      },
      create: {
        userId,
        contentId: id,
        status: status as any,
        progress: progressPercent ? parseInt(progressPercent) : 0,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        lastAccessedAt: new Date()
      }
    });

    // Update higher-level progress
    // await this.updateHigherLevelProgress(userId, content, status);

    return progress;
  }

  // private async updateHigherLevelProgress(userId: string, content: any, status: string) {
  //   // Update subtopic progress if content has subtopic
  //   if (content.subtopicId) {
  //     await this.updateSubtopicProgress(userId, content.subtopicId);
  //   }

  //   // Update topic progress if content has topic
  //   if (content.topicId) {
  //     await this.updateTopicProgress(userId, content.topicId);
  //   }

  //   // Update lesson progress if content has lesson
  //   if (content.lessonId) {
  //     await this.updateLessonProgress(userId, content.lessonId);
  //   }

  //   // Update subject progress
  //   if (content.subjectId) {
  //     await this.updateSubjectProgress(userId, content.subjectId);
  //   }
  // }

  // private async updateSubtopicProgress(userId: string, subtopicId: string) {
  //   const subtopic = await this.prisma.subtopic.findUnique({
  //     where: { id: subtopicId },
  //     include: {
  //       lmsContent: {
  //         where: { status: 'PUBLISHED' },
  //         include: {
  //           progress: {
  //             where: { userId }
  //           }
  //         }
  //       }
  //     }
  //   });

  //   if (!subtopic) return;

  //   const totalContent = subtopic.lmsContent.length;
  //   const completedContent = subtopic.lmsContent.filter(content => 
  //     content.progress.length > 0 && 
  //     (content.progress[0].status === 'COMPLETED' || content.progress[0].status === 'REVIEW' || content.progress[0].status === 'REVISIT')
  //   ).length;

  //   const progress = totalContent > 0 ? (completedContent / totalContent) * 100 : 0;
  //   const isCompleted = completedContent === totalContent && totalContent > 0;

  //   await this.prisma.subtopicProgress.upsert({
  //     where: { userId_subtopicId: { userId, subtopicId } },
  //     update: {
  //       progress,
  //       contentCompleted: completedContent,
  //       totalContent,
  //       status: isCompleted ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
  //       completedAt: isCompleted ? new Date() : undefined,
  //       lastAccessedAt: new Date()
  //     },
  //     create: {
  //       userId,
  //       subtopicId,
  //       progress,
  //       contentCompleted: completedContent,
  //       totalContent,
  //       status: isCompleted ? 'COMPLETED' : progress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
  //       completedAt: isCompleted ? new Date() : undefined,
  //       lastAccessedAt: new Date()
  //     }
  //   });
  // }

  // private async updateTopicProgress(userId: string, topicId: string) {
  //   // Implementation commented out until migration is run
  // }

  // private async updateLessonProgress(userId: string, lessonId: string) {
  //   // Implementation commented out until migration is run
  // }

  // private async updateSubjectProgress(userId: string, subjectId: string) {
  //   // Implementation commented out until migration is run
  // }

  @Get('progress')
  async getProgress(@Req() req: any) {
    const userId = req.user.id;
    
    const progress = await this.prisma.lMSProgress.findMany({
      where: { userId },
      include: {
        content: {
          select: {
            id: true,
            title: true,
            contentType: true,
            subject: {
              select: { name: true }
            },
            lesson: {
              select: { name: true }
            },
            topic: {
              select: { name: true }
            },
            subtopic: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { completedAt: 'desc' }
    });

    return progress;
  }

  @Get('resume/:subjectId')
  async getResumeContent(@Param('subjectId') subjectId: string, @Req() req: any) {
    const userId = req.user.id;
    
    // Get user's stream
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { streamId: true }
    });

    if (!user?.streamId) {
      throw new ForbiddenException('No stream assigned to user');
    }

    // Find the last accessed content for this subject that is not completed
    const lastProgress = await this.prisma.lMSProgress.findFirst({
      where: {
        userId,
        status: {
          in: ['IN_PROGRESS', 'REVIEW', 'REVISIT']
        },
        content: {
          subjectId,
          status: 'PUBLISHED',
          subject: {
            streamId: user.streamId
          }
        }
      },
      include: {
        content: {
          include: {
            subject: {
              select: { id: true, name: true }
            },
            lesson: {
              select: { id: true, name: true }
            },
            topic: {
              select: { id: true, name: true }
            },
            subtopic: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { lastAccessedAt: 'desc' }
    });

    if (!lastProgress) {
      // If no in-progress content, find the first content in the subject
      const firstContent = await this.prisma.lMSContent.findFirst({
        where: {
          subjectId,
          status: 'PUBLISHED',
          subject: {
            streamId: user.streamId
          }
        },
        include: {
          subject: {
            select: { id: true, name: true }
          },
          lesson: {
            select: { id: true, name: true }
          },
          topic: {
            select: { id: true, name: true }
          },
          subtopic: {
            select: { id: true, name: true }
          },
          progress: {
            where: { userId },
            select: {
              id: true,
              status: true,
              progress: true,
              completedAt: true
            }
          }
        },
        orderBy: [
          { lesson: { order: 'asc' } },
          { topic: { order: 'asc' } },
          { order: 'asc' }
        ]
      });

      return firstContent;
    }

    return {
      ...lastProgress.content,
      progress: [{
        id: lastProgress.id,
        status: lastProgress.status,
        progress: lastProgress.progress,
        completedAt: lastProgress.completedAt
      }]
    };
  }
}
