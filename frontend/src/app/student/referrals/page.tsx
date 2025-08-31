'use client';

import { useEffect, useState } from 'react';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import api from '@/lib/api';
import Swal from 'sweetalert2';

interface ReferralInfo {
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
    totalRewardsEarned: number;
    claimedRewards: number;
    unclaimedRewards: number;
  };
  recentReferrals: Array<{
    id: string;
    referee: {
      fullName: string;
      email: string;
      createdAt: string;
    };
    status: string;
    createdAt: string;
  }>;
  rewards: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    isClaimed: boolean;
    claimedAt: string | null;
    expiresAt: string | null;
    referral: {
      referee: {
        fullName: string;
        email: string;
      };
    };
  }>;
}

export default function ReferralsPage() {
  const [referralInfo, setReferralInfo] = useState<ReferralInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);

  useEffect(() => {
    fetchReferralInfo();
  }, []);

  const fetchReferralInfo = async () => {
    try {
      const response = await api.get('/referrals/my-referrals');
      setReferralInfo(response.data);
    } catch (error) {
      console.error('Error fetching referral info:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load referral information',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    try {
      setGeneratingCode(true);
      const response = await api.post('/referrals/generate-code');
      await fetchReferralInfo(); // Refresh data
      Swal.fire({
        title: 'Success!',
        text: `Your referral code is: ${response.data.code}`,
        icon: 'success',
      });
    } catch (error: any) {
      console.error('Error generating referral code:', error);
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to generate referral code',
        icon: 'error',
      });
    } finally {
      setGeneratingCode(false);
    }
  };

  const claimReward = async (rewardId: string) => {
    try {
      setClaimingReward(rewardId);
      const response = await api.post(`/referrals/claim-reward/${rewardId}`);
      await fetchReferralInfo(); // Refresh data
      Swal.fire({
        title: 'Success!',
        text: response.data.message,
        icon: 'success',
      });
    } catch (error: any) {
      console.error('Error claiming reward:', error);
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to claim reward',
        icon: 'error',
      });
    } finally {
      setClaimingReward(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    Swal.fire({
      title: 'Copied!',
      text: 'Referral code copied to clipboard',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const shareReferralCode = () => {
    if (!referralInfo?.referralCode.code) return;

    const shareText = `Join me on JEE Practice App! Use my referral code ${referralInfo.referralCode.code} to get 3 days free subscription. Sign up at: ${window.location.origin}/register?ref=${referralInfo.referralCode.code}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join JEE Practice App',
        text: shareText,
        url: `${window.location.origin}/register?ref=${referralInfo.referralCode.code}`,
      });
    } else {
      copyToClipboard(shareText);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'SUBSCRIPTION_DAYS':
        return '📅';
      case 'MONETARY_CREDIT':
        return '💰';
      case 'FEATURE_ACCESS':
        return '⭐';
      case 'DISCOUNT_PERCENT':
        return '🎯';
      default:
        return '🎁';
    }
  };

  const getRewardTypeText = (type: string, amount: number) => {
    switch (type) {
      case 'SUBSCRIPTION_DAYS':
        return `${amount} days free subscription`;
      case 'MONETARY_CREDIT':
        return `₹${amount / 100} credit`;
      case 'FEATURE_ACCESS':
        return 'Premium feature access';
      case 'DISCOUNT_PERCENT':
        return `${amount}% discount`;
      default:
        return 'Reward';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <p className="mt-6 text-lg font-medium text-gray-700">Loading referral information...</p>
              </div>
            </div>
          </StudentLayout>
        </SubscriptionGuard>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="STUDENT">
      <SubscriptionGuard>
        <StudentLayout>
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Refer & Earn</h1>
              <p className="text-lg text-gray-600">Invite friends and earn rewards together!</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Referral Code Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Referral Code</h2>
                  
                  {referralInfo?.referralCode ? (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-4">
                            <div className="text-sm text-gray-600 mb-1">Your Code</div>
                            <div className="text-2xl font-bold text-gray-900 font-mono">
                              {referralInfo.referralCode.code}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => copyToClipboard(referralInfo.referralCode.code)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Copy
                        </button>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button
                          onClick={shareReferralCode}
                          className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          📤 Share Code
                        </button>
                        <button
                          onClick={() => window.open(`/register?ref=${referralInfo.referralCode.code}`, '_blank')}
                          className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
                        >
                          🔗 Invite Link
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">Generate your unique referral code to start earning rewards!</p>
                      <button
                        onClick={generateReferralCode}
                        disabled={generatingCode}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                      >
                        {generatingCode ? 'Generating...' : 'Generate Code'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Statistics */}
                {referralInfo && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Statistics</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{referralInfo.stats.totalReferrals}</div>
                        <div className="text-sm text-gray-600">Total Referrals</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{referralInfo.stats.completedReferrals}</div>
                        <div className="text-sm text-gray-600">Completed</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{referralInfo.stats.pendingReferrals}</div>
                        <div className="text-sm text-gray-600">Pending</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{referralInfo.stats.totalRewardsEarned}</div>
                        <div className="text-sm text-gray-600">Days Earned</div>
                      </div>
                      <div className="text-center p-4 bg-indigo-50 rounded-lg">
                        <div className="text-2xl font-bold text-indigo-600">{referralInfo.stats.claimedRewards}</div>
                        <div className="text-sm text-gray-600">Claimed</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{referralInfo.stats.unclaimedRewards}</div>
                        <div className="text-sm text-gray-600">Unclaimed</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recent Referrals */}
                {referralInfo && referralInfo.recentReferrals.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Referrals</h2>
                    <div className="space-y-3">
                      {referralInfo.recentReferrals.map((referral) => (
                        <div key={referral.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium text-gray-900">{referral.referee.fullName}</div>
                            <div className="text-sm text-gray-600">{referral.referee.email}</div>
                            <div className="text-xs text-gray-500">{formatDate(referral.createdAt)}</div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            referral.status === 'COMPLETED' 
                              ? 'bg-green-100 text-green-800'
                              : referral.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {referral.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Rewards */}
                {referralInfo && referralInfo.rewards.length > 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Rewards</h3>
                    <div className="space-y-3">
                      {referralInfo.rewards.map((reward) => (
                        <div key={reward.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-lg">{getRewardTypeIcon(reward.type)}</span>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {getRewardTypeText(reward.type, reward.amount)}
                                </div>
                                <div className="text-sm text-gray-600">{reward.description}</div>
                                <div className="text-xs text-gray-500">
                                  From: {reward.referral.referee.fullName}
                                </div>
                              </div>
                            </div>
                            {!reward.isClaimed ? (
                              <button
                                onClick={() => claimReward(reward.id)}
                                disabled={claimingReward === reward.id}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                              >
                                {claimingReward === reward.id ? 'Claiming...' : 'Claim'}
                              </button>
                            ) : (
                              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded">
                                Claimed
                              </span>
                            )}
                          </div>
                          {reward.expiresAt && (
                            <div className="text-xs text-gray-500 mt-2">
                              Expires: {formatDate(reward.expiresAt)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* How It Works */}
                <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">🎯 How It Works</h3>
                  <div className="space-y-3 text-sm text-blue-800">
                    <div className="flex items-start space-x-2">
                      <span className="font-bold">1.</span>
                      <span>Share your referral code with friends</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="font-bold">2.</span>
                      <span>They sign up using your code</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="font-bold">3.</span>
                      <span>When they subscribe, you both get rewards!</span>
                    </div>
                  </div>
                </div>

                {/* Rewards Info */}
                <div className="bg-green-50 rounded-lg border border-green-200 p-6">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">🎁 Rewards</h3>
                  <div className="space-y-2 text-sm text-green-800">
                    <div>• <strong>You get:</strong> 7 days free subscription</div>
                    <div>• <strong>Your friend gets:</strong> 3 days free subscription</div>
                    <div>• <strong>Unlimited referrals</strong> - earn more rewards!</div>
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-purple-50 rounded-lg border border-purple-200 p-6">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">💡 Tips</h3>
                  <ul className="space-y-2 text-sm text-purple-800">
                    <li>• Share on social media</li>
                    <li>• Send to study groups</li>
                    <li>• Post in JEE forums</li>
                    <li>• Tell your classmates</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
} 