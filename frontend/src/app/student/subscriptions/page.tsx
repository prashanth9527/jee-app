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
  planType: 'MANUAL' | 'AI_ENABLED';
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
      console.log('Fetching subscription data...');
      console.log('Token exists:', !!localStorage.getItem('token'));
      
      const [plansResponse, statusResponse] = await Promise.all([
        api.get('/subscriptions/plans-renewal'),
        api.get('/student/subscription-status')
      ]);
      
      console.log('Plans response:', plansResponse.data);
      console.log('Status response:', statusResponse.data);
      
      setPlans(plansResponse.data);
      setSubscriptionStatus(statusResponse.data.subscriptionStatus);
    } catch (error: any) {
      console.error('Error fetching subscription data:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to load subscription information';
      if (error.response?.status === 403) {
        errorMessage = 'Access denied. Please make sure you are logged in and have the correct permissions.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Swal.fire({
        title: 'Error',
        text: errorMessage,
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
        successUrl: `${window.location.origin}/student/payment-status?orderId={ORDER_ID}`,
        cancelUrl: `${window.location.origin}/student/payment-status?orderId={ORDER_ID}`,
      });

      // Handle different payment gateways
      if (response.data.deepLink) {
        // PhonePe - try deep link first, fallback to redirect URL
        if (window.location.protocol === 'https:' && response.data.deepLink) {
          window.location.href = response.data.deepLink;
        } else {
          window.location.href = response.data.url;
        }
      } else {
        // Stripe or other gateways
        window.location.href = response.data.url;
      }
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

  const getPricePerDay = (priceCents: number, interval: string) => {
    const amount = priceCents / 100;
    const days = interval === 'MONTH' ? 30 : 365;
    const pricePerDay = amount / days;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(pricePerDay);
  };

  const getEncouragingMessage = (priceCents: number, interval: string) => {
    const amount = priceCents / 100;
    const days = interval === 'MONTH' ? 30 : 365;
    const pricePerDay = amount / days;
    
    if (pricePerDay <= 1.5) {
      return "Less than a cup of coffee! ☕";
    } else if (pricePerDay <= 3) {
      return "Less than a samosa! 🥟";
    } else if (pricePerDay <= 5) {
      return "Less than a chai! 🍵";
    } else {
      return "Great value for your success! 🎯";
    }
  };

  // Filter out trial plans for users who already have a subscription or are renewing
  const getAvailablePlans = () => {
    if (subscriptionStatus?.hasValidSubscription || subscriptionStatus?.isOnTrial) {
      // For existing subscribers or trial users, exclude free/trial plans
      return plans.filter(plan => plan.priceCents > 0);
    }
    // For new users, show all plans
    return plans;
  };

  const isRecommendedPlan = (plan: Plan) => {
    return plan.planType === 'AI_ENABLED';
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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">🚀 Unlock Your JEE Success</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">Choose a plan to unlock unlimited access to JEE practice tests</p>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
              <p className="text-blue-800 dark:text-blue-200 font-semibold text-lg">
                💡 "Success is the sum of small efforts repeated day in and day out" - Robert Collier
              </p>
              <p className="text-blue-600 dark:text-blue-300 mt-2">
                Your journey to IIT starts with consistent practice. Let's make it happen! 🎯
              </p>
            </div>
          </div>

          {/* Current Status */}
          {subscriptionStatus && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Current Status</h2>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 dark:text-gray-300">
                    {subscriptionStatus.isOnTrial ? 'Trial period - 2 days remaining' : subscriptionStatus.message}
                  </p>
                  {subscriptionStatus.daysRemaining > 0 && (
                    <p className="text-blue-600 font-medium">
                      {subscriptionStatus.daysRemaining} days remaining
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {subscriptionStatus.isOnTrial && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                      Trial
                    </span>
                  )}
                  {subscriptionStatus.hasValidSubscription && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                      Active
                    </span>
                  )}
                  {subscriptionStatus.needsSubscription && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                      Expired
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Trial Expired Message */}
          {subscriptionStatus?.needsSubscription && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Trial Period Expired</h3>
                  <p className="text-red-700 dark:text-red-300 mt-1">
                    Your 2-day free trial has ended. To continue accessing all features of JEE Master, please choose a subscription plan below.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Plans Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12 max-w-6xl mx-auto">
            {getAvailablePlans().map((plan, index) => {
              // Debug: Log plan details
              console.log('Plan:', plan.name, 'Type:', plan.planType, 'Index:', index);
              
              // Make the first plan recommended if it's AI_ENABLED, or if it's the first plan and contains 'ai' in name
              const isRecommended = plan.planType === 'AI_ENABLED' || 
                                  (index === 0 && plan.name.toLowerCase().includes('ai')) ||
                                  (index === 0 && getAvailablePlans().length > 0 && getAvailablePlans()[0].priceCents > getAvailablePlans()[1]?.priceCents) ||
                                  (index === 0); // Fallback: always make first plan recommended
              
              return (
                <div key={plan.id} className={`rounded-lg shadow-lg overflow-hidden relative transition-all duration-300 hover:shadow-xl cursor-pointer mb-8 flex flex-col ${
                  isRecommended 
                    ? 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/40 dark:to-red-900/40 ring-4 ring-orange-500 shadow-2xl border-2 border-orange-300 dark:border-orange-600' 
                    : 'bg-white dark:bg-gray-800 hover:ring-2 hover:ring-blue-500 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                }`}>
                  {isRecommended && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 z-30">
                      <div className="relative">
                        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white px-10 py-5 rounded-full text-lg font-black shadow-2xl border-4 border-white animate-bounce">
                          MOST POPULAR
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-full blur-sm opacity-75 -z-10"></div>
                      </div>
                    </div>
                  )}
                  <div className={`p-8 flex flex-col flex-grow ${isRecommended ? 'pt-20' : ''}`}>
                  <div className="text-center flex-grow">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      {isRecommended && <span className="text-orange-500 mr-2">🔥</span>}
                      {plan.planType === 'AI_ENABLED' ? 'AI Enabled Plan' : 'Manual Plan'}
                      {isRecommended && <span className="text-orange-500 ml-2">🔥</span>}
                    </h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                        {formatPrice(plan.priceCents, plan.currency)}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300 text-lg">/{getIntervalText(plan.interval)}</span>
                    </div>
                    
                    {/* Price per day */}
                    <div className="mb-3">
                      <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                        Just {getPricePerDay(plan.priceCents, plan.interval)}/day
                      </span>
                    </div>
                    
                    {/* Encouraging message */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400 bg-red-100 dark:bg-red-900/50 border-2 border-red-300 dark:border-red-700 px-4 py-2 rounded-lg inline-block shadow-md font-bold">
                        {getEncouragingMessage(plan.priceCents, plan.interval)}
                      </p>
                    </div>
                    
                    <p className="text-gray-600 dark:text-gray-300 mb-6">
                      {plan.planType === 'AI_ENABLED' 
                        ? 'Access to AI-generated questions and explanations'
                        : 'Access to practice tests with database questions'
                      }
                    </p>
                  </div>

                  <div className="space-y-3 mb-6 flex-grow">
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Unlimited practice tests
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Detailed performance analytics
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      All subjects and topics
                    </div>
                    <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
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
                    
                    {/* Additional encouraging features */}
                    <div className="flex items-center text-sm text-purple-600 font-medium">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Instant access after payment
                    </div>
                    
                    <div className="flex items-center text-sm text-green-600 font-medium">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Cancel anytime
                    </div>
                  </div>

                  <div className="mt-auto">
                    <button
                      onClick={() => handleSubscribe(plan.id, plan.name)}
                      disabled={processingPayment || (subscriptionStatus?.hasValidSubscription && !subscriptionStatus?.needsSubscription)}
                      className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-all duration-200 border-2 border-red-300 shadow-md ${
                        subscriptionStatus?.hasValidSubscription && !subscriptionStatus?.needsSubscription
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : isRecommendedPlan(plan)
                          ? 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-lg transform hover:scale-105'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
                      }`}
                    >
                      {processingPayment ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          Processing...
                        </div>
                      ) : subscriptionStatus?.hasValidSubscription && !subscriptionStatus?.needsSubscription ? (
                        'Current Plan'
                      ) : (
                        `🚀 Start Your Success - ${formatPrice(plan.priceCents, plan.currency)}/${getIntervalText(plan.interval)}`
                      )}
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {/* Features Comparison */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">What's Included</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Practice Tests</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <li>• Unlimited practice tests</li>
                  <li>• Subject-wise tests (Physics, Chemistry, Mathematics)</li>
                  <li>• Topic-wise practice</li>
                  <li>• Previous year JEE questions</li>
                  <li>• Timed mock exams</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Analytics & Progress</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
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
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">Secure Payment</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
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
