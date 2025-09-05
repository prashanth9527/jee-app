'use client';

import { useEffect, useState } from 'react';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import Swal from 'sweetalert2';

interface Plan {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  interval: 'MONTH' | 'YEAR';
  isActive: boolean;
}

interface SubscriptionStatus {
  hasValidSubscription: boolean;
  isOnTrial: boolean;
  trialEndsAt?: string;
  subscriptionEndsAt?: string;
  daysRemaining: number;
  needsSubscription: boolean;
  message: string;
}

export default function SubscriptionsPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [plansResponse, statusResponse] = await Promise.all([
        api.get('/subscriptions/plans'),
        api.get('/student/subscription-status')
      ]);
      
      setPlans(plansResponse.data);
      setSubscriptionStatus(statusResponse.data.subscriptionStatus);
    } catch (error) {
      console.error('Error fetching subscription data:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load subscription information',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string, planName: string) => {
    try {
      setProcessingPayment(true);
      
      const response = await api.post('/subscriptions/checkout', {
        planId,
        successUrl: `${window.location.origin}/student/subscriptions?success=true`,
        cancelUrl: `${window.location.origin}/student/subscriptions?canceled=true`,
      });

      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to process payment',
        icon: 'error',
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatPrice = (priceCents: number, currency: string) => {
    const amount = priceCents / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getIntervalText = (interval: string) => {
    return interval === 'MONTH' ? 'month' : 'year';
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <StudentLayout>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading subscription plans...</p>
            </div>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="STUDENT">
      <StudentLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
            <p className="text-gray-600">Choose a plan to unlock unlimited access to JEE practice tests</p>
          </div>

          {/* Current Status */}
          {subscriptionStatus && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{subscriptionStatus.message}</p>
                  {subscriptionStatus.daysRemaining > 0 && (
                    <p className="text-sm text-blue-600 font-medium">
                      {subscriptionStatus.daysRemaining} days remaining
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {subscriptionStatus.isOnTrial && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Trial
                    </span>
                  )}
                  {subscriptionStatus.hasValidSubscription && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                  {subscriptionStatus.needsSubscription && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Expired
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Trial Expired Message */}
          {subscriptionStatus?.needsSubscription && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-red-800">Trial Period Expired</h3>
                  <p className="text-red-700 mt-1">
                    Your 2-day free trial has ended. To continue accessing all features of JEE Master, please choose a subscription plan below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-gray-900">
                        {formatPrice(plan.priceCents, plan.currency)}
                      </span>
                      <span className="text-gray-600">/{getIntervalText(plan.interval)}</span>
                    </div>
                    {plan.description && (
                      <p className="text-gray-600 text-sm mb-6">{plan.description}</p>
                    )}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Unlimited practice tests
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Detailed performance analytics
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      All subjects and topics
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Previous year questions
                    </div>
                    {plan.interval === 'YEAR' && (
                      <div className="flex items-center text-sm text-blue-600 font-medium">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Save 17% with yearly plan
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleSubscribe(plan.id, plan.name)}
                    disabled={processingPayment || (subscriptionStatus?.hasValidSubscription && !subscriptionStatus?.needsSubscription)}
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                      subscriptionStatus?.hasValidSubscription && !subscriptionStatus?.needsSubscription
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {processingPayment ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </div>
                    ) : subscriptionStatus?.hasValidSubscription && !subscriptionStatus?.needsSubscription ? (
                      'Current Plan'
                    ) : (
                      `Subscribe - ${formatPrice(plan.priceCents, plan.currency)}/${getIntervalText(plan.interval)}`
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Features Comparison */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What's Included</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Practice Tests</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Unlimited practice tests</li>
                  <li>• Subject-wise tests (Physics, Chemistry, Mathematics)</li>
                  <li>• Topic-wise practice</li>
                  <li>• Previous year JEE questions</li>
                  <li>• Timed mock exams</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Analytics & Progress</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Detailed performance analytics</li>
                  <li>• Progress tracking by subject</li>
                  <li>• Weak area identification</li>
                  <li>• Performance trends</li>
                  <li>• Score improvement tracking</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Payment Security */}
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-900">Secure Payment</h3>
                <p className="text-sm text-blue-700">
                  All payments are processed securely through Stripe. Your payment information is never stored on our servers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </StudentLayout>
    </ProtectedRoute>
  );
} 
