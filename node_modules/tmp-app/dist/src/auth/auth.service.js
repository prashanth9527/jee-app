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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const otp_service_1 = require("./otp.service");
const referrals_service_1 = require("../referrals/referrals.service");
let AuthService = class AuthService {
    constructor(users, jwt, otp, referralsService) {
        this.users = users;
        this.jwt = jwt;
        this.otp = otp;
        this.referralsService = referralsService;
    }
    async register(params) {
        const existing = await this.users.findByEmail(params.email);
        if (existing)
            throw new common_1.BadRequestException('Email already registered');
        const hashedPassword = await bcrypt.hash(params.password, 10);
        const user = await this.users.createUser({ email: params.email, fullName: params.fullName, hashedPassword, phone: params.phone });
        const days = Number(process.env.FREE_TRIAL_DAYS || 2);
        const started = new Date();
        const ends = new Date(started.getTime() + days * 24 * 60 * 60 * 1000);
        await this.users.updateTrial(user.id, started, ends);
        if (params.referralCode) {
            try {
                await this.referralsService.applyReferralCode(user.id, params.referralCode);
            }
            catch (error) {
                console.error('Failed to apply referral code:', error);
            }
        }
        await this.otp.sendEmailOtp(user.id, user.email);
        if (user.phone)
            await this.otp.sendPhoneOtp(user.id, user.phone);
        return { id: user.id, email: user.email };
    }
    async login(params) {
        console.log('Login attempt for email:', params.email);
        const user = await this.users.findByEmail(params.email);
        if (!user) {
            console.log('User not found');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        console.log('User found:', { id: user.id, email: user.email, role: user.role });
        const ok = await bcrypt.compare(params.password, user.hashedPassword);
        console.log('Password comparison result:', ok);
        if (!ok) {
            console.log('Password mismatch');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const token = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
        const response = {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        };
        console.log('Login successful, returning:', response);
        return response;
    }
    async sendEmailOtp(userId, email) {
        await this.otp.sendEmailOtp(userId, email);
        return { ok: true };
    }
    async sendPhoneOtp(userId, phone) {
        await this.otp.sendPhoneOtp(userId, phone);
        return { ok: true };
    }
    async verifyEmail(userId, code) {
        await this.otp.verifyOtp(userId, code, 'EMAIL');
        await this.users.setEmailVerified(userId);
        return { ok: true };
    }
    async verifyPhone(userId, code) {
        await this.otp.verifyOtp(userId, code, 'PHONE');
        await this.users.setPhoneVerified(userId);
        return { ok: true };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        otp_service_1.OtpService,
        referrals_service_1.ReferralsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map