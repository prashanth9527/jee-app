import { PrismaService } from '../prisma/prisma.service';
export declare class ReferralsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    generateReferralCode(userId: string): Promise<{
        code: string;
    }>;
    getUserReferralInfo(userId: string): Promise<{
        referralCode: {
            code: string;
            isActive: boolean;
            usageCount: number;
            maxUsage: number | null;
        };
        stats: {
            totalReferrals: number;
            completedReferrals: number;
            pendingReferrals: number;
            totalRewardsEarned: any;
            claimedRewards: number;
            unclaimedRewards: number;
        };
        recentReferrals: ({
            referee: {
                id: string;
                email: string;
                fullName: string;
                createdAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            referrerId: string;
            refereeId: string;
            referralCodeId: string;
            status: import(".prisma/client").$Enums.ReferralStatus;
            completedAt: Date | null;
        })[];
        rewards: ({
            referral: {
                referee: {
                    email: string;
                    fullName: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                referrerId: string;
                refereeId: string;
                referralCodeId: string;
                status: import(".prisma/client").$Enums.ReferralStatus;
                completedAt: Date | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            description: string;
            currency: string | null;
            type: import(".prisma/client").$Enums.RewardType;
            expiresAt: Date | null;
            referralId: string;
            amount: number;
            isClaimed: boolean;
            claimedAt: Date | null;
        })[];
    } | null>;
    validateReferralCode(code: string): Promise<{
        valid: boolean;
        referrer?: any;
        message?: string;
    }>;
    applyReferralCode(refereeId: string, referralCode: string): Promise<{
        success: boolean;
        message: string;
    }>;
    completeReferral(refereeId: string): Promise<void>;
    private createReferralRewards;
    claimReward(userId: string, rewardId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private applyReward;
    private applySubscriptionDaysReward;
    private applyMonetaryCreditReward;
    getReferralLeaderboard(limit?: number): Promise<{
        id: string;
        fullName: string;
        email: string;
        completedReferrals: number;
    }[]>;
    private generateRandomCode;
}
