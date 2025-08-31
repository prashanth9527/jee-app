import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AwsService } from '../aws/aws.service';

export interface UpdateSystemSettingsDto {
  siteTitle?: string;
  siteDescription?: string;
  siteKeywords?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  customCss?: string;
  customJs?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
}

@Injectable()
export class SystemSettingsService {
  constructor(
    private prisma: PrismaService,
    private awsService: AwsService,
  ) {}

  async getSettings() {
    let settings = await this.prisma.systemSettings.findFirst();
    
    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          siteTitle: 'JEE App',
          siteDescription: 'Comprehensive JEE preparation platform',
          siteKeywords: 'JEE, IIT, engineering, entrance exam, preparation',
        },
      });
    }
    
    return settings;
  }

  async updateSettings(data: UpdateSystemSettingsDto) {
    let settings = await this.prisma.systemSettings.findFirst();
    
    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          ...data,
          siteTitle: data.siteTitle || 'JEE App',
        },
      });
    } else {
      settings = await this.prisma.systemSettings.update({
        where: { id: settings.id },
        data,
      });
    }
    
    return settings;
  }

  async uploadLogo(file: Express.Multer.File) {
    const logoUrl = await this.awsService.uploadFile(file, 'logos');
    
    let settings = await this.prisma.systemSettings.findFirst();
    
    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          siteTitle: 'JEE App',
          logoUrl,
        },
      });
    } else {
      // Delete old logo if exists
      if (settings.logoUrl) {
        await this.awsService.deleteFile(settings.logoUrl);
      }
      
      settings = await this.prisma.systemSettings.update({
        where: { id: settings.id },
        data: { logoUrl },
      });
    }
    
    return { logoUrl };
  }

  async uploadFavicon(file: Express.Multer.File) {
    const faviconUrl = await this.awsService.uploadFile(file, 'favicons');
    
    let settings = await this.prisma.systemSettings.findFirst();
    
    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          siteTitle: 'JEE App',
          faviconUrl,
        },
      });
    } else {
      // Delete old favicon if exists
      if (settings.faviconUrl) {
        await this.awsService.deleteFile(settings.faviconUrl);
      }
      
      settings = await this.prisma.systemSettings.update({
        where: { id: settings.id },
        data: { faviconUrl },
      });
    }
    
    return { faviconUrl };
  }

  async uploadOgImage(file: Express.Multer.File) {
    const ogImageUrl = await this.awsService.uploadFile(file, 'og-images');
    
    let settings = await this.prisma.systemSettings.findFirst();
    
    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          siteTitle: 'JEE App',
          ogImageUrl,
        },
      });
    } else {
      // Delete old OG image if exists
      if (settings.ogImageUrl) {
        await this.awsService.deleteFile(settings.ogImageUrl);
      }
      
      settings = await this.prisma.systemSettings.update({
        where: { id: settings.id },
        data: { ogImageUrl },
      });
    }
    
    return { ogImageUrl };
  }

  async deleteLogo() {
    let settings = await this.prisma.systemSettings.findFirst();
    
    if (settings?.logoUrl) {
      await this.awsService.deleteFile(settings.logoUrl);
      
      settings = await this.prisma.systemSettings.update({
        where: { id: settings.id },
        data: { logoUrl: null },
      });
    }
    
    return { message: 'Logo deleted successfully' };
  }

  async deleteFavicon() {
    let settings = await this.prisma.systemSettings.findFirst();
    
    if (settings?.faviconUrl) {
      await this.awsService.deleteFile(settings.faviconUrl);
      
      settings = await this.prisma.systemSettings.update({
        where: { id: settings.id },
        data: { faviconUrl: null },
      });
    }
    
    return { message: 'Favicon deleted successfully' };
  }

  async deleteOgImage() {
    let settings = await this.prisma.systemSettings.findFirst();
    
    if (settings?.ogImageUrl) {
      await this.awsService.deleteFile(settings.ogImageUrl);
      
      settings = await this.prisma.systemSettings.update({
        where: { id: settings.id },
        data: { ogImageUrl: null },
      });
    }
    
    return { message: 'OG Image deleted successfully' };
  }
} 