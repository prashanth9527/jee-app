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
exports.SubscriptionValidationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let SubscriptionValidationService = class SubscriptionValidationService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async validateStudentSubscription(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    include: { plan: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
        if (!user) {
            return {
                hasValidSubscription: false,
                isOnTrial: false,
                daysRemaining: 0,
                needsSubscription: true,
                message: 'User not found',
            };
        }
        const now = new Date();
        let daysRemaining = 0;
        let message = '';
        if (user.subscriptions.length > 0) {
            const subscription = user.subscriptions[0];
            const subscriptionEndsAt = subscription.endsAt;
            if (subscriptionEndsAt && subscriptionEndsAt > now) {
                daysRemaining = Math.ceil((subscriptionEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                return {
                    hasValidSubscription: true,
                    isOnTrial: false,
                    subscriptionEndsAt: subscriptionEndsAt || undefined,
                    daysRemaining,
                    needsSubscription: false,
                    planType: subscription.plan.planType,
                    message: `Active subscription - ${daysRemaining} days remaining`,
                };
            }
            else {
                return {
                    hasValidSubscription: false,
                    isOnTrial: false,
                    subscriptionEndsAt: subscriptionEndsAt || undefined,
                    daysRemaining: 0,
                    needsSubscription: true,
                    message: 'Subscription has expired',
                };
            }
        }
        if (user.trialEndsAt && user.trialEndsAt > now) {
            daysRemaining = Math.ceil((user.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            return {
                hasValidSubscription: false,
                isOnTrial: true,
                trialEndsAt: user.trialEndsAt,
                daysRemaining,
                needsSubscription: false,
                message: `Trial period - ${daysRemaining} days remaining`,
            };
        }
        return {
            hasValidSubscription: false,
            isOnTrial: false,
            daysRemaining: 0,
            needsSubscription: true,
            message: 'No active subscription or trial',
        };
    }
    async canAccessContent(userId) {
        const status = await this.validateStudentSubscription(userId);
        return status.hasValidSubscription || status.isOnTrial;
    }
    async getSubscriptionDetails(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscriptions: {
                    include: { plan: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!user) {
            return null;
        }
        const status = await this.validateStudentSubscription(userId);
        return {
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                trialStartedAt: user.trialStartedAt,
                trialEndsAt: user.trialEndsAt,
            },
            subscriptionStatus: status,
            subscriptions: user.subscriptions,
        };
    }
    async hasAIAccess(userId) {
        const status = await this.validateStudentSubscription(userId);
        if (!status.hasValidSubscription) {
            return false;
        }
        return status.planType === 'AI_ENABLED';
    }
    async validateAiUsage(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                subscriptions: {
                    where: { status: 'ACTIVE' },
                    include: { plan: true },
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });
        if (!user) {
            return {
                canUseAi: false,
                aiTestsUsed: 0,
                aiTestsLimit: 0,
                aiTestsRemaining: 0,
                message: 'User not found',
            };
        }
        const subscriptionStatus = await this.validateStudentSubscription(userId);
        if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
            return {
                canUseAi: false,
                aiTestsUsed: user.aiTestsUsed,
                aiTestsLimit: user.aiTestsLimit,
                aiTestsRemaining: 0,
                message: 'No active subscription required for AI features',
            };
        }
        if (user.subscriptions.length > 0) {
            const subscription = user.subscriptions[0];
            if (subscription.plan.planType !== 'AI_ENABLED') {
                return {
                    canUseAi: false,
                    aiTestsUsed: user.aiTestsUsed,
                    aiTestsLimit: user.aiTestsLimit,
                    aiTestsRemaining: 0,
                    message: 'AI features require AI-enabled subscription plan',
                };
            }
        }
        else if (subscriptionStatus.isOnTrial) {
            const trialAiLimit = 5;
            const remaining = Math.max(0, trialAiLimit - user.aiTestsUsed);
            return {
                canUseAi: remaining > 0,
                aiTestsUsed: user.aiTestsUsed,
                aiTestsLimit: trialAiLimit,
                aiTestsRemaining: remaining,
                message: remaining > 0
                    ? `Trial AI access - ${remaining} tests remaining`
                    : 'Trial AI limit reached',
            };
        }
        await this.checkAndResetAiUsage(user);
        const updatedUser = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!updatedUser) {
            return {
                canUseAi: false,
                aiTestsUsed: 0,
                aiTestsLimit: 0,
                aiTestsRemaining: 0,
                message: 'User not found',
            };
        }
        const remaining = Math.max(0, updatedUser.aiTestsLimit - updatedUser.aiTestsUsed);
        const nextResetAt = this.calculateNextResetDate(updatedUser.lastAiResetAt || undefined);
        return {
            canUseAi: remaining > 0,
            aiTestsUsed: updatedUser.aiTestsUsed,
            aiTestsLimit: updatedUser.aiTestsLimit,
            aiTestsRemaining: remaining,
            lastResetAt: updatedUser.lastAiResetAt || undefined,
            nextResetAt,
            message: remaining > 0
                ? `AI tests available - ${remaining} remaining`
                : 'AI test limit reached for this month',
        };
    }
    async incrementAiUsage(userId) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                aiTestsUsed: {
                    increment: 1,
                },
            },
        });
    }
    async checkAndResetAiUsage(user) {
        const now = new Date();
        const lastReset = user.lastAiResetAt || user.createdAt;
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (lastReset < oneMonthAgo) {
            await this.prisma.user.update({
                where: { id: user.id },
                data: {
                    aiTestsUsed: 0,
                    lastAiResetAt: now,
                },
            });
        }
    }
    calculateNextResetDate(lastResetAt) {
        if (!lastResetAt) {
            return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        return new Date(lastResetAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    }
    async setAiLimitForUser(userId, limit) {
        await this.prisma.user.update({
            where: { id: userId },
            data: {
                aiTestsLimit: limit,
                lastAiResetAt: new Date(),
            },
        });
    }
};
exports.SubscriptionValidationService = SubscriptionValidationService;
exports.SubscriptionValidationService = SubscriptionValidationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionValidationService);
//# sourceMappingURL=subscription-validation.service.js.map