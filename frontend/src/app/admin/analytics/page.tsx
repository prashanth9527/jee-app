'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalLessons: number;
  totalContent: number;
  totalQuestions: number;
  totalBadgesEarned: number;
  activeUsers: number;
  completionRate: number;
}

interface UserGrowthData {
  date: string;
  newUsers: number;
  totalUsers: number;
}

interface LessonAnalyticsData {
  lessonId: string;
  lessonName: string;
  subjectName: string;
  totalStudents: number;
  completionRate: number;
  averageScore: number;
  averageTimeSpent: number;
  badgesEarned: number;
}

interface SubjectPerformanceData {
  subjectId: string;
  subjectName: string;
  totalLessons: number;
  totalStudents: number;
  averageCompletionRate: number;
  averageScore: number;
  totalBadgesEarned: number;
}

interface BadgeAnalyticsData {
  badgeType: string;
  badgeTitle: string;
  totalEarned: number;
  percentageOfUsers: number;
  recentEarnings: number;
}

interface TopPerformersData {
  userId: string;
  userName: string;
  totalBadges: number;
  averageScore: number;
  completedLessons: number;
  profilePicture?: string;
}

export default function AdminAnalyticsPage() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [lessonAnalytics, setLessonAnalytics] = useState<LessonAnalyticsData[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<SubjectPerformanceData[]>([]);
  const [badgeAnalytics, setBadgeAnalytics] = useState<BadgeAnalyticsData[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformersData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const [
        dashboardResponse,
        userGrowthResponse,
        lessonAnalyticsResponse,
        subjectPerformanceResponse,
        badgeAnalyticsResponse,
        topPerformersResponse
      ] = await Promise.all([
        api.get('/admin/analytics/dashboard'),
        api.get('/admin/analytics/user-growth'),
        api.get('/admin/analytics/lessons'),
        api.get('/admin/analytics/subjects'),
        api.get('/admin/analytics/badges'),
        api.get('/admin/analytics/top-performers')
      ]);

      setDashboardStats(dashboardResponse.data);
      setUserGrowth(userGrowthResponse.data);
      setLessonAnalytics(lessonAnalyticsResponse.data);
      setSubjectPerformance(subjectPerformanceResponse.data);
      setBadgeAnalytics(badgeAnalyticsResponse.data);
      setTopPerformers(topPerformersResponse.data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminLayout>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
                <p className="text-gray-600 mt-1">Comprehensive insights into your platform performance</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => loadAnalyticsData()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          {dashboardStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(dashboardStats.totalStudents)}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <span className="text-2xl">👥</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Lessons</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(dashboardStats.totalLessons)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <span className="text-2xl">📚</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Badges Earned</p>
                    <p className="text-3xl font-bold text-gray-900">{formatNumber(dashboardStats.totalBadgesEarned)}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <span className="text-2xl">🏆</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                    <p className="text-3xl font-bold text-gray-900">{dashboardStats.completionRate}%</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <span className="text-2xl">📈</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'overview', label: 'Overview', icon: '📊' },
                  { id: 'lessons', label: 'Lessons', icon: '📚' },
                  { id: 'subjects', label: 'Subjects', icon: '🎯' },
                  { id: 'badges', label: 'Badges', icon: '🏆' },
                  { id: 'performers', label: 'Top Performers', icon: '⭐' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* User Growth Chart */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">📈 User Growth (Last 7 Days)</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-7 gap-2">
                        {userGrowth.slice(-7).map((day, index) => (
                          <div key={index} className="text-center">
                            <div className="text-xs text-gray-500 mb-2">
                              {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </div>
                            <div className="bg-blue-600 rounded-t" style={{ height: `${(day.newUsers / Math.max(...userGrowth.map(d => d.newUsers))) * 60}px` }}></div>
                            <div className="text-xs text-gray-700 mt-1">{day.newUsers}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900">Active Users</h4>
                      <p className="text-2xl font-bold text-blue-600">{dashboardStats?.activeUsers || 0}</p>
                      <p className="text-sm text-blue-700">Last 30 days</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900">Total Content</h4>
                      <p className="text-2xl font-bold text-green-600">{formatNumber(dashboardStats?.totalContent || 0)}</p>
                      <p className="text-sm text-green-700">Learning materials</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900">Questions</h4>
                      <p className="text-2xl font-bold text-purple-600">{formatNumber(dashboardStats?.totalQuestions || 0)}</p>
                      <p className="text-sm text-purple-700">Practice questions</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Lessons Tab */}
              {activeTab === 'lessons' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">📚 Lesson Performance</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lesson</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Score</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badges</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {lessonAnalytics.slice(0, 10).map((lesson) => (
                          <tr key={lesson.lessonId}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {lesson.lessonName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {lesson.subjectName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {lesson.totalStudents}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ width: `${lesson.completionRate}%` }}
                                  ></div>
                                </div>
                                <span>{lesson.completionRate}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {lesson.averageScore}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {lesson.badgesEarned}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Subjects Tab */}
              {activeTab === 'subjects' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">🎯 Subject Performance</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {subjectPerformance.map((subject) => (
                      <div key={subject.subjectId} className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">{subject.subjectName}</h4>
                          <span className="text-2xl">📖</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Lessons</p>
                            <p className="font-semibold">{subject.totalLessons}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Students</p>
                            <p className="font-semibold">{subject.totalStudents}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Completion</p>
                            <p className="font-semibold">{subject.averageCompletionRate}%</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Avg Score</p>
                            <p className="font-semibold">{subject.averageScore}%</p>
                          </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Badges Earned</span>
                            <span className="text-yellow-600 font-semibold">🏆 {subject.totalBadgesEarned}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Badges Tab */}
              {activeTab === 'badges' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">🏆 Badge Analytics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {badgeAnalytics.map((badge) => (
                      <div key={badge.badgeType} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-900">{badge.badgeTitle}</h4>
                          <span className="text-3xl">🏆</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Earned</span>
                            <span className="font-semibold">{badge.totalEarned}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">% of Users</span>
                            <span className="font-semibold">{badge.percentageOfUsers}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Recent (7 days)</span>
                            <span className="font-semibold text-green-600">+{badge.recentEarnings}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Performers Tab */}
              {activeTab === 'performers' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">⭐ Top Performers</h3>
                  <div className="space-y-4">
                    {topPerformers.map((performer, index) => (
                      <div key={performer.userId} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                              {performer.profilePicture ? (
                                <img 
                                  src={performer.profilePicture} 
                                  alt={performer.userName}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-lg font-bold text-blue-600">
                                  {performer.userName.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-semibold text-gray-900">{performer.userName}</h4>
                              {index < 3 && (
                                <span className="text-xl">
                                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-4 mt-2 text-sm">
                              <div>
                                <p className="text-gray-600">Badges</p>
                                <p className="font-semibold text-yellow-600">🏆 {performer.totalBadges}</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Avg Score</p>
                                <p className="font-semibold">{performer.averageScore}%</p>
                              </div>
                              <div>
                                <p className="text-gray-600">Lessons</p>
                                <p className="font-semibold">{performer.completedLessons}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}