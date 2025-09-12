import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { NotificationPriority, UserRole } from '../types/prisma.types';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(createNotificationDto: CreateNotificationDto) {
    return this.prisma.notification.create({
      data: createNotificationDto,
    });
  }

  async findAll() {
    return this.prisma.notification.findMany({
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
    });
  }

  async findActive() {
    const now = new Date();
    return this.prisma.notification.findMany({
      where: {
        isActive: true,
        validFrom: {
          lte: now,
        },
        validUntil: {
          gte: now,
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
    });
  }

  async findForRole(role: UserRole) {
    const now = new Date();
    return this.prisma.notification.findMany({
      where: {
        isActive: true,
        targetRole: role,
        validFrom: {
          lte: now,
        },
        validUntil: {
          gte: now,
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
    });
  }

  async findOne(id: string) {
    return this.prisma.notification.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateNotificationDto: UpdateNotificationDto) {
    return this.prisma.notification.update({
      where: { id },
      data: updateNotificationDto,
    });
  }

  async remove(id: string) {
    return this.prisma.notification.delete({
      where: { id },
    });
  }

  async toggleActive(id: string) {
    const notification = await this.findOne(id);
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    return this.prisma.notification.update({
      where: { id },
      data: { isActive: !notification.isActive },
    });
  }
}
