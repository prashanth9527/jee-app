import { Injectable, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from './mailer.service';
import { SmsService } from './sms.service';

type OtpTypeLiteral = 'EMAIL' | 'PHONE';

function generateOtp(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

interface OtpLimits {
	maxPerHour: number;
	maxPerDay: number;
	cooldownMinutes: number;
}

@Injectable()
export class OtpService {
	private readonly otpLimits: Record<OtpTypeLiteral, OtpLimits> = {
		EMAIL: {
			maxPerHour: 5,
			maxPerDay: 20,
			cooldownMinutes: 1
		},
		PHONE: {
			maxPerHour: 3,
			maxPerDay: 10,
			cooldownMinutes: 2
		}
	};

	constructor(
		private readonly prisma: PrismaService,
		private readonly mailer: MailerService,
		private readonly sms: SmsService,
	) {}

	private async checkOtpLimits(userId: string, type: OtpTypeLiteral): Promise<void> {
		const limits = this.otpLimits[type];
		const now = new Date();
		const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
		const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

		// Check hourly limit
		const hourlyCount = await this.prisma.otp.count({
			where: {
				userId,
				type,
				createdAt: { gte: oneHourAgo }
			}
		});

		if (hourlyCount >= limits.maxPerHour) {
			throw new HttpException(
				`Too many ${type.toLowerCase()} OTP requests. Please wait before requesting another code.`,
				HttpStatus.TOO_MANY_REQUESTS
			);
		}

		// Check daily limit
		const dailyCount = await this.prisma.otp.count({
			where: {
				userId,
				type,
				createdAt: { gte: oneDayAgo }
			}
		});

		if (dailyCount >= limits.maxPerDay) {
			throw new HttpException(
				`Daily limit for ${type.toLowerCase()} OTP requests exceeded. Please try again tomorrow.`,
				HttpStatus.TOO_MANY_REQUESTS
			);
		}

		// Check cooldown period
		const lastOtp = await this.prisma.otp.findFirst({
			where: {
				userId,
				type
			},
			orderBy: { createdAt: 'desc' }
		});

		if (lastOtp) {
			const cooldownMs = limits.cooldownMinutes * 60 * 1000;
			const timeSinceLastOtp = now.getTime() - lastOtp.createdAt.getTime();
			
			if (timeSinceLastOtp < cooldownMs) {
				const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastOtp) / 1000);
				throw new HttpException(
					`Please wait ${remainingSeconds} seconds before requesting another ${type.toLowerCase()} OTP.`,
					HttpStatus.TOO_MANY_REQUESTS
				);
			}
		}
	}

	async sendEmailOtp(userId: string, email: string) {
		// Check rate limits before sending
		await this.checkOtpLimits(userId, 'EMAIL');
		
		const code = generateOtp();
		const ttlMin = Number(process.env.OTP_TTL_MIN || 10);
		await this.prisma.otp.create({ data: { userId, code, type: 'EMAIL', target: email, expiresAt: new Date(Date.now() + ttlMin * 60 * 1000) } });
		
		try {
			await this.mailer.sendOtpEmail(email, code);
		} catch (error) {
			console.error('Failed to send email OTP:', error);
			// Don't throw error - OTP is still created and can be used
		}
	}

	async sendPhoneOtp(userId: string, phone: string) {
		// Check rate limits before sending
		await this.checkOtpLimits(userId, 'PHONE');
		
		const code = generateOtp();
		const ttlMin = Number(process.env.OTP_TTL_MIN || 10);
		await this.prisma.otp.create({ data: { userId, code, type: 'PHONE', target: phone, expiresAt: new Date(Date.now() + ttlMin * 60 * 1000) } });
		
		try {
			await this.sms.sendOtpSms(phone, code);
		} catch (error) {
			console.error('Failed to send SMS OTP:', error);
			// Don't throw error - OTP is still created and can be used
		}
	}

	async verifyOtp(userId: string, code: string, type: OtpTypeLiteral) {
		const otp = await this.prisma.otp.findFirst({ where: { userId, code, type, consumed: false }, orderBy: { createdAt: 'desc' } });
		if (!otp) throw new BadRequestException('Invalid code');
		if (otp.expiresAt < new Date()) throw new BadRequestException('Code expired');
		await this.prisma.otp.update({ where: { id: otp.id }, data: { consumed: true } });
		return true;
	}

	async getOtpUsageStats(userId: string, type: OtpTypeLiteral) {
		const now = new Date();
		const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
		const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

		const [hourlyCount, dailyCount, lastOtp] = await Promise.all([
			this.prisma.otp.count({
				where: {
					userId,
					type,
					createdAt: { gte: oneHourAgo }
				}
			}),
			this.prisma.otp.count({
				where: {
					userId,
					type,
					createdAt: { gte: oneDayAgo }
				}
			}),
			this.prisma.otp.findFirst({
				where: { userId, type },
				orderBy: { createdAt: 'desc' }
			})
		]);

		const limits = this.otpLimits[type];
		const cooldownMs = limits.cooldownMinutes * 60 * 1000;
		const timeSinceLastOtp = lastOtp ? now.getTime() - lastOtp.createdAt.getTime() : null;
		const canRequestNow = !lastOtp || (timeSinceLastOtp && timeSinceLastOtp >= cooldownMs);

		return {
			hourlyCount,
			dailyCount,
			hourlyLimit: limits.maxPerHour,
			dailyLimit: limits.maxPerDay,
			cooldownMinutes: limits.cooldownMinutes,
			canRequestNow,
			timeUntilNextRequest: lastOtp && timeSinceLastOtp && timeSinceLastOtp < cooldownMs 
				? Math.ceil((cooldownMs - timeSinceLastOtp) / 1000) 
				: 0
		};
	}

	// Method for anonymous users (registration) - stricter limits
	async sendPhoneOtpForRegistration(phone: string, ipAddress?: string) {
		// For anonymous users, we use phone number as identifier
		const identifier = `anon_${phone}`;
		
		// Stricter limits for anonymous users
		const anonymousLimits = {
			maxPerHour: 2,
			maxPerDay: 5,
			cooldownMinutes: 5
		};

		const now = new Date();
		const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
		const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

		// Check if phone number has been used recently (prevent spam)
		const recentOtps = await this.prisma.otp.count({
			where: {
				target: phone,
				type: 'PHONE',
				createdAt: { gte: oneHourAgo }
			}
		});

		if (recentOtps >= anonymousLimits.maxPerHour) {
			throw new HttpException(
				'Too many OTP requests for this phone number. Please wait before requesting another code.',
				HttpStatus.TOO_MANY_REQUESTS
			);
		}

		// Check daily limit
		const dailyOtps = await this.prisma.otp.count({
			where: {
				target: phone,
				type: 'PHONE',
				createdAt: { gte: oneDayAgo }
			}
		});

		if (dailyOtps >= anonymousLimits.maxPerDay) {
			throw new HttpException(
				'Daily limit for OTP requests exceeded for this phone number. Please try again tomorrow.',
				HttpStatus.TOO_MANY_REQUESTS
			);
		}

		// Check cooldown
		const lastOtp = await this.prisma.otp.findFirst({
			where: {
				target: phone,
				type: 'PHONE'
			},
			orderBy: { createdAt: 'desc' }
		});

		if (lastOtp) {
			const cooldownMs = anonymousLimits.cooldownMinutes * 60 * 1000;
			const timeSinceLastOtp = now.getTime() - lastOtp.createdAt.getTime();
			
			if (timeSinceLastOtp < cooldownMs) {
				const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastOtp) / 1000);
				throw new HttpException(
					`Please wait ${remainingSeconds} seconds before requesting another OTP.`,
					HttpStatus.TOO_MANY_REQUESTS
				);
			}
		}

		// Generate and send OTP
		const code = generateOtp();
		const ttlMin = Number(process.env.OTP_TTL_MIN || 10);
		
		// Create OTP record with a temporary user ID for anonymous users
		await this.prisma.otp.create({ 
			data: { 
				userId: identifier, // Use phone as temporary identifier
				code, 
				type: 'PHONE', 
				target: phone, 
				expiresAt: new Date(Date.now() + ttlMin * 60 * 1000) 
			} 
		});
		
		try {
			await this.sms.sendOtpSms(phone, code);
		} catch (error) {
			console.error('Failed to send SMS OTP:', error);
			// Don't throw error - OTP is still created and can be used
		}
	}
} 