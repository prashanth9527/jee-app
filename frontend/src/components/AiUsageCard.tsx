'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';

interface AiUsageStatus {
  canUseAi: boolean;
  aiTestsUsed: number;
  aiTestsLimit: number;
  aiTestsRemaining: number;
  lastResetAt?: Date;
  nextResetAt?: Date;
  message: string;
}

export default function AiUsageCard() {
  const [aiUsage, setAiUsage] = useState<AiUsageStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAiUsage = async () => {
      try {
        const response = await api.get('/student/ai-usage');
        setAiUsage(response.data);
      } catch (error) {
        console.error('Error fetching AI usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAiUsage();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!aiUsage) {
    return null;
  }

  const usagePercentage = aiUsage.aiTestsLimit > 0 
    ? (aiUsage.aiTestsUsed / aiUsage.aiTestsLimit) * 100 
    : 0;

  const getStatusColor = () => {
    if (usagePercentage >= 90) return 'text-red-600';
    if (usagePercentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = () => {
    if (usagePercentage >= 90) return 'bg-red-500';
    if (usagePercentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">AI Test Usage</h3>
        <div className={`text-sm font-medium ${getStatusColor()}`}>
          {aiUsage.canUseAi ? 'Available' : 'Limited'}
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Used: {aiUsage.aiTestsUsed}</span>
          <span>Limit: {aiUsage.aiTestsLimit}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${getProgressColor()}`}
            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="text-center mb-4">
        <div className="text-2xl font-bold text-gray-900">
          {aiUsage.aiTestsRemaining}
        </div>
        <div className="text-sm text-gray-600">
          AI tests remaining
        </div>
      </div>

      {aiUsage.nextResetAt && (
        <div className="text-xs text-gray-500 text-center">
          Resets on {new Date(aiUsage.nextResetAt).toLocaleDateString()}
        </div>
      )}

      {!aiUsage.canUseAi && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="text-sm text-yellow-800">
            {aiUsage.message}
          </div>
        </div>
      )}
    </div>
  );
} 