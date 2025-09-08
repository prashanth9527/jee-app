import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards, Query } from '@nestjs/common';
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

	@Post('start-registration')
	startRegistration(@Body() dto: RegisterDto) {
		return this.auth.startRegistration(dto);
	}

	@Post('complete-registration')
	completeRegistration(@Body() body: { userId: string; otpCode: string }) {
		return this.auth.completeRegistration(body.userId, body.otpCode);
	}

	@Post('resend-email-otp')
	async resendEmailOtp(@Body() body: { userId: string; email: string }) {
		return this.auth.resendEmailOtp(body.userId, body.email);
	}

	@UseGuards(JwtAuthGuard)
	@Post('complete-profile')
	completeProfile(@Req() req: any, @Body() body: { phone: string; streamId?: string }) {
		return this.auth.completeProfile(req.user.id, body.phone, body.streamId);
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

	@Post('send-login-otp')
	sendLoginOtp(@Body('phone') phone: string) {
		return this.auth.sendLoginOtp(phone);
	}

	@Post('send-phone-otp-registration')
	sendPhoneOtpForRegistration(@Body('phone') phone: string, @Req() req: any) {
		const ipAddress = req.ip || req.connection.remoteAddress;
		return this.auth.sendPhoneOtpForRegistration(phone, ipAddress);
	}

	@UseGuards(JwtAuthGuard)
	@Get('otp-usage-stats')
	getOtpUsageStats(@Req() req: any, @Query('type') type: 'EMAIL' | 'PHONE') {
		return this.auth.getOtpUsageStats(req.user.id, type);
	}

	@UseGuards(JwtAuthGuard)
	@Get('verification-status')
	getVerificationStatus(@Req() req: any) {
		return this.auth.getVerificationStatus(req.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Get('phone-change-status')
	getPhoneChangeStatus(@Req() req: any) {
		return this.auth.getPhoneChangeStatus(req.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Post('verify-email')
	verifyEmail(@Req() req: any, @Body('code') code: string) {
		return this.auth.verifyEmail(req.user.id, code);
	}

	@UseGuards(JwtAuthGuard)
	@Post('send-phone-verification-otp')
	sendPhoneVerificationOtp(@Req() req: any) {
		return this.auth.sendPhoneVerificationOtp(req.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Post('verify-phone')
	verifyPhone(@Req() req: any, @Body('code') code: string) {
		return this.auth.verifyPhone(req.user.id, code);
	}

	@UseGuards(JwtAuthGuard)
	@Post('change-phone')
	changePhone(@Req() req: any, @Body('newPhone') newPhone: string) {
		return this.auth.changePhone(req.user.id, newPhone);
	}

	@UseGuards(JwtAuthGuard)
	@Post('verify-phone-change')
	verifyPhoneChange(@Req() req: any, @Body('code') code: string) {
		return this.auth.verifyPhoneChange(req.user.id, code);
	}

	@UseGuards(JwtAuthGuard)
	@Post('cancel-phone-change')
	cancelPhoneChange(@Req() req: any) {
		return this.auth.cancelPhoneChange(req.user.id);
	}

	@UseGuards(JwtAuthGuard)
	@Get('me')
	async me(@Req() req: any) {
		const jwtUser = req.user;
		
		console.log('Auth /me endpoint - JWT User:', {
			id: jwtUser.id,
			email: jwtUser.email,
			role: jwtUser.role
		});
		
		// Fetch current user data from database to get updated profile information
		const currentUser = await this.auth.getUserById(jwtUser.id);
		
		if (!currentUser) {
			throw new BadRequestException('User not found');
		}
		
		// Check if user needs profile completion (only for students)
		const needsProfileCompletion = currentUser.role === 'STUDENT' && (!currentUser.streamId || !currentUser.phone);
		
		console.log('Auth /me endpoint - Database User data:', {
			id: currentUser.id,
			email: currentUser.email,
			role: currentUser.role,
			streamId: currentUser.streamId,
			phone: currentUser.phone,
			needsProfileCompletion
		});
		
		return {
			...currentUser,
			needsProfileCompletion
		};
	}
} 