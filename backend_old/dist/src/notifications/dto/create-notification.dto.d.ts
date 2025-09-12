import { UserRole } from '@prisma/client';
export declare class CreateNotificationDto {
    title: string;
    message?: string;
    link?: string;
    validFrom: string;
    validUntil: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    targetRole?: UserRole;
}
