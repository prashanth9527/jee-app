'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { toast } from '@/lib/toast';

interface PDFReviewItem {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  processingStatus: string;
  lastProcessedAt: string;
  questions: Array<{
    id: string;
    status: 'approved' | 'underreview' | 'rejected';
  }>;
  stats: {
    total: number;
    approved: number;
    underreview: number;
    rejected: number;
    completionPercentage: number;
  };
}

export default function QuestionReviewPage() {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<PDFReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPDFsWithQuestions();
  }, []);

  const fetchPDFsWithQuestions = async () => {
    try {
      // Get all completed PDFs
      const response = await api.get('/admin/pdf-processor/processed');
      if (response.data.success) {
        const completedPdfs = response.data.data;
        
        // For each PDF, get the review stats
        const pdfsWithStats = await Promise.all(
          completedPdfs.map(async (pdf: any) => {
            try {
              const statsResponse = await api.get(`/admin/pdf-review/stats/${pdf.id}`);
              if (statsResponse.data.success) {
                const stats = statsResponse.data.data;
                
                // Only include PDFs that have questions under review
                if (stats.underreview > 0 || stats.approved > 0 || stats.rejected > 0) {
                  return {
                    id: pdf.id,
                    fileName: pdf.fileName,
                    filePath: pdf.filePath,
                    fileSize: pdf.fileSize,
                    processingStatus: pdf.processingStatus,
                    lastProcessedAt: pdf.lastProcessedAt,
                    stats: stats
                  };
                }
              }
            } catch (error) {
              console.warn(`Failed to get stats for ${pdf.fileName}:`, error);
            }
            return null;
          })
        );

        // Filter out null values
        const validPdfs = pdfsWithStats.filter(pdf => pdf !== null);
        setPdfs(validPdfs);
      }
    } catch (error: any) {
      console.error('Error fetching PDFs with questions:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'underreview':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
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
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Question Review</h1>
            <p className="text-gray-600">Review and approve questions imported from PDF processing</p>
          </div>

          {/* Stats Overview */}
          {pdfs.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-gray-900">{pdfs.length}</div>
                <div className="text-sm text-gray-600">PDFs with Questions</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-blue-600">
                  {pdfs.reduce((sum, pdf) => sum + pdf.stats.total, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Questions</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-green-600">
                  {pdfs.reduce((sum, pdf) => sum + pdf.stats.approved, 0)}
                </div>
                <div className="text-sm text-gray-600">Approved</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-yellow-600">
                  {pdfs.reduce((sum, pdf) => sum + pdf.stats.underreview, 0)}
                </div>
                <div className="text-sm text-gray-600">Under Review</div>
              </div>
            </div>
          )}

          {/* PDF List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">PDFs with Questions for Review</h3>
            </div>
            
            {pdfs.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-gray-500 mb-4">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions to Review</h3>
                  <p className="text-gray-600">
                    No PDFs with questions under review found. Import questions from the PDF Processor to start reviewing.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/admin/pdf-processor')}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Go to PDF Processor
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PDF File
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Processed
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Questions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Progress
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pdfs.map((pdf) => (
                      <tr key={pdf.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            <a 
                              href={`http://localhost:3001/static/pdf/${encodeURIComponent(pdf.fileName)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              title="Click to open PDF in new tab"
                            >
                              {pdf.fileName}
                            </a>
                          </div>
                          <div className="text-sm text-gray-500">{pdf.filePath}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatFileSize(pdf.fileSize)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(pdf.lastProcessedAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {pdf.stats.approved} Approved
                            </span>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              {pdf.stats.underreview} Under Review
                            </span>
                            {pdf.stats.rejected > 0 && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                {pdf.stats.rejected} Rejected
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${pdf.stats.completionPercentage}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-gray-600">
                              {pdf.stats.completionPercentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => router.push(`/admin/pdf-review/${pdf.id}`)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                          >
                            Review Questions
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
