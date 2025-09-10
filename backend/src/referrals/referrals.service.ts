import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService
  ) {}

  // Generate unique referral code for user
  async generateReferralCode(userId: string): Promise<{ code: string }> {
    // Check if user already has a referral code
    const existingCode = await this.prisma.referralCode.findUnique({
      where: { userId }
    });

    if (existingCode) {
      return { code: existingCode.code };
    }

    // Generate unique code
    let code: string;
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

    // Create referral code
    const referralCode = await this.prisma.referralCode.create({
      data: {
        userId,
        code: code!
      }
    });

    return { code: referralCode.code };
  }

  // Get user's referral code and stats
  async getUserReferralInfo(userId: string) {
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

    // Calculate stats
    const totalReferrals = referralCode.referrals.length;
    const completedReferrals = referralCode.referrals.filter((r: any) => r.status === 'COMPLETED').length;
    const pendingReferrals = referralCode.referrals.filter((r: any) => r.status === 'PENDING').length;

    // Get rewards earned
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

    const totalRewardsEarned = rewards.reduce((sum: number, reward: any) => {
      if (reward.type === 'SUBSCRIPTION_DAYS') {
        return sum + reward.amount;
      } else if (reward.type === 'MONETARY_CREDIT') {
        return sum + reward.amount;
      }
      return sum;
    }, 0);

    const claimedRewards = rewards.filter((r: any) => r.isClaimed).length;
    const unclaimedRewards = rewards.filter((r: any) => !r.isClaimed).length;

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

  // Validate referral code
  async validateReferralCode(code: string): Promise<{ valid: boolean; referrer?: any; message?: string }> {
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

  // Apply referral code during registration
  async applyReferralCode(refereeId: string, referralCode: string): Promise<{ success: boolean; message: string }> {
    // Validate referral code
    const validation = await this.validateReferralCode(referralCode);
    if (!validation.valid) {
      return { success: false, message: validation.message! };
    }

    const referrerId = validation.referrer!.id;

    // Check if user already has a referral
    const existingReferral = await this.prisma.referral.findUnique({
      where: { refereeId }
    });

    if (existingReferral) {
      return { success: false, message: 'User already has a referral' };
    }

    // Check if user is referring themselves
    if (referrerId === refereeId) {
      return { success: false, message: 'Cannot refer yourself' };
    }

    // Get referral code record
    const referralCodeRecord = await this.prisma.referralCode.findUnique({
      where: { code: referralCode }
    });

    // Create referral
    await this.prisma.referral.create({
      data: {
        referrerId,
        refereeId,
        referralCodeId: referralCodeRecord!.id,
        status: 'PENDING'
      }
    });

    // Update usage count
    await this.prisma.referralCode.update({
      where: { id: referralCodeRecord!.id },
      data: {
        usageCount: {
          increment: 1
        }
      }
    });

    return { success: true, message: 'Referral code applied successfully' };
  }

  // Complete referral (when referee subscribes)
  async completeReferral(refereeId: string): Promise<void> {
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

    // Update referral status
    await this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });

    // Create rewards for both referrer and referee
    await this.createReferralRewards(referral.id, referral.referrerId, referral.refereeId);
  }

  // Create rewards for completed referral
  private async createReferralRewards(referralId: string, referrerId: string, refereeId: string): Promise<void> {
    // Referrer reward: 7 days free subscription
    await this.prisma.referralReward.create({
      data: {
        referralId,
        type: 'SUBSCRIPTION_DAYS',
        amount: 7,
        description: '7 days free subscription for successful referral',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
      }
    });

    // Referee reward: 3 days free subscription
    await this.prisma.referralReward.create({
      data: {
        referralId,
        type: 'SUBSCRIPTION_DAYS',
        amount: 3,
        description: '3 days free subscription for using referral code',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days expiry
      }
    });
  }

  // Claim reward
  async claimReward(userId: string, rewardId: string): Promise<{ success: boolean; message: string }> {
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

    // Check if user owns this reward
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

    // Apply the reward based on type
    const applicationResult = await this.applyReward(userId, reward);
    if (!applicationResult.success) {
      return applicationResult;
    }

    // Mark reward as claimed
    await this.prisma.referralReward.update({
      where: { id: rewardId },
      data: {
        isClaimed: true,
        claimedAt: new Date()
      }
    });

    return { success: true, message: 'Reward claimed successfully' };
  }

  // Apply reward to user account
  private async applyReward(userId: string, reward: any): Promise<{ success: boolean; message: string }> {
    switch (reward.type) {
      case 'SUBSCRIPTION_DAYS':
        return await this.applySubscriptionDaysReward(userId, reward.amount);
      case 'MONETARY_CREDIT':
        return await this.applyMonetaryCreditReward(userId, reward.amount, reward.currency);
      default:
        return { success: false, message: 'Unknown reward type' };
    }
  }

  // Apply subscription days reward
  private async applySubscriptionDaysReward(userId: string, days: number): Promise<{ success: boolean; message: string }> {
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
        // Extend existing subscription
        const subscription = user.subscriptions[0];
        const newEndDate = new Date(subscription.endsAt || new Date());
        newEndDate.setDate(newEndDate.getDate() + days);

        await this.prisma.subscription.update({
          where: { id: subscription.id },
          data: { endsAt: newEndDate }
        });
      } else {
        // Create new subscription with free days
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + days);

        // Find the free trial plan
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
    } catch (error) {
      return { success: false, message: 'Failed to apply subscription reward' };
    }
  }

  // Apply monetary credit reward
  private async applyMonetaryCreditReward(userId: string, amount: number, currency: string): Promise<{ success: boolean; message: string }> {
    // This would integrate with your payment system
    // For now, we'll just return success
    return { success: true, message: `${amount} ${currency} credit applied` };
  }

  // Get referral leaderboard
  async getReferralLeaderboard(limit: number = 10) {
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

	return leaderboard.map((user: any) => ({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      completedReferrals: user._count.referralsMade
    }));
  }

  // Generate random referral code
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
} 