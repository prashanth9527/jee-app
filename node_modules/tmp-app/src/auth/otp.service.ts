import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from './mailer.service';
import { SmsService } from './sms.service';

type OtpTypeLiteral = 'EMAIL' | 'PHONE';

function generateOtp(): string {
	return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class OtpService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly mailer: MailerService,
		private readonly sms: SmsService,
	) {}

	async sendEmailOtp(userId: string, email: string) {
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
} 