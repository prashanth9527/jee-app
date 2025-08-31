import { AppService } from './app.service';
import { SystemSettingsService } from './admin/system-settings.service';
export declare class AppController {
    private readonly appService;
    private readonly systemSettingsService;
    constructor(appService: AppService, systemSettingsService: SystemSettingsService);
    getHello(): string;
    getSystemSettings(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        siteTitle: string;
        siteDescription: string | null;
        siteKeywords: string | null;
        logoUrl: string | null;
        faviconUrl: string | null;
        ogImageUrl: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        address: string | null;
        facebookUrl: string | null;
        twitterUrl: string | null;
        linkedinUrl: string | null;
        instagramUrl: string | null;
        youtubeUrl: string | null;
        googleAnalyticsId: string | null;
        facebookPixelId: string | null;
        customCss: string | null;
        customJs: string | null;
        maintenanceMode: boolean;
        maintenanceMessage: string | null;
    }>;
}
