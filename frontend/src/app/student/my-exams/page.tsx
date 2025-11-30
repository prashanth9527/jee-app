'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import api from '@/lib/api';
import { useToastContext } from '@/contexts/ToastContext';
import Swal from 'sweetalert2';

interface ExamPaper {
  id: string;
  title: string;
  description: string;
  timeLimitMin: number | null;
  createdAt: string;
  subjects: { id: string; name: string }[];
  hasAttempted: boolean;
  hasPracticed: boolean;
  isBookmarked: boolean;
  questionCount: number;
  examType: string;
  overallDifficulty: string;
  lessonInfo: { id: string; name: string; subject?: { name: string } }[];
  averageScore: number;
  completionRate: number;
  totalAttempts: number;
  difficultyStats: { difficulty: string; _count: { difficulty: number } }[];
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function MyExamsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToastContext();
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(9);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  const [debouncedSearchText, setDebouncedSearchText] = useState(searchText);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchPapers();
  }, [currentPage, itemsPerPage, debouncedSearchText, selectedSubject]);

  const loadInitialData = async () => {
    try {
      const subjectsRes = await api.get('/student/subjects');
      setSubjects(subjectsRes.data);
      setError(null);
    } catch (error: any) {
      console.error('Failed to load initial data:', error);
      setError('Failed to load filter data. Please try again.');
      showError('Loading Error', 'Failed to load data', 4000);
    } finally {
      setLoading(false);
    }
  };

  const fetchPapers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        myExams: 'true', // Filter for user's PRACTICE_EXAM exams
      });

      if (debouncedSearchText) {
        params.append('search', debouncedSearchText);
      }

      if (selectedSubject) {
        params.append('subjectId', selectedSubject);
      }

      const response = await api.get(`/student/exam-papers?${params}`);
      setPapers(response.data.papers);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Error fetching exam papers:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to load exam papers';
      setError(errorMessage);
      showError('Loading Error', errorMessage, 4000);
    }
  };

  const handleStartExam = async (paperId: string, paperTitle: string) => {
    try {
      const result = await Swal.fire({
        title: 'Start Exam',
        text: `Are you sure you want to start "${paperTitle}"?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Start Exam',
        cancelButtonText: 'Cancel',
      });

      if (result.isConfirmed) {
        const response = await api.post(`/exams/papers/${paperId}/start`);
        const { submissionId } = response.data;
        router.push(`/student/exam/${submissionId}`);
      }
    } catch (error: any) {
      console.error('Error starting exam:', error);
      showError('Exam Error', error?.response?.data?.message || 'Failed to start exam', 4000);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchText('');
    setSelectedSubject('');
    setCurrentPage(1);
  };

  const getExamTypeColor = (examType: string) => {
    switch (examType) {
      case 'REGULAR': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PRACTICE_EXAM': return 'bg-green-100 text-green-800 border-green-200';
      case 'PYQ_PRACTICE': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'AI_EXAM': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'CONTENT_EXAM': return 'bg-pink-100 text-pink-800 border-pink-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getExamTypeLabel = (examType: string) => {
    switch (examType) {
      case 'REGULAR': return 'Regular';
      case 'PRACTICE_EXAM': return 'Practice';
      case 'PYQ_PRACTICE': return 'PYQ';
      case 'AI_EXAM': return 'AI Generated';
      case 'CONTENT_EXAM': return 'Content';
      default: return examType;
    }
  };

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'No time limit';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  if (loading && papers.length === 0) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <p className="mt-6 text-lg font-medium text-gray-700">Loading exam papers...</p>
                <p className="mt-2 text-sm text-gray-500">Please wait while we fetch your exams</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Exams</h1>
            <p className="text-lg text-gray-600">Practice exams you've created</p>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-wrap items-center gap-4">
                <input
                  type="text"
                  placeholder="Search exam papers..."
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="flex-1 min-w-[200px] px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={selectedSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Exam Papers List */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {papers.length === 0 && !loading ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-600 text-lg">No exams found</p>
                <p className="text-gray-500 mt-2">You haven't created any practice exams yet.</p>
                <Link
                  href="/student/practice"
                  className="mt-4 inline-block px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Practice Test
                </Link>
              </div>
            ) : (
              <>
                {pagination && (
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, pagination.totalItems)} of {pagination.totalItems} exam papers
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {papers.map((paper) => (
                    <div key={paper.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1">{paper.title}</h3>
                        <span className={`ml-2 px-2 py-1 rounded text-xs font-medium border ${getExamTypeColor(paper.examType)}`}>
                          {getExamTypeLabel(paper.examType)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-4">{paper.description || 'Practice exam'}</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {paper.hasAttempted && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">Attempted</span>
                        )}
                        {paper.overallDifficulty && (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            paper.overallDifficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                            paper.overallDifficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {paper.overallDifficulty}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 mb-4">
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span className="font-medium">{formatDuration(paper.timeLimitMin)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Questions:</span>
                          <span className="font-medium">{paper.questionCount}</span>
                        </div>
                        {paper.subjects.length > 0 && (
                          <div className="flex justify-between">
                            <span>Subject:</span>
                            <span className="font-medium">{paper.subjects.map(s => s.name).join(', ')}</span>
                          </div>
                        )}
                        {paper.hasAttempted && (
                          <>
                            <div className="flex justify-between">
                              <span>Avg Score:</span>
                              <span className="font-medium">{paper.averageScore.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Attempts:</span>
                              <span className="font-medium">{paper.totalAttempts}</span>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex gap-2 mt-4">
                        {paper.hasAttempted ? (
                          <>
                            <button
                              onClick={() => handleStartExam(paper.id, paper.title)}
                              className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors text-sm font-medium"
                            >
                              Re-Practice
                            </button>
                            <button
                              onClick={() => handleStartExam(paper.id, paper.title)}
                              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              Retake
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleStartExam(paper.id, paper.title)}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                          >
                            Start
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="text-sm text-gray-600">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                        className="px-4 py-2 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
}

