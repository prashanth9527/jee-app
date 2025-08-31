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
};
exports.SubscriptionValidationService = SubscriptionValidationService;
exports.SubscriptionValidationService = SubscriptionValidationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionValidationService);
//# sourceMappingURL=subscription-validation.service.js.map