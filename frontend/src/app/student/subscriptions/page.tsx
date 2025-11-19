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
  interval: 'MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'YEAR';
  planType: 'MANUAL' | 'AI_ENABLED';
  isActive: boolean;
  discountPercent?: number;
  basePriceCents?: number;
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
  const [referralCode, setReferralCode] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<string>('MONTH');

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
        referralCode: referralCode.trim() || undefined,
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
    switch (interval) {
      case 'MONTH': return 'month';
      case 'THREE_MONTHS': return '3 months';
      case 'SIX_MONTHS': return '6 months';
      case 'YEAR': return 'year';
      default: return 'month';
    }
  };

  const getPricePerDay = (priceCents: number, interval: string) => {
    const amount = priceCents / 100;
    let days = 30;
    switch (interval) {
      case 'MONTH': days = 30; break;
      case 'THREE_MONTHS': days = 90; break;
      case 'SIX_MONTHS': days = 180; break;
      case 'YEAR': days = 365; break;
    }
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

  // Group plans by duration
  const getPlansByDuration = () => {
    const durations = ['MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'YEAR'];
    return durations.map(duration => {
      const durationPlans = getAvailablePlans().filter(plan => plan.interval === duration);
      const discount = durationPlans[0]?.discountPercent || 0;
      return {
        duration,
        discount,
        plans: durationPlans
      };
    });
  };

  const getDurationTabInfo = (duration: string) => {
    switch (duration) {
      case 'MONTH':
        return { label: '1 Month', discount: 0, color: 'blue' };
      case 'THREE_MONTHS':
        return { label: '3 Months', discount: 5, color: 'green' };
      case 'SIX_MONTHS':
        return { label: '6 Months', discount: 10, color: 'purple' };
      case 'YEAR':
        return { label: '12 Months', discount: 20, color: 'orange' };
      default:
        return { label: '1 Month', discount: 0, color: 'blue' };
    }
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

          {/* Referral Code Input */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">🎁 Have a referral code?</h3>
            <div className="flex space-x-4">
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                placeholder="Enter referral code for 50% discount"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium text-green-600">50% off</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Enter a valid referral code to get 50% discount on your subscription
            </p>
          </div>

          {/* Duration Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 text-center">Choose Your Duration</h2>
            
            {/* Duration Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {getPlansByDuration().map(({ duration, discount }) => {
                const tabInfo = getDurationTabInfo(duration);
                const isSelected = selectedDuration === duration;
                const hasPlans = getAvailablePlans().some(plan => plan.interval === duration);
                
                if (!hasPlans) return null;
                
                return (
                  <button
                    key={duration}
                    onClick={() => setSelectedDuration(duration)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                      isSelected
                        ? `bg-${tabInfo.color}-500 text-white shadow-lg transform scale-105`
                        : `bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600`
                    }`}
                  >
                    <div className="text-lg">{tabInfo.label}</div>
                    {discount > 0 && (
                      <div className={`text-sm ${isSelected ? 'text-white' : 'text-green-600 font-bold'}`}>
                        Save {discount}%
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Plans for Selected Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {getAvailablePlans()
                .filter(plan => plan.interval === selectedDuration)
                .map((plan) => {
                  const isRecommended = plan.planType === 'AI_ENABLED';
                  const tabInfo = getDurationTabInfo(selectedDuration);
                  
                  return (
                    <div
                      key={plan.id}
                      className={`rounded-lg shadow-lg overflow-hidden relative transition-all duration-300 hover:shadow-xl ${
                        isRecommended
                          ? 'bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/40 dark:to-red-900/40 ring-4 ring-orange-500 shadow-2xl border-2 border-orange-300 dark:border-orange-600'
                          : 'bg-white dark:bg-gray-800 hover:ring-2 hover:ring-blue-500 hover:border-blue-300'
                      }`}
                    >
                      {isRecommended && (
                        <div className="absolute top-4 right-4 z-10">
                          <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                            🔥 POPULAR
                          </div>
                        </div>
                      )}

                      <div className="p-6">
                        <div className="text-center mb-6">
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                            {plan.planType === 'AI_ENABLED' ? '🤖 AI Enabled' : '📚 Manual'}
                          </h3>
                          
                          {/* Discount Badge */}
                          {plan.discountPercent && plan.discountPercent > 0 && (
                            <div className="inline-block mb-3">
                              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                                🎉 {plan.discountPercent}% OFF
                              </span>
                            </div>
                          )}

                          {/* Price Display */}
                          <div className="mb-4">
                            {plan.discountPercent && plan.discountPercent > 0 && (
                              <div className="mb-2">
                                <span className="text-lg text-gray-500 line-through">
                                  {formatPrice(plan.basePriceCents || plan.priceCents, plan.currency)}
                                </span>
                              </div>
                            )}
                            <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                              {formatPrice(plan.priceCents, plan.currency)}
                            </div>
                            <div className="text-gray-600 dark:text-gray-300">
                              per {getIntervalText(plan.interval)}
                            </div>
                          </div>

                          {/* Price per day */}
                          <div className="mb-4">
                            <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                              Just {getPricePerDay(plan.priceCents, plan.interval)}/day
                            </span>
                          </div>

                          {/* Encouraging message */}
                          <div className="mb-4">
                            <p className="text-sm font-medium text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/50 px-3 py-2 rounded-lg inline-block">
                              {getEncouragingMessage(plan.priceCents, plan.interval)}
                            </p>
                          </div>
                        </div>

                        {/* Features */}
                        <div className="space-y-2 mb-6">
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
                          {plan.planType === 'AI_ENABLED' && (
                            <div className="flex items-center text-sm text-blue-600 font-medium">
                              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                              </svg>
                              AI-generated questions & explanations
                            </div>
                          )}
                        </div>

                        {/* Subscribe Button */}
                        <button
                          onClick={() => handleSubscribe(plan.id, plan.name)}
                          disabled={processingPayment || (subscriptionStatus?.hasValidSubscription && !subscriptionStatus?.needsSubscription)}
                          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
                            processingPayment
                              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                              : subscriptionStatus?.hasValidSubscription && !subscriptionStatus?.needsSubscription
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : isRecommended
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 transform hover:scale-105 shadow-lg'
                              : `bg-${tabInfo.color}-500 text-white hover:bg-${tabInfo.color}-600 transform hover:scale-105 shadow-lg`
                          }`}
                        >
                          {processingPayment ? (
                            <div className="flex items-center justify-center">
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </div>
                          ) : subscriptionStatus?.hasValidSubscription && !subscriptionStatus?.needsSubscription ? (
                            'Current Plan'
                          ) : (
                            `🚀 Get Started - ${formatPrice(plan.priceCents, plan.currency)}`
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* No Plans Message */}
            {getAvailablePlans().filter(plan => plan.interval === selectedDuration).length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-lg font-medium">No plans available for this duration</p>
                  <p className="text-sm mt-2">Please select another duration</p>
                </div>
              </div>
            )}
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
