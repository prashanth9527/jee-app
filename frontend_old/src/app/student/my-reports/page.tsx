'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import api from '@/lib/api';

interface QuestionReport {
  id: string;
  reportType: string;
  reason: string;
  description?: string;
  status: string;
  alternativeExplanation?: string;
  suggestedAnswer?: string;
  createdAt: string;
  question: {
    id: string;
    stem: string;
    subject: {
      name: string;
      stream: {
        name: string;
        code: string;
      };
    };
  };
  suggestedOptions: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
  reviewedBy?: {
    id: string;
    fullName: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
}

export default function MyReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/question-reports/my-reports');
      setReports(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INCORRECT_ANSWER': return '❌';
      case 'INCORRECT_EXPLANATION': return '📝';
      case 'SUGGESTED_EXPLANATION': return '💡';
      case 'GRAMMATICAL_ERROR': return '📖';
      case 'TECHNICAL_ERROR': return '🔧';
      case 'OTHER': return '❓';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading your reports...</p>
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
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
              <h1 className="text-3xl font-bold mb-2">My Question Reports</h1>
              <p className="text-blue-100">Track the status of your submitted question reports</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {reports.filter(r => r.status === 'PENDING').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {reports.filter(r => r.status === 'APPROVED').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Rejected</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {reports.filter(r => r.status === 'REJECTED').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Reports List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Your Reports</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {reports.length} total reports submitted
                </p>
              </div>

              <div className="divide-y divide-gray-200">
                {reports.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Yet</h3>
                    <p className="text-gray-600">
                      You haven't submitted any question reports yet. Start by reporting issues with questions you encounter.
                    </p>
                  </div>
                ) : (
                  reports.map((report) => (
                    <div key={report.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-3">
                            <span className="text-lg mr-3">{getTypeIcon(report.reportType)}</span>
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {report.reportType.replace(/_/g, ' ')}
                              </h3>
                              <p className="text-sm text-gray-600">{report.reason}</p>
                            </div>
                            <span className={`ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                              {report.status}
                            </span>
                          </div>

                          {/* Question Details */}
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
                            <p className="text-sm text-gray-700 mb-2">{report.question.stem}</p>
                            <p className="text-xs text-gray-500">
                              {report.question.subject.name} ({report.question.subject.stream.code})
                            </p>
                          </div>

                          {/* Report Details */}
                          {report.description && (
                            <div className="mb-3">
                              <h4 className="font-medium text-gray-900 mb-1">Description:</h4>
                              <p className="text-sm text-gray-700">{report.description}</p>
                            </div>
                          )}

                          {/* Alternative Explanation */}
                          {report.alternativeExplanation && (
                            <div className="mb-3">
                              <h4 className="font-medium text-gray-900 mb-1">Suggested Explanation:</h4>
                              <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded">{report.alternativeExplanation}</p>
                            </div>
                          )}

                          {/* Suggested Options */}
                          {report.suggestedOptions.length > 0 && (
                            <div className="mb-3">
                              <h4 className="font-medium text-gray-900 mb-1">Suggested Options:</h4>
                              <div className="space-y-1">
                                {report.suggestedOptions.map((option, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                                      option.isCorrect ? 'bg-green-500 text-white' : 'bg-gray-300'
                                    }`}>
                                      {option.isCorrect ? '✓' : '○'}
                                    </span>
                                    <span className="text-sm text-gray-700">{option.text}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Review Information */}
                          {report.status !== 'PENDING' && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-2">Review Details:</h4>
                              <div className="space-y-2 text-sm">
                                <div>
                                  <strong>Reviewed by:</strong> {report.reviewedBy?.fullName || 'Unknown'}
                                </div>
                                <div>
                                  <strong>Reviewed on:</strong> {report.reviewedAt ? new Date(report.reviewedAt).toLocaleDateString() : 'Unknown'}
                                </div>
                                {report.reviewNotes && (
                                  <div>
                                    <strong>Notes:</strong> {report.reviewNotes}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 text-xs text-gray-500">
                            Submitted on {new Date(report.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
} 
