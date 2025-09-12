import { Controller, Get, UseGuards, Param, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('streams')
export class StreamsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async getAllStreams() {
    const streams = await this.prisma.stream.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        _count: {
          select: {
            subjects: true,
            users: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return streams;
  }

  @Get(':id/subjects')
  async getStreamSubjects(@Param('id') streamId: string) {
    const subjects = await this.prisma.subject.findMany({
      where: { 
        streamId,
        stream: { isActive: true }
      },
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: {
            topics: true,
            questions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return subjects;
  }

  @Get(':id')
  async getStreamById(@Param('id') streamId: string) {
    const stream = await this.prisma.stream.findUnique({
      where: { 
        id: streamId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        code: true,
        subjects: {
          select: {
            id: true,
            name: true,
            description: true,
            _count: {
              select: {
                topics: true,
                questions: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
    });

    if (!stream) {
      throw new NotFoundException('Stream not found');
    }

    return stream;
  }
} 