import { Injectable, Logger } from '@nestjs/common';
import * as Twilio from 'twilio';

@Injectable()
export class SmsService {
	private readonly logger = new Logger(SmsService.name);
	private client: any;

	constructor() {
		// Only create client if Twilio configuration is available
		if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
			this.client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
		}
	}

	async sendOtpSms(phone: string, otp: string) {
		try {
		  // Convert Indian numbers to E.164 format
		  let formattedNumber = phone;
		  if (!phone.startsWith('+')) {
			// Assuming Indian numbers
			formattedNumber = '+91' + phone.replace(/^0/, '');
		  }
	
		  const message = await this.client.messages.create({
			to: formattedNumber,
			from: process.env.TWILIO_PHONE_NUMBER, // Must be a valid Twilio number
			body: `Your OTP is: ${otp}`,
		  });
	
		  this.logger.log(`OTP sent to ${formattedNumber}, SID: ${message.sid}`);
		  return { success: true, sid: message.sid };
		} catch (error: any) {
		  if (error.code === 21408) {
			this.logger.error(
			  `Twilio permission error: cannot send SMS to ${phone}. ${error.moreInfo}`
			);
			throw new Error(
			  `Cannot send SMS to this number. Verify it in Twilio or upgrade your account.`
			);
		  } else {
			this.logger.error(`Failed to send SMS: ${error.message}`);
			throw new Error(`Failed to send SMS: ${error.message}`);
		  }
		}
	  }
} 