import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SystemSettingsService } from './admin/system-settings.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly systemSettingsService: SystemSettingsService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('system-settings')
  async getSystemSettings() {
    return this.systemSettingsService.getSettings();
  }
}
