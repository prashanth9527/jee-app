import { IsEmail, IsEnum, IsPhoneNumber, IsString } from 'class-validator';

export enum OtpChannel {
	EMAIL = 'EMAIL',
	PHONE = 'PHONE',
}

export class SendOtpDto {
	@IsEnum(OtpChannel)
	channel!: OtpChannel;

	@IsString()
	target!: string; // email or phone value
}

export class VerifyOtpDto {
	@IsEnum(OtpChannel)
	channel!: OtpChannel;

	@IsString()
	code!: string;
} 