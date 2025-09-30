'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { toast } from '@/lib/toast';

interface PDFFile {
  fileName: string;
  filePath: string;
  fileSize: number;
  status: string;
  questionCount?: number;
  hasImportedQuestions?: boolean;
  cacheId?: string;
  importedAt?: string;
}

interface ProcessingStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retrying: number;
}

interface AIProviders {
  providers: string[];
  available: { [key: string]: boolean };
}

interface ProcessingStatus {
  id: string;
  fileName: string;
  processingStatus: string;
  errorMessage?: string;
  outputFilePath?: string;
  processingTimeMs?: number;
  lastProcessedAt?: string;
  logs: Array<{
    id: string;
    logType: string;
    message: string;
    createdAt: string;
  }>;
}

export default function PDFProcessorPage() {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [statusDetails, setStatusDetails] = useState<ProcessingStatus | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [aiProviders, setAiProviders] = useState<AIProviders | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [currentAIService, setCurrentAIService] = useState<string>('openai');

  useEffect(() => {
    fetchPDFs();
    fetchStats();
    fetchAIProviders();
  }, []);

  const fetchPDFs = async () => {
    try {
      const response = await api.get('/admin/pdf-processor/list');
      if (response.data.success) {
        const pdfs = response.data.data;
        const currentAIService = response.data.currentAIService || 'openai';
        setCurrentAIService(currentAIService);
        setSelectedProvider(currentAIService);
        
        // Fetch question counts and import status for completed files
        const pdfsWithCounts = await Promise.all(
          pdfs.map(async (pdf: PDFFile) => {
            if (pdf.status === 'COMPLETED') {
              try {
                // Get question count
                const countResponse = await api.get(`/admin/pdf-processor/question-count/${pdf.fileName}`);
                if (countResponse.data.success) {
                  const questionCount = countResponse.data.data.questionCount;
                  
                  // Check if questions have been imported by getting the cache ID and checking for questions
                  try {
                    const processedResponse = await api.get('/admin/pdf-processor/processed');
                    if (processedResponse.data.success) {
                      const processedPdfs = processedResponse.data.data;
                      const matchingPdf = processedPdfs.find((p: any) => p.fileName === pdf.fileName);
                      
                      if (matchingPdf) {
                        // Check if there are questions for this cache ID
                        const statsResponse = await api.get(`/admin/pdf-review/stats/${matchingPdf.id}`);
                        if (statsResponse.data.success) {
                          const stats = statsResponse.data.data;
                          console.log(`PDF ${pdf.fileName}: Found ${stats.total} questions, imported: ${stats.total > 0}`);
                          return { 
                            ...pdf, 
                            questionCount,
                            hasImportedQuestions: stats.total > 0,
                            cacheId: matchingPdf.id
                          };
                        }
                      }
                    }
                  } catch (error) {
                    console.warn(`Failed to check import status for ${pdf.fileName}:`, error);
                  }
                  
                  return { ...pdf, questionCount, hasImportedQuestions: false };
                }
              } catch (error) {
                console.warn(`Failed to get question count for ${pdf.fileName}:`, error);
              }
            }
            return pdf;
          })
        );
        
        setPdfs(pdfsWithCounts);
      }
    } catch (error) {
      console.error('Error fetching PDFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/pdf-processor/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAIProviders = async () => {
    try {
      const response = await api.get('/admin/pdf-processor/ai-providers');
      if (response.data.success) {
        setAiProviders(response.data.data);
        // Set default provider to the first available one
        const availableProviders = response.data.data.providers.filter((provider: string) => 
          response.data.data.available[provider]
        );
        if (availableProviders.length > 0) {
          setSelectedProvider(availableProviders[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching AI providers:', error);
    }
  };

  const processPDF = async (fileName: string, filePath?: string) => {
    setProcessing(fileName);
    toast.loading(`Processing PDF with ${selectedProvider.toUpperCase()}...`, 'Please wait');
    
    try {
      const response = await api.post('/admin/pdf-processor/process', {
        fileName,
        filePath,
        userPrompt: customPrompt || undefined,
        aiProvider: selectedProvider
      });
      
      if (response.data.success) {
        toast.close();
        toast.success('PDF processing initiated successfully!');
        fetchPDFs();
        fetchStats();
      }
    } catch (error: any) {
      console.error('Error processing PDF:', error);
      toast.close();
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const retryProcessing = async (fileName: string, currentStatus: string) => {
    // Show confirmation for completed files since it will overwrite existing data
    if (currentStatus === 'COMPLETED') {
      const confirmed = window.confirm(
        'This will reprocess the PDF and overwrite the existing processed data. Are you sure you want to continue?'
      );
      if (!confirmed) {
        return;
      }
    }

    setProcessing(fileName);
    toast.loading('Retrying PDF processing...', 'Please wait');
    
    try {
      const response = await api.post(`/admin/pdf-processor/retry/${fileName}`);
      
      if (response.data.success) {
        toast.close();
        toast.success('PDF processing retry initiated successfully!');
        fetchPDFs();
        fetchStats();
      }
    } catch (error: any) {
      console.error('Error retrying PDF processing:', error);
      toast.close();
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const viewStatus = async (fileName: string) => {
    try {
      const response = await api.get(`/admin/pdf-processor/status/${fileName}`);
      if (response.data.success) {
        setStatusDetails(response.data.data);
        setShowStatusModal(true);
      }
    } catch (error: any) {
      console.error('Error fetching status:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const resetRetryCount = async (fileName: string) => {
    const confirmed = window.confirm(
      'This will reset the retry count and allow you to retry processing. Are you sure?'
    );
    if (!confirmed) {
      return;
    }

    setProcessing(fileName);
    toast.loading('Resetting retry count...', 'Please wait');
    
    try {
      const response = await api.post(`/admin/pdf-processor/reset-retry/${fileName}`);
      
      if (response.data.success) {
        toast.close();
        toast.success('Retry count reset successfully!');
        fetchPDFs();
      }
    } catch (error: any) {
      console.error('Error resetting retry count:', error);
      toast.close();
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const downloadProcessed = async (fileName: string) => {
    try {
      const response = await api.get(`/admin/pdf-processor/download/${fileName}`);
      if (response.data.success) {
        const { outputFilePath, downloadUrl } = response.data.data;
        
        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = downloadUrl || `/api/admin/pdf-processor/download-file/${fileName}`;
        link.download = fileName.replace('.pdf', '.json');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Also show success message
        toast.success(`Download started for: ${fileName}`);
      }
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const importProcessedJSON = async (fileName: string) => {
    // Find the PDF to get question count
    const pdf = pdfs.find(p => p.fileName === fileName);
    const questionCount = pdf?.questionCount;
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      `This will import ${questionCount ? `${questionCount} questions` : 'all questions'} from ${fileName} into the Question database with 'under review' status. After import, you can click the 'Review' button to approve/reject questions. Are you sure you want to continue?`
    );
    
    if (!confirmed) {
      return;
    }

    toast.loading('Importing questions...', 'Please wait');
    
    try {
      const response = await api.post(`/admin/pdf-processor/import/${fileName}`);
      
      if (response.data.success) {
        toast.close();
        const { importedCount, skippedCount, totalQuestions, errors, cacheId } = response.data.data;
        
        let message = `Import completed! ${importedCount} questions imported successfully.`;
        if (skippedCount > 0) {
          message += ` ${skippedCount} questions were skipped.`;
        }
        
        toast.success(message);
        
        // Show detailed results if there were errors
        if (errors && errors.length > 0) {
          console.warn('Import errors:', errors);
          setTimeout(() => {
            toast.warning(`Some questions had issues. Check console for details.`);
          }, 2000);
        }

        // Refresh the PDF list to update the import status and show "Review" button
        fetchPDFs();
        
        // Show option to go to review page
        setTimeout(() => {
          const goToReview = window.confirm(
            `Questions imported successfully! Would you like to go to the review page now?`
          );
          if (goToReview && cacheId) {
            router.push(`/admin/pdf-review/${cacheId}`);
          }
        }, 2000); // Wait 2 seconds to show the success message
      }
    } catch (error: any) {
      console.error('Error importing JSON:', error);
      toast.close();
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PROCESSING':
      case 'UPLOADING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'RETRYING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
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
            <h1 className="text-2xl font-bold text-gray-900">PDF Processor</h1>
            <p className="text-gray-600">Process JEE Previous Year Papers using AI providers (OpenAI GPT-4o or DeepSeek)</p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total PDFs</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
                <div className="text-sm text-gray-600">Processing</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-orange-600">{stats.retrying}</div>
                <div className="text-sm text-gray-600">Retrying</div>
              </div>
            </div>
          )}

          {/* AI Provider and Custom Prompt Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Provider & Processing Settings</h3>
            <div className="space-y-4">
              {/* AI Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI Provider
                </label>
                <div className="mb-2">
                  <span className="text-sm text-blue-600 font-medium">
                    Current Default: {currentAIService.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    (Set via AI_SERVICE environment variable)
                  </span>
                </div>
                <div className="flex space-x-4">
                  {aiProviders?.providers.map((provider) => (
                    <label key={provider} className="flex items-center">
                      <input
                        type="radio"
                        name="aiProvider"
                        value={provider}
                        checked={selectedProvider === provider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        disabled={!aiProviders.available[provider]}
                        className="mr-2"
                      />
                      <span className={`text-sm ${aiProviders.available[provider] ? 'text-gray-900' : 'text-gray-400'}`}>
                        {provider.toUpperCase()}
                        {provider === currentAIService && ' (Default)'}
                        {!aiProviders.available[provider] && ' (Not Available)'}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {selectedProvider === 'openai' && 'Uses OpenAI GPT-4o with file upload and chunked processing'}
                  {selectedProvider === 'deepseek' && 'Uses DeepSeek API with base64 PDF encoding and chunked processing'}
                </div>
              </div>

              {/* Custom Prompt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Instructions (Optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add any specific instructions for processing this PDF..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>Default System Prompt:</strong> Extracts JEE questions with LaTeX math formatting, 4 options per question, detailed explanations, and proper categorization.</p>
              </div>
            </div>
          </div>

          {/* PDF List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Available PDFs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {pdfs.map((pdf) => (
                    <tr key={pdf.fileName} className="hover:bg-gray-50">
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pdf.status)}`}>
                          {pdf.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {pdf.status === 'PENDING' && (
                          <button
                            onClick={() => processPDF(pdf.fileName, pdf.filePath)}
                            disabled={processing === pdf.fileName}
                            className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processing === pdf.fileName ? 'Processing...' : 'Process'}
                          </button>
                        )}
                        
                        {(pdf.status === 'FAILED' || pdf.status === 'COMPLETED') && (
                          <>
                            <button
                              onClick={() => retryProcessing(pdf.fileName, pdf.status)}
                              disabled={processing === pdf.fileName}
                              className="bg-yellow-600 text-white px-3 py-1 rounded-md hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {processing === pdf.fileName ? 'Retrying...' : 'Retry'}
                            </button>
                            <button
                              onClick={() => resetRetryCount(pdf.fileName)}
                              disabled={processing === pdf.fileName}
                              className="bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Reset retry count if max attempts reached"
                            >
                              Reset Retry
                            </button>
                          </>
                        )}
                        
                        {pdf.status === 'COMPLETED' && (
                          <>
                            <button
                              onClick={() => downloadProcessed(pdf.fileName)}
                              className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700"
                            >
                              Download
                            </button>
                            {pdf.importedAt ? (
                              <button
                                onClick={() => router.push(`/admin/pdf-review/${pdf.cacheId}`)}
                                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700"
                                title={pdf.questionCount ? `Preview ${pdf.questionCount} questions` : 'Preview questions'}
                              >
                                Preview{pdf.questionCount ? ` (${pdf.questionCount})` : ''}
                              </button>
                            ) : (
                              <button
                                onClick={() => importProcessedJSON(pdf.fileName)}
                                className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700"
                                title={pdf.questionCount ? `Import ${pdf.questionCount} questions` : 'Import questions'}
                              >
                                Import{pdf.questionCount ? ` (${pdf.questionCount})` : ''}
                              </button>
                            )}
                          </>
                        )}
                        
                        {(pdf.status === 'FAILED' || pdf.status === 'COMPLETED' || pdf.status === 'PROCESSING' || pdf.status === 'UPLOADING' || pdf.status === 'RETRYING') && (
                          <button
                            onClick={() => viewStatus(pdf.fileName)}
                            className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700"
                          >
                            View Status
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Status Modal */}
          {showStatusModal && statusDetails && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Processing Status: {statusDetails.fileName}
                    </h3>
                    <button
                      onClick={() => setShowStatusModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <strong>Status:</strong> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(statusDetails.processingStatus)}`}>
                        {statusDetails.processingStatus}
                      </span>
                    </div>
                    
                    {statusDetails.errorMessage && (
                      <div>
                        <strong>Error:</strong>
                        <p className="text-red-600 mt-1">{statusDetails.errorMessage}</p>
                      </div>
                    )}
                    
                    {statusDetails.processingTimeMs && (
                      <div>
                        <strong>Processing Time:</strong> {statusDetails.processingTimeMs}ms
                      </div>
                    )}
                    
                    {statusDetails.lastProcessedAt && (
                      <div>
                        <strong>Last Processed:</strong> {new Date(statusDetails.lastProcessedAt).toLocaleString()}
                      </div>
                    )}
                    
                    {statusDetails.outputFilePath && (
                      <div>
                        <strong>Output File:</strong> {statusDetails.outputFilePath}
                      </div>
                    )}
                    
                    {statusDetails.logs && statusDetails.logs.length > 0 && (
                      <div>
                        <strong>Recent Logs:</strong>
                        <div className="mt-2 max-h-40 overflow-y-auto">
                          {statusDetails.logs.map((log) => (
                            <div key={log.id} className="text-sm border-l-2 border-gray-200 pl-2 mb-1">
                              <span className="font-medium">{log.logType}:</span> {log.message}
                              <div className="text-xs text-gray-500">
                                {new Date(log.createdAt).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
