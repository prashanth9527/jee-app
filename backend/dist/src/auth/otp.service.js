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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const mailer_service_1 = require("./mailer.service");
const sms_service_1 = require("./sms.service");
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
let OtpService = class OtpService {
    constructor(prisma, mailer, sms) {
        this.prisma = prisma;
        this.mailer = mailer;
        this.sms = sms;
    }
    async sendEmailOtp(userId, email) {
        const code = generateOtp();
        const ttlMin = Number(process.env.OTP_TTL_MIN || 10);
        await this.prisma.otp.create({ data: { userId, code, type: 'EMAIL', target: email, expiresAt: new Date(Date.now() + ttlMin * 60 * 1000) } });
        try {
            await this.mailer.sendOtpEmail(email, code);
        }
        catch (error) {
            console.error('Failed to send email OTP:', error);
        }
    }
    async sendPhoneOtp(userId, phone) {
        const code = generateOtp();
        const ttlMin = Number(process.env.OTP_TTL_MIN || 10);
        await this.prisma.otp.create({ data: { userId, code, type: 'PHONE', target: phone, expiresAt: new Date(Date.now() + ttlMin * 60 * 1000) } });
        try {
            await this.sms.sendOtpSms(phone, code);
        }
        catch (error) {
            console.error('Failed to send SMS OTP:', error);
        }
    }
    async verifyOtp(userId, code, type) {
        const otp = await this.prisma.otp.findFirst({ where: { userId, code, type, consumed: false }, orderBy: { createdAt: 'desc' } });
        if (!otp)
            throw new common_1.BadRequestException('Invalid code');
        if (otp.expiresAt < new Date())
            throw new common_1.BadRequestException('Code expired');
        await this.prisma.otp.update({ where: { id: otp.id }, data: { consumed: true } });
        return true;
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mailer_service_1.MailerService,
        sms_service_1.SmsService])
], OtpService);
//# sourceMappingURL=otp.service.js.map