import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { AwsService } from '../aws/aws.service';
import { OtpService } from '../auth/otp.service';

@Injectable()
export class UsersService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly awsService: AwsService,
		private readonly otpService: OtpService
	) {}

	createUser(params: { email: string; fullName: string; hashedPassword: string; phone: string; streamId?: string; emailVerified?: boolean }) {
		const { email, fullName, hashedPassword, phone, streamId, emailVerified } = params;
		return this.prisma.user.create({ 
			data: { 
				email, 
				fullName, 
				hashedPassword, 
				phone,
				streamId: streamId || null,
				emailVerified: emailVerified !== undefined ? emailVerified : true
			} 
		});
	}

	findByEmail(email: string) {
		return this.prisma.user.findUnique({ where: { email } });
	}

	findByPhone(phone: string) {
		return this.prisma.user.findUnique({ where: { phone } });
	}

	findById(id: string) {
		return this.prisma.user.findUnique({ where: { id } });
	}

	async setEmailVerified(userId: string) {
		return this.prisma.user.update({ where: { id: userId }, data: { emailVerified: true } });
	}

	async setPhoneVerified(userId: string) {
		return this.prisma.user.update({ where: { id: userId }, data: { phoneVerified: true } });
	}

	async updateTrial(userId: string, startedAt: Date, endsAt: Date) {
		return this.prisma.user.update({ where: { id: userId }, data: { trialStartedAt: startedAt, trialEndsAt: endsAt } });
	}

	// Profile Settings Methods
	async updateProfile(userId: string, updateData: { fullName?: string; profilePicture?: string }) {
		return this.prisma.user.update({
			where: { id: userId },
			data: updateData,
			select: {
				id: true,
				email: true,
				fullName: true,
				phone: true,
				profilePicture: true,
				role: true,
				emailVerified: true,
				phoneVerified: true,
				stream: {
					select: {
						id: true,
						name: true,
						code: true
					}
				}
			}
		});
	}

	async sendEmailChangeOtp(userId: string, newEmail: string) {
		// Generate OTP for email change
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		
		// Save OTP to database with email change context
		await this.prisma.otp.create({
			data: {
				userId,
				code: otp,
				type: 'EMAIL_CHANGE',
				expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
				metadata: JSON.stringify({ newEmail })
			}
		});

		// Send OTP via email (you'll need to implement email service)
		// For now, we'll just log it
		console.log(`Email change OTP for ${newEmail}: ${otp}`);
		
		// TODO: Implement actual email sending
		return { message: 'OTP sent to new email address' };
	}

	async changeEmail(userId: string, newEmail: string, otpCode: string) {
		// Verify OTP
		const otp = await this.prisma.otp.findFirst({
			where: {
				userId,
				code: otpCode,
				type: 'EMAIL_CHANGE',
				expiresAt: { gt: new Date() },
				used: false
			}
		});

		if (!otp) {
			throw new BadRequestException('Invalid or expired OTP');
		}

		const metadata = JSON.parse(otp.metadata || '{}');
		if (metadata.newEmail !== newEmail) {
			throw new BadRequestException('Email does not match OTP');
		}

		// Update user email and mark OTP as used
		const updatedUser = await this.prisma.$transaction(async (tx) => {
			await tx.otp.update({
				where: { id: otp.id },
				data: { used: true }
			});

			return tx.user.update({
				where: { id: userId },
				data: { email: newEmail, emailVerified: true },
				select: {
					id: true,
					email: true,
					fullName: true,
					phone: true,
					profilePicture: true,
					role: true,
					emailVerified: true,
					phoneVerified: true,
					stream: {
						select: {
							id: true,
							name: true,
							code: true
						}
					}
				}
			});
		});

		return updatedUser;
	}

	async sendPhoneChangeOtp(userId: string, newPhone: string) {
		// Generate OTP for phone change
		const otp = Math.floor(100000 + Math.random() * 900000).toString();
		
		// Save OTP to database with phone change context
		await this.prisma.otp.create({
			data: {
				userId,
				code: otp,
				type: 'PHONE_CHANGE',
				expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
				metadata: JSON.stringify({ newPhone })
			}
		});

		// Send OTP via SMS (you'll need to implement SMS service)
		// For now, we'll just log it
		console.log(`Phone change OTP for ${newPhone}: ${otp}`);
		
		// TODO: Implement actual SMS sending
		return { message: 'OTP sent to new phone number' };
	}

	async changePhone(userId: string, newPhone: string, otpCode: string) {
		// Verify OTP
		const otp = await this.prisma.otp.findFirst({
			where: {
				userId,
				code: otpCode,
				type: 'PHONE_CHANGE',
				expiresAt: { gt: new Date() },
				used: false
			}
		});

		if (!otp) {
			throw new BadRequestException('Invalid or expired OTP');
		}

		const metadata = JSON.parse(otp.metadata || '{}');
		if (metadata.newPhone !== newPhone) {
			throw new BadRequestException('Phone number does not match OTP');
		}

		// Update user phone and mark OTP as used
		const updatedUser = await this.prisma.$transaction(async (tx) => {
			await tx.otp.update({
				where: { id: otp.id },
				data: { used: true }
			});

			return tx.user.update({
				where: { id: userId },
				data: { phone: newPhone, phoneVerified: true },
				select: {
					id: true,
					email: true,
					fullName: true,
					phone: true,
					profilePicture: true,
					role: true,
					emailVerified: true,
					phoneVerified: true,
					stream: {
						select: {
							id: true,
							name: true,
							code: true
						}
					}
				}
			});
		});

		return updatedUser;
	}

	async getProfilePicUploadUrl(userId: string, fileName: string, fileType: string) {
		// Generate unique file name
		const fileExtension = fileName.split('.').pop();
		const uniqueFileName = `profile-pics/${userId}-${Date.now()}.${fileExtension}`;

		// Get presigned URL from AWS S3
		const uploadUrl = await this.awsService.getPresignedUploadUrl(uniqueFileName, fileType);
		
		// Return upload URL and final picture URL
		const pictureUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${uniqueFileName}`;
		
		return {
			uploadUrl,
			pictureUrl
		};
	}

	async changePassword(userId: string, currentPassword: string, newPassword: string) {
		// Get user with password
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { hashedPassword: true }
		});

		if (!user || !user.hashedPassword) {
			throw new BadRequestException('User not found or no password set');
		}

		// Verify current password
		const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.hashedPassword);
		if (!isCurrentPasswordValid) {
			throw new BadRequestException('Current password is incorrect');
		}

		// Hash new password
		const hashedNewPassword = await bcrypt.hash(newPassword, 10);

		// Update password
		await this.prisma.user.update({
			where: { id: userId },
			data: { hashedPassword: hashedNewPassword }
		});

		return { message: 'Password changed successfully' };
	}
} 