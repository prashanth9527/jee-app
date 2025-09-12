import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';
import { UpdateNotificationDto } from '../notifications/dto/update-notification.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, NotificationPriority } from '@prisma/client';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminNotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('priority') priority?: NotificationPriority,
    @Query('isActive') isActive?: string,
  ) {
    // For now, return all notifications. Can add pagination later
    return this.notificationsService.findAll();
  }

  @Get('stats')
  async getStats() {
    const all = await this.notificationsService.findAll();
    const active = all.filter(n => n.isActive);
    const expired = all.filter(n => new Date(n.validUntil) < new Date());
    const upcoming = all.filter(n => new Date(n.validFrom) > new Date());
    
    return {
      total: all.length,
      active: active.length,
      expired: expired.length,
      upcoming: upcoming.length,
    };
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Patch(':id/toggle')
  toggleActive(@Param('id') id: string) {
    return this.notificationsService.toggleActive(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }
}
