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
				tls: {
					rejectUnauthorized: false // Allow self-signed certificates in development
				}
			});
		}
	}

	async sendOtpEmail(to: string, code: string) {
		if (!this.transporter) {
			console.log(`[MailerService] SMTP not configured, skipping email to ${to}. OTP: ${code}`);
			return;
		}
		
		const from = process.env.SMTP_FROM || 'no-reply@jeemaster.com';
		const subject = 'Email Verification Code - JEE Master';
		
		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Email Verification</title>
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
					.container { max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background: linear-gradient(135deg, #f97316, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
					.content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
					.otp-code { background: #f3f4f6; border: 2px solid #f97316; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
					.otp-digits { font-size: 32px; font-weight: bold; color: #f97316; letter-spacing: 8px; font-family: monospace; }
					.footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #6b7280; }
					.button { display: inline-block; background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>🎓 JEE Master</h1>
						<p>Email Verification Required</p>
					</div>
					<div class="content">
						<h2>Welcome to JEE Master!</h2>
						<p>Thank you for registering with JEE Master. To complete your account setup and start your JEE preparation journey, please verify your email address using the code below:</p>
						
						<div class="otp-code">
							<p style="margin: 0 0 10px 0; font-size: 16px; color: #6b7280;">Your verification code:</p>
							<div class="otp-digits">${code}</div>
						</div>
						
						<p><strong>Important:</strong></p>
						<ul>
							<li>This code will expire in <strong>5 minutes</strong></li>
							<li>Enter this code exactly as shown above</li>
							<li>Do not share this code with anyone</li>
						</ul>
						
						<p>If you didn't create an account with JEE Master, please ignore this email.</p>
						
						<p>Best regards,<br>
						<strong>The JEE Master Team</strong></p>
					</div>
					<div class="footer">
						<p>This is an automated message. Please do not reply to this email.</p>
						<p>© 2024 JEE Master. All rights reserved.</p>
					</div>
				</div>
			</body>
			</html>
		`;
		
		const textContent = `
			JEE Master - Email Verification
			
			Welcome to JEE Master!
			
			Thank you for registering with JEE Master. To complete your account setup, please verify your email address using the code below:
			
			Your verification code: ${code}
			
			Important:
			- This code will expire in 5 minutes
			- Enter this code exactly as shown above
			- Do not share this code with anyone
			
			If you didn't create an account with JEE Master, please ignore this email.
			
			Best regards,
			The JEE Master Team
			
			---
			This is an automated message. Please do not reply to this email.
			© 2024 JEE Master. All rights reserved.
		`;
		
		await this.transporter.sendMail({ 
			from, 
			to, 
			subject, 
			text: textContent,
			html: htmlContent
		});
	}
} 