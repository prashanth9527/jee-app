'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import api from '@/lib/api';

interface PracticeTest {
  id: string;
  examPaper: {
    id: string;
    title: string;
    description: string | null;
    timeLimitMin: number | null;
  } | null;
  startedAt: string;
  submittedAt: string | null;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number | null;
}

export default function PracticeTestHistoryPage() {
  const [tests, setTests] = useState<PracticeTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchPracticeTests();
  }, [currentPage]);

  const fetchPracticeTests = async () => {
    try {
      const response = await api.get(`/student/exam-history?page=${currentPage}&limit=10`);
      setTests(response.data.submissions || []);
      setTotalPages(response.data.pagination.totalPages);
      setTotalItems(response.data.pagination.totalItems);
    } catch (error) {
      console.error('Error fetching practice tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (startedAt: string, submittedAt: string | null) => {
    if (!submittedAt) return 'In Progress';
    
    const start = new Date(startedAt);
    const end = new Date(submittedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`;
    }
    return `${diffSecs}s`;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-600';
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number | null) => {
    if (score === null) return 'bg-gray-100 text-gray-800';
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <p className="mt-6 text-lg font-medium text-gray-700">Loading practice history...</p>
                <p className="mt-2 text-sm text-gray-500">Please wait while we fetch your test history</p>
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
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Test History</h1>
                  <p className="text-lg text-gray-600">Review your past practice tests and performance</p>
                </div>
                <Link
                  href="/student/practice"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Take New Test
                </Link>
              </div>
            </div>

            {/* Stats Summary */}
            {tests.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-2xl font-bold text-blue-600">{totalItems}</div>
                  <div className="text-sm text-gray-600">Total Tests</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-2xl font-bold text-green-600">
                    {tests.filter(t => t.scorePercent && t.scorePercent >= 80).length}
                  </div>
                  <div className="text-sm text-gray-600">Excellent (≥80%)</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-2xl font-bold text-yellow-600">
                    {tests.filter(t => t.scorePercent && t.scorePercent >= 60 && t.scorePercent < 80).length}
                  </div>
                  <div className="text-sm text-gray-600">Good (60-79%)</div>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="text-2xl font-bold text-red-600">
                    {tests.filter(t => t.scorePercent && t.scorePercent < 60).length}
                  </div>
                  <div className="text-sm text-gray-600">Needs Work (&lt;60%)</div>
                </div>
              </div>
            )}

            {/* Tests List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Practice Tests</h2>
              </div>

              {tests.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Practice Tests Yet</h3>
                  <p className="text-gray-600 mb-6">Start your first practice test to see your history here.</p>
                  <Link
                    href="/student/practice"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Take Your First Test
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {tests.map((test) => (
                    <div key={test.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {test.examPaper?.title || 'Practice Test'}
                            </h3>
                            {test.submittedAt && (
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getScoreBadge(test.scorePercent)}`}>
                                {test.scorePercent?.toFixed(1)}%
                              </span>
                            )}
                            {!test.submittedAt && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                In Progress
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Questions:</span> {test.totalQuestions}
                            </div>
                            <div>
                              <span className="font-medium">Correct:</span> {test.correctCount}
                            </div>
                            <div>
                              <span className="font-medium">Time:</span> {formatDuration(test.startedAt, test.submittedAt)}
                            </div>
                            <div>
                              <span className="font-medium">Date:</span> {new Date(test.startedAt).toLocaleDateString()}
                            </div>
                          </div>

                          {test.examPaper?.description && (
                            <p className="text-sm text-gray-500 mt-2">{test.examPaper.description}</p>
                          )}
                        </div>

                        <div className="flex items-center space-x-3">
                          {test.submittedAt ? (
                            <Link
                              href={`/student/practice/results/${test.id}`}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                            >
                              View Results
                            </Link>
                          ) : (
                            <Link
                              href={`/student/practice/test/${test.id}`}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                            >
                              Continue Test
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * 10) + 1} to {Math.min(currentPage * 10, totalItems)} of {totalItems} tests
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
} 
