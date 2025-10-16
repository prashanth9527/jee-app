'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import api from '@/lib/api';
import Swal from 'sweetalert2';

interface ExamPaper {
  id: string;
  title: string;
  description: string;
  timeLimitMin: number | null;
  createdAt: string;
  subjects: { id: string; name: string }[];
  hasAttempted: boolean;
  questionCount: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export default function ExamPapersPage() {
  const router = useRouter();
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [subtopics, setSubtopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchPapers();
  }, [currentPage, itemsPerPage, searchText, selectedSubject, selectedLesson, selectedTopic, selectedSubtopic]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/student/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchLessons = async (subjectId: string) => {
    try {
      const response = await api.get(`/lms/subjects/${subjectId}/lessons`);
      setLessons(response.data);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setLessons([]);
    }
  };

  const fetchTopics = async (subjectId: string, lessonId?: string) => {
    try {
      let url = `/student/topics?subjectId=${subjectId}`;
      if (lessonId) {
        url = `/student/topics?subjectId=${subjectId}&lessonId=${lessonId}`;
      }
      const response = await api.get(url);
      setTopics(response.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
      setTopics([]);
    }
  };

  const fetchSubtopics = async (topicId: string) => {
    try {
      const response = await api.get(`/student/subtopics?topicId=${topicId}`);
      setSubtopics(response.data);
    } catch (error) {
      console.error('Error fetching subtopics:', error);
      setSubtopics([]);
    }
  };

  const fetchPapers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (searchText) {
        params.append('search', searchText);
      }

      if (selectedSubject) {
        params.append('subjectId', selectedSubject);
      }

      if (selectedLesson) {
        params.append('lessonId', selectedLesson);
      }

      if (selectedTopic) {
        params.append('topicId', selectedTopic);
      }

      if (selectedSubtopic) {
        params.append('subtopicId', selectedSubtopic);
      }

      const response = await api.get(`/student/exam-papers?${params}`);
      setPapers(response.data.papers);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching exam papers:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load exam papers',
        icon: 'error',
      });
    } finally {
      setLoading(false);
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
        // Redirect to exam page
        router.push(`/student/exam/${submissionId}`);
      }
    } catch (error: any) {
      console.error('Error starting exam:', error);
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to start exam',
        icon: 'error',
      });
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
    setSelectedLesson('');
    setSelectedTopic('');
    setSelectedSubtopic('');
    setLessons([]);
    setTopics([]);
    setSubtopics([]);
    setCurrentPage(1);
    
    if (subjectId) {
      fetchLessons(subjectId);
      fetchTopics(subjectId);
    }
  };

  const handleLessonChange = (lessonId: string) => {
    setSelectedLesson(lessonId);
    setSelectedTopic('');
    setSelectedSubtopic('');
    setTopics([]);
    setSubtopics([]);
    setCurrentPage(1);
    
    if (lessonId && selectedSubject) {
      fetchTopics(selectedSubject, lessonId);
    } else if (selectedSubject) {
      fetchTopics(selectedSubject);
    }
  };

  const handleTopicChange = (topicId: string) => {
    setSelectedTopic(topicId);
    setSelectedSubtopic('');
    setSubtopics([]);
    setCurrentPage(1);
    
    if (topicId) {
      fetchSubtopics(topicId);
    }
  };

  const handleSubtopicChange = (subtopicId: string) => {
    setSelectedSubtopic(subtopicId);
    setCurrentPage(1);
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
                <p className="mt-2 text-sm text-gray-500">Please wait while we fetch your available exams</p>
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Available Exams</h1>
            <p className="text-lg text-gray-600">Choose an exam to start practicing</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search exam papers..."
                  value={searchText}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500 text-sm"
                />
              </div>

              {/* Subject Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subject</label>
                <select
                  value={selectedSubject}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white text-sm"
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lesson Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Lesson</label>
                <select
                  value={selectedLesson}
                  onChange={(e) => handleLessonChange(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white text-sm"
                  disabled={!selectedSubject || !lessons.length}
                >
                  <option value="">All Lessons</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.name}
                    </option>
                  ))}
                </select>
                {!selectedSubject && (
                  <p className="text-xs text-gray-500 mt-1">Select a subject first</p>
                )}
              </div>

              {/* Topic Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Topic</label>
                <select
                  value={selectedTopic}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white text-sm"
                  disabled={!selectedSubject || !topics.length}
                >
                  <option value="">All Topics</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
                {!selectedSubject && (
                  <p className="text-xs text-gray-500 mt-1">Select a subject first</p>
                )}
              </div>

              {/* Subtopic Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Subtopic</label>
                <select
                  value={selectedSubtopic}
                  onChange={(e) => handleSubtopicChange(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white text-sm"
                  disabled={!selectedSubject || !selectedTopic || !subtopics.length}
                >
                  <option value="">All Subtopics</option>
                  {subtopics.map((subtopic) => (
                    <option key={subtopic.id} value={subtopic.id}>
                      {subtopic.name}
                    </option>
                  ))}
                </select>
                {!selectedSubject && (
                  <p className="text-xs text-gray-500 mt-1">Select a subject first</p>
                )}
                {selectedSubject && !selectedTopic && (
                  <p className="text-xs text-gray-500 mt-1">Select a topic first</p>
                )}
              </div>

              {/* Items per page */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Items per page</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>
          </div>

          {/* Results count */}
          {pagination && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
              <div className="text-sm font-medium text-gray-700">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                {pagination.totalItems} exam papers
              </div>
            </div>
          )}

          {/* Loading overlay for subsequent loads */}
          {loading && papers.length > 0 && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-200 border-t-blue-600"></div>
                <p className="text-gray-700 font-medium">Updating results...</p>
              </div>
            </div>
          )}

          {/* Exam Papers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {papers.map((paper) => (
              <div key={paper.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight">{paper.title}</h3>
                    {paper.hasAttempted && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        Attempted
                      </span>
                    )}
                  </div>

                  {paper.description && (
                    <p className="text-gray-600 text-base mb-6 line-clamp-3 leading-relaxed">{paper.description}</p>
                  )}

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm text-gray-700 font-medium">
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {formatDuration(paper.timeLimitMin)}
                    </div>
                    <div className="flex items-center text-sm text-gray-700 font-medium">
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {paper.questionCount} questions
                    </div>
                    <div className="flex items-center text-sm text-gray-700 font-medium">
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      {paper.subjects.map(s => s.name).join(', ')}
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartExam(paper.id, paper.title)}
                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold text-base shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    {paper.hasAttempted ? 'Retake Exam' : 'Start Exam'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {!loading && papers.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No exam papers found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {searchText || selectedSubject ? 'Try adjusting your search criteria to find more exam papers.' : 'No exam papers are available at the moment. Please check back later.'}
              </p>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1}
                    className="px-4 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all duration-200"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-medium text-gray-700">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:border-gray-300 transition-all duration-200"
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