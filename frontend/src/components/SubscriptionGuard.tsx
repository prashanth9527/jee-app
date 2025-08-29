'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user || user.role !== 'STUDENT') {
        setChecking(false);
        return;
      }

      try {
        const response = await api.get('/student/subscription-status');
        const { subscriptionStatus } = response.data;

        // If student needs subscription and is not already on subscription page
        if (subscriptionStatus.needsSubscription && !subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/student/subscriptions')) {
            router.push('/student/subscriptions');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
        // If there's an error checking subscription, allow access
      } finally {
        setChecking(false);
      }
    };

    checkSubscription();
  }, [user, router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking subscription...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 