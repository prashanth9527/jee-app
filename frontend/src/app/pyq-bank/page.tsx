'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import DynamicHead from '@/components/DynamicHead';
import DynamicFavicon from '@/components/DynamicFavicon';
import DynamicFooter from '@/components/DynamicFooter';
import HeaderHome from '@/components/HeaderHome';
import { QuestionStem } from '@/components/QuestionDisplay';
import MathRenderer from '@/components/MathRenderer';
import { ChevronLeft, ChevronRight, Lock, UserPlus, BookOpen } from 'lucide-react';
import api from '@/lib/api';

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
  showSolution?: boolean; // This will be randomly set
}

interface Subject {
  id: string;
  name: string;
  _count: { questions: number };
}

interface Stream {
  id: string;
  name: string;
  _count: { questions: number };
}

interface Analytics {
  totalPYQ: number;
  byYear: { year: number; count: number }[];
  bySubject: { name: string; count: number }[];
  byDifficulty: { difficulty: string; count: number }[];
}

export default function PYQBankPage() {
  const { systemSettings } = useSystemSettings();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [filters, setFilters] = useState({
    year: '',
    subject: '',
    stream: '',
    difficulty: '',
  });

  useEffect(() => {
    loadQuestions();
    loadSubjects();
    loadStreams();
    loadAnalytics();
  }, [pagination.currentPage, filters]);

  const loadQuestions = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        ...filters
      });

      const response = await api.get(`/pyq/public?${params}`);
      const data = response.data;
      
      // Always show solutions for first 2 questions, then randomly for 30% of remaining
      const questionsWithRandomSolutions = data.questions.map((question: Question, index: number) => ({
        ...question,
        showSolution: index < 2 || Math.random() < 0.3 // First 2 always show, then 30% chance
      }));
      
      setQuestions(questionsWithRandomSolutions);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Failed to load subjects:', error);
    }
  };

  const loadStreams = async () => {
    try {
      const response = await api.get('/streams');
      setStreams(response.data);
    } catch (error) {
      console.error('Failed to load streams:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/pyq/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HARD': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getYears = () => {
    if (!analytics?.byYear) return [];
    return analytics.byYear.map(item => item.year).sort((a, b) => b - a);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading PYQ Bank...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DynamicFavicon 
        faviconUrl={systemSettings?.faviconUrl}
        siteTitle={systemSettings?.siteTitle}
      />
      <DynamicHead 
        title={`PYQ Bank - ${systemSettings?.siteTitle || 'JEE App'}`}
        description="Access thousands of previous year JEE questions with detailed solutions. Practice with real exam questions from past years."
        keywords={`JEE PYQ, previous year questions, JEE preparation, JEE Main, JEE Advanced, practice questions, ${systemSettings?.siteKeywords || ''}`}
        canonicalUrl={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/pyq-bank`}
        ogImage={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/og-pyq-bank.jpg`}
      />

      <div className="min-h-screen bg-white">
        {/* Math Renderer for formula display */}
        <MathRenderer />
        
        {/* Navigation */}
        <HeaderHome systemSettings={systemSettings || undefined} />
        {/* Hero Section */}
        <section className="pt-20 pb-16 bg-gradient-to-br from-orange-50 via-white to-red-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                PYQ Bank
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                Practice with {analytics?.totalPYQ || 0} previous year JEE questions with detailed solutions. 
                Master real exam questions from past years.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Get Full Access
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center px-8 py-4 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-lg"
                >
                  Login to Continue
                </Link>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Questions</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.totalPYQ}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">Y</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Years Covered</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.byYear.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 font-bold text-sm">S</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Subjects</p>
                    <p className="text-2xl font-bold text-gray-900">{analytics.bySubject.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Questions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Years</option>
                  {getYears().map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stream</label>
                <select
                  value={filters.stream}
                  onChange={(e) => handleFilterChange('stream', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Streams</option>
                  {streams.map(stream => (
                    <option key={stream.id} value={stream.id}>{stream.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select
                  value={filters.subject}
                  onChange={(e) => handleFilterChange('subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Difficulties</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Questions */}
          {questions.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">No questions found</h3>
              <p className="mt-2 text-gray-600">Try adjusting your filters to see more results.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {questions.map((question, index) => (
                <div key={question.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  {/* Question Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-500">
                        Question {pagination.currentPage * pagination.itemsPerPage - pagination.itemsPerPage + index + 1}
                      </span>
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
                    {!question.showSolution && (
                      <div className="flex items-center text-orange-600">
                        <Lock className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">Solution Locked</span>
                      </div>
                    )}
                  </div>

                  {/* Question Stem */}
                  <div className="mb-4">
                    <QuestionStem stem={question.stem} />
                  </div>

                  {/* Options */}
                  <div className="space-y-2 mb-4">
                    {question.options.map((option) => (
                      <div key={option.id} className={`p-3 rounded-lg border ${
                        question.showSolution && option.isCorrect 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <div className="flex items-center space-x-2">
                          {question.showSolution && option.isCorrect && (
                            <span className="text-green-600 text-sm">✓</span>
                          )}
                          <div className={`text-sm ${
                            question.showSolution && option.isCorrect 
                              ? 'text-green-800 font-medium' 
                              : 'text-gray-700'
                          }`}>
                            <QuestionStem stem={option.text} />
                          </div>
                          {question.showSolution && option.isCorrect && (
                            <span className="text-xs text-green-600">(Correct)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Solution (if available) */}
                  {question.showSolution ? (
                    <div className="space-y-4">
                      {question.tip_formula && (
                        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                          <h4 className="text-sm font-semibold text-yellow-900 mb-2">💡 Tips & Formulas</h4>
                          <div className="text-yellow-800 text-sm">
                            <QuestionStem stem={question.tip_formula} />
                          </div>
                        </div>
                      )}
                      
                      {question.explanation && (
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <h4 className="text-sm font-semibold text-blue-900 mb-2">📖 Explanation</h4>
                          <div className="text-blue-800 text-sm">
                            <QuestionStem stem={question.explanation} />
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-orange-900 mb-1">🔒 Solution Locked</h4>
                          <p className="text-orange-800 text-sm">
                            Register now to access detailed solutions for all questions!
                          </p>
                        </div>
                        <Link
                          href="/register"
                          className="inline-flex items-center px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Register
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <nav className="flex space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 text-sm border rounded-md ${
                        pagination.currentPage === page
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </nav>
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Ready to Access All Solutions?</h2>
            <p className="text-orange-100 mb-6">
              Join thousands of students who are already preparing with our comprehensive PYQ bank.
              Get access to detailed solutions, explanations, and tips for all questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="inline-flex items-center px-8 py-3 bg-white text-orange-600 font-medium rounded-lg hover:bg-gray-100 transition-colors"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Start Free Trial
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-3 bg-orange-700 text-white font-medium rounded-lg hover:bg-orange-800 transition-colors"
              >
                Login to Continue
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DynamicFooter />
      </div>
    </>
  );
}
