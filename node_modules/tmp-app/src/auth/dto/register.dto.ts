import { IsEmail, IsOptional, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class RegisterDto {
	@IsEmail()
	email!: string;

	@IsOptional()
	@IsString()
	phone?: string;

	@IsString()
	@MinLength(6)
	password!: string;

	@IsString()
	fullName!: string;

	@IsOptional()
	@IsString()
	referralCode?: string;

	@IsNotEmpty()
	@IsString()
	streamId!: string;
} 