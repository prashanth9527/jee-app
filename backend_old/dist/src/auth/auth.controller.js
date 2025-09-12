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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const jwt_guard_1 = require("./jwt.guard");
let AuthController = class AuthController {
    constructor(auth) {
        this.auth = auth;
    }
    register(dto) {
        return this.auth.register(dto);
    }
    startRegistration(dto) {
        return this.auth.startRegistration(dto);
    }
    completeRegistration(body) {
        return this.auth.completeRegistration(body.userId, body.otpCode);
    }
    async resendEmailOtp(body) {
        return this.auth.resendEmailOtp(body.userId, body.email);
    }
    completeProfile(req, body) {
        return this.auth.completeProfile(req.user.id, body.phone, body.streamId);
    }
    login(dto, req) {
        const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
        const ipAddress = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return this.auth.login({
            ...dto,
            deviceInfo,
            ipAddress,
            userAgent
        });
    }
    sendEmailOtp(req) {
        return this.auth.sendEmailOtp(req.user.id, req.user.email);
    }
    sendPhoneOtp(req, phone) {
        return this.auth.sendPhoneOtp(req.user.id, phone);
    }
    sendLoginOtp(phone) {
        return this.auth.sendLoginOtp(phone);
    }
    sendEmailLoginOtp(email) {
        return this.auth.sendEmailLoginOtp(email);
    }
    sendPhoneOtpForRegistration(phone, req) {
        const ipAddress = req.ip || req.connection.remoteAddress;
        return this.auth.sendPhoneOtpForRegistration(phone, ipAddress);
    }
    getOtpUsageStats(req, type) {
        return this.auth.getOtpUsageStats(req.user.id, type);
    }
    getVerificationStatus(req) {
        return this.auth.getVerificationStatus(req.user.id);
    }
    verifyEmail(req, code) {
        return this.auth.verifyEmail(req.user.id, code);
    }
    sendPhoneVerificationOtp(req) {
        return this.auth.sendPhoneVerificationOtp(req.user.id);
    }
    verifyPhone(req, code) {
        return this.auth.verifyPhone(req.user.id, code);
    }
    async logout(req) {
        if (req.user.sessionId) {
            await this.auth.logout(req.user.sessionId);
        }
        return { message: 'Logged out successfully' };
    }
    async logoutAllDevices(req) {
        await this.auth.logoutAllDevices(req.user.id);
        return { message: 'Logged out from all devices successfully' };
    }
    async getUserSessions(req) {
        return this.auth.getUserSessions(req.user.id);
    }
    async me(req) {
        const jwtUser = req.user;
        console.log('Auth /me endpoint - JWT User:', {
            id: jwtUser.id,
            email: jwtUser.email,
            role: jwtUser.role
        });
        const currentUser = await this.auth.getUserById(jwtUser.id);
        if (!currentUser) {
            throw new common_1.BadRequestException('User not found');
        }
        const needsProfileCompletion = currentUser.role === 'STUDENT' && (!currentUser.streamId || !currentUser.phone);
        console.log('Auth /me endpoint - Database User data:', {
            id: currentUser.id,
            email: currentUser.email,
            role: currentUser.role,
            streamId: currentUser.streamId,
            phone: currentUser.phone,
            needsProfileCompletion
        });
        return {
            ...currentUser,
            needsProfileCompletion
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('start-registration'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "startRegistration", null);
__decorate([
    (0, common_1.Post)('complete-registration'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "completeRegistration", null);
__decorate([
    (0, common_1.Post)('resend-email-otp'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resendEmailOtp", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('complete-profile'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "completeProfile", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('send-email-otp'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendEmailOtp", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('send-phone-otp'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendPhoneOtp", null);
__decorate([
    (0, common_1.Post)('send-login-otp'),
    __param(0, (0, common_1.Body)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendLoginOtp", null);
__decorate([
    (0, common_1.Post)('send-email-login-otp'),
    __param(0, (0, common_1.Body)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendEmailLoginOtp", null);
__decorate([
    (0, common_1.Post)('send-phone-otp-registration'),
    __param(0, (0, common_1.Body)('phone')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendPhoneOtpForRegistration", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('otp-usage-stats'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getOtpUsageStats", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('verification-status'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getVerificationStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('verify-email'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('send-phone-verification-otp'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "sendPhoneVerificationOtp", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('verify-phone'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyPhone", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Post)('logout-all-devices'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logoutAllDevices", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('sessions'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getUserSessions", null);
__decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map