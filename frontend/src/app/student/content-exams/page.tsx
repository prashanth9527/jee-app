'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, Calendar, Clock, Users, Trophy, FileText, Tag, Search, Filter, BookOpen } from 'lucide-react';
import { useToastContext } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';
import api from '@/lib/api';

interface ContentExam {
  id: string;
  title: string;
  description: string;
  contentId: string;
  contentTitle: string;
  subject: string;
  topic: string;
  subtopic: string;
  questionCount: number;
  duration: number;
  difficulty: string;
  examType: string;
  createdAt: string;
  lastSubmission: {
    id: string;
    score: number;
    completedAt: string;
    status: string;
  } | null;
  totalSubmissions: number;
}

function ContentExamsPageContent() {
  const [exams, setExams] = useState<ContentExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const { showError } = useToastContext();

  useEffect(() => {
    loadContentExams();
  }, []);

  const loadContentExams = async () => {
    setLoading(true);
    try {
      const response = await api.get('/student/content-learning/content-exams');
      setExams(response.data || []);
      
      // Extract unique subjects
      const uniqueSubjects = [...new Set(response.data?.map((exam: ContentExam) => exam.subject) || [])] as string[];
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Failed to load content exams:', error);
      showError('Failed to load content exams', 'Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = exams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.contentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.subtopic.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = !filterSubject || exam.subject === filterSubject;
    const matchesDifficulty = !filterDifficulty || exam.difficulty === filterDifficulty;
    
    return matchesSearch && matchesSubject && matchesDifficulty;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Exams</h1>
              <p className="text-gray-600 mt-2">
                Exams created from your learning content
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              <span>{exams.length} exams</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search exams, content, subjects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
              >
                <option value="">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>
        </div>

        {/* Exams List */}
        {filteredExams.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterSubject || filterDifficulty ? 'No exams found' : 'No content exams yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterSubject || filterDifficulty 
                ? 'Try adjusting your search or filter criteria.'
                : 'Create exams from your learning content to see them here.'
              }
            </p>
            {!searchTerm && !filterSubject && !filterDifficulty && (
              <Link
                href="/student/lms"
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Start Learning
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {exam.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                        <div className="flex items-center">
                          <Tag className="w-4 h-4 mr-1" />
                          <span>{exam.subject}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>Created: {formatDate(exam.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Content:</span> {exam.contentTitle}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exam.difficulty)}`}>
                        {exam.difficulty}
                      </span>
                      <Link
                        href={`/student/exam/${exam.id}`}
                        className="flex items-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <Play className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">Start Exam</span>
                      </Link>
                    </div>
                  </div>

                  {/* Content Path */}
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">{exam.subject}</span>
                      <span className="mx-2">›</span>
                      <span>{exam.topic}</span>
                      <span className="mx-2">›</span>
                      <span>{exam.subtopic}</span>
                    </div>
                  </div>

                  {/* Exam Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="w-4 h-4 mr-2" />
                      <span>{exam.questionCount} questions</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{formatDuration(exam.duration)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>{exam.totalSubmissions} attempts</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Trophy className="w-4 h-4 mr-2" />
                      <span>Type: {exam.examType}</span>
                    </div>
                  </div>

                  {/* Last Submission */}
                  {exam.lastSubmission && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">Last Attempt</h4>
                          <p className="text-sm text-gray-600">
                            Completed: {formatDate(exam.lastSubmission.completedAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-semibold ${getScoreColor(exam.lastSubmission.score)}`}>
                            {exam.lastSubmission.score}%
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {exam.lastSubmission.status}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {exam.description && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {exam.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ContentExamsPage() {
  return (
    <ProtectedRoute>
      <StudentLayout>
        <ContentExamsPageContent />
      </StudentLayout>
    </ProtectedRoute>
  );
}
