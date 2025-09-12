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
export declare class SystemSettingsService {
    private prisma;
    private awsService;
    constructor(prisma: PrismaService, awsService: AwsService);
    getSettings(): Promise<{
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
    updateSettings(data: UpdateSystemSettingsDto): Promise<{
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
    uploadLogo(file: Express.Multer.File): Promise<{
        logoUrl: string;
    }>;
    uploadFavicon(file: Express.Multer.File): Promise<{
        faviconUrl: string;
    }>;
    uploadOgImage(file: Express.Multer.File): Promise<{
        ogImageUrl: string;
    }>;
    deleteLogo(): Promise<{
        message: string;
    }>;
    deleteFavicon(): Promise<{
        message: string;
    }>;
    deleteOgImage(): Promise<{
        message: string;
    }>;
}
