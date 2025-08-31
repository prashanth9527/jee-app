'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import ExpertLayout from '@/components/ExpertLayout';
import Swal from 'sweetalert2';

interface QuestionReport {
  id: string;
  reportType: string;
  reason: string;
  description?: string;
  alternativeExplanation?: string;
  suggestedAnswer?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  question: {
    id: string;
    stem: string;
    explanation?: string;
    subject?: {
      name: string;
      stream: {
        name: string;
        code: string;
      };
    };
  };
  user: {
    id: string;
    fullName: string;
    email: string;
  };
  suggestedOptions: {
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }[];
  reviewedBy?: {
    id: string;
    fullName: string;
  };
}

interface ReportStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  typeStats: {
    type: string;
    count: number;
  }[];
}

export default function ExpertQuestionReportsPage() {
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<QuestionReport | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    fetchReports();
    fetchStats();
  }, [currentPage, selectedStatus, selectedType]);

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedType !== 'all') params.append('type', selectedType);

      const response = await api.get(`/expert/question-reports?${params}`);
      setReports(response.data.reports);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching reports:', error);
      Swal.fire('Error', 'Failed to fetch reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/expert/question-reports/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleReview = async () => {
    if (!selectedReport) return;

    try {
      await api.post(`/expert/question-reports/${selectedReport.id}/review`, {
        status: reviewStatus,
        reviewNotes
      });

      Swal.fire('Success', `Report ${reviewStatus.toLowerCase()} successfully`, 'success');
      setReviewModalOpen(false);
      setSelectedReport(null);
      setReviewStatus('APPROVED');
      setReviewNotes('');
      fetchReports();
      fetchStats();
    } catch (error) {
      console.error('Error reviewing report:', error);
      Swal.fire('Error', 'Failed to review report', 'error');
    }
  };

  const openReviewModal = (report: QuestionReport) => {
    setSelectedReport(report);
    setReviewStatus('APPROVED');
    setReviewNotes('');
    setReviewModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INCORRECT_ANSWER': return 'bg-red-100 text-red-800';
      case 'INCORRECT_EXPLANATION': return 'bg-orange-100 text-orange-800';
      case 'SUGGESTED_EXPLANATION': return 'bg-blue-100 text-blue-800';
      case 'GRAMMATICAL_ERROR': return 'bg-purple-100 text-purple-800';
      case 'TECHNICAL_ERROR': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="EXPERT">
        <ExpertLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </ExpertLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="EXPERT">
      <ExpertLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Question Reports</h1>
            <p className="text-green-100">Review and manage student-submitted question reports</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.total || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.pending || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.approved || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.rejected || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="all">All Types</option>
                <option value="INCORRECT_ANSWER">Incorrect Answer</option>
                <option value="INCORRECT_EXPLANATION">Incorrect Explanation</option>
                <option value="SUGGESTED_EXPLANATION">Suggested Explanation</option>
                <option value="GRAMMATICAL_ERROR">Grammatical Error</option>
                <option value="TECHNICAL_ERROR">Technical Error</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id}>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-900 truncate">{report.question.stem}</div>
                          <div className="text-sm text-gray-500">
                            {report.question.subject?.name || 'No Subject'} ({report.question.subject?.stream?.code || 'No Stream'})
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(report.reportType)}`}>
                          {report.reportType.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{report.user.fullName}</div>
                        <div className="text-xs text-gray-500">{report.user.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {report.status === 'PENDING' && (
                          <button
                            onClick={() => openReviewModal(report)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Review
                          </button>
                        )}
                        {report.status !== 'PENDING' && (
                          <span className="text-gray-500">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Review Modal */}
          {reviewModalOpen && selectedReport && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Review Report</h2>
                </div>

                <div className="p-6 space-y-6">
                  {/* Report Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Report Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="text-gray-900"><strong>Type:</strong> {selectedReport.reportType.replace(/_/g, ' ')}</div>
                      <div className="text-gray-900"><strong>Reason:</strong> {selectedReport.reason}</div>
                      {selectedReport.description && (
                        <div className="text-gray-900"><strong>Description:</strong> {selectedReport.description}</div>
                      )}
                      <div className="text-gray-900"><strong>Student:</strong> {selectedReport.user.fullName} ({selectedReport.user.email})</div>
                      <div className="text-gray-900"><strong>Date:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Question Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Question Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="text-gray-900"><strong>Question:</strong> {selectedReport.question.stem}</div>
                      <div className="text-gray-900"><strong>Subject:</strong> {selectedReport.question.subject?.name || 'No Subject'} ({selectedReport.question.subject?.stream?.code || 'No Stream'})</div>
                      {selectedReport.question.explanation && (
                        <div className="text-gray-900"><strong>Current Explanation:</strong> {selectedReport.question.explanation}</div>
                      )}
                    </div>
                  </div>

                  {/* Alternative Explanation */}
                  {selectedReport.reportType === 'SUGGESTED_EXPLANATION' && selectedReport.alternativeExplanation && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-2">Suggested Explanation</h3>
                      <p className="text-blue-800 text-sm">{selectedReport.alternativeExplanation}</p>
                    </div>
                  )}

                  {/* Suggested Answer */}
                  {selectedReport.reportType === 'INCORRECT_ANSWER' && selectedReport.suggestedAnswer && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-medium text-green-900 mb-2">Suggested Answer</h3>
                      <p className="text-green-800 text-sm">{selectedReport.suggestedAnswer}</p>
                    </div>
                  )}

                  {/* Suggested Options */}
                  {selectedReport.reportType === 'INCORRECT_ANSWER' && selectedReport.suggestedOptions && selectedReport.suggestedOptions.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-medium text-green-900 mb-2">Suggested Options</h3>
                      <div className="space-y-2">
                        {selectedReport.suggestedOptions.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <span className="text-sm text-green-800">{index + 1}.</span>
                            <span className="text-sm text-green-800">{option.text}</span>
                            {option.isCorrect && (
                              <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">Correct</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Review Decision */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Review Decision</label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="APPROVED"
                          checked={reviewStatus === 'APPROVED'}
                          onChange={(e) => setReviewStatus(e.target.value as 'APPROVED' | 'REJECTED')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-900">Approve</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="REJECTED"
                          checked={reviewStatus === 'REJECTED'}
                          onChange={(e) => setReviewStatus(e.target.value as 'APPROVED' | 'REJECTED')}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-900">Reject</span>
                      </label>
                    </div>
                  </div>

                  {/* Review Notes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Review Notes (Optional)</label>
                    <textarea
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="Add any notes about your decision..."
                    />
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setReviewModalOpen(false);
                      setSelectedReport(null);
                      setReviewStatus('APPROVED');
                      setReviewNotes('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReview}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Submit Review
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </ExpertLayout>
    </ProtectedRoute>
  );
} 