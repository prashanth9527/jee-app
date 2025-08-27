import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt.guard';

@Controller('auth')
export class AuthController {
	constructor(private readonly auth: AuthService) {}

	@Post('register')
	register(@Body() dto: RegisterDto) {
		return this.auth.register(dto);
	}

	@Post('login')
	login(@Body() dto: LoginDto) {
		return this.auth.login(dto);
	}

	@UseGuards(JwtAuthGuard)
	@Post('send-email-otp')
	sendEmailOtp(@Req() req: any) {
		return this.auth.sendEmailOtp(req.user.id, req.user.email);
	}

	@UseGuards(JwtAuthGuard)
	@Post('send-phone-otp')
	sendPhoneOtp(@Req() req: any, @Body('phone') phone: string) {
		return this.auth.sendPhoneOtp(req.user.id, phone);
	}

	@UseGuards(JwtAuthGuard)
	@Post('verify-email')
	verifyEmail(@Req() req: any, @Body('code') code: string) {
		return this.auth.verifyEmail(req.user.id, code);
	}

	@UseGuards(JwtAuthGuard)
	@Post('verify-phone')
	verifyPhone(@Req() req: any, @Body('code') code: string) {
		return this.auth.verifyPhone(req.user.id, code);
	}

	@UseGuards(JwtAuthGuard)
	@Get('me')
	me(@Req() req: any) {
		return req.user;
	}
} 