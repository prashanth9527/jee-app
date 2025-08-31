import { Controller, Get, Post, Put, Delete, Body, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SystemSettingsService, UpdateSystemSettingsDto } from './system-settings.service';

@Controller('admin/system-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class SystemSettingsController {
  constructor(private readonly systemSettingsService: SystemSettingsService) {}

  @Get()
  async getSettings() {
    return this.systemSettingsService.getSettings();
  }

  @Put()
  async updateSettings(@Body() data: UpdateSystemSettingsDto) {
    return this.systemSettingsService.updateSettings(data);
  }

  @Post('upload/logo')
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.systemSettingsService.uploadLogo(file);
  }

  @Post('upload/favicon')
  @UseInterceptors(
    FileInterceptor('favicon', {
      limits: {
        fileSize: 2 * 1024 * 1024, // 2MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFavicon(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.systemSettingsService.uploadFavicon(file);
  }

  @Post('upload/og-image')
  @UseInterceptors(
    FileInterceptor('ogImage', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadOgImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    return this.systemSettingsService.uploadOgImage(file);
  }

  @Delete('logo')
  async deleteLogo() {
    return this.systemSettingsService.deleteLogo();
  }

  @Delete('favicon')
  async deleteFavicon() {
    return this.systemSettingsService.deleteFavicon();
  }

  @Delete('og-image')
  async deleteOgImage() {
    return this.systemSettingsService.deleteOgImage();
  }
} 