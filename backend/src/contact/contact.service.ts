import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactTicketDto, UpdateTicketStatusDto, CreateTicketResponseDto } from './dto/contact.dto';
import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';

@Injectable()
export class ContactService {
  constructor(private prisma: PrismaService) {}

  async createTicket(data: CreateContactTicketDto) {
    return this.prisma.contactTicket.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        category: (data.category as TicketCategory) || TicketCategory.GENERAL,
        priority: (data.priority as TicketPriority) || TicketPriority.NORMAL,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async getTickets(filters?: {
    status?: string;
    category?: string;
    priority?: string;
    page?: number | string;
    limit?: number | string;
  }) {
    const page = parseInt(String(filters?.page || 1), 10);
    const limit = parseInt(String(filters?.limit || 20), 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.priority) where.priority = filters.priority;

    const [tickets, total] = await Promise.all([
      this.prisma.contactTicket.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          responses: {
            include: {
              responder: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.contactTicket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getTicketById(id: string) {
    return this.prisma.contactTicket.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        responses: {
          include: {
            responder: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async updateTicketStatus(id: string, data: UpdateTicketStatusDto) {
    return this.prisma.contactTicket.update({
      where: { id },
      data: {
        status: data.status as TicketStatus,
        priority: data.priority as TicketPriority,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        responses: {
          include: {
            responder: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
  }

  async addResponse(ticketId: string, data: CreateTicketResponseDto, responderId: string) {
    return this.prisma.ticketResponse.create({
      data: {
        ticketId,
        message: data.message,
        isInternal: data.isInternal || false,
        responderId,
      },
      include: {
        responder: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }

  async getTicketStats() {
    const [total, open, inProgress, resolved, closed] = await Promise.all([
      this.prisma.contactTicket.count(),
      this.prisma.contactTicket.count({ where: { status: 'OPEN' } }),
      this.prisma.contactTicket.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.contactTicket.count({ where: { status: 'RESOLVED' } }),
      this.prisma.contactTicket.count({ where: { status: 'CLOSED' } }),
    ]);

    const categoryStats = await this.prisma.contactTicket.groupBy({
      by: ['category'],
      _count: {
        category: true,
      },
    });

    const priorityStats = await this.prisma.contactTicket.groupBy({
      by: ['priority'],
      _count: {
        priority: true,
      },
    });

    return {
      total,
      byStatus: {
        open,
        inProgress,
        resolved,
        closed,
      },
      byCategory: categoryStats.map(stat => ({
        category: stat.category,
        count: stat._count.category,
      })),
      byPriority: priorityStats.map(stat => ({
        priority: stat.priority,
        count: stat._count.priority,
      })),
    };
  }
}
