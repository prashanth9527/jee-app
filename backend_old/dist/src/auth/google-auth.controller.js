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
exports.GoogleAuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const prisma_service_1 = require("../prisma/prisma.service");
const oauth_state_service_1 = require("./oauth-state.service");
const phone_utils_1 = require("./utils/phone.utils");
const axios_1 = require("axios");
let GoogleAuthController = class GoogleAuthController {
    constructor(authService, prisma, oauthStateService) {
        this.authService = authService;
        this.prisma = prisma;
        this.oauthStateService = oauthStateService;
        this.usedCodes = new Set();
    }
    async generateState(stateData) {
        try {
            const { redirectUri } = stateData;
            const state = await this.oauthStateService.generateState('google', redirectUri);
            return {
                state,
                message: 'OAuth state generated successfully'
            };
        }
        catch (error) {
            console.error('Error generating OAuth state:', error);
            throw new common_1.HttpException('Failed to generate OAuth state', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async googleLogin(googleData) {
        try {
            const { googleId, email, name, picture } = googleData;
            if (!googleId || !email || !name) {
                throw new common_1.HttpException('Missing required Google user data', common_1.HttpStatus.BAD_REQUEST);
            }
            let user = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        { googleId: googleId },
                        { email: email }
                    ]
                },
                include: {
                    stream: true,
                    subscriptions: {
                        include: {
                            plan: true
                        }
                    }
                }
            });
            if (user) {
                if (!user.googleId) {
                    user = await this.prisma.user.update({
                        where: { id: user.id },
                        data: {
                            googleId: googleId,
                            profilePicture: picture || user.profilePicture
                        },
                        include: {
                            stream: true,
                            subscriptions: {
                                include: {
                                    plan: true
                                }
                            }
                        }
                    });
                }
            }
            else {
                user = await this.prisma.user.create({
                    data: {
                        googleId: googleId,
                        email: email,
                        fullName: name,
                        profilePicture: picture,
                        emailVerified: true,
                        role: 'STUDENT',
                        streamId: null
                    },
                    include: {
                        stream: true,
                        subscriptions: {
                            include: {
                                plan: true
                            }
                        }
                    }
                });
            }
            const token = await this.authService.generateJwtToken(user);
            const needsProfileCompletion = user.role === 'STUDENT' && (!user.streamId || !user.phone);
            return {
                access_token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    profilePicture: user.profilePicture,
                    emailVerified: user.emailVerified,
                    stream: user.stream,
                    subscriptions: user.subscriptions,
                    needsProfileCompletion
                }
            };
        }
        catch (error) {
            console.error('Google login error:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Google authentication failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async googleRegister(googleData) {
        try {
            const { googleId, email, name, picture, streamId, phone } = googleData;
            if (!googleId || !email || !name) {
                throw new common_1.HttpException('Missing required Google user data', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!phone) {
                throw new common_1.HttpException('Phone number is required for registration', common_1.HttpStatus.BAD_REQUEST);
            }
            const normalizedPhone = (0, phone_utils_1.normalizeIndianPhone)(phone);
            if (!(0, phone_utils_1.isValidIndianMobile)(normalizedPhone)) {
                throw new common_1.HttpException('Please enter a valid 10-digit Indian mobile number', common_1.HttpStatus.BAD_REQUEST);
            }
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        { googleId: googleId },
                        { email: email },
                        { phone: normalizedPhone }
                    ]
                }
            });
            if (existingUser) {
                throw new common_1.HttpException('User already exists with this email, phone number, or Google account', common_1.HttpStatus.CONFLICT);
            }
            const userData = {
                googleId: googleId,
                email: email,
                fullName: name,
                profilePicture: picture,
                phone: normalizedPhone,
                emailVerified: true,
                role: 'STUDENT'
            };
            if (streamId) {
                const stream = await this.prisma.stream.findUnique({
                    where: { id: streamId }
                });
                if (!stream) {
                    throw new common_1.HttpException('Invalid stream selected', common_1.HttpStatus.BAD_REQUEST);
                }
                userData.streamId = streamId;
            }
            const user = await this.prisma.user.create({
                data: userData,
                include: {
                    stream: true,
                    subscriptions: {
                        include: {
                            plan: true
                        }
                    }
                }
            });
            const token = await this.authService.generateJwtToken(user);
            return {
                access_token: token,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    profilePicture: user.profilePicture,
                    emailVerified: user.emailVerified,
                    stream: user.stream,
                    subscriptions: user.subscriptions
                }
            };
        }
        catch (error) {
            console.error('Google registration error:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Google registration failed', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async exchangeToken(tokenData) {
        try {
            const { code, redirectUri, state } = tokenData;
            if (!code || !redirectUri) {
                throw new common_1.HttpException('Missing code or redirectUri', common_1.HttpStatus.BAD_REQUEST);
            }
            if (this.usedCodes.has(code)) {
                console.log('Authorization code already used:', code.substring(0, 10) + '...');
                throw new common_1.HttpException('Authorization code has already been used. Please try logging in again.', common_1.HttpStatus.BAD_REQUEST);
            }
            this.usedCodes.add(code);
            if (this.usedCodes.size > 100) {
                const codesArray = Array.from(this.usedCodes);
                this.usedCodes.clear();
                codesArray.slice(-50).forEach(c => this.usedCodes.add(c));
            }
            if (state) {
                try {
                    const stateData = await this.oauthStateService.validateAndConsumeState(state, 'google');
                    console.log('OAuth state validated successfully:', stateData);
                }
                catch (stateError) {
                    console.error('OAuth state validation failed:', stateError);
                    console.log('Proceeding without state validation due to error:', stateError.message);
                }
            }
            console.log('Attempting to exchange authorization code with Google:', {
                code: code.substring(0, 10) + '...',
                redirectUri,
                clientId: process.env.GOOGLE_CLIENT_ID ? 'present' : 'missing'
            });
            let tokenResponse;
            try {
                tokenResponse = await axios_1.default.post('https://oauth2.googleapis.com/token', {
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    code,
                    grant_type: 'authorization_code',
                    redirect_uri: redirectUri,
                }, {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                });
            }
            catch (tokenError) {
                console.error('Google token exchange error:', tokenError);
                console.error('Token exchange request details:', {
                    code: code.substring(0, 10) + '...',
                    redirectUri,
                    clientId: process.env.GOOGLE_CLIENT_ID ? 'present' : 'missing',
                    errorResponse: tokenError.response?.data
                });
                if (tokenError.response?.status === 400) {
                    throw new common_1.BadRequestException('Invalid or expired authorization code. Please try logging in again.');
                }
                throw new common_1.BadRequestException('Failed to exchange Google authorization code');
            }
            const { access_token } = tokenResponse.data;
            const userInfoResponse = await axios_1.default.get('https://www.googleapis.com/oauth2/v2/userinfo', {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                },
            });
            const userInfo = userInfoResponse.data;
            return {
                access_token,
                user: {
                    id: userInfo.id,
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture,
                },
            };
        }
        catch (error) {
            console.error('Google token exchange error:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Failed to exchange Google authorization code', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async cleanupExpiredStates() {
        try {
            const cleanedCount = await this.oauthStateService.cleanupExpiredStates();
            return {
                message: 'OAuth states cleaned up successfully',
                cleanedCount
            };
        }
        catch (error) {
            console.error('Error cleaning up OAuth states:', error);
            throw new common_1.HttpException('Failed to cleanup OAuth states', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.GoogleAuthController = GoogleAuthController;
__decorate([
    (0, common_1.Post)('state'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GoogleAuthController.prototype, "generateState", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GoogleAuthController.prototype, "googleLogin", null);
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GoogleAuthController.prototype, "googleRegister", null);
__decorate([
    (0, common_1.Post)('token'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GoogleAuthController.prototype, "exchangeToken", null);
__decorate([
    (0, common_1.Post)('cleanup-states'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GoogleAuthController.prototype, "cleanupExpiredStates", null);
exports.GoogleAuthController = GoogleAuthController = __decorate([
    (0, common_1.Controller)('auth/google'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        prisma_service_1.PrismaService,
        oauth_state_service_1.OAuthStateService])
], GoogleAuthController);
//# sourceMappingURL=google-auth.controller.js.map