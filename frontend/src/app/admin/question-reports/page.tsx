'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import Swal from 'sweetalert2';

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
    explanation?: string;
    subject: {
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

interface ReportStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  typeStats: Array<{
    type: string;
    count: number;
  }>;
}

export default function AdminQuestionReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReport, setSelectedReport] = useState<QuestionReport | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');

  const reportTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'INCORRECT_ANSWER', label: 'Incorrect Answer' },
    { value: 'INCORRECT_EXPLANATION', label: 'Incorrect Explanation' },
    { value: 'SUGGESTED_EXPLANATION', label: 'Suggested Explanation' },
    { value: 'GRAMMATICAL_ERROR', label: 'Grammatical Error' },
    { value: 'TECHNICAL_ERROR', label: 'Technical Error' },
    { value: 'OTHER', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  useEffect(() => {
    loadReports();
    loadStats();
  }, [selectedStatus, selectedType, currentPage]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedType !== 'all') params.append('type', selectedType);

      const response = await api.get(`/admin/question-reports?${params}`);
      setReports(response.data.reports);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/question-reports/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleReview = async () => {
    if (!selectedReport) return;

    try {
      await api.post(`/admin/question-reports/${selectedReport.id}/review`, {
        status: reviewStatus,
        reviewNotes: reviewNotes || undefined
      });

      Swal.fire({
        icon: 'success',
        title: 'Report Reviewed',
        text: `Report has been ${reviewStatus.toLowerCase()} successfully.`
      });

      setReviewModalOpen(false);
      setSelectedReport(null);
      setReviewStatus('APPROVED');
      setReviewNotes('');
      loadReports();
      loadStats();
    } catch (error) {
      console.error('Error reviewing report:', error);
      Swal.fire({
        icon: 'error',
        title: 'Review Failed',
        text: 'Failed to review the report. Please try again.'
      });
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

  if (loading && !stats) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <AdminLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-lg p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">Question Reports</h1>
            <p className="text-orange-100">Manage and review student question reports</p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Reports</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.pending}</p>
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
                    <p className="text-2xl font-semibold text-gray-900">{stats.approved}</p>
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
                    <p className="text-2xl font-semibold text-gray-900">{stats.rejected}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {statusOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {reportTypes.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Question Reports</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question
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
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-lg mr-2">{getTypeIcon(report.reportType)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {report.reportType.replace(/_/g, ' ')}
                            </div>
                            <div className="text-sm text-gray-500">{report.reason}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-900 truncate">{report.question.stem}</div>
                          <div className="text-sm text-gray-500">
                            {report.question.subject.name} ({report.question.subject.stream.code})
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{report.user.fullName}</div>
                        <div className="text-sm text-gray-500">{report.user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {report.status === 'PENDING' ? (
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setReviewModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Review
                          </button>
                        ) : (
                          <span className="text-gray-500">Reviewed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {reports.length === 0 && (
              <div className="p-12 text-center">
                <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Reports Found</h3>
                <p className="text-gray-600">No question reports match your current filters.</p>
              </div>
            )}

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
                    <div><strong>Type:</strong> {selectedReport.reportType.replace(/_/g, ' ')}</div>
                    <div><strong>Reason:</strong> {selectedReport.reason}</div>
                    {selectedReport.description && (
                      <div><strong>Description:</strong> {selectedReport.description}</div>
                    )}
                  </div>
                </div>

                {/* Question Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Question</h3>
                  <p className="text-sm text-gray-700 mb-2">{selectedReport.question.stem}</p>
                  {selectedReport.question.explanation && (
                    <div>
                      <strong className="text-sm">Current Explanation:</strong>
                      <p className="text-sm text-gray-700 mt-1">{selectedReport.question.explanation}</p>
                    </div>
                  )}
                </div>

                {/* Alternative Explanation */}
                {selectedReport.alternativeExplanation && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Suggested Explanation</h3>
                    <p className="text-sm text-blue-700">{selectedReport.alternativeExplanation}</p>
                  </div>
                )}

                {/* Suggested Options */}
                {selectedReport.suggestedOptions.length > 0 && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="font-medium text-green-900 mb-2">Suggested Options</h3>
                    <div className="space-y-2">
                      {selectedReport.suggestedOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                            option.isCorrect ? 'bg-green-500 text-white' : 'bg-gray-300'
                          }`}>
                            {option.isCorrect ? '✓' : '○'}
                          </span>
                          <span className="text-sm text-green-700">{option.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Decision */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Review Decision *
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="APPROVED"
                        checked={reviewStatus === 'APPROVED'}
                        onChange={(e) => setReviewStatus(e.target.value as 'APPROVED' | 'REJECTED')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Approve</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="REJECTED"
                        checked={reviewStatus === 'REJECTED'}
                        onChange={(e) => setReviewStatus(e.target.value as 'APPROVED' | 'REJECTED')}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Reject</span>
                    </label>
                  </div>
                </div>

                {/* Review Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Notes
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Add notes about your decision..."
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
                  className={`px-4 py-2 text-white rounded-md transition-colors ${
                    reviewStatus === 'APPROVED' 
                      ? 'bg-green-500 hover:bg-green-600' 
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {reviewStatus === 'APPROVED' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
} 