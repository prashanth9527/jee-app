import { Controller, Get, Put, Post, Req, Body, BadRequestException, UnauthorizedException, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import * as bcrypt from 'bcryptjs';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Get('me')
	async me(@Req() req: any) {
		const jwtUser = req.user;
		
		console.log('User /me endpoint - JWT User:', {
			id: jwtUser.id,
			email: jwtUser.email,
			role: jwtUser.role
		});
		
		// Fetch current user data from database to get updated profile information
		const currentUser = await this.usersService.findById(jwtUser.id);
		
		if (!currentUser) {
			throw new BadRequestException('User not found');
		}
		
		// Check if user needs profile completion (only for students)
		const needsProfileCompletion = currentUser.role === 'STUDENT' && (!currentUser.streamId || !currentUser.phone);
		
		console.log('User /me endpoint - Database User data:', {
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

	@Put('profile')
	async updateProfile(@Req() req: any, @Body() body: { fullName?: string; profilePicture?: string }) {
		if (!req.user) {
			throw new UnauthorizedException('User not authenticated');
		}

		const { fullName, profilePicture } = body;
		const updateData: any = {};

		if (fullName !== undefined) {
			updateData.fullName = fullName;
		}

		if (profilePicture !== undefined) {
			updateData.profilePicture = profilePicture;
		}

		const updatedUser = await this.usersService.updateProfile(req.user.id, updateData);
		return { user: updatedUser };
	}

	@Post('send-email-change-otp')
	async sendEmailChangeOtp(@Req() req: any, @Body() body: { email: string }) {
		if (!req.user) {
			throw new UnauthorizedException('User not authenticated');
		}

		const { email } = body;
		if (!email) {
			throw new BadRequestException('Email is required');
		}

		// Check if email is already taken by another user
		const existingUser = await this.usersService.findByEmail(email);
		if (existingUser && existingUser.id !== req.user.id) {
			throw new BadRequestException('Email is already in use');
		}

		// Send OTP for email change
		await this.usersService.sendEmailChangeOtp(req.user.id, email);
		return { message: 'OTP sent to new email address' };
	}

	@Put('change-email')
	async changeEmail(@Req() req: any, @Body() body: { newEmail: string; otpCode: string }) {
		if (!req.user) {
			throw new UnauthorizedException('User not authenticated');
		}

		const { newEmail, otpCode } = body;
		if (!newEmail || !otpCode) {
			throw new BadRequestException('New email and OTP code are required');
		}

		const updatedUser = await this.usersService.changeEmail(req.user.id, newEmail, otpCode);
		return { user: updatedUser };
	}

	@Post('send-phone-change-otp')
	async sendPhoneChangeOtp(@Req() req: any, @Body() body: { phone: string }) {
		if (!req.user) {
			throw new UnauthorizedException('User not authenticated');
		}

		const { phone } = body;
		if (!phone) {
			throw new BadRequestException('Phone number is required');
		}

		// Check if phone is already taken by another user
		const existingUser = await this.usersService.findByPhone(phone);
		if (existingUser && existingUser.id !== req.user.id) {
			throw new BadRequestException('Phone number is already in use');
		}

		// Send OTP for phone change
		await this.usersService.sendPhoneChangeOtp(req.user.id, phone);
		return { message: 'OTP sent to new phone number' };
	}

	@Put('change-phone')
	async changePhone(@Req() req: any, @Body() body: { newPhone: string; otpCode: string }) {
		if (!req.user) {
			throw new UnauthorizedException('User not authenticated');
		}

		const { newPhone, otpCode } = body;
		if (!newPhone || !otpCode) {
			throw new BadRequestException('New phone number and OTP code are required');
		}

		const updatedUser = await this.usersService.changePhone(req.user.id, newPhone, otpCode);
		return { user: updatedUser };
	}

	@Post('get-profile-pic-upload-url')
	async getProfilePicUploadUrl(@Req() req: any, @Body() body: { fileName: string; fileType: string }) {
		if (!req.user) {
			throw new UnauthorizedException('User not authenticated');
		}

		const { fileName, fileType } = body;
		if (!fileName || !fileType) {
			throw new BadRequestException('File name and type are required');
		}

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
		if (!allowedTypes.includes(fileType)) {
			throw new BadRequestException('Invalid file type. Only JPEG, PNG, and GIF are allowed');
		}

		const uploadData = await this.usersService.getProfilePicUploadUrl(req.user.id, fileName, fileType);
		return uploadData;
	}

	@Put('change-password')
	async changePassword(@Req() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
		if (!req.user) {
			throw new UnauthorizedException('User not authenticated');
		}

		const { currentPassword, newPassword } = body;
		if (!currentPassword || !newPassword) {
			throw new BadRequestException('Current password and new password are required');
		}

		if (newPassword.length < 8) {
			throw new BadRequestException('New password must be at least 8 characters long');
		}

		await this.usersService.changePassword(req.user.id, currentPassword, newPassword);
		return { message: 'Password changed successfully' };
	}
} 