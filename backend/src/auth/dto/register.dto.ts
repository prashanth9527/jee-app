import { IsEmail, IsOptional, IsString, MinLength, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class RegisterDto {
	@IsEmail()
	email!: string;

	@IsNotEmpty()
	@IsString()
	@IsPhoneNumber('IN') // Assuming Indian phone numbers, adjust as needed
	phone!: string;

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