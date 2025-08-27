import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
	private transporter: any;

	constructor() {
		// Only create transporter if SMTP configuration is available
		if (process.env.SMTP_HOST) {
			this.transporter = nodemailer.createTransport({
				host: process.env.SMTP_HOST,
				port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
				secure: false,
				auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
					user: process.env.SMTP_USER,
					pass: process.env.SMTP_PASS,
				} : undefined,
			});
		}
	}

	async sendOtpEmail(to: string, code: string) {
		if (!this.transporter) {
			console.log(`[MailerService] SMTP not configured, skipping email to ${to}. OTP: ${code}`);
			return;
		}
		const from = process.env.SMTP_FROM || 'no-reply@example.com';
		await this.transporter.sendMail({ from, to, subject: 'Your Verification Code', text: `Your OTP is ${code}` });
	}
} 