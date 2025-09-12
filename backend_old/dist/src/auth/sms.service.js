"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const Twilio = require("twilio");
let SmsService = SmsService_1 = class SmsService {
    constructor() {
        this.logger = new common_1.Logger(SmsService_1.name);
        if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
            this.client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
        }
    }
    async sendOtpSms(phone, otp) {
        try {
            let formattedNumber = phone;
            if (!phone.startsWith('+')) {
                formattedNumber = '+91' + phone.replace(/^0/, '');
            }
            const message = await this.client.messages.create({
                to: formattedNumber,
                from: process.env.TWILIO_PHONE_NUMBER,
                body: `Your OTP is: ${otp}`,
            });
            this.logger.log(`OTP sent to ${formattedNumber}, SID: ${message.sid}`);
            return { success: true, sid: message.sid };
        }
        catch (error) {
            if (error.code === 21408) {
                this.logger.error(`Twilio permission error: cannot send SMS to ${phone}. ${error.moreInfo}`);
                throw new Error(`Cannot send SMS to this number. Verify it in Twilio or upgrade your account.`);
            }
            else {
                this.logger.error(`Failed to send SMS: ${error.message}`);
                throw new Error(`Failed to send SMS: ${error.message}`);
            }
        }
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SmsService);
//# sourceMappingURL=sms.service.js.map