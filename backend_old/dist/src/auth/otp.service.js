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
const phone_utils_1 = require("./utils/phone.utils");
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
let OtpService = class OtpService {
    constructor(prisma, mailer, sms) {
        this.prisma = prisma;
        this.mailer = mailer;
        this.sms = sms;
        this.otpLimits = {
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
    }
    async checkOtpLimits(userId, type) {
        const limits = this.otpLimits[type];
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const hourlyCount = await this.prisma.otp.count({
            where: {
                userId,
                type,
                createdAt: { gte: oneHourAgo }
            }
        });
        if (hourlyCount >= limits.maxPerHour) {
            throw new common_1.HttpException(`Too many ${type.toLowerCase()} OTP requests. Please wait before requesting another code.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const dailyCount = await this.prisma.otp.count({
            where: {
                userId,
                type,
                createdAt: { gte: oneDayAgo }
            }
        });
        if (dailyCount >= limits.maxPerDay) {
            throw new common_1.HttpException(`Daily limit for ${type.toLowerCase()} OTP requests exceeded. Please try again tomorrow.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
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
                throw new common_1.HttpException(`Please wait ${remainingSeconds} seconds before requesting another ${type.toLowerCase()} OTP.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
        }
    }
    async sendEmailOtp(userId, email) {
        await this.checkOtpLimits(userId, 'EMAIL');
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
        await this.checkOtpLimits(userId, 'PHONE');
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
    async getOtpUsageStats(userId, type) {
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
    async sendPhoneOtpForRegistration(phone, ipAddress) {
        const normalizedPhone = (0, phone_utils_1.normalizeIndianPhone)(phone);
        if (!(0, phone_utils_1.isValidIndianMobile)(normalizedPhone)) {
            throw new common_1.BadRequestException('Please enter a valid 10-digit Indian mobile number');
        }
        const identifier = `anon_${normalizedPhone}`;
        const anonymousLimits = {
            maxPerHour: 2,
            maxPerDay: 5,
            cooldownMinutes: 5
        };
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const recentOtps = await this.prisma.otp.count({
            where: {
                target: normalizedPhone,
                type: 'PHONE',
                createdAt: { gte: oneHourAgo }
            }
        });
        if (recentOtps >= anonymousLimits.maxPerHour) {
            throw new common_1.HttpException('Too many OTP requests for this phone number. Please wait before requesting another code.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const dailyOtps = await this.prisma.otp.count({
            where: {
                target: normalizedPhone,
                type: 'PHONE',
                createdAt: { gte: oneDayAgo }
            }
        });
        if (dailyOtps >= anonymousLimits.maxPerDay) {
            throw new common_1.HttpException('Daily limit for OTP requests exceeded for this phone number. Please try again tomorrow.', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const lastOtp = await this.prisma.otp.findFirst({
            where: {
                target: normalizedPhone,
                type: 'PHONE'
            },
            orderBy: { createdAt: 'desc' }
        });
        if (lastOtp) {
            const cooldownMs = anonymousLimits.cooldownMinutes * 60 * 1000;
            const timeSinceLastOtp = now.getTime() - lastOtp.createdAt.getTime();
            if (timeSinceLastOtp < cooldownMs) {
                const remainingSeconds = Math.ceil((cooldownMs - timeSinceLastOtp) / 1000);
                throw new common_1.HttpException(`Please wait ${remainingSeconds} seconds before requesting another OTP.`, common_1.HttpStatus.TOO_MANY_REQUESTS);
            }
        }
        const code = generateOtp();
        const ttlMin = Number(process.env.OTP_TTL_MIN || 10);
        await this.prisma.otp.create({
            data: {
                userId: identifier,
                code,
                type: 'PHONE',
                target: normalizedPhone,
                expiresAt: new Date(Date.now() + ttlMin * 60 * 1000)
            }
        });
        try {
            await this.sms.sendOtpSms(normalizedPhone, code);
        }
        catch (error) {
            console.error('Failed to send SMS OTP:', error);
        }
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