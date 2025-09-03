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
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'suggestions' | 'analysis'>('insights');

  useEffect(() => {
    fetchQuickInsights();
    fetchPersonalizedSuggestions();
  }, []);

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
                  onClick={() => setActiveTab('insights')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'insights'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Quick Insights
                </button>
                <button
                  onClick={() => setActiveTab('suggestions')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'suggestions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Detailed Suggestions
                </button>
                <button
                  onClick={() => setActiveTab('analysis')}
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

            {/* Performance Analysis Tab */}
            {activeTab === 'analysis' && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Performance Analysis</h3>
                <p className="text-gray-600 mb-4">
                  This section will show detailed breakdown of your performance by subject, topic, and subtopic.
                  The analysis helps identify specific areas for improvement.
                </p>
                <div className="text-center py-8">
                  <div className="text-gray-400 text-6xl mb-4">📊</div>
                  <p className="text-gray-500">Detailed analysis coming soon...</p>
                </div>
              </div>
            )}
          </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
} 