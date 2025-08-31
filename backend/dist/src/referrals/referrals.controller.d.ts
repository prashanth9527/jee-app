import { ReferralsService } from './referrals.service';
export declare class ReferralsController {
    private readonly referralsService;
    constructor(referralsService: ReferralsService);
    generateReferralCode(req: any): Promise<{
        code: string;
    }>;
    getMyReferrals(req: any): Promise<{
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
    applyReferralCode(req: any, body: {
        code: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    claimReward(req: any, rewardId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getLeaderboard(limit?: string): Promise<{
        id: string;
        fullName: string;
        email: string;
        completedReferrals: number;
    }[]>;
}
export declare class AdminReferralsController {
    private readonly referralsService;
    constructor(referralsService: ReferralsService);
    getAllReferrals(): Promise<{
        message: string;
    }>;
    getReferralStats(): Promise<{
        message: string;
    }>;
}
