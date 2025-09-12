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
const bcrypt = require("bcryptjs");
const otp_service_1 = require("./otp.service");
const referrals_service_1 = require("../referrals/referrals.service");
const prisma_service_1 = require("../prisma/prisma.service");
const session_service_1 = require("./session.service");
let AuthService = class AuthService {
    constructor(users, jwt, otp, referralsService, prisma, sessionService) {
        this.users = users;
        this.jwt = jwt;
        this.otp = otp;
        this.referralsService = referralsService;
        this.prisma = prisma;
        this.sessionService = sessionService;
    }
    async register(params) {
        let normalizedPhone = params.phone;
        normalizedPhone = normalizedPhone.replace(/[\s\-\(\)]/g, '');
        if (normalizedPhone.startsWith('+91')) {
        }
        else if (normalizedPhone.startsWith('91')) {
            normalizedPhone = '+' + normalizedPhone;
        }
        else if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '+91' + normalizedPhone.substring(1);
        }
        else {
            normalizedPhone = '+91' + normalizedPhone;
        }
        if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
            throw new common_1.BadRequestException('Please enter a valid 10-digit Indian mobile number');
        }
        const existingEmail = await this.users.findByEmail(params.email);
        if (existingEmail)
            throw new common_1.BadRequestException('Email already registered');
        const existingPhone = await this.users.findByPhone(normalizedPhone);
        if (existingPhone)
            throw new common_1.BadRequestException('Phone number already registered');
        const stream = await this.prisma.stream.findUnique({
            where: { id: params.streamId, isActive: true }
        });
        if (!stream)
            throw new common_1.BadRequestException('Invalid stream selected');
        const hashedPassword = await bcrypt.hash(params.password, 10);
        const user = await this.users.createUser({
            email: params.email,
            fullName: params.fullName,
            hashedPassword,
            phone: normalizedPhone,
            streamId: params.streamId
        });
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
    async startRegistration(params) {
        let normalizedPhone = params.phone;
        normalizedPhone = normalizedPhone.replace(/[\s\-\(\)]/g, '');
        if (normalizedPhone.startsWith('+91')) {
        }
        else if (normalizedPhone.startsWith('91')) {
            normalizedPhone = '+' + normalizedPhone;
        }
        else if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '+91' + normalizedPhone.substring(1);
        }
        else {
            normalizedPhone = '+91' + normalizedPhone;
        }
        if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
            throw new common_1.BadRequestException('Please enter a valid 10-digit Indian mobile number');
        }
        const existingEmail = await this.users.findByEmail(params.email);
        if (existingEmail)
            throw new common_1.BadRequestException('Email already registered');
        const existingPhone = await this.users.findByPhone(normalizedPhone);
        if (existingPhone)
            throw new common_1.BadRequestException('Phone number already registered');
        const stream = await this.prisma.stream.findUnique({
            where: { id: params.streamId, isActive: true }
        });
        if (!stream)
            throw new common_1.BadRequestException('Invalid stream selected');
        const hashedPassword = await bcrypt.hash(params.password, 10);
        const user = await this.users.createUser({
            email: params.email,
            fullName: params.fullName,
            hashedPassword,
            phone: normalizedPhone,
            streamId: params.streamId,
            emailVerified: false
        });
        await this.otp.sendEmailOtp(user.id, user.email);
        await this.otp.sendPhoneOtp(user.id, user.phone);
        return {
            id: user.id,
            email: user.email,
            message: 'Registration initiated. Please check your email and phone for OTP verification.'
        };
    }
    async completeRegistration(userId, otpCode) {
        await this.otp.verifyOtp(userId, otpCode, 'EMAIL');
        await this.users.setEmailVerified(userId);
        const days = Number(process.env.FREE_TRIAL_DAYS || 2);
        const started = new Date();
        const ends = new Date(started.getTime() + days * 24 * 60 * 60 * 1000);
        await this.users.updateTrial(userId, started, ends);
        const user = await this.users.findById(userId);
        if (!user)
            throw new common_1.BadRequestException('User not found');
        if (user.phone) {
            await this.otp.sendPhoneOtp(user.id, user.phone);
        }
        const sessionId = await this.sessionService.createSession(user.id);
        const token = this.jwt.sign({
            sub: user.id,
            email: user.email,
            role: user.role,
            sessionId: sessionId
        });
        return {
            access_token: token,
            message: 'Registration completed successfully!',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                emailVerified: user.emailVerified
            }
        };
    }
    async resendEmailOtp(userId, email) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (user.email !== email) {
            throw new common_1.BadRequestException('Email mismatch');
        }
        if (user.emailVerified) {
            throw new common_1.BadRequestException('Email already verified');
        }
        await this.otp.sendEmailOtp(userId, email);
        return {
            message: 'Email OTP sent successfully'
        };
    }
    async completeProfile(userId, phone, streamId) {
        console.log('Complete profile called with:', { userId, phone, streamId });
        const currentUser = await this.prisma.user.findUnique({
            where: { id: userId }
        });
        if (!currentUser)
            throw new common_1.BadRequestException('User not found');
        console.log('Current user data:', {
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.role,
            currentPhone: currentUser.phone,
            currentStreamId: currentUser.streamId
        });
        const existingUserWithPhone = await this.prisma.user.findFirst({
            where: {
                phone: phone,
                id: { not: userId }
            }
        });
        if (existingUserWithPhone) {
            throw new common_1.BadRequestException('This phone number is already registered with another account');
        }
        if (currentUser.role !== 'ADMIN' && streamId) {
            const stream = await this.prisma.stream.findUnique({
                where: { id: streamId, isActive: true }
            });
            if (!stream)
                throw new common_1.BadRequestException('Invalid stream selected');
        }
        const updateData = { phone };
        if (streamId) {
            updateData.streamId = streamId;
        }
        try {
            const user = await this.prisma.user.update({
                where: { id: userId },
                data: updateData,
                include: {
                    stream: true,
                    subscriptions: {
                        include: {
                            plan: true
                        }
                    }
                }
            });
            console.log('Profile updated successfully:', {
                id: user.id,
                phone: user.phone,
                streamId: user.streamId,
                stream: user.stream
            });
            await this.otp.sendPhoneOtp(user.id, phone);
            return {
                message: 'Profile completed successfully!',
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    phone: user.phone,
                    stream: user.stream,
                    emailVerified: user.emailVerified
                }
            };
        }
        catch (error) {
            if (error.code === 'P2002') {
                if (error.meta?.target?.includes('phone')) {
                    throw new common_1.BadRequestException('This phone number is already registered with another account');
                }
                throw new common_1.BadRequestException('A field with this value already exists');
            }
            throw error;
        }
    }
    async login(params) {
        if (params.phone && params.otpCode) {
            return this.loginWithPhoneOtp(params.phone, params.otpCode, params.deviceInfo, params.ipAddress, params.userAgent);
        }
        if (params.email && params.otpCode && !params.password) {
            return this.loginWithEmailOtp(params.email, params.otpCode, params.deviceInfo, params.ipAddress, params.userAgent);
        }
        if (params.email && params.password) {
            return this.loginWithPassword(params.email, params.password, params.deviceInfo, params.ipAddress, params.userAgent);
        }
        throw new common_1.BadRequestException('Invalid login parameters. Provide either email/password, email/otpCode, or phone/otpCode.');
    }
    async loginWithPassword(email, password, deviceInfo, ipAddress, userAgent) {
        console.log('Login attempt for email:', email);
        const user = await this.users.findByEmail(email);
        if (!user) {
            console.log('User not found');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        console.log('User found:', { id: user.id, email: user.email, role: user.role });
        if (!user.hashedPassword) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const ok = await bcrypt.compare(password, user.hashedPassword);
        console.log('Password comparison result:', ok);
        if (!ok) {
            console.log('Password mismatch');
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const sessionId = await this.sessionService.createSession(user.id, deviceInfo, ipAddress, userAgent);
        const token = await this.jwt.signAsync({
            sub: user.id,
            email: user.email,
            role: user.role,
            sessionId: sessionId
        });
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
    async loginWithPhoneOtp(phone, otpCode, deviceInfo, ipAddress, userAgent) {
        let normalizedPhone = phone;
        normalizedPhone = normalizedPhone.replace(/[\s\-\(\)]/g, '');
        if (normalizedPhone.startsWith('+91')) {
        }
        else if (normalizedPhone.startsWith('91')) {
            normalizedPhone = '+' + normalizedPhone;
        }
        else if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '+91' + normalizedPhone.substring(1);
        }
        else {
            normalizedPhone = '+91' + normalizedPhone;
        }
        console.log('Phone OTP login attempt for phone:', normalizedPhone);
        const user = await this.users.findByPhone(normalizedPhone);
        if (!user) {
            console.log('User not found with phone:', normalizedPhone);
            throw new common_1.UnauthorizedException('Invalid phone number or OTP');
        }
        console.log('User found:', { id: user.id, email: user.email, role: user.role });
        await this.otp.verifyOtp(user.id, otpCode, 'PHONE');
        const sessionId = await this.sessionService.createSession(user.id, deviceInfo, ipAddress, userAgent);
        const token = await this.jwt.signAsync({
            sub: user.id,
            email: user.email,
            role: user.role,
            sessionId: sessionId
        });
        const response = {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        };
        console.log('Phone OTP login successful, returning:', response);
        return response;
    }
    async loginWithEmailOtp(email, otpCode, deviceInfo, ipAddress, userAgent) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new common_1.UnauthorizedException('Please enter a valid email address');
        }
        console.log('Email OTP login attempt for email:', email);
        const user = await this.users.findByEmail(email);
        if (!user) {
            console.log('User not found with email:', email);
            throw new common_1.UnauthorizedException('Invalid email address or OTP');
        }
        console.log('User found:', { id: user.id, email: user.email, role: user.role });
        await this.otp.verifyOtp(user.id, otpCode, 'EMAIL');
        const sessionId = await this.sessionService.createSession(user.id, deviceInfo, ipAddress, userAgent);
        const token = await this.jwt.signAsync({
            sub: user.id,
            email: user.email,
            role: user.role,
            sessionId: sessionId
        });
        const response = {
            access_token: token,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role
            }
        };
        console.log('Email OTP login successful, returning:', response);
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
    async sendLoginOtp(phone) {
        let normalizedPhone = phone;
        normalizedPhone = normalizedPhone.replace(/[\s\-\(\)]/g, '');
        if (normalizedPhone.startsWith('+91')) {
        }
        else if (normalizedPhone.startsWith('91')) {
            normalizedPhone = '+' + normalizedPhone;
        }
        else if (normalizedPhone.startsWith('0')) {
            normalizedPhone = '+91' + normalizedPhone.substring(1);
        }
        else {
            normalizedPhone = '+91' + normalizedPhone;
        }
        if (!/^\+91[6-9]\d{9}$/.test(normalizedPhone)) {
            throw new common_1.UnauthorizedException('Please enter a valid 10-digit Indian mobile number');
        }
        const user = await this.users.findByPhone(normalizedPhone);
        if (!user) {
            throw new common_1.UnauthorizedException('No account found with this phone number');
        }
        await this.otp.sendPhoneOtp(user.id, normalizedPhone);
        return { ok: true, message: 'OTP sent to your phone number' };
    }
    async sendEmailLoginOtp(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            throw new common_1.UnauthorizedException('Please enter a valid email address');
        }
        const user = await this.users.findByEmail(email);
        if (!user) {
            throw new common_1.UnauthorizedException('No account found with this email address');
        }
        await this.otp.sendEmailOtp(user.id, email);
        return { ok: true, message: 'OTP sent to your email address' };
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
    async generateJwtToken(user) {
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role
        };
        return this.jwt.signAsync(payload);
    }
    async getUserById(userId) {
        const user = await this.users.findById(userId);
        console.log('getUserById called for userId:', userId);
        console.log('User found:', user ? {
            id: user.id,
            email: user.email,
            role: user.role,
            phone: user.phone,
            streamId: user.streamId
        } : 'User not found');
        return user;
    }
    async sendPhoneOtpForRegistration(phone, ipAddress) {
        await this.otp.sendPhoneOtpForRegistration(phone, ipAddress);
        return { ok: true };
    }
    async getOtpUsageStats(userId, type) {
        return this.otp.getOtpUsageStats(userId, type);
    }
    async sendPhoneVerificationOtp(userId) {
        const user = await this.users.findById(userId);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (!user.phone) {
            throw new common_1.BadRequestException('No phone number found. Please add a phone number to your profile first.');
        }
        if (user.phoneVerified) {
            throw new common_1.BadRequestException('Phone number is already verified');
        }
        await this.otp.sendPhoneOtp(userId, user.phone);
        return {
            ok: true,
            message: 'Phone verification OTP sent successfully',
            phone: user.phone ? user.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2') : null
        };
    }
    async getVerificationStatus(userId) {
        const user = await this.users.findById(userId);
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        return {
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
            hasPhone: !!user.phone,
            phone: user.phone ? user.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2') : null,
            needsPhoneVerification: !!user.phone && !user.phoneVerified,
            canVerifyPhone: !!user.phone && !user.phoneVerified
        };
    }
    async logout(sessionId) {
        await this.sessionService.invalidateSession(sessionId);
    }
    async logoutAllDevices(userId) {
        await this.sessionService.invalidateAllUserSessions(userId);
    }
    async getUserSessions(userId) {
        return this.sessionService.getUserActiveSessions(userId);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        otp_service_1.OtpService,
        referrals_service_1.ReferralsService,
        prisma_service_1.PrismaService,
        session_service_1.SessionService])
], AuthService);
//# sourceMappingURL=auth.service.js.map