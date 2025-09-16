'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';
import Swal from 'sweetalert2';

interface ExamPaper {
  id: string;
  title: string;
  description?: string;
  timeLimitMin?: number;
  createdAt: string;
  subjectIds: string[];
  topicIds: string[];
  subtopicIds: string[];
  questionIds: string[];
  _count?: {
    submissions: number;
  };
  subjects?: {
    id: string;
    name: string;
  }[];
}

export default function MyAITestsPage() {
  const router = useRouter();
  const [examPapers, setExamPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);

  useEffect(() => {
    fetchSubscriptionStatus();
    fetchSubjects();
    fetchExamPapers();
  }, [currentPage, searchTerm, selectedSubject]);

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get('/student/subscription-status');
      setSubscriptionStatus(response.data.subscriptionStatus);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/student/subjects');
      setSubjects(response.data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setSubjects([]); // Ensure subjects is always an array
    }
  };

  const fetchExamPapers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedSubject && { subjectId: selectedSubject }),
      });

      const response = await api.get(`/student/my-ai-tests?${params}`);
      const { examPapers: aiExamPapers, pagination } = response.data;
      
      setExamPapers(aiExamPapers);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      console.error('Error fetching AI exam papers:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to fetch AI exam papers',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (paperId: string) => {
    try {
      const response = await api.post(`/exams/papers/${paperId}/start`);
      const { submissionId } = response.data;
      router.push(`/student/practice/test/${submissionId}`);
    } catch (error) {
      console.error('Error starting test:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to start the test',
        icon: 'error',
      });
    }
  };

  const handleDeleteTest = async (paperId: string) => {
    const result = await Swal.fire({
      title: 'Delete Test',
      text: 'Are you sure you want to delete this AI-generated test?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/student/exam-papers/${paperId}`);
        setExamPapers(examPapers.filter(p => p.id !== paperId));
        Swal.fire({
          title: 'Deleted!',
          text: 'Your AI test has been deleted.',
          icon: 'success',
        });
      } catch (error) {
        console.error('Error deleting test:', error);
        Swal.fire({
          title: 'Error',
          text: 'Failed to delete test',
          icon: 'error',
        });
      }
    }
  };

  const formatTimeLimit = (minutes?: number) => {
    if (!minutes) return 'No time limit';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleUpgradeToAI = () => {
    router.push('/student/subscriptions');
  };

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentLayout>
        <div className="space-y-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My AI Tests</h1>
            <p className="text-lg text-gray-600">View and manage your AI-generated practice tests</p>
          </div>

          {/* AI Plan Upgrade Prompt */}
          {subscriptionStatus && subscriptionStatus.planType !== 'AI_ENABLED' && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-purple-900">Unlock AI-Powered Tests</h3>
                    <p className="text-purple-700">
                      Upgrade to AI-Enabled plan to generate unlimited custom practice tests with AI-powered questions!
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={handleUpgradeToAI}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Upgrade Now
                  </button>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center text-sm text-purple-700">
                  <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Unlimited AI Tests
                </div>
                <div className="flex items-center text-sm text-purple-700">
                  <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  AI-Powered Questions
                </div>
                <div className="flex items-center text-sm text-purple-700">
                  <svg className="w-4 h-4 mr-2 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Smart Explanations
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Filters */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Filter Tests</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Tests
                    </label>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by test title..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Subjects</option>
                      {subjects && subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedSubject('');
                      setCurrentPage(1);
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>

              {/* Tests List */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading your AI tests...</p>
                  </div>
                ) : examPapers.length === 0 ? (
                  <div className="p-8 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No AI tests found</h3>
                    {subscriptionStatus && subscriptionStatus.planType !== 'AI_ENABLED' ? (
                      <>
                        <p className="mt-1 text-sm text-gray-500">
                          You need an AI-Enabled subscription to generate AI tests. Upgrade now to unlock unlimited AI-powered practice tests!
                        </p>
                        <div className="mt-6 space-x-3">
                          <button
                            onClick={handleUpgradeToAI}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            Upgrade to AI Plan
                          </button>
                          <button
                            onClick={() => router.push('/student/practice')}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            View Practice Tests
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="mt-1 text-sm text-gray-500">
                          You haven't generated any AI tests yet. Create some practice tests to generate AI content.
                        </p>
                        <div className="mt-6">
                          <button
                            onClick={() => router.push('/student/practice')}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            Create Practice Test
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {examPapers.map((paper) => (
                      <div key={paper.id} className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                AI Generated
                              </span>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {paper.questionIds.length} Questions
                              </span>
                              {paper.timeLimitMin && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {formatTimeLimit(paper.timeLimitMin)}
                                </span>
                              )}
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {paper.title}
                            </h3>
                            {paper.description && (
                              <p className="text-gray-600 mb-3">{paper.description}</p>
                            )}
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Created: {new Date(paper.createdAt).toLocaleDateString()}</span>
                              {paper._count && (
                                <span>Attempts: {paper._count.submissions}</span>
                              )}
                            </div>
                          </div>
                          <div className="ml-4 flex-shrink-0 flex items-center gap-2">
                            <button
                              onClick={() => handleStartTest(paper.id)}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Start Test
                            </button>
                            <button
                              onClick={() => handleDeleteTest(paper.id)}
                              className="text-red-600 hover:text-red-800 transition-colors p-2"
                              title="Delete test"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-700">
                        Page {currentPage} of {totalPages}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* AI Tests Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Tests Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Tests:</span>
                    <span className="font-medium text-gray-900">{examPapers.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Questions:</span>
                    <span className="font-medium text-blue-600">
                      {examPapers.reduce((sum, paper) => sum + paper.questionIds.length, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Attempts:</span>
                    <span className="font-medium text-green-600">
                      {examPapers.reduce((sum, paper) => sum + (paper._count?.submissions || 0), 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => router.push('/student/practice')}
                    className="flex items-center w-full p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">Create Practice Test</div>
                      <div className="text-sm text-gray-600">Generate new AI tests</div>
                    </div>
                  </button>
                  <button
                    onClick={() => router.push('/student/my-ai-questions')}
                    className="flex items-center w-full p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">My AI Questions</div>
                      <div className="text-sm text-gray-600">View AI-generated questions</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* AI Features Info */}
              {subscriptionStatus && subscriptionStatus.planType === 'AI_ENABLED' ? (
                <div className="bg-purple-50 rounded-lg border border-purple-200 p-6">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">🤖 AI Features</h3>
                  <ul className="space-y-2 text-sm text-purple-800">
                    <li>• Generate unlimited custom tests</li>
                    <li>• AI-powered explanations for every answer</li>
                    <li>• Personalized difficulty adjustment</li>
                    <li>• Real-time test generation</li>
                  </ul>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
                  <h3 className="text-lg font-semibold text-purple-900 mb-3">🚀 Unlock AI Features</h3>
                  <p className="text-sm text-purple-700 mb-4">
                    Upgrade to AI-Enabled plan to access these powerful features:
                  </p>
                  <ul className="space-y-2 text-sm text-purple-800 mb-4">
                    <li>• Generate unlimited custom tests</li>
                    <li>• AI-powered explanations for every answer</li>
                    <li>• Personalized difficulty adjustment</li>
                    <li>• Real-time test generation</li>
                  </ul>
                  <button
                    onClick={handleUpgradeToAI}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    Upgrade Now
                  </button>
                </div>
              )}

              {/* Tips */}
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Tips</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Start tests to track your progress</li>
                  <li>• Review explanations after each test</li>
                  <li>• Use filters to find specific tests</li>
                  <li>• Delete tests you no longer need</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </StudentLayout>
    </ProtectedRoute>
  );
}
