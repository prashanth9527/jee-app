'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';
import { useToastContext } from '@/contexts/ToastContext';

interface LearningProfile {
  userId: string;
  learningStyle: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    reading: number;
  };
  optimalStudyTime: string;
  attentionSpan: number;
  preferredContentTypes: string[];
  weakConcepts: Array<{
    conceptId: string;
    conceptName: string;
    difficulty: number;
    attempts: number;
    lastAttempted: Date;
  }>;
  strongConcepts: Array<{
    conceptId: string;
    conceptName: string;
    mastery: number;
    lastPracticed: Date;
  }>;
  learningVelocity: {
    topicsPerWeek: number;
    averageTimePerTopic: number;
    retentionRate: number;
  };
  performancePredictions: {
    nextTopicDifficulty: string;
    estimatedCompletionTime: number;
    successProbability: number;
  };
}

interface LearningInsight {
  type: 'PERFORMANCE_TREND' | 'LEARNING_PATTERN' | 'STRENGTH_WEAKNESS' | 'STUDY_EFFICIENCY' | 'CONCEPT_MASTERY';
  title: string;
  description: string;
  data: any;
  confidence: number;
  recommendations: string[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export default function LearningAnalyticsPage() {
  const [learningProfile, setLearningProfile] = useState<LearningProfile | null>(null);
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshStatus, setRefreshStatus] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasAISubscription, setHasAISubscription] = useState<boolean | null>(null);
  const { showSuccess, showError, showInfo } = useToastContext();

  useEffect(() => {
    checkAISubscription();
    loadAnalyticsData();
    loadRefreshStatus();
  }, []);

  const checkAISubscription = async () => {
    try {
      const response = await api.get('/subscriptions/status');
      setHasAISubscription(response.data.plan === 'AI_ENABLED');
    } catch (error) {
      console.error('Error checking AI subscription:', error);
      setHasAISubscription(false);
    }
  };

  const handleUpgrade = () => {
    // Redirect to subscription/renewal page
    window.location.href = '/student/subscriptions';
  };

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Check subscription first
      if (hasAISubscription === false) {
        setLoading(false);
        return;
      }
      
      const [profileResponse, insightsResponse] = await Promise.all([
        api.get('/ai/advanced/analytics/learning-profile'),
        api.get('/ai/advanced/analytics/insights')
      ]);

      setLearningProfile(profileResponse.data);
      setInsights(insightsResponse.data);
    } catch (error: any) {
      console.error('Error loading analytics data:', error);
      if (error.response?.status === 403 || error.response?.data?.message?.includes('subscription')) {
        setHasAISubscription(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadRefreshStatus = async () => {
    try {
      const response = await api.get('/ai/advanced/analytics/refresh-status');
      setRefreshStatus(response.data);
    } catch (error) {
      console.error('Error loading refresh status:', error);
    }
  };

  const handleRefreshAnalytics = async () => {
    if (!refreshStatus?.canRefresh) {
      if (!refreshStatus?.hasAISubscription) {
        showError('Upgrade Required', 'AI analytics refresh requires AI_ENABLED subscription. Please upgrade your plan to use this feature.');
      } else {
        showInfo('Daily Limit Reached', 'You have already refreshed your analytics today. Please try again tomorrow.');
      }
      return;
    }

    try {
      setRefreshing(true);
      const response = await api.post('/ai/advanced/analytics/refresh');
      
      // Update the data with fresh analytics
      setLearningProfile(response.data.learningProfile);
      setInsights(response.data.insights);
      
      // Reload refresh status
      await loadRefreshStatus();
      
      showSuccess('Analytics Refreshed', 'Your AI analytics have been successfully refreshed with the latest data!');
    } catch (error: any) {
      console.error('Error refreshing analytics:', error);
      const errorMessage = error.response?.data?.message || 'Failed to refresh analytics. Please try again.';
      showError('Refresh Failed', errorMessage);
    } finally {
      setRefreshing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 border-red-300 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'LOW': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getLearningStyleLabel = (style: string) => {
    switch (style) {
      case 'visual': return 'Visual Learner';
      case 'auditory': return 'Auditory Learner';
      case 'kinesthetic': return 'Kinesthetic Learner';
      case 'reading': return 'Reading/Writing Learner';
      default: return 'Mixed Style';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <StudentLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    );
  }

  // Show upgrade message for non-AI users
  if (hasAISubscription === false) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <StudentLayout>
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">🧠 AI Learning Analytics</h1>
                  <p className="text-gray-600 mt-1">Personalized insights into your learning patterns and performance</p>
                </div>
              </div>
            </div>

            {/* Upgrade Message */}
            <div className="from-orange-50 to-red-50 border border-orange-200 rounded-lg p-8">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
                  <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Analytics Requires Premium Subscription</h2>
                <p className="text-lg text-gray-600 mb-6">
                  Unlock powerful AI-driven insights into your learning patterns, performance predictions, and personalized recommendations.
                </p>
                <div className="bg-white rounded-lg p-6 mb-6 text-left max-w-2xl mx-auto">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">What you'll get with AI Analytics:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">✓</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Learning Style Analysis</h4>
                        <p className="text-sm text-gray-600">Discover your optimal learning methods</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">✓</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Performance Predictions</h4>
                        <p className="text-sm text-gray-600">AI-powered success probability</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">✓</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Weakness Identification</h4>
                        <p className="text-sm text-gray-600">Target areas for improvement</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">✓</span>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Personalized Recommendations</h4>
                        <p className="text-sm text-gray-600">AI-driven study suggestions</p>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleUpgrade}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  🚀 Upgrade to AI Analytics
                </button>
                <p className="text-sm text-gray-500 mt-4">
                  Join thousands of students using AI to optimize their learning
                </p>
              </div>
            </div>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🧠 AI Learning Analytics</h1>
                <p className="text-gray-600 mt-1">Personalized insights into your learning patterns and performance</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleRefreshAnalytics}
                  disabled={refreshing || !refreshStatus?.canRefresh}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                    refreshStatus?.canRefresh && !refreshing
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : refreshStatus?.hasAISubscription === false
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-gray-400 text-white cursor-not-allowed'
                  }`}
                >
                  {refreshing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <span>🔄</span>
                      <span>
                        {refreshStatus?.hasAISubscription === false
                          ? 'Upgrade to Refresh'
                          : refreshStatus?.canRefresh
                          ? 'Refresh'
                          : 'Daily Limit Reached'}
                      </span>
                    </>
                  )}
                </button>
                {refreshStatus && (
                  <div className="text-sm text-gray-600 flex items-center">
                    {refreshStatus.hasAISubscription ? (
                      <span>
                        {refreshStatus.todayRefreshes}/{refreshStatus.maxRefreshes} refreshes today
                      </span>
                    ) : (
                      <span className="text-orange-600">AI subscription required</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Overview', icon: '📊' },
                  { id: 'insights', label: 'AI Insights', icon: '💡' },
                  { id: 'concepts', label: 'Concept Mastery', icon: '🎯' },
                  { id: 'recommendations', label: 'Recommendations', icon: '🚀' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && learningProfile && (
                <div className="space-y-6">
                  {/* Learning Style */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">🎨 Learning Style</h3>
                      <div className="space-y-3">
                        {Object.entries(learningProfile.learningStyle).map(([style, score]) => (
                          <div key={style} className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700 capitalize">
                              {getLearningStyleLabel(style)}
                            </span>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ width: `${score}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{score}%</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">⏰ Study Preferences</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-600">Optimal Study Time</p>
                          <p className="text-lg font-semibold text-gray-900">{learningProfile.optimalStudyTime}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Attention Span</p>
                          <p className="text-lg font-semibold text-gray-900">{learningProfile.attentionSpan} minutes</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Preferred Content</p>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {learningProfile.preferredContentTypes.map((type, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {type}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Learning Velocity */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Learning Velocity</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {learningProfile.learningVelocity.topicsPerWeek}
                        </div>
                        <div className="text-sm text-gray-600">Topics per Week</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {learningProfile.learningVelocity.averageTimePerTopic}m
                        </div>
                        <div className="text-sm text-gray-600">Avg Time per Topic</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(learningProfile.learningVelocity.retentionRate * 100)}%
                        </div>
                        <div className="text-sm text-gray-600">Retention Rate</div>
                      </div>
                    </div>
                  </div>

                  {/* Performance Predictions */}
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🔮 Performance Predictions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-sm text-gray-600">Next Topic Difficulty</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {learningProfile.performancePredictions.nextTopicDifficulty}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Estimated Completion Time</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {learningProfile.performancePredictions.estimatedCompletionTime} minutes
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Success Probability</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {Math.round(learningProfile.performancePredictions.successProbability * 100)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Insights Tab */}
              {activeTab === 'insights' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">💡 AI Learning Insights</h3>
                  <div className="space-y-4">
                    {insights.map((insight, index) => (
                      <div key={index} className={`border rounded-lg p-6 ${getPriorityColor(insight.priority)}`}>
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-semibold">{insight.title}</h4>
                            <p className="text-sm opacity-80 mt-1">{insight.description}</p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(insight.priority)}`}>
                              {insight.priority}
                            </span>
                            <p className="text-xs mt-1">Confidence: {insight.confidence}%</p>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <h5 className="font-medium mb-2">Recommendations:</h5>
                          <ul className="space-y-1">
                            {insight.recommendations.map((rec, recIndex) => (
                              <li key={recIndex} className="text-sm flex items-start">
                                <span className="mr-2">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Concepts Tab */}
              {activeTab === 'concepts' && learningProfile && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Weak Concepts */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-red-900 mb-4">⚠️ Areas for Improvement</h3>
                      <div className="space-y-3">
                        {learningProfile.weakConcepts.slice(0, 5).map((concept, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-red-200">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{concept.conceptName}</h4>
                              <span className="text-sm text-red-600">{concept.difficulty}% difficult</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                              <span>{concept.attempts} attempts</span>
                              <span>Last: {new Date(concept.lastAttempted).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Strong Concepts */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-4">✅ Strong Areas</h3>
                      <div className="space-y-3">
                        {learningProfile.strongConcepts.slice(0, 5).map((concept, index) => (
                          <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">{concept.conceptName}</h4>
                              <span className="text-sm text-green-600">{concept.mastery}% mastery</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              Last practiced: {new Date(concept.lastPracticed).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations Tab */}
              {activeTab === 'recommendations' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 AI-Powered Recommendations</h3>
                    <p className="text-gray-600 mb-4">
                      Based on your learning profile and performance data, here are personalized recommendations to optimize your study experience:
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-2">📚 Study Schedule</h4>
                        <ul className="space-y-1 text-sm text-gray-700">
                          <li>• Study during your optimal time: {learningProfile?.optimalStudyTime || 'morning'}</li>
                          <li>• Use {(learningProfile?.attentionSpan || 25)}-minute focused sessions</li>
                          <li>• Take 5-minute breaks between sessions</li>
                          <li>• Review weak concepts first thing in the morning</li>
                        </ul>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-2">🎯 Focus Areas</h4>
                        <ul className="space-y-1 text-sm text-gray-700">
                          <li>• Prioritize your weak concepts</li>
                          <li>• Use your strong areas to build confidence</li>
                          <li>• Practice {learningProfile?.learningVelocity?.topicsPerWeek || 0} topics per week</li>
                          <li>• Aim for {Math.round((learningProfile?.learningVelocity?.retentionRate || 0) * 100)}% retention rate</li>
                        </ul>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <h4 className="font-semibold text-purple-900 mb-2">💡 Learning Methods</h4>
                        <ul className="space-y-1 text-sm text-gray-700">
                          <li>• Focus on {learningProfile?.preferredContentTypes?.[0] || 'video'} content</li>
                          <li>• Use visual aids for better retention</li>
                          <li>• Practice active recall techniques</li>
                          <li>• Teach others to reinforce learning</li>
                        </ul>
                      </div>
                      
                      <div className="bg-white rounded-lg p-4 border border-orange-200">
                        <h4 className="font-semibold text-orange-900 mb-2">📈 Performance Goals</h4>
                        <ul className="space-y-1 text-sm text-gray-700">
                          <li>• Target {learningProfile?.performancePredictions?.nextTopicDifficulty || 'medium'} difficulty</li>
                          <li>• Aim for {Math.round((learningProfile?.performancePredictions?.successProbability || 0.7) * 100)}% success rate</li>
                          <li>• Complete topics in {learningProfile?.performancePredictions?.estimatedCompletionTime || 30} minutes</li>
                          <li>• Review and practice regularly</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </StudentLayout>
    </ProtectedRoute>
  );
}
