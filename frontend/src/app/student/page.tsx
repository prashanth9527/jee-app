'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import AiUsageCard from '@/components/AiUsageCard';
import NotificationBanner from '@/components/NotificationBanner';
import api from '@/lib/api';

interface StudentStats {
  totalExamsTaken: number;
  averageScore: number;
  totalQuestionsAnswered: number;
  correctAnswers: number;
  subjects: {
    name: string;
    score: number;
    questions: number;
  }[];
}

export default function StudentDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [recentExams, setRecentExams] = useState<{ id: string; examPaper?: { title?: string; subjects?: string[] }; submittedAt: string; scorePercent?: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsResponse, historyResponse] = await Promise.all([
          api.get('/student/dashboard'),
          api.get('/student/exam-history?limit=3')
        ]);
        
        setStats(statsResponse.data);
        setRecentExams(historyResponse.data.submissions || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const practiceOptions = [
    {
      title: 'Physics',
      description: 'Practice mechanics, electricity, and more',
      icon: '⚡',
      color: 'bg-blue-500',
      subjectName: 'Physics',
    },
    {
      title: 'Chemistry',
      description: 'Master physical, organic, and inorganic chemistry',
      icon: '🧪',
      color: 'bg-green-500',
      subjectName: 'Chemistry',
    },
    {
      title: 'Mathematics',
      description: 'Solve algebra, calculus, and geometry problems',
      icon: '📐',
      color: 'bg-purple-500',
      subjectName: 'Mathematics',
    },
  ];

  const handleSubjectClick = (subjectName: string) => {
    router.push(`/student/practice?subject=${encodeURIComponent(subjectName)}`);
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
        <StudentLayout>
        <NotificationBanner />
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome to your student dashboard</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <AiUsageCard />
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-500 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Exams Taken</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalExamsTaken}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-500 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.averageScore}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-500 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Questions Answered</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalQuestionsAnswered}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-500 text-white">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Correct Answers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.correctAnswers}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Practice Options */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Start Practicing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {practiceOptions.map((option) => (
                <button
                  key={option.title}
                  onClick={() => handleSubjectClick(option.subjectName)}
                  className="block w-full p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 rounded-lg ${option.color} text-white text-2xl`}>
                      {option.icon}
                    </div>
                    <h4 className="ml-3 text-lg font-semibold text-gray-900">{option.title}</h4>
                  </div>
                  <p className="text-gray-600">{option.description}</p>
                  <div className="mt-4 flex items-center text-blue-600 font-medium">
                    Start Practice
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Performance */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
              <div className="space-y-4">
                {stats?.subjects.map((subject) => (
                  <div key={subject.name} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900">{subject.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">{subject.questions} questions</span>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${subject.score}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-900">{subject.score}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Exams */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Exams</h3>
              <div className="space-y-4">
                {recentExams.length > 0 ? (
                  recentExams.map((exam) => (
                    <div key={exam.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{exam.examPaper?.title || 'Untitled Exam'}</h4>
                        <p className="text-xs text-gray-500">
                          {new Date(exam.submittedAt).toLocaleDateString()} • {exam.examPaper?.subjects?.join(', ') || 'No subjects'}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{Math.round(exam.scorePercent || 0)}%</span>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Completed
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No exams taken yet</p>
                )}
              </div>
              <div className="mt-4">
                <Link
                  href="/student/exam-papers"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all exams →
                </Link>
              </div>
            </div>
          </div>

          {/* AI Suggestions Widget */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🎯 AI Learning Suggestions</h3>
              <Link
                href="/student/ai-suggestions"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Personalized Learning Path</h4>
                  <p className="text-sm text-gray-600">Get AI-powered suggestions based on your performance</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center text-sm text-gray-700">
                  <span className="w-2 h-2 bg-red-400 rounded-full mr-2"></span>
                  Focus on weak areas
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                  Practice recommended topics
                </div>
                <div className="flex items-center text-sm text-gray-700">
                  <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                  Track improvement progress
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href="/student/ai-suggestions"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                >
                  Get Suggestions
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href="/student/exam-papers"
                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Take Practice Test
              </Link>
              <Link
                href="/student/performance"
                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Performance
              </Link>
              <Link
                href="/student/pyq"
                className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Previous Year Qs
              </Link>
            </div>
          </div>
        </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
} 
