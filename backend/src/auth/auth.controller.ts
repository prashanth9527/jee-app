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
	login(@Body() dto: LoginDto, @Req() req: any) {
		// Extract device information from request
		const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
		const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
		const userAgent = req.headers['user-agent'];

		return this.auth.login({
			...dto,
			deviceInfo,
			ipAddress,
			userAgent
		});
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

	@Post('send-email-login-otp')
	sendEmailLoginOtp(@Body('email') email: string) {
		return this.auth.sendEmailLoginOtp(email);
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

	// Phone change status endpoint removed for now

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

	// Phone change endpoints removed for now - focus on basic login fix

	@UseGuards(JwtAuthGuard)
	@Post('logout')
	async logout(@Req() req: any) {
		if (req.user.sessionId) {
			await this.auth.logout(req.user.sessionId);
		}
		return { message: 'Logged out successfully' };
	}

	@UseGuards(JwtAuthGuard)
	@Post('logout-all-devices')
	async logoutAllDevices(@Req() req: any) {
		await this.auth.logoutAllDevices(req.user.id);
		return { message: 'Logged out from all devices successfully' };
	}

	@UseGuards(JwtAuthGuard)
	@Get('sessions')
	async getUserSessions(@Req() req: any) {
		return this.auth.getUserSessions(req.user.id);
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

	// Forgot Password Endpoints
	@Post('forgot-password/email')
	async forgotPasswordEmail(@Body('email') email: string) {
		return this.auth.forgotPasswordEmail(email);
	}

	@Post('forgot-password/phone')
	async forgotPasswordPhone(@Body('phone') phone: string) {
		return this.auth.forgotPasswordPhone(phone);
	}

	@Post('forgot-password/verify-otp')
	async verifyPasswordResetOtp(@Body() body: { userId: string; code: string; type: 'EMAIL' | 'PHONE' }) {
		return this.auth.verifyPasswordResetOtp(body.userId, body.code, body.type);
	}

	@Post('forgot-password/reset')
	async resetPassword(@Body() body: { resetToken: string; newPassword: string }) {
		return this.auth.resetPassword(body.resetToken, body.newPassword);
	}
} 