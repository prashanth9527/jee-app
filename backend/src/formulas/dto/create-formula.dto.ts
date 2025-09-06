import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum } from 'class-validator';
import { UserRole } from '@prisma/client';

export class CreateFormulaDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  formula: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  topicId?: string;

  @IsString()
  @IsOptional()
  subtopicId?: string;

  @IsEnum(UserRole)
  @IsOptional()
  targetRole?: UserRole;
}
