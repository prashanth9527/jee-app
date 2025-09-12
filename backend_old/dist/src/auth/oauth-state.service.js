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
exports.OAuthStateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let OAuthStateService = class OAuthStateService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateState(provider, redirectUri, ttlMinutes = 10) {
        const state = this.generateRandomState();
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
        await this.prisma.oAuthState.create({
            data: {
                state,
                provider,
                redirectUri,
                expiresAt,
            },
        });
        return state;
    }
    async validateAndConsumeState(state, provider) {
        const oauthState = await this.prisma.oAuthState.findUnique({
            where: { state },
        });
        if (!oauthState) {
            throw new Error('Invalid state parameter');
        }
        if (oauthState.provider !== provider) {
            throw new Error('State provider mismatch');
        }
        if (oauthState.expiresAt < new Date()) {
            await this.prisma.oAuthState.delete({
                where: { id: oauthState.id },
            });
            throw new Error('State has expired');
        }
        await this.prisma.oAuthState.delete({
            where: { id: oauthState.id },
        });
        return {
            redirectUri: oauthState.redirectUri || undefined,
        };
    }
    async cleanupExpiredStates() {
        const result = await this.prisma.oAuthState.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
        return result.count;
    }
    generateRandomState() {
        const timestamp = Date.now().toString(36);
        const randomBytes = crypto.getRandomValues(new Uint8Array(16));
        const randomString = Array.from(randomBytes, byte => byte.toString(36)).join('');
        return `${timestamp}_${randomString}`;
    }
};
exports.OAuthStateService = OAuthStateService;
exports.OAuthStateService = OAuthStateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OAuthStateService);
//# sourceMappingURL=oauth-state.service.js.map