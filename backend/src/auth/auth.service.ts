import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { OtpService } from './otp.service';
import { ReferralsService } from '../referrals/referrals.service';
import { PrismaService } from '../prisma/prisma.service';
import { normalizeIndianPhone, isValidIndianMobile, formatPhoneForDisplay } from './utils/phone.utils';

@Injectable()
export class AuthService {
	constructor(
		private readonly users: UsersService,
		private readonly jwt: JwtService,
		private readonly otp: OtpService,
		private readonly referralsService: ReferralsService,
		private readonly prisma: PrismaService,
	) {}

	async register(params: { email: string; password: string; fullName: string; phone: string; referralCode?: string; streamId: string }) {
		// Normalize phone number by adding +91
		const normalizedPhone = normalizeIndianPhone(params.phone);
		
		// Validate Indian mobile number format
		if (!isValidIndianMobile(normalizedPhone)) {
			throw new BadRequestException('Please enter a valid 10-digit Indian mobile number');
		}

		const existingEmail = await this.users.findByEmail(params.email);
		if (existingEmail) throw new BadRequestException('Email already registered');
		
		const existingPhone = await this.users.findByPhone(normalizedPhone);
		if (existingPhone) throw new BadRequestException('Phone number already registered');
		
		// Validate stream exists
		const stream = await this.prisma.stream.findUnique({
			where: { id: params.streamId, isActive: true }
		});
		if (!stream) throw new BadRequestException('Invalid stream selected');
		
		const hashedPassword = await bcrypt.hash(params.password, 10);
		const user = await this.users.createUser({ 
			email: params.email, 
			fullName: params.fullName, 
			hashedPassword, 
			phone: normalizedPhone,
			streamId: params.streamId
		});
		const days = Number(process.env.FREE_TRIAL_DAYS || 2);
		const started = new Date();
		const ends = new Date(started.getTime() + days * 24 * 60 * 60 * 1000);
		await this.users.updateTrial(user.id, started, ends);
		
		// Apply referral code if provided
		if (params.referralCode) {
			try {
				await this.referralsService.applyReferralCode(user.id, params.referralCode);
			} catch (error) {
				// Log error but don't fail registration
				console.error('Failed to apply referral code:', error);
			}
		}
		
		await this.otp.sendEmailOtp(user.id, user.email);
		if (user.phone) await this.otp.sendPhoneOtp(user.id, user.phone);
		return { id: user.id, email: user.email };
	}

	async startRegistration(params: { email: string; password: string; fullName: string; phone: string; referralCode?: string; streamId: string }) {
		// Normalize phone number by adding +91
		const normalizedPhone = normalizeIndianPhone(params.phone);
		
		// Validate Indian mobile number format
		if (!isValidIndianMobile(normalizedPhone)) {
			throw new BadRequestException('Please enter a valid 10-digit Indian mobile number');
		}

		const existingEmail = await this.users.findByEmail(params.email);
		if (existingEmail) throw new BadRequestException('Email already registered');
		
		const existingPhone = await this.users.findByPhone(normalizedPhone);
		if (existingPhone) throw new BadRequestException('Phone number already registered');
		
		// Validate stream exists
		const stream = await this.prisma.stream.findUnique({
			where: { id: params.streamId, isActive: true }
		});
		if (!stream) throw new BadRequestException('Invalid stream selected');
		
		// Create user with emailVerified: false
		const hashedPassword = await bcrypt.hash(params.password, 10);
		const user = await this.users.createUser({ 
			email: params.email, 
			fullName: params.fullName, 
			hashedPassword, 
			phone: normalizedPhone,
			streamId: params.streamId,
			emailVerified: false // User needs to verify email first
		});
		
		// Send email and phone OTP for verification
		await this.otp.sendEmailOtp(user.id, user.email);
		await this.otp.sendPhoneOtp(user.id, user.phone!);
		
		return { 
			id: user.id, 
			email: user.email,
			message: 'Registration initiated. Please check your email and phone for OTP verification.'
		};
	}

	async completeRegistration(userId: string, otpCode: string) {
		// Verify email OTP
		await this.otp.verifyOtp(userId, otpCode, 'EMAIL');
		
		// Mark email as verified
		await this.users.setEmailVerified(userId);
		
		// Set up trial period
		const days = Number(process.env.FREE_TRIAL_DAYS || 2);
		const started = new Date();
		const ends = new Date(started.getTime() + days * 24 * 60 * 60 * 1000);
		await this.users.updateTrial(userId, started, ends);
		
		// Get user data
		const user = await this.users.findById(userId);
		if (!user) throw new BadRequestException('User not found');
		
		// Send phone OTP if phone is provided
		if (user.phone) {
			await this.otp.sendPhoneOtp(user.id, user.phone);
		}
		
		// Generate JWT token
		const token = this.jwt.sign({ 
			sub: user.id, 
			email: user.email, 
			role: user.role 
		});

		return { 
			access_token: token,
			message: 'Registration completed successfully!',
			user: {
				id: user.id,
				email: user.email,
				fullName: user.fullName,
				emailVerified: user.emailVerified
			}
		};
	}

	async resendEmailOtp(userId: string, email: string) {
		// Verify user exists and email matches
		const user = await this.prisma.user.findUnique({
			where: { id: userId }
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		if (user.email !== email) {
			throw new BadRequestException('Email mismatch');
		}

		if (user.emailVerified) {
			throw new BadRequestException('Email already verified');
		}

		// Send new email OTP
		await this.otp.sendEmailOtp(userId, email);

		return {
			message: 'Email OTP sent successfully'
		};
	}

	async completeProfile(userId: string, phone: string, streamId?: string) {
		console.log('Complete profile called with:', { userId, phone, streamId });
		
		// Get user to check role
		const currentUser = await this.prisma.user.findUnique({
			where: { id: userId }
		});
		if (!currentUser) throw new BadRequestException('User not found');
		
		console.log('Current user data:', {
			id: currentUser.id,
			email: currentUser.email,
			role: currentUser.role,
			currentPhone: currentUser.phone,
			currentStreamId: currentUser.streamId
		});

		// Check if phone number is already registered by another user
		const existingUserWithPhone = await this.prisma.user.findFirst({
			where: { 
				phone: phone,
				id: { not: userId } // Exclude current user
			}
		});
		if (existingUserWithPhone) {
			throw new BadRequestException('This phone number is already registered with another account');
		}

		// For non-admin users, validate stream exists
		if (currentUser.role !== 'ADMIN' && streamId) {
			const stream = await this.prisma.stream.findUnique({
				where: { id: streamId, isActive: true }
			});
			if (!stream) throw new BadRequestException('Invalid stream selected');
		}

		// Prepare update data
		const updateData: any = { phone };
		if (streamId) {
			updateData.streamId = streamId;
		}

		try {
			// Update user profile
			const user = await this.prisma.user.update({
				where: { id: userId },
				data: updateData,
				include: {
					stream: true,
					subscriptions: {
						include: {
							plan: true
						}
					}
				}
			});

			console.log('Profile updated successfully:', {
				id: user.id,
				phone: user.phone,
				streamId: user.streamId,
				stream: user.stream
			});

			// Send phone OTP for verification
			await this.otp.sendPhoneOtp(user.id, phone);

			return {
				message: 'Profile completed successfully!',
				user: {
					id: user.id,
					email: user.email,
					fullName: user.fullName,
					phone: user.phone,
					stream: user.stream,
					emailVerified: user.emailVerified
				}
			};
		} catch (error: any) {
			// Handle unique constraint errors
			if (error.code === 'P2002') {
				if (error.meta?.target?.includes('phone')) {
					throw new BadRequestException('This phone number is already registered with another account');
				}
				throw new BadRequestException('A field with this value already exists');
			}
			throw error;
		}
	}

	async login(params: { email?: string; password?: string; phone?: string; otpCode?: string }) {
		// Check if this is a phone OTP login
		if (params.phone && params.otpCode) {
			return this.loginWithPhoneOtp(params.phone, params.otpCode);
		}
		
		// Traditional email/password login
		if (params.email && params.password) {
			return this.loginWithPassword(params.email, params.password);
		}
		
		throw new BadRequestException('Invalid login parameters. Provide either email/password or phone/otpCode.');
	}

	async loginWithPassword(email: string, password: string) {
		console.log('Login attempt for email:', email); // Debug log
		
		const user = await this.users.findByEmail(email);
		if (!user) {
			console.log('User not found'); // Debug log
			throw new UnauthorizedException('Invalid credentials');
		}
		
		console.log('User found:', { id: user.id, email: user.email, role: user.role }); // Debug log
		
		if (!user.hashedPassword) {
			throw new UnauthorizedException('Invalid credentials');
		}
		const ok = await bcrypt.compare(password, user.hashedPassword);
		console.log('Password comparison result:', ok); // Debug log
		
		if (!ok) {
			console.log('Password mismatch'); // Debug log
			throw new UnauthorizedException('Invalid credentials');
		}
		
		const token = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
		const response = { 
			access_token: token,
			user: {
				id: user.id,
				email: user.email,
				fullName: user.fullName,
				role: user.role
			}
		};
		
		console.log('Login successful, returning:', response); // Debug log
		return response;
	}

	async loginWithPhoneOtp(phone: string, otpCode: string) {
		console.log('Phone OTP login attempt for phone:', phone); // Debug log
		
		const user = await this.users.findByPhone(phone);
		if (!user) {
			console.log('User not found with phone:', phone); // Debug log
			throw new UnauthorizedException('Invalid phone number or OTP');
		}
		
		console.log('User found:', { id: user.id, email: user.email, role: user.role }); // Debug log
		
		// Verify OTP
		await this.otp.verifyOtp(user.id, otpCode, 'PHONE');
		
		const token = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
		const response = { 
			access_token: token,
			user: {
				id: user.id,
				email: user.email,
				fullName: user.fullName,
				role: user.role
			}
		};
		
		console.log('Phone OTP login successful, returning:', response); // Debug log
		return response;
	}

	async sendEmailOtp(userId: string, email: string) {
		await this.otp.sendEmailOtp(userId, email);
		return { ok: true };
	}

	async sendPhoneOtp(userId: string, phone: string) {
		await this.otp.sendPhoneOtp(userId, phone);
		return { ok: true };
	}

	async sendLoginOtp(phone: string) {
		// Find user by phone number
		const user = await this.users.findByPhone(phone);
		if (!user) {
			throw new UnauthorizedException('No account found with this phone number');
		}
		
		// Send OTP
		await this.otp.sendPhoneOtp(user.id, phone);
		return { ok: true, message: 'OTP sent to your phone number' };
	}

	async verifyEmail(userId: string, code: string) {
		await this.otp.verifyOtp(userId, code, 'EMAIL');
		await this.users.setEmailVerified(userId);
		return { ok: true };
	}

	async verifyPhone(userId: string, code: string) {
		await this.otp.verifyOtp(userId, code, 'PHONE');
		await this.users.setPhoneVerified(userId);
		return { ok: true };
	}

	async generateJwtToken(user: any): Promise<string> {
		const payload = {
			sub: user.id,
			email: user.email,
			role: user.role
		};
		return this.jwt.signAsync(payload);
	}

	async getUserById(userId: string) {
		const user = await this.users.findById(userId);
		console.log('getUserById called for userId:', userId);
		console.log('User found:', user ? {
			id: user.id,
			email: user.email,
			role: user.role,
			phone: user.phone,
			streamId: user.streamId
		} : 'User not found');
		return user;
	}

	async sendPhoneOtpForRegistration(phone: string, ipAddress?: string) {
		await this.otp.sendPhoneOtpForRegistration(phone, ipAddress);
		return { ok: true };
	}

	async getOtpUsageStats(userId: string, type: 'EMAIL' | 'PHONE') {
		return this.otp.getOtpUsageStats(userId, type);
	}

	async sendPhoneVerificationOtp(userId: string) {
		// Get user to check if they have a phone number
		const user = await this.users.findById(userId);
		if (!user) {
			throw new BadRequestException('User not found');
		}

		if (!user.phone) {
			throw new BadRequestException('No phone number found. Please add a phone number to your profile first.');
		}

		if (user.phoneVerified) {
			throw new BadRequestException('Phone number is already verified');
		}

		// Send OTP to the user's phone number
		await this.otp.sendPhoneOtp(userId, user.phone);
		
		return { 
			ok: true, 
			message: 'Phone verification OTP sent successfully',
			phone: formatPhoneForDisplay(user.phone)
		};
	}

	async getVerificationStatus(userId: string) {
		const user = await this.users.findById(userId);
		if (!user) {
			throw new BadRequestException('User not found');
		}

		return {
			emailVerified: user.emailVerified,
			phoneVerified: user.phoneVerified,
			hasPhone: !!user.phone,
			phone: user.phone ? formatPhoneForDisplay(user.phone) : null,
			needsPhoneVerification: !!user.phone && !user.phoneVerified,
			canVerifyPhone: !!user.phone && !user.phoneVerified
		};
	}

	async changePhone(userId: string, newPhone: string) {
		// Normalize phone number by adding +91
		const normalizedPhone = normalizeIndianPhone(newPhone);
		
		// Validate Indian mobile number format
		if (!isValidIndianMobile(normalizedPhone)) {
			throw new BadRequestException('Please enter a valid 10-digit Indian mobile number');
		}

		// Check if the new phone number is already registered by another user
		const existingUser = await this.prisma.user.findFirst({
			where: { 
				phone: normalizedPhone,
				id: { not: userId }
			}
		});

		if (existingUser) {
			throw new BadRequestException('This phone number is already registered with another account');
		}

		// Get current user
		const user = await this.users.findById(userId);
		if (!user) {
			throw new BadRequestException('User not found');
		}

		// Check if it's the same phone number
		if (user.phone === normalizedPhone) {
			throw new BadRequestException('This is already your current phone number');
		}

		// Store the new phone number temporarily for verification
		// We'll use a separate table or add a field to track pending phone changes
		await this.prisma.user.update({
			where: { id: userId },
			data: { 
				pendingPhone: normalizedPhone,
				phoneVerified: false // Reset verification status
			}
		});

		// Send OTP to the new phone number
		await this.otp.sendPhoneOtp(userId, normalizedPhone);

		return {
			ok: true,
			message: 'OTP sent to new phone number for verification',
			newPhone: formatPhoneForDisplay(normalizedPhone)
		};
	}

	async verifyPhoneChange(userId: string, code: string) {
		// Get user with pending phone
		const user = await this.prisma.user.findUnique({
			where: { id: userId }
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		if (!user.pendingPhone) {
			throw new BadRequestException('No pending phone number change found');
		}

		// Verify OTP
		await this.otp.verifyOtp(userId, code, 'PHONE');

		// Update the phone number and clear pending phone
		const updatedUser = await this.prisma.user.update({
			where: { id: userId },
			data: {
				phone: user.pendingPhone,
				pendingPhone: null,
				phoneVerified: true
			},
			select: {
				id: true,
				email: true,
				fullName: true,
				phone: true,
				emailVerified: true,
				phoneVerified: true,
				role: true
			}
		});

		return {
			ok: true,
			message: 'Phone number changed and verified successfully',
			user: updatedUser
		};
	}

	async getPhoneChangeStatus(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				phone: true,
				pendingPhone: true,
				phoneVerified: true
			}
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		return {
			currentPhone: user.phone,
			pendingPhone: user.pendingPhone,
			phoneVerified: user.phoneVerified,
			hasPendingChange: !!user.pendingPhone,
			currentPhoneDisplay: user.phone ? formatPhoneForDisplay(user.phone) : null,
			pendingPhoneDisplay: user.pendingPhone ? formatPhoneForDisplay(user.pendingPhone) : null
		};
	}

	async cancelPhoneChange(userId: string) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId }
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		if (!user.pendingPhone) {
			throw new BadRequestException('No pending phone number change to cancel');
		}

		// Clear the pending phone number
		await this.prisma.user.update({
			where: { id: userId },
			data: { pendingPhone: null }
		});

		return {
			ok: true,
			message: 'Phone number change cancelled successfully'
		};
	}
} 