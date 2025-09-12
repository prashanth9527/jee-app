import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SubscriptionStatus {
  hasValidSubscription: boolean;
  isOnTrial: boolean;
  trialEndsAt?: Date;
  subscriptionEndsAt?: Date;
  daysRemaining: number;
  needsSubscription: boolean;
  message: string;
  planType?: 'MANUAL' | 'AI_ENABLED';
}

export interface AiUsageStatus {
  canUseAi: boolean;
  aiTestsUsed: number;
  aiTestsLimit: number;
  aiTestsRemaining: number;
  lastResetAt?: Date;
  nextResetAt?: Date;
  message: string;
}

@Injectable()
export class SubscriptionValidationService {
  constructor(private readonly prisma: PrismaService) {}

  async validateStudentSubscription(userId: string): Promise<SubscriptionStatus> {
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

    // Check if user has an active subscription
    if (user.subscriptions.length > 0) {
      const subscription = user.subscriptions[0];
      const subscriptionEndsAt = (subscription as any).endDate || (subscription as any).endsAt;

      if (subscriptionEndsAt && subscriptionEndsAt > now) {
        daysRemaining = Math.ceil((subscriptionEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return {
          hasValidSubscription: true,
          isOnTrial: false,
          subscriptionEndsAt: subscriptionEndsAt || undefined,
          daysRemaining,
          needsSubscription: false,
          planType: 'MANUAL', // Default plan type
          message: `Active subscription - ${daysRemaining} days remaining`,
        };
      } else {
        // Subscription expired
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

    // Check trial status
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

    // No valid subscription or trial
    return {
      hasValidSubscription: false,
      isOnTrial: false,
      daysRemaining: 0,
      needsSubscription: true,
      message: 'No active subscription or trial',
    };
  }

  async canAccessContent(userId: string): Promise<boolean> {
    const status = await this.validateStudentSubscription(userId);
    return status.hasValidSubscription || status.isOnTrial;
  }

  async getSubscriptionDetails(userId: string) {
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

  async hasAIAccess(userId: string): Promise<boolean> {
    const status = await this.validateStudentSubscription(userId);
    
    // For now, only active subscriptions with AI_ENABLED plan type have AI access
    // Trial users don't get AI access
    if (!status.hasValidSubscription) {
      return false;
    }

    // Check if the plan type is AI_ENABLED
    // This will work once we regenerate the Prisma client
    return status.planType === 'AI_ENABLED';
  }

  async validateAiUsage(userId: string): Promise<AiUsageStatus> {
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

    // Check if user has AI-enabled subscription
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

    // Check if user has AI-enabled plan
    if (user.subscriptions.length > 0) {
      const subscription = user.subscriptions[0];
      if ((subscription.plan as any).planType !== 'AI_ENABLED') {
        return {
          canUseAi: false,
          aiTestsUsed: user.aiTestsUsed,
          aiTestsLimit: user.aiTestsLimit,
          aiTestsRemaining: 0,
          message: 'AI features require AI-enabled subscription plan',
        };
      }
    } else if (subscriptionStatus.isOnTrial) {
      // Trial users get limited AI access
      const trialAiLimit = 5; // 5 AI tests during trial
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

    // Check if AI usage needs to be reset (monthly reset)
    await this.checkAndResetAiUsage(user);

    // Get updated user data after potential reset
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

  async incrementAiUsage(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        aiTestsUsed: {
          increment: 1,
        },
      },
    });
  }

  private async checkAndResetAiUsage(user: any): Promise<void> {
    const now = new Date();
    const lastReset = user.lastAiResetAt || user.createdAt;
    
    // Check if it's been more than a month since last reset
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    if (lastReset < oneMonthAgo) {
      // Reset AI usage
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          aiTestsUsed: 0,
          lastAiResetAt: now,
        },
      });
    }
  }

  private calculateNextResetDate(lastResetAt?: Date): Date {
    if (!lastResetAt) {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    }
    
    // Calculate next reset date (30 days from last reset)
    return new Date(lastResetAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  async setAiLimitForUser(userId: string, limit: number): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        aiTestsLimit: limit,
        lastAiResetAt: new Date(), // Set current time as reset time
      },
    });
  }
} 