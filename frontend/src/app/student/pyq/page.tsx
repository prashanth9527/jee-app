'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { LatexQuestionStem, LatexQuestionExplanation, LatexQuestionTips, LatexQuestionOption } from '@/components/LatexContentDisplay';
import MathRenderer from '@/components/MathRenderer';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Question {
  id: string;
  stem: string;
  explanation?: string;
  tip_formula?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  yearAppeared?: number;
  subject?: { id: string; name: string };
  topic?: { id: string; name: string };
  subtopic?: { id: string; name: string };
  options: { id: string; text: string; isCorrect: boolean; order: number }[];
  tags: { tag: { name: string } }[];
}

interface Subject {
  id: string;
  name: string;
  _count: { questions: number };
}

interface Topic {
  id: string;
  name: string;
  subject: { name: string };
  lesson?: { id: string; name: string };
  _count: { questions: number };
}

interface Lesson {
  id: string;
  name: string;
  subject: { name: string };
  _count: { questions: number };
}

interface Subtopic {
  id: string;
  name: string;
  topic: { 
    id: string; 
    name: string;
    subject: { id: string; name: string };
  };
  _count: { questions: number };
}

interface Analytics {
  totalPYQ: number;
  byYear: { year: number; count: number }[];
  bySubject: { name: string; count: number }[];
  byDifficulty: { difficulty: string; count: number }[];
}

export default function PYQPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Filters
  const [filters, setFilters] = useState({
    year: '',
    subjectId: '',
    lessonId: '',
    topicId: '',
    subtopicId: '',
    difficulty: '',
    search: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [filters, pagination.currentPage]);

  const loadInitialData = async () => {
    try {
      const [yearsRes, subjectsRes, lessonsRes, topicsRes, subtopicsRes, analyticsRes] = await Promise.all([
        api.get('/student/pyq/years'),
        api.get('/student/pyq/subjects'),
        api.get('/student/pyq/lessons'),
        api.get('/student/pyq/topics'),
        api.get('/student/pyq/subtopics'),
        api.get('/student/pyq/analytics')
      ]);

      setYears(yearsRes.data);
      setSubjects(subjectsRes.data);
      setLessons(lessonsRes.data);
      setTopics(topicsRes.data);
      setSubtopics(subtopicsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Swal.fire('Error', 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        ...filters
      });

      const response = await api.get(`/student/pyq/questions?${params}`);
      setQuestions(response.data.questions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load questions:', error);
      Swal.fire('Error', 'Failed to load questions', 'error');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const getPageNumbers = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, pagination.currentPage - delta); 
         i <= Math.min(pagination.totalPages - 1, pagination.currentPage + delta); 
         i++) {
      range.push(i);
    }

    if (pagination.currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (pagination.currentPage + delta < pagination.totalPages - 1) {
      rangeWithDots.push('...', pagination.totalPages);
    } else {
      rangeWithDots.push(pagination.totalPages);
    }

    return rangeWithDots.filter((page, index, arr) => arr.indexOf(page) === index);
  };

  const startPractice = () => {
    // Redirect to PYQ practice test creation page
    router.push('/student/pyq/practice');
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HARD': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="STUDENT">
      <SubscriptionGuard>
        <MathRenderer />
        <StudentLayout>
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Previous Year Questions</h1>
              <p className="text-gray-600">Practice with authentic JEE questions from previous years</p>
            </div>

            {/* Analytics Cards */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total PYQs</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.totalPYQ}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Years Covered</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.byYear.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Subjects</p>
                      <p className="text-2xl font-bold text-gray-900">{analytics.bySubject.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Practice Now</p>
                      <button
                        onClick={startPractice}
                        className="text-2xl font-bold text-orange-600 hover:text-orange-700"
                      >
                        Start →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-4">
                {/* Year Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Year</label>
                  <select
                    value={filters.year}
                    onChange={(e) => handleFilterChange('year', e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="" className="text-gray-600">All Years</option>
                    {years.map(year => (
                      <option key={year} value={year} className="text-gray-900">{year}</option>
                    ))}
                  </select>
                </div>

                {/* Subject Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Subject</label>
                  <select
                    value={filters.subjectId}
                    onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="" className="text-gray-600">All Subjects</option>
                    {subjects.map(subject => (
                      <option key={subject.id} value={subject.id} className="text-gray-900">
                        {subject.name} ({subject._count.questions})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lesson Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Lesson</label>
                  <select
                    value={filters.lessonId}
                    onChange={(e) => handleFilterChange('lessonId', e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="" className="text-gray-600">All Lessons</option>
                    {lessons
                      .filter(lesson => !filters.subjectId || lesson.subject.name === subjects.find(s => s.id === filters.subjectId)?.name)
                      .map(lesson => (
                        <option key={lesson.id} value={lesson.id} className="text-gray-900">
                          {lesson.name} ({lesson._count.questions})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Topic Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Topic</label>
                  <select
                    value={filters.topicId}
                    onChange={(e) => handleFilterChange('topicId', e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="" className="text-gray-600">All Topics</option>
                    {topics
                      .filter(topic => {
                        const subjectMatch = !filters.subjectId || topic.subject.name === subjects.find(s => s.id === filters.subjectId)?.name;
                        const lessonMatch = !filters.lessonId || topic.lesson?.id === filters.lessonId;
                        return subjectMatch && lessonMatch;
                      })
                      .map(topic => (
                        <option key={topic.id} value={topic.id} className="text-gray-900">
                          {topic.name} ({topic._count.questions})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Subtopic Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Subtopic</label>
                  <select
                    value={filters.subtopicId}
                    onChange={(e) => handleFilterChange('subtopicId', e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="" className="text-gray-600">All Subtopics</option>
                    {subtopics
                      .filter(subtopic => {
                        const subjectMatch = !filters.subjectId || subtopic.topic.subject.name === subjects.find(s => s.id === filters.subjectId)?.name;
                        const topicMatch = !filters.topicId || subtopic.topic.id === filters.topicId;
                        return subjectMatch && topicMatch;
                      })
                      .map(subtopic => (
                        <option key={subtopic.id} value={subtopic.id} className="text-gray-900">
                          {subtopic.name} ({subtopic._count.questions})
                        </option>
                      ))}
                  </select>
                </div>

                {/* Difficulty Filter */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">Difficulty</label>
                  <select
                    value={filters.difficulty}
                    onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    <option value="" className="text-gray-600">All Difficulties</option>
                    <option value="EASY" className="text-gray-900">Easy</option>
                    <option value="MEDIUM" className="text-gray-900">Medium</option>
                    <option value="HARD" className="text-gray-900">Hard</option>
                  </select>
                </div>
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Search</label>
                <input
                  type="text"
                  placeholder="Search questions, topics, or explanations..."
                  value={filters.search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Questions List */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Questions ({pagination.totalItems})
                  </h2>
                  <button
                    onClick={startPractice}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Start Practice Test
                  </button>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {questions.map((question, index) => (
                  <div key={question.id} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-500">#{index + 1 + (pagination.currentPage - 1) * pagination.itemsPerPage}</span>
                          {question.yearAppeared && (
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {question.yearAppeared}
                            </span>
                          )}
                          <span className={`text-sm px-2 py-1 rounded ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                          {question.subject && (
                            <span className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded">
                              {question.subject.name}
                            </span>
                          )}
                        </div>
                        
                        <LatexQuestionStem stem={question.stem} className="mb-4" />
                        
                        <div className="space-y-3">
                          {question.options.map((option, idx) => (
                            <LatexQuestionOption
                              key={option.id}
                              option={option}
                              index={idx}
                              showCorrect={true}
                              className="text-sm"
                            />
                          ))}
                        </div>

                        {question.explanation && (
                          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                            <p className="text-sm font-medium text-green-800 mb-2">📖 Explanation:</p>
                            <LatexQuestionExplanation explanation={question.explanation} />
                          </div>
                        )}

                        {question.tip_formula && (
                          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                            <p className="text-sm font-medium text-yellow-800 mb-2">💡 Tips & Formulas:</p>
                            <LatexQuestionTips tipFormula={question.tip_formula} />
                          </div>
                        )}

                        <div className="mt-3 flex flex-wrap gap-1">
                          {question.tags.map((tag) => (
                            <span key={tag.tag.name} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {tag.tag.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Enhanced Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 bg-white">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((pagination.currentPage - 1) * pagination.itemsPerPage) + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> of{' '}
                      <span className="font-medium">{pagination.totalItems}</span> questions
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                        disabled={!pagination.hasPreviousPage}
                        className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Previous
                      </button>
                      
                      {/* Page Numbers */}
                      <div className="flex items-center space-x-1">
                        {getPageNumbers().map((page, index) => (
                          page === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm text-gray-500">
                              ...
                            </span>
                          ) : (
                            <button
                              key={page}
                              onClick={() => setPagination(prev => ({ ...prev, currentPage: Number(page) }))}
                              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                pagination.currentPage === page
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          )
                        ))}
                      </div>
                      
                      <button
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                        disabled={!pagination.hasNextPage}
                        className="flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
} 