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
exports.ReferralsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReferralsService = class ReferralsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateReferralCode(userId) {
        const existingCode = await this.prisma.referralCode.findUnique({
            where: { userId }
        });
        if (existingCode) {
            return { code: existingCode.code };
        }
        let code;
        let isUnique = false;
        while (!isUnique) {
            code = this.generateRandomCode();
            const existing = await this.prisma.referralCode.findUnique({
                where: { code }
            });
            if (!existing) {
                isUnique = true;
            }
        }
        const referralCode = await this.prisma.referralCode.create({
            data: {
                userId,
                code: code
            }
        });
        return { code: referralCode.code };
    }
    async getUserReferralInfo(userId) {
        const referralCode = await this.prisma.referralCode.findUnique({
            where: { userId },
            include: {
                referrals: {
                    include: {
                        referee: {
                            select: {
                                id: true,
                                fullName: true,
                                email: true,
                                createdAt: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!referralCode) {
            return null;
        }
        const totalReferrals = referralCode.referrals.length;
        const completedReferrals = referralCode.referrals.filter((r) => r.status === 'COMPLETED').length;
        const pendingReferrals = referralCode.referrals.filter((r) => r.status === 'PENDING').length;
        const rewards = await this.prisma.referralReward.findMany({
            where: {
                referral: {
                    referrerId: userId
                }
            },
            include: {
                referral: {
                    include: {
                        referee: {
                            select: {
                                fullName: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        const totalRewardsEarned = rewards.reduce((sum, reward) => {
            if (reward.type === 'SUBSCRIPTION_DAYS') {
                return sum + reward.amount;
            }
            else if (reward.type === 'MONETARY_CREDIT') {
                return sum + reward.amount;
            }
            return sum;
        }, 0);
        const claimedRewards = rewards.filter((r) => r.isClaimed).length;
        const unclaimedRewards = rewards.filter((r) => !r.isClaimed).length;
        return {
            referralCode: {
                code: referralCode.code,
                isActive: referralCode.isActive,
                usageCount: referralCode.usageCount,
                maxUsage: referralCode.maxUsage
            },
            stats: {
                totalReferrals,
                completedReferrals,
                pendingReferrals,
                totalRewardsEarned,
                claimedRewards,
                unclaimedRewards
            },
            recentReferrals: referralCode.referrals.slice(0, 5),
            rewards
        };
    }
    async validateReferralCode(code) {
        const referralCode = await this.prisma.referralCode.findUnique({
            where: { code },
            include: {
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                }
            }
        });
        if (!referralCode) {
            return { valid: false, message: 'Invalid referral code' };
        }
        if (!referralCode.isActive) {
            return { valid: false, message: 'Referral code is inactive' };
        }
        if (referralCode.maxUsage && referralCode.usageCount >= referralCode.maxUsage) {
            return { valid: false, message: 'Referral code usage limit reached' };
        }
        return {
            valid: true,
            referrer: referralCode.user
        };
    }
    async applyReferralCode(refereeId, referralCode) {
        const validation = await this.validateReferralCode(referralCode);
        if (!validation.valid) {
            return { success: false, message: validation.message };
        }
        const referrerId = validation.referrer.id;
        const existingReferral = await this.prisma.referral.findUnique({
            where: { refereeId }
        });
        if (existingReferral) {
            return { success: false, message: 'User already has a referral' };
        }
        if (referrerId === refereeId) {
            return { success: false, message: 'Cannot refer yourself' };
        }
        const referralCodeRecord = await this.prisma.referralCode.findUnique({
            where: { code: referralCode }
        });
        await this.prisma.referral.create({
            data: {
                referrerId,
                refereeId,
                referralCodeId: referralCodeRecord.id,
                status: 'PENDING'
            }
        });
        await this.prisma.referralCode.update({
            where: { id: referralCodeRecord.id },
            data: {
                usageCount: {
                    increment: 1
                }
            }
        });
        return { success: true, message: 'Referral code applied successfully' };
    }
    async completeReferral(refereeId) {
        const referral = await this.prisma.referral.findUnique({
            where: { refereeId },
            include: {
                referrer: true,
                referee: true
            }
        });
        if (!referral || referral.status !== 'PENDING') {
            return;
        }
        await this.prisma.referral.update({
            where: { id: referral.id },
            data: {
                status: 'COMPLETED',
                completedAt: new Date()
            }
        });
        await this.createReferralRewards(referral.id, referral.referrerId, referral.refereeId);
    }
    async createReferralRewards(referralId, referrerId, refereeId) {
        await this.prisma.referralReward.create({
            data: {
                referralId,
                type: 'SUBSCRIPTION_DAYS',
                amount: 7,
                description: '7 days free subscription for successful referral',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });
        await this.prisma.referralReward.create({
            data: {
                referralId,
                type: 'SUBSCRIPTION_DAYS',
                amount: 3,
                description: '3 days free subscription for using referral code',
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        });
    }
    async claimReward(userId, rewardId) {
        const reward = await this.prisma.referralReward.findUnique({
            where: { id: rewardId },
            include: {
                referral: {
                    include: {
                        referrer: true,
                        referee: true
                    }
                }
            }
        });
        if (!reward) {
            return { success: false, message: 'Reward not found' };
        }
        const isReferrer = reward.referral.referrerId === userId;
        const isReferee = reward.referral.refereeId === userId;
        if (!isReferrer && !isReferee) {
            return { success: false, message: 'You do not own this reward' };
        }
        if (reward.isClaimed) {
            return { success: false, message: 'Reward already claimed' };
        }
        if (reward.expiresAt && reward.expiresAt < new Date()) {
            return { success: false, message: 'Reward has expired' };
        }
        const applicationResult = await this.applyReward(userId, reward);
        if (!applicationResult.success) {
            return applicationResult;
        }
        await this.prisma.referralReward.update({
            where: { id: rewardId },
            data: {
                isClaimed: true,
                claimedAt: new Date()
            }
        });
        return { success: true, message: 'Reward claimed successfully' };
    }
    async applyReward(userId, reward) {
        switch (reward.type) {
            case 'SUBSCRIPTION_DAYS':
                return await this.applySubscriptionDaysReward(userId, reward.amount);
            case 'MONETARY_CREDIT':
                return await this.applyMonetaryCreditReward(userId, reward.amount, reward.currency);
            default:
                return { success: false, message: 'Unknown reward type' };
        }
    }
    async applySubscriptionDaysReward(userId, days) {
        try {
            const user = await this.prisma.user.findUnique({
                where: { id: userId },
                include: {
                    subscriptions: {
                        where: { status: 'ACTIVE' },
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            });
            if (!user) {
                return { success: false, message: 'User not found' };
            }
            if (user.subscriptions.length > 0) {
                const subscription = user.subscriptions[0];
                const newEndDate = new Date(subscription.endsAt || new Date());
                newEndDate.setDate(newEndDate.getDate() + days);
                await this.prisma.subscription.update({
                    where: { id: subscription.id },
                    data: { endsAt: newEndDate }
                });
            }
            else {
                const startDate = new Date();
                const endDate = new Date();
                endDate.setDate(endDate.getDate() + days);
                const freeTrialPlan = await this.prisma.plan.findFirst({
                    where: { name: 'Free Trial' }
                });
                if (freeTrialPlan) {
                    await this.prisma.subscription.create({
                        data: {
                            userId,
                            planId: freeTrialPlan.id,
                            status: 'ACTIVE',
                            startedAt: startDate,
                            endsAt: endDate
                        }
                    });
                }
            }
            return { success: true, message: `${days} days added to subscription` };
        }
        catch (error) {
            return { success: false, message: 'Failed to apply subscription reward' };
        }
    }
    async applyMonetaryCreditReward(userId, amount, currency) {
        return { success: true, message: `${amount} ${currency} credit applied` };
    }
    async getReferralLeaderboard(limit = 10) {
        const leaderboard = await this.prisma.user.findMany({
            select: {
                id: true,
                fullName: true,
                email: true,
                _count: {
                    select: {
                        referralsMade: {
                            where: { status: 'COMPLETED' }
                        }
                    }
                }
            },
            orderBy: {
                referralsMade: {
                    _count: 'desc'
                }
            },
            take: limit
        });
        return leaderboard.map(user => ({
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            completedReferrals: user._count.referralsMade
        }));
    }
    generateRandomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
};
exports.ReferralsService = ReferralsService;
exports.ReferralsService = ReferralsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReferralsService);
//# sourceMappingURL=referrals.service.js.map