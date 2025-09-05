'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface SubscriptionStatus {
  hasValidSubscription: boolean;
  isOnTrial: boolean;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  daysRemaining: number;
  needsSubscription: boolean;
  message: string;
}

interface SubscriptionGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function SubscriptionGuard({ children, fallback }: SubscriptionGuardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || user.role !== 'STUDENT') {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/student/subscription-status');
        const data = response.data;
        setSubscriptionStatus(data.subscriptionStatus);

        // If user needs subscription and is not on subscription page, redirect
        if (data.subscriptionStatus.needsSubscription) {
          const currentPath = window.location.pathname;
          if (currentPath !== '/student/subscriptions') {
            router.push('/student/subscriptions');
            return;
          }
        }
      } catch (error) {
        console.error('Failed to check subscription status:', error);
        // Don't block access if subscription check fails
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking subscription status...</p>
        </div>
      </div>
    );
  }

  // If user needs subscription, show fallback or redirect
  if (subscriptionStatus?.needsSubscription) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}