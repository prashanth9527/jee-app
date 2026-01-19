'use client';

import { useEffect, useState } from 'react';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import api from '@/lib/api';

interface AISuggestion {
  type: 'FOCUS_AREA' | 'PRACTICE_AREA' | 'REVISION_AREA' | 'ADVANCED_AREA';
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  subjectId: string;
  subjectName: string;
  topicId?: string;
  topicName?: string;
  subtopicId?: string;
  subtopicName?: string;
  reason: string;
  recommendedActions: string[];
  estimatedTimeToImprove: string;
  confidence: number;
}

interface QuickInsights {
  topSuggestions: AISuggestion[];
  performanceSummary: {
    overallScore: number;
    totalQuestions: number;
    totalCorrect: number;
    weakestArea: {
      subject: string;
      topic: string;
      score: number;
    } | null;
    strongestArea: {
      subject: string;
      topic: string;
      score: number;
    } | null;
  };
}

export default function AISuggestionsPage() {
  const [quickInsights, setQuickInsights] = useState<QuickInsights | null>(null);
  const [personalizedSuggestions, setPersonalizedSuggestions] = useState<AISuggestion[]>([]);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'suggestions' | 'analysis'>('insights');
  const [hasAISubscription, setHasAISubscription] = useState<boolean | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);

  useEffect(() => {
    checkAISubscription();
    fetchQuickInsights();
    fetchPersonalizedSuggestions();
    fetchPerformanceAnalysis();
  }, []);

  const checkAISubscription = async () => {
    try {
      setSubscriptionLoading(true);
      const response = await api.get('/subscriptions/status');
      console.log('Subscription response:', response.data);
      const isAIEnabled = response.data.plan === 'AI_ENABLED';
      console.log('Is AI enabled:', isAIEnabled);
      setHasAISubscription(isAIEnabled);
    } catch (error) {
      console.error('Error checking AI subscription:', error);
      setHasAISubscription(false);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  const handleUpgrade = () => {
    // Redirect to subscription/renewal page
    window.location.href = '/student/subscription';
  };

  const handleTabChange = (tab: 'insights' | 'suggestions' | 'analysis') => {
    // Always allow tab switching, but show upgrade message for suggestions if not AI_ENABLED
    setActiveTab(tab);
  };

  const fetchQuickInsights = async () => {
    try {
      const response = await api.get('/ai-suggestions/quick-insights');
      if (response.data.success) {
        setQuickInsights(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching quick insights:', error);
    }
  };

  const fetchPersonalizedSuggestions = async () => {
    try {
      const response = await api.get('/ai-suggestions/personalized?limit=15');
      if (response.data.success) {
        setPersonalizedSuggestions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching personalized suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceAnalysis = async () => {
    try {
      const response = await api.get('/ai-suggestions/performance-analysis');
      if (response.data.success) {
        setPerformanceAnalysis(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching performance analysis:', error);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FOCUS_AREA': return 'bg-red-100 text-red-800 border-red-200';
      case 'PRACTICE_AREA': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'REVISION_AREA': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ADVANCED_AREA': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-white';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'FOCUS_AREA': return '🎯';
      case 'PRACTICE_AREA': return '📚';
      case 'REVISION_AREA': return '🔄';
      case 'ADVANCED_AREA': return '🚀';
      default: return '💡';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Analyzing your performance...</p>
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
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Learning Suggestions</h1>
              <p className="text-gray-600">Personalized recommendations based on your performance</p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => handleTabChange('insights')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'insights'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Quick Insights
                </button>
                <button
                  onClick={() => handleTabChange('suggestions')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'suggestions'
                      ? 'border-blue-500 text-blue-600'
                      : subscriptionLoading
                      ? 'border-transparent text-gray-400 cursor-wait'
                      : hasAISubscription === false
                      ? 'border-transparent text-orange-500 hover:text-orange-700 hover:border-orange-300 cursor-pointer'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 cursor-pointer'
                  }`}
                  disabled={subscriptionLoading}
                >
                  <span className="flex items-center space-x-1">
                    <span>Detailed Suggestions</span>
                    {subscriptionLoading ? (
                      <span className="text-gray-400">⏳</span>
                    ) : hasAISubscription === false ? (
                      <span className="text-orange-500">🔒</span>
                    ) : null}
                  </span>
                </button>
                <button
                  onClick={() => handleTabChange('analysis')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'analysis'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Performance Analysis
                </button>
              </nav>
            </div>

            {/* Quick Insights Tab */}
            {activeTab === 'insights' && quickInsights && (
              <div className="space-y-6">
                {/* Performance Overview */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{quickInsights.performanceSummary.overallScore}%</div>
                      <div className="text-sm text-blue-600">Overall Score</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{quickInsights.performanceSummary.totalQuestions}</div>
                      <div className="text-sm text-green-600">Questions Attempted</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{quickInsights.performanceSummary.totalCorrect}</div>
                      <div className="text-sm text-yellow-600">Correct Answers</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {quickInsights.performanceSummary.totalQuestions > 0 
                          ? Math.round((quickInsights.performanceSummary.totalCorrect / quickInsights.performanceSummary.totalQuestions) * 100)
                          : 0}%
                      </div>
                      <div className="text-sm text-purple-600">Accuracy Rate</div>
                    </div>
                  </div>
                </div>

                {/* Top Suggestions */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Priority Suggestions</h3>
                  <div className="space-y-4">
                    {quickInsights.topSuggestions.map((suggestion, index) => (
                      <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getTypeIcon(suggestion.type)}</span>
                            <div>
                              <h4 className="font-medium text-gray-900">
                                {suggestion.subjectName}
                                {suggestion.topicName && ` > ${suggestion.topicName}`}
                                {suggestion.subtopicName && ` > ${suggestion.subtopicName}`}
                              </h4>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(suggestion.type)}`}>
                                  {suggestion.type.replace('_', ' ')}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                                  {suggestion.priority}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-500">Confidence</div>
                            <div className="text-lg font-semibold text-blue-600">{suggestion.confidence}%</div>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-3">{suggestion.reason}</p>
                        
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Recommended Actions:</h5>
                          <ul className="list-disc list-inside space-y-1">
                            {suggestion.recommendedActions.map((action, actionIndex) => (
                              <li key={actionIndex} className="text-sm text-gray-600">{action}</li>
                            ))}
                          </ul>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span>⏱️ Estimated time: {suggestion.estimatedTimeToImprove}</span>
                          <button className="text-blue-600 hover:text-blue-800 font-medium">
                            Start Practice →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Weakest & Strongest Areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quickInsights.performanceSummary.weakestArea && (
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">🎯 Focus Area</h3>
                      <div className="space-y-2">
                        <p className="text-gray-600">
                          <span className="font-medium">{quickInsights.performanceSummary.weakestArea.subject}</span>
                          {quickInsights.performanceSummary.weakestArea.topic && 
                            ` > ${quickInsights.performanceSummary.weakestArea.topic}`}
                        </p>
                        <p className="text-2xl font-bold text-red-600">
                          {quickInsights.performanceSummary.weakestArea.score}%
                        </p>
                        <p className="text-sm text-gray-500">Needs immediate attention</p>
                      </div>
                    </div>
                  )}
                  
                  {quickInsights.performanceSummary.strongestArea && (
                    <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">🚀 Strong Area</h3>
                      <div className="space-y-2">
                        <p className="text-gray-600">
                          <span className="font-medium">{quickInsights.performanceSummary.strongestArea.subject}</span>
                          {quickInsights.performanceSummary.strongestArea.topic && 
                            ` > ${quickInsights.performanceSummary.strongestArea.topic}`}
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          {quickInsights.performanceSummary.strongestArea.score}%
                        </p>
                        <p className="text-sm text-gray-500">Ready for advanced challenges</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Suggestions Tab */}
            {activeTab === 'suggestions' && (
              <div className="space-y-6">
                {subscriptionLoading ? (
                  /* Loading State */
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Checking subscription status...</p>
                    </div>
                  </div>
                ) : hasAISubscription === false ? (
                  /* Upgrade Message for Non-AI Users */
                  <div className="from-orange-50 to-red-50 border border-orange-200 rounded-lg p-8">
                    <div className="text-center">
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
                        <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Detailed Suggestions Requires Premium Subscription</h2>
                      <p className="text-lg text-gray-600 mb-6">
                        Unlock personalized, detailed learning suggestions powered by AI analysis of your performance patterns.
                      </p>
                      <div className="bg-white rounded-lg p-6 mb-6 text-left max-w-2xl mx-auto">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">What you'll get with AI Detailed Suggestions:</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-sm">✓</span>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Personalized Recommendations</h4>
                              <p className="text-sm text-gray-600">AI-powered suggestions tailored to your learning style</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-sm">✓</span>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Detailed Action Plans</h4>
                              <p className="text-sm text-gray-600">Step-by-step study recommendations with time estimates</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-sm">✓</span>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Subject-Specific Guidance</h4>
                              <p className="text-sm text-gray-600">Tailored advice for Mathematics, Physics, and Chemistry</p>
                            </div>
                          </div>
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 text-sm">✓</span>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">Priority-Based Suggestions</h4>
                              <p className="text-sm text-gray-600">Focus on high-impact areas for maximum improvement</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleUpgrade}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        🚀 Upgrade to AI Detailed Suggestions
                      </button>
                      <p className="text-sm text-gray-500 mt-4">
                        Join thousands of students using AI to optimize their JEE preparation
                      </p>
                    </div>
                  </div>
                ) : (
                  /* AI Suggestions for AI_ENABLED Users */
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">All Personalized Suggestions</h3>
                    <div className="space-y-4">
                      {personalizedSuggestions.map((suggestion, index) => (
                        <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-2xl">{getTypeIcon(suggestion.type)}</span>
                              <div>
                                <h4 className="font-medium text-gray-900">
                                  {suggestion.subjectName}
                                  {suggestion.topicName && ` > ${suggestion.topicName}`}
                                  {suggestion.subtopicName && ` > ${suggestion.subtopicName}`}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(suggestion.type)}`}>
                                    {suggestion.type.replace('_', ' ')}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                                    {suggestion.priority}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">Confidence</div>
                              <div className="text-lg font-semibold text-blue-600">{suggestion.confidence}%</div>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mb-3">{suggestion.reason}</p>
                          
                          <div className="mb-3">
                            <h5 className="text-sm font-medium text-gray-900 mb-2">Recommended Actions:</h5>
                            <ul className="list-disc list-inside space-y-1">
                              {suggestion.recommendedActions.map((action, actionIndex) => (
                                <li key={actionIndex} className="text-sm text-gray-600">{action}</li>
                              ))}
                            </ul>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>⏱️ Estimated time: {suggestion.estimatedTimeToImprove}</span>
                            <button className="text-blue-600 hover:text-blue-800 font-medium">
                              Start Practice →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Performance Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="space-y-6">
                {performanceAnalysis ? (
                  <>
                    {/* Overall Performance */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Overall Performance</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{performanceAnalysis.overall.score.toFixed(1)}%</div>
                          <div className="text-sm text-blue-600">Overall Score</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{performanceAnalysis.overall.totalQuestions}</div>
                          <div className="text-sm text-green-600">Total Questions</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">{performanceAnalysis.overall.correctAnswers}</div>
                          <div className="text-sm text-yellow-600">Correct Answers</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">{performanceAnalysis.trends?.totalAreas || 0}</div>
                          <div className="text-sm text-purple-600">Areas Analyzed</div>
                        </div>
                      </div>
                    </div>

                    {/* Subject Performance */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Subject Performance</h3>
                      <div className="space-y-4">
                        {performanceAnalysis.subjects?.map((subject: any, index: number) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-gray-900">{subject.subjectName}</h4>
                              <div className="text-right">
                                <div className="text-lg font-semibold text-blue-600">{subject.score.toFixed(1)}%</div>
                                <div className="text-sm text-gray-500">{subject.correctAnswers}/{subject.totalQuestions} correct</div>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  subject.score >= 80 ? 'bg-green-500' : 
                                  subject.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(100, subject.score)}%` }}
                              ></div>
                            </div>
                            {subject.topics && subject.topics.length > 0 && (
                              <div className="mt-3">
                                <h5 className="text-sm font-medium text-gray-700 mb-2">Topics:</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {subject.topics.slice(0, 4).map((topic: any, topicIndex: number) => (
                                    <div key={topicIndex} className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                      {topic.topicName}: {topic.score.toFixed(1)}%
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance Insights */}
                    {performanceAnalysis.insights && performanceAnalysis.insights.length > 0 && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Performance Insights</h3>
                        <div className="space-y-4">
                          {performanceAnalysis.insights.map((insight: any, index: number) => (
                            <div key={index} className={`border-l-4 p-4 rounded ${
                              insight.type === 'WEAKNESS' ? 'border-red-500 bg-red-50' :
                              insight.type === 'STRENGTH' ? 'border-green-500 bg-green-50' :
                              insight.type === 'IMPROVEMENT' ? 'border-yellow-500 bg-yellow-50' :
                              'border-blue-500 bg-blue-50'
                            }`}>
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{insight.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  insight.priority === 'HIGH' ? 'bg-red-100 text-red-800' :
                                  insight.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }`}>
                                  {insight.priority}
                                </span>
                              </div>
                              <p className="text-gray-700 mb-2">{insight.description}</p>
                              <p className="text-sm text-gray-600">
                                <strong>Recommendation:</strong> {insight.recommendation}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Performance Trends */}
                    {performanceAnalysis.trends && (
                      <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 Performance Trends</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">{performanceAnalysis.trends.weakAreas}</div>
                            <div className="text-sm text-red-600">Weak Areas</div>
                          </div>
                          <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">
                              {performanceAnalysis.trends.totalAreas - performanceAnalysis.trends.weakAreas - performanceAnalysis.trends.strongAreas}
                            </div>
                            <div className="text-sm text-yellow-600">Moderate Areas</div>
                          </div>
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{performanceAnalysis.trends.strongAreas}</div>
                            <div className="text-sm text-green-600">Strong Areas</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center py-8">
                      <div className="text-gray-400 text-6xl mb-4">📊</div>
                      <p className="text-gray-500">Loading performance analysis...</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
} 