import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SystemSettingsService } from './admin/system-settings.service';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly systemSettingsService: SystemSettingsService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('system-settings')
  async getSystemSettings() {
    return this.systemSettingsService.getSettings();
  }

  @Get('subjects')
  async getPublicSubjects() {
    return this.prisma.subject.findMany({
      where: {
        stream: { isActive: true }
      },
      orderBy: { name: 'asc' },
      include: {
        stream: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        _count: {
          select: {
            questions: true
          }
        }
      }
    });
  }

  @Get('plans')
  async getPublicPlans() {
    return this.prisma.plan.findMany({
      where: {
        isActive: true
      },
      orderBy: { priceCents: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        priceCents: true,
        currency: true,
        interval: true,
        isActive: true
      }
    });
  }
}
