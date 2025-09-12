'use client';

import { useEffect, useState } from 'react';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import api from '@/lib/api';

interface PerformanceData {
  subjectPerformance: {
    subjectId: string;
    subjectName: string;
    totalQuestions: number;
    correctAnswers: number;
    score: number;
  }[];
  topicPerformance: {
    topicId: string;
    topicName: string;
    subjectName: string;
    totalQuestions: number;
    correctAnswers: number;
    score: number;
  }[];
  difficultyPerformance: {
    difficulty: string;
    totalQuestions: number;
    correctAnswers: number;
    score: number;
  }[];
  recentTrend: {
    score: number;
    date: string;
    examTitle: string;
  }[];
}

export default function PerformancePage() {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const response = await api.get('/student/performance');
      setPerformance(response.data);
    } catch (error) {
      console.error('Error fetching performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HARD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading performance data...</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
            <p className="text-gray-600">Track your progress and identify areas for improvement</p>
          </div>

          {performance && (
            <>
              {/* Subject Performance */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
                {performance.subjectPerformance.length > 0 ? (
                  <div className="space-y-4">
                    {performance.subjectPerformance.map((subject) => (
                      <div key={subject.subjectId} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-medium text-gray-900">{subject.subjectName}</h4>
                          <span className={`text-lg font-bold ${getScoreColor(subject.score)}`}>
                            {subject.score.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                          <span>{subject.correctAnswers} correct out of {subject.totalQuestions} questions</span>
                          <span>{((subject.correctAnswers / subject.totalQuestions) * 100).toFixed(1)}% accuracy</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${subject.score >= 80 ? 'bg-green-500' : subject.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${subject.score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No subject performance data available</p>
                )}
              </div>

              {/* Topic Performance */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Topic Performance</h3>
                {performance.topicPerformance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Questions</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {performance.topicPerformance.map((topic) => (
                          <tr key={topic.topicId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {topic.topicName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {topic.subjectName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {topic.correctAnswers}/{topic.totalQuestions}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <span className={getScoreColor(topic.score)}>
                                {topic.score.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div
                                    className={`h-2 rounded-full ${topic.score >= 80 ? 'bg-green-500' : topic.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${topic.score}%` }}
                                  ></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No topic performance data available</p>
                )}
              </div>

              {/* Difficulty Performance */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance by Difficulty</h3>
                {performance.difficultyPerformance.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {performance.difficultyPerformance.map((difficulty) => (
                      <div key={difficulty.difficulty} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(difficulty.difficulty)}`}>
                            {difficulty.difficulty}
                          </span>
                          <span className={`text-lg font-bold ${getScoreColor(difficulty.score)}`}>
                            {difficulty.score.toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {difficulty.correctAnswers} correct out of {difficulty.totalQuestions} questions
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${difficulty.score >= 80 ? 'bg-green-500' : difficulty.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${difficulty.score}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No difficulty performance data available</p>
                )}
              </div>

              {/* Recent Performance Trend */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Performance Trend</h3>
                {performance.recentTrend.length > 0 ? (
                  <div className="space-y-4">
                    {performance.recentTrend.map((exam, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{exam.examTitle}</h4>
                          <p className="text-xs text-gray-500">
                            {new Date(exam.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-medium ${getScoreColor(exam.score)}`}>
                            {exam.score.toFixed(1)}%
                          </span>
                          <div className="w-12 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${exam.score >= 80 ? 'bg-green-500' : exam.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                              style={{ width: `${exam.score}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent exam data available</p>
                )}
              </div>

              {/* Performance Insights */}
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Performance Insights</h3>
                <div className="space-y-3">
                  {performance.subjectPerformance.length > 0 && (
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-blue-800">
                          <strong>Best Subject:</strong> {performance.subjectPerformance[0]?.subjectName} ({performance.subjectPerformance[0]?.score.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  )}
                  {performance.subjectPerformance.length > 1 && (
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <p className="text-sm text-blue-800">
                          <strong>Needs Improvement:</strong> {performance.subjectPerformance[performance.subjectPerformance.length - 1]?.subjectName} ({performance.subjectPerformance[performance.subjectPerformance.length - 1]?.score.toFixed(1)}%)
                        </p>
                      </div>
                    </div>
                  )}
                  {performance.recentTrend.length > 1 && (
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <div>
                        <p className="text-sm text-blue-800">
                          <strong>Recent Trend:</strong> {performance.recentTrend[0]?.score > performance.recentTrend[1]?.score ? 'Improving' : 'Declining'} performance
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {!performance && !loading && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No performance data</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start taking exams to see your performance analytics.
              </p>
            </div>
          )}
        </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
} 