import { IsEmail, IsOptional, IsString, MinLength, IsNotEmpty, IsPhoneNumber } from 'class-validator';

export class RegisterDto {
	@IsEmail()
	email!: string;

	@IsNotEmpty()
	@IsString()
	@MinLength(10)
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