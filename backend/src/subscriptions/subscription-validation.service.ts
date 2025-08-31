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
} 