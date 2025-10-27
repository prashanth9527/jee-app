'use client';

import { useEffect, useState, useCallback } from 'react';
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
  const [selectedExamType, setSelectedExamType] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [minDuration, setMinDuration] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [minQuestions, setMinQuestions] = useState('');
  const [maxQuestions, setMaxQuestions] = useState('');
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedAttempted, setSelectedAttempted] = useState('');
  const [selectedBookmarked, setSelectedBookmarked] = useState('');
  const [previewModal, setPreviewModal] = useState<{ isOpen: boolean; paper: any | null }>({
    isOpen: false,
    paper: null
  });

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
  }, [currentPage, itemsPerPage, debouncedSearchText, selectedSubject, selectedLesson, selectedTopic, selectedSubtopic, selectedExamType, selectedDifficulty, selectedYear, minDuration, maxDuration, minQuestions, maxQuestions, selectedAttempted, selectedBookmarked]);

  const loadInitialData = async () => {
    try {
      const [subjectsRes, lessonsRes, topicsRes, subtopicsRes] = await Promise.all([
        api.get('/student/subjects'),
        api.get('/student/lessons'),
        api.get('/student/topics'),
        api.get('/student/subtopics')
      ]);

      setSubjects(subjectsRes.data);
      setLessons(lessonsRes.data);
      setTopics(topicsRes.data);
      setSubtopics(subtopicsRes.data);
      setError(null);
    } catch (error: any) {
      console.error('Failed to load initial data:', error);
      setError('Failed to load filter data. Please try again.');
      Swal.fire('Error', 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPapers = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
      });

      if (debouncedSearchText) {
        params.append('search', debouncedSearchText);
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

      if (selectedExamType) {
        params.append('examType', selectedExamType);
      }

      if (selectedDifficulty) {
        params.append('difficulty', selectedDifficulty);
      }

      if (selectedYear) {
        params.append('year', selectedYear);
      }

      if (minDuration) {
        params.append('minDuration', minDuration);
      }

      if (maxDuration) {
        params.append('maxDuration', maxDuration);
      }

      if (minQuestions) {
        params.append('minQuestions', minQuestions);
      }

      if (maxQuestions) {
        params.append('maxQuestions', maxQuestions);
      }

      if (selectedAttempted) {
        params.append('attempted', selectedAttempted);
      }

      if (selectedBookmarked) {
        params.append('bookmarked', selectedBookmarked);
      }

      const response = await api.get(`/student/exam-papers?${params}`);
      setPapers(response.data.papers);
      setPagination(response.data.pagination);
    } catch (error: any) {
      console.error('Error fetching exam papers:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to load exam papers';
      setError(errorMessage);
      Swal.fire({
        title: 'Error',
        text: errorMessage,
        icon: 'error',
      });
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
    setCurrentPage(1);
  };

  const handleLessonChange = (lessonId: string) => {
    setSelectedLesson(lessonId);
    setSelectedTopic('');
    setSelectedSubtopic('');
    setCurrentPage(1);
  };

  const handleTopicChange = (topicId: string) => {
    setSelectedTopic(topicId);
    setSelectedSubtopic('');
    setCurrentPage(1);
  };

  const handleSubtopicChange = (subtopicId: string) => {
    setSelectedSubtopic(subtopicId);
    setCurrentPage(1);
  };

  const handleExamTypeChange = (examType: string) => {
    setSelectedExamType(examType);
    setCurrentPage(1);
  };

  const handleDifficultyChange = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    setCurrentPage(1);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setCurrentPage(1);
  };

  const handleDurationChange = (type: 'min' | 'max', value: string) => {
    if (type === 'min') {
      setMinDuration(value);
    } else {
      setMaxDuration(value);
    }
    setCurrentPage(1);
  };

  const handleQuestionCountChange = (type: 'min' | 'max', value: string) => {
    if (type === 'min') {
      setMinQuestions(value);
    } else {
      setMaxQuestions(value);
    }
    setCurrentPage(1);
  };

  const toggleAdvancedFilters = () => {
    setShowAdvancedFilters(!showAdvancedFilters);
  };

  const openPreviewModal = (paper: any) => {
    setPreviewModal({ isOpen: true, paper });
  };

  const closePreviewModal = () => {
    setPreviewModal({ isOpen: false, paper: null });
  };

  const startPracticeSession = (paper: any) => {
    router.push(`/student/practice-exam/${paper.id}`);
  };

  const handleBookmark = async (paper: ExamPaper) => {
    try {
      if (paper.isBookmarked) {
        await api.delete(`/student/exam-papers/${paper.id}/bookmark`);
        setPapers(papers.map(p => 
          p.id === paper.id ? { ...p, isBookmarked: false } : p
        ));
        Swal.fire({
          title: 'Success',
          text: 'Exam removed from bookmarks',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        await api.post(`/student/exam-papers/${paper.id}/bookmark`);
        setPapers(papers.map(p => 
          p.id === paper.id ? { ...p, isBookmarked: true } : p
        ));
        Swal.fire({
          title: 'Success',
          text: 'Exam bookmarked successfully',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update bookmark',
        icon: 'error'
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HARD': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getExamTypeColor = (examType: string) => {
    switch (examType) {
      case 'REGULAR': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PRACTICE_EXAM': return 'bg-purple-100 text-purple-800 border-purple-200';
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

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Basic Filters */}
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
                      {subject.name} ({subject._count?.questions || 0})
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
                >
                  <option value="">All Lessons</option>
                  {lessons
                    .filter(lesson => !selectedSubject || lesson.subject?.name === subjects.find(s => s.id === selectedSubject)?.name)
                    .map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                        {lesson.name} ({lesson._count?.questions || 0})
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
                >
                  <option value="">All Topics</option>
                  {topics
                    .filter(topic => {
                      if (!selectedSubject) return true;
                      const subject = subjects.find(s => s.id === selectedSubject);
                      return topic.subject?.name === subject?.name;
                    })
                    .filter(topic => {
                      if (!selectedLesson) return true;
                      const lesson = lessons.find(l => l.id === selectedLesson);
                      return topic.lesson?.name === lesson?.name;
                    })
                    .map((topic) => (
                    <option key={topic.id} value={topic.id}>
                        {topic.name} ({topic._count?.questions || 0})
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
                >
                  <option value="">All Subtopics</option>
                  {subtopics
                    .filter(subtopic => {
                      if (!selectedTopic) return true;
                      const topic = topics.find(t => t.id === selectedTopic);
                      return subtopic.topic?.id === topic?.id;
                    })
                    .map((subtopic) => (
                    <option key={subtopic.id} value={subtopic.id}>
                        {subtopic.name} ({subtopic._count?.questions || 0})
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

              {/* Exam Type Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Type</label>
                <select
                  value={selectedExamType}
                  onChange={(e) => handleExamTypeChange(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white text-sm"
                >
                  <option value="">All Types</option>
                  <option value="REGULAR">Regular</option>
                  <option value="PRACTICE_EXAM">Practice Exam</option>
                  <option value="PYQ_PRACTICE">PYQ Practice</option>
                  <option value="AI_EXAM">AI Generated</option>
                  <option value="CONTENT_EXAM">Content Exam</option>
                </select>
              </div>
            </div>

            {/* Advanced Filters Toggle */}
            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={toggleAdvancedFilters}
                className="flex items-center text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors"
              >
                <svg 
                  className={`w-4 h-4 mr-2 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                {showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
              </button>
              
              {/* Clear All Filters Button */}
              <button
                onClick={() => {
                  setSearchText('');
                  setSelectedSubject('');
                  setSelectedLesson('');
                  setSelectedTopic('');
                  setSelectedSubtopic('');
                  setSelectedExamType('');
                  setSelectedDifficulty('');
                  setSelectedYear('');
                  setMinDuration('');
                  setMaxDuration('');
                  setMinQuestions('');
                  setMaxQuestions('');
                  setSelectedAttempted('');
                  setSelectedBookmarked('');
                  setCurrentPage(1);
                  setShowAdvancedFilters(false);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm font-medium"
              >
                Clear All Filters
              </button>
            </div>

            {/* Advanced Filters - Collapsible */}
            {showAdvancedFilters && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Difficulty Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
                    <select
                      value={selectedDifficulty}
                      onChange={(e) => handleDifficultyChange(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white text-sm"
                    >
                      <option value="">All Difficulties</option>
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>

                  {/* Year Filter */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => handleYearChange(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white text-sm"
                    >
                      <option value="">All Years</option>
                      <option value="2024">2024</option>
                      <option value="2023">2023</option>
                      <option value="2022">2022</option>
                      <option value="2021">2021</option>
                      <option value="2020">2020</option>
                      <option value="2019">2019</option>
                      <option value="2018">2018</option>
                      <option value="2017">2017</option>
                      <option value="2016">2016</option>
                      <option value="2015">2015</option>
                    </select>
                  </div>

                  {/* Duration Range */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Duration (minutes)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={minDuration}
                        onChange={(e) => handleDurationChange('min', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500 text-sm"
                        min="0"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxDuration}
                        onChange={(e) => handleDurationChange('max', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500 text-sm"
                        min="0"
                      />
                    </div>
                  </div>

                  {/* Question Count Range */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Questions</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={minQuestions}
                        onChange={(e) => handleQuestionCountChange('min', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500 text-sm"
                        min="0"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={maxQuestions}
                        onChange={(e) => handleQuestionCountChange('max', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 placeholder-gray-500 text-sm"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Attempted Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Attempted</label>
                  <select
                    value={selectedAttempted}
                    onChange={(e) => setSelectedAttempted(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white text-sm"
                  >
                    <option value="">All Exams</option>
                    <option value="true">Attempted</option>
                    <option value="false">Not Attempted</option>
                  </select>
                </div>

                {/* Bookmarked Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bookmarked</label>
                  <select
                    value={selectedBookmarked}
                    onChange={(e) => setSelectedBookmarked(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white text-sm"
                  >
                    <option value="">All Exams</option>
                    <option value="true">Bookmarked</option>
                    <option value="false">Not Bookmarked</option>
                  </select>
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
            )}
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


          {/* Exam Papers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {papers.map((paper) => (
              <div key={paper.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="p-6">
                  {/* Header with badges */}
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2 leading-tight flex-1 mr-3">{paper.title}</h3>
                    <div className="flex flex-col gap-2 items-end">
                    {paper.hasAttempted && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        Attempted
                      </span>
                    )}
                      <div className="flex gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(paper.overallDifficulty)}`}>
                          {paper.overallDifficulty}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${getExamTypeColor(paper.examType)}`}>
                          {getExamTypeLabel(paper.examType)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {paper.description && (
                    <p className="text-gray-600 text-base mb-4 line-clamp-2 leading-relaxed">{paper.description}</p>
                  )}

                  {/* Lesson Information */}
                  {paper.lessonInfo && paper.lessonInfo.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span className="font-medium">Lessons:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {paper.lessonInfo.slice(0, 3).map((lesson: any, index: number) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                            {lesson.name}
                          </span>
                        ))}
                        {paper.lessonInfo.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">
                            +{paper.lessonInfo.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats and Info */}
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
                    
                    {/* Performance Stats */}
                    {paper.totalAttempts > 0 ? (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>Avg Score: {Math.round(paper.averageScore || 0)}%</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span>{paper.totalAttempts} attempts</span>
                        </div>
                        <button
                          onClick={() => handleBookmark(paper)}
                          className={`ml-3 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                            paper.isBookmarked 
                              ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 focus:ring-yellow-500' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus:ring-gray-500'
                          }`}
                          title={paper.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end text-sm">
                        <button
                          onClick={() => handleBookmark(paper)}
                          className={`p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
                            paper.isBookmarked 
                              ? 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 focus:ring-yellow-500' 
                              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus:ring-gray-500'
                          }`}
                          title={paper.isBookmarked ? 'Remove bookmark' : 'Add bookmark'}
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>


                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => startPracticeSession(paper)}
                      className={`flex-1 py-2.5 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 font-medium text-sm ${
                        paper.hasPracticed 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500'
                      }`}
                    >
                      {paper.hasPracticed ? 'Re-Practice' : 'Practice'}
                    </button>
                    <button
                      onClick={() => handleStartExam(paper.id, paper.title)}
                      className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                    >
                      {paper.hasAttempted ? 'Retake' : 'Start'}
                    </button>
                  </div>
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

      {/* Preview Modal */}
      {previewModal.isOpen && previewModal.paper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{previewModal.paper.title}</h2>
                  <div className="flex gap-2 mb-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getDifficultyColor(previewModal.paper.overallDifficulty)}`}>
                      {previewModal.paper.overallDifficulty}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${getExamTypeColor(previewModal.paper.examType)}`}>
                      {getExamTypeLabel(previewModal.paper.examType)}
                    </span>
                    {previewModal.paper.hasAttempted && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                        Attempted
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={closePreviewModal}
                  className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="space-y-6">
                {/* Description */}
                {previewModal.paper.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-600 leading-relaxed">{previewModal.paper.description}</p>
                  </div>
                )}

                {/* Exam Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Exam Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center text-sm text-gray-700">
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Duration:</span>
                      <span className="ml-2">{formatDuration(previewModal.paper.timeLimitMin)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Questions:</span>
                      <span className="ml-2">{previewModal.paper.questionCount}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-700">
                      <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="font-medium">Subjects:</span>
                      <span className="ml-2">{previewModal.paper.subjects.map((s: any) => s.name).join(', ')}</span>
                    </div>
                    {previewModal.paper.totalAttempts > 0 && (
                      <div className="flex items-center text-sm text-gray-700">
                        <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <span className="font-medium">Avg Score:</span>
                        <span className="ml-2">{Math.round(previewModal.paper.averageScore || 0)}%</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lesson Information */}
                {previewModal.paper.lessonInfo && previewModal.paper.lessonInfo.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Lessons Covered</h3>
                    <div className="flex flex-wrap gap-2">
                      {previewModal.paper.lessonInfo.map((lesson: any, index: number) => (
                        <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                          {lesson.name}
                          {lesson.subject && (
                            <span className="ml-1 text-xs text-gray-500">({lesson.subject.name})</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Stats */}
                {previewModal.paper.totalAttempts > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Performance Statistics</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Total Attempts:</span>
                          <span className="font-semibold text-gray-900">{previewModal.paper.totalAttempts}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Average Score:</span>
                          <span className="font-semibold text-gray-900">{Math.round(previewModal.paper.averageScore || 0)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Completion Rate:</span>
                          <span className="font-semibold text-gray-900">{previewModal.paper.completionRate}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Difficulty:</span>
                          <span className={`font-semibold px-2 py-1 rounded text-xs ${getDifficultyColor(previewModal.paper.overallDifficulty)}`}>
                            {previewModal.paper.overallDifficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={closePreviewModal}
                  className="flex-1 py-2.5 px-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium text-sm"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    closePreviewModal();
                    handleStartExam(previewModal.paper.id, previewModal.paper.title);
                  }}
                  className="flex-1 py-2.5 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium text-sm shadow-md hover:shadow-lg"
                >
                  {previewModal.paper.hasAttempted ? 'Retake Exam' : 'Start Exam'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
} 