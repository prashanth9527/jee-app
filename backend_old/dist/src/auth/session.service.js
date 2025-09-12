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
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
let SessionService = class SessionService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createSession(userId, deviceInfo, ipAddress, userAgent) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        if (!user) {
            throw new Error('User not found');
        }
        if (user.role === 'STUDENT') {
            await this.prisma.userSession.updateMany({
                where: {
                    userId,
                    isActive: true
                },
                data: {
                    isActive: false
                }
            });
        }
        const sessionId = (0, crypto_1.randomBytes)(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        await this.prisma.userSession.create({
            data: {
                userId,
                sessionId,
                deviceInfo,
                ipAddress,
                userAgent,
                expiresAt
            }
        });
        return sessionId;
    }
    async validateSession(sessionId) {
        const session = await this.prisma.userSession.findUnique({
            where: { sessionId },
            select: {
                userId: true,
                isActive: true,
                expiresAt: true
            }
        });
        if (!session || !session.isActive || session.expiresAt < new Date()) {
            return { userId: '', isValid: false };
        }
        await this.prisma.userSession.update({
            where: { sessionId },
            data: { lastActivityAt: new Date() }
        });
        return { userId: session.userId, isValid: true };
    }
    async invalidateSession(sessionId) {
        await this.prisma.userSession.update({
            where: { sessionId },
            data: { isActive: false }
        });
    }
    async invalidateAllUserSessions(userId) {
        await this.prisma.userSession.updateMany({
            where: { userId },
            data: { isActive: false }
        });
    }
    async cleanupExpiredSessions() {
        const result = await this.prisma.userSession.updateMany({
            where: {
                OR: [
                    { expiresAt: { lt: new Date() } },
                    { isActive: false }
                ]
            },
            data: { isActive: false }
        });
        return result.count;
    }
    async getUserActiveSessions(userId) {
        return this.prisma.userSession.findMany({
            where: {
                userId,
                isActive: true,
                expiresAt: { gt: new Date() }
            },
            select: {
                id: true,
                sessionId: true,
                deviceInfo: true,
                ipAddress: true,
                userAgent: true,
                lastActivityAt: true,
                createdAt: true
            },
            orderBy: { lastActivityAt: 'desc' }
        });
    }
    async hasActiveSessions(userId) {
        const count = await this.prisma.userSession.count({
            where: {
                userId,
                isActive: true,
                expiresAt: { gt: new Date() }
            }
        });
        return count > 0;
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionService);
//# sourceMappingURL=session.service.js.map