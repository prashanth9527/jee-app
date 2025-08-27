import { Injectable } from '@nestjs/common';
import * as Twilio from 'twilio';

@Injectable()
export class SmsService {
	private client: any;

	constructor() {
		// Only create client if Twilio configuration is available
		if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
			this.client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
		}
	}

	async sendOtpSms(to: string, code: string) {
		if (!this.client) {
			console.log(`[SmsService] Twilio not configured, skipping SMS to ${to}. OTP: ${code}`);
			return;
		}
		const from = process.env.TWILIO_FROM || '';
		if (!from) {
			console.log(`[SmsService] Twilio FROM number not configured, skipping SMS to ${to}`);
			return;
		}
		await this.client.messages.create({ from, to, body: `Your OTP is ${code}` });
	}
} 