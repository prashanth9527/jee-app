import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsString()
  @IsOptional()
  link?: string;

  @IsDateString()
  validFrom: string;

  @IsDateString()
  validUntil: string;

  @IsEnum(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  @IsOptional()
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

  @IsEnum(UserRole)
  @IsOptional()
  targetRole?: UserRole;
}