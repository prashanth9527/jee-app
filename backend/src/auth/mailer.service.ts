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

	async sendBadgeAchievementEmail(to: string, badgeData: {
		userName: string;
		badgeTitle: string;
		badgeDescription: string;
		badgeType: string;
		lessonName: string;
		subjectName: string;
		earnedAt: string;
	}) {
		if (!this.transporter) {
			console.log(`[MailerService] SMTP not configured, skipping badge notification email to ${to}`);
			return;
		}

		const from = process.env.SMTP_FROM || 'no-reply@jeemaster.com';
		const subject = `🏆 Congratulations! You earned a new badge - ${badgeData.badgeTitle}`;

		const getBadgeIcon = (badgeType: string) => {
			const icons: Record<string, string> = {
				COMPLETION: '🏆',
				SPEED_DEMON: '⚡',
				PERFECT_SCORE: '💯',
				PERSEVERANCE: '💪',
				EARLY_BIRD: '🐦',
				NIGHT_OWL: '🦉',
				STREAK_MASTER: '🔥',
				TOP_PERFORMER: '⭐',
				CONTENT_EXPLORER: '🗺️',
				QUIZ_MASTER: '🧠'
			};
			return icons[badgeType] || '🏆';
		};

		const getBadgeColor = (badgeType: string) => {
			const colors: Record<string, string> = {
				COMPLETION: '#fbbf24',
				SPEED_DEMON: '#ef4444',
				PERFECT_SCORE: '#10b981',
				PERSEVERANCE: '#8b5cf6',
				EARLY_BIRD: '#f97316',
				NIGHT_OWL: '#6366f1',
				STREAK_MASTER: '#ec4899',
				TOP_PERFORMER: '#3b82f6',
				CONTENT_EXPLORER: '#14b8a6',
				QUIZ_MASTER: '#6b7280'
			};
			return colors[badgeType] || '#fbbf24';
		};

		const badgeColor = getBadgeColor(badgeData.badgeType);
		const badgeIcon = getBadgeIcon(badgeData.badgeType);

		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Badge Achievement</title>
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
					.container { max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
					.content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
					.badge-container { background: linear-gradient(135deg, ${badgeColor}, ${badgeColor}dd); border-radius: 15px; padding: 30px; text-align: center; margin: 20px 0; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }
					.badge-icon { font-size: 60px; margin-bottom: 15px; }
					.badge-title { font-size: 28px; font-weight: bold; color: white; margin-bottom: 10px; }
					.badge-description { font-size: 16px; color: rgba(255,255,255,0.9); margin-bottom: 20px; }
					.achievement-details { background: #f8fafc; border-radius: 10px; padding: 20px; margin: 20px 0; }
					.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
					.detail-row:last-child { border-bottom: none; }
					.detail-label { font-weight: 600; color: #374151; }
					.detail-value { color: #6b7280; }
					.celebration { text-align: center; margin: 30px 0; }
					.celebration h3 { color: #059669; font-size: 24px; margin-bottom: 10px; }
					.celebration p { color: #6b7280; font-size: 16px; }
					.cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
					.footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #6b7280; }
					.social-proof { background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin: 20px 0; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>🎓 JEE Master</h1>
						<p>Badge Achievement Notification</p>
					</div>
					<div class="content">
						<h2>Congratulations, ${badgeData.userName}! 🎉</h2>
						<p>You've just earned a new badge! Your dedication and hard work in learning is paying off.</p>
						
						<div class="badge-container">
							<div class="badge-icon">${badgeIcon}</div>
							<div class="badge-title">${badgeData.badgeTitle}</div>
							<div class="badge-description">${badgeData.badgeDescription}</div>
						</div>

						<div class="achievement-details">
							<div class="detail-row">
								<span class="detail-label">📚 Lesson:</span>
								<span class="detail-value">${badgeData.lessonName}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">📖 Subject:</span>
								<span class="detail-value">${badgeData.subjectName}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">🏆 Badge Type:</span>
								<span class="detail-value">${badgeData.badgeType.replace('_', ' ')}</span>
							</div>
							<div class="detail-row">
								<span class="detail-label">📅 Earned On:</span>
								<span class="detail-value">${new Date(badgeData.earnedAt).toLocaleDateString('en-US', { 
									year: 'numeric', 
									month: 'long', 
									day: 'numeric',
									hour: '2-digit',
									minute: '2-digit'
								})}</span>
							</div>
						</div>

						<div class="celebration">
							<h3>🌟 Keep Up the Great Work!</h3>
							<p>Each badge you earn represents a milestone in your JEE preparation journey. You're building the knowledge and skills that will help you succeed in your exams.</p>
						</div>

						<div class="social-proof">
							<p><strong>💡 Pro Tip:</strong> Share your achievements with friends and family! Your progress is inspiring and can motivate others to start their own learning journey.</p>
						</div>

						<div style="text-align: center;">
							<a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/student/badges" class="cta-button">
								🏆 View All My Badges
							</a>
						</div>

						<p>Continue your learning journey and earn more badges by:</p>
						<ul>
							<li>📖 Completing lessons and topics</li>
							<li>🎯 Achieving high scores in practice tests</li>
							<li>⏰ Maintaining consistent study habits</li>
							<li>🧠 Exploring all available learning content</li>
						</ul>

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

		try {
			await this.transporter.sendMail({
				from,
				to,
				subject,
				html: htmlContent
			});
			console.log(`[MailerService] Badge achievement email sent to ${to} for badge: ${badgeData.badgeTitle}`);
		} catch (error) {
			console.error(`[MailerService] Failed to send badge achievement email to ${to}:`, error);
			throw error;
		}
	}

	async sendReferralCodeEmail(to: string, referralCode: string, referrerName: string, registrationUrl: string) {
		if (!this.transporter) {
			console.log(`[MailerService] SMTP not configured, skipping referral email to ${to}. Code: ${referralCode}`);
			return;
		}

		const from = process.env.SMTP_FROM || 'no-reply@jeemaster.com';
		const subject = `${referrerName} invited you to join JEE Master!`;

		const htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Referral Invitation</title>
				<style>
					body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f8fafc; }
					.container { max-width: 600px; margin: 0 auto; padding: 20px; }
					.header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
					.content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
					.code-container { background: #f3f4f6; border: 2px solid #3b82f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
					.code { font-size: 32px; font-weight: bold; color: #3b82f6; letter-spacing: 4px; font-family: monospace; }
					.button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
					.benefits { background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 20px; margin: 20px 0; }
					.benefits ul { margin: 10px 0; padding-left: 20px; }
					.footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #6b7280; }
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<h1>🎓 JEE Master</h1>
						<p>You've been invited!</p>
					</div>
					<div class="content">
						<h2>Hello!</h2>
						<p><strong>${referrerName}</strong> has invited you to join <strong>JEE Master</strong> - the ultimate platform for JEE preparation!</p>
						
						<div class="code-container">
							<p style="margin: 0 0 10px 0; font-size: 16px; color: #6b7280;">Your referral code:</p>
							<div class="code">${referralCode}</div>
						</div>

						<div style="text-align: center;">
							<a href="${registrationUrl}" class="button">
								🚀 Sign Up Now & Get Rewards!
							</a>
						</div>

						<div class="benefits">
							<h3 style="margin-top: 0; color: #1e40af;">🎁 Special Benefits for You:</h3>
							<ul>
								<li><strong>3 days free subscription</strong> when you sign up using this code</li>
								<li>Access to thousands of practice questions</li>
								<li>AI-powered learning recommendations</li>
								<li>Detailed performance analytics</li>
								<li>Previous year question papers</li>
							</ul>
						</div>

						<p><strong>How to use your referral code:</strong></p>
						<ol>
							<li>Click the button above or visit: <a href="${registrationUrl}">${registrationUrl}</a></li>
							<li>Create your account</li>
							<li>Enter the referral code: <strong>${referralCode}</strong> during registration</li>
							<li>Start your JEE preparation journey!</li>
						</ol>

						<p><strong>What happens next?</strong></p>
						<p>When you subscribe to JEE Master, both you and ${referrerName} will receive rewards! It's a win-win situation.</p>

						<p>Don't miss out on this opportunity to excel in your JEE preparation!</p>

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
			JEE Master - Referral Invitation
			
			Hello!
			
			${referrerName} has invited you to join JEE Master - the ultimate platform for JEE preparation!
			
			Your referral code: ${referralCode}
			
			Sign up here: ${registrationUrl}
			
			Special Benefits for You:
			- 3 days free subscription when you sign up using this code
			- Access to thousands of practice questions
			- AI-powered learning recommendations
			- Detailed performance analytics
			- Previous year question papers
			
			How to use your referral code:
			1. Visit: ${registrationUrl}
			2. Create your account
			3. Enter the referral code: ${referralCode} during registration
			4. Start your JEE preparation journey!
			
			What happens next?
			When you subscribe to JEE Master, both you and ${referrerName} will receive rewards!
			
			Best regards,
			The JEE Master Team
			
			---
			This is an automated message. Please do not reply to this email.
			© 2024 JEE Master. All rights reserved.
		`;

		try {
			await this.transporter.sendMail({
				from,
				to,
				subject,
				text: textContent,
				html: htmlContent
			});
			console.log(`[MailerService] Referral email sent to ${to} with code: ${referralCode}`);
		} catch (error) {
			console.error(`[MailerService] Failed to send referral email to ${to}:`, error);
			throw error;
		}
	}
} 