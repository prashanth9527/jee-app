"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemSettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const aws_service_1 = require("../aws/aws.service");
let SystemSettingsService = class SystemSettingsService {
    constructor(prisma, awsService) {
        this.prisma = prisma;
        this.awsService = awsService;
    }
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
    async updateSettings(data) {
        let settings = await this.prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await this.prisma.systemSettings.create({
                data: {
                    ...data,
                    siteTitle: data.siteTitle || 'JEE App',
                },
            });
        }
        else {
            settings = await this.prisma.systemSettings.update({
                where: { id: settings.id },
                data,
            });
        }
        return settings;
    }
    async uploadLogo(file) {
        const logoUrl = await this.awsService.uploadFile(file, 'logos');
        let settings = await this.prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await this.prisma.systemSettings.create({
                data: {
                    siteTitle: 'JEE App',
                    logoUrl,
                },
            });
        }
        else {
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
    async uploadFavicon(file) {
        const faviconUrl = await this.awsService.uploadFile(file, 'favicons');
        let settings = await this.prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await this.prisma.systemSettings.create({
                data: {
                    siteTitle: 'JEE App',
                    faviconUrl,
                },
            });
        }
        else {
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
    async uploadOgImage(file) {
        const ogImageUrl = await this.awsService.uploadFile(file, 'og-images');
        let settings = await this.prisma.systemSettings.findFirst();
        if (!settings) {
            settings = await this.prisma.systemSettings.create({
                data: {
                    siteTitle: 'JEE App',
                    ogImageUrl,
                },
            });
        }
        else {
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
};
exports.SystemSettingsService = SystemSettingsService;
exports.SystemSettingsService = SystemSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        aws_service_1.AwsService])
], SystemSettingsService);
//# sourceMappingURL=system-settings.service.js.map