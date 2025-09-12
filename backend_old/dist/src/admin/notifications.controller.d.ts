import { NotificationsService } from '../notifications/notifications.service';
import { CreateNotificationDto } from '../notifications/dto/create-notification.dto';
import { UpdateNotificationDto } from '../notifications/dto/update-notification.dto';
import { NotificationPriority } from '@prisma/client';
export declare class AdminNotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    create(createNotificationDto: CreateNotificationDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        title: string;
        link: string | null;
        message: string | null;
        validFrom: Date;
        validUntil: Date;
        priority: import(".prisma/client").$Enums.NotificationPriority;
        targetRole: import(".prisma/client").$Enums.UserRole;
    }>;
    findAll(page?: string, limit?: string, priority?: NotificationPriority, isActive?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        title: string;
        link: string | null;
        message: string | null;
        validFrom: Date;
        validUntil: Date;
        priority: import(".prisma/client").$Enums.NotificationPriority;
        targetRole: import(".prisma/client").$Enums.UserRole;
    }[]>;
    getStats(): Promise<{
        total: number;
        active: number;
        expired: number;
        upcoming: number;
    }>;
    findOne(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        title: string;
        link: string | null;
        message: string | null;
        validFrom: Date;
        validUntil: Date;
        priority: import(".prisma/client").$Enums.NotificationPriority;
        targetRole: import(".prisma/client").$Enums.UserRole;
    } | null>;
    update(id: string, updateNotificationDto: UpdateNotificationDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        title: string;
        link: string | null;
        message: string | null;
        validFrom: Date;
        validUntil: Date;
        priority: import(".prisma/client").$Enums.NotificationPriority;
        targetRole: import(".prisma/client").$Enums.UserRole;
    }>;
    toggleActive(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        title: string;
        link: string | null;
        message: string | null;
        validFrom: Date;
        validUntil: Date;
        priority: import(".prisma/client").$Enums.NotificationPriority;
        targetRole: import(".prisma/client").$Enums.UserRole;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isActive: boolean;
        title: string;
        link: string | null;
        message: string | null;
        validFrom: Date;
        validUntil: Date;
        priority: import(".prisma/client").$Enums.NotificationPriority;
        targetRole: import(".prisma/client").$Enums.UserRole;
    }>;
}
