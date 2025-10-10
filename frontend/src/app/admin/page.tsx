'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import MonthlyUsersChart from '@/components/charts/MonthlyUsersChart';
import RevenueChart from '@/components/charts/RevenueChart';
import api from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  totalStudents: number;
  totalLessons: number;
  totalContent: number;
  totalQuestions: number;
  totalBadgesEarned: number;
  activeUsers: number;
  completionRate: number;
  totalSubjects: number;
  totalTopics: number;
  totalSubtopics: number;
  totalTags: number;
  totalExamPapers: number;
  totalSubmissions: number;
  activeSubscriptions: number;
  totalPlans: number;
  userGrowthPercentage: number;
  questionGrowthPercentage: number;
  submissionGrowthPercentage: number;
  subscriptionGrowthPercentage: number;
}

interface RecentActivity {
  id: string;
  type: string;
  message: string;
  timeAgo: string;
  icon: string;
  details: any;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        const [statsResponse, activitiesResponse] = await Promise.all([
          api.get('/admin/analytics/dashboard'),
          api.get('/admin/analytics/recent-activities')
        ]);

        setStats(statsResponse.data);
        setRecentActivities(activitiesResponse.data);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        setError(error.response?.data?.message || 'Failed to load dashboard data');
        
        // Fallback to mock data if API fails
        const mockStats: DashboardStats = {
          totalUsers: 156,
          totalStudents: 140,
          totalLessons: 45,
          totalContent: 120,
          totalQuestions: 1247,
          totalBadgesEarned: 89,
          activeUsers: 45,
          completionRate: 78.5,
          totalSubjects: 3,
          totalTopics: 9,
          totalSubtopics: 27,
          totalTags: 8,
          totalExamPapers: 15,
          totalSubmissions: 342,
          activeSubscriptions: 89,
          totalPlans: 3,
          userGrowthPercentage: 12,
          questionGrowthPercentage: 8,
          submissionGrowthPercentage: 15,
          subscriptionGrowthPercentage: 5,
        };
        setStats(mockStats);
        
        const mockActivities: RecentActivity[] = [
          {
            id: '1',
            type: 'question',
            message: 'New question added to Physics',
            timeAgo: '2 minutes ago',
            icon: '📝',
            details: {}
          },
          {
            id: '2',
            type: 'submission',
            message: 'Student completed Chemistry exam',
            timeAgo: '5 minutes ago',
            icon: '✅',
            details: {}
          },
          {
            id: '3',
            type: 'subscription',
            message: 'New subscription plan created',
            timeAgo: '10 minutes ago',
            icon: '💳',
            details: {}
          },
          {
            id: '4',
            type: 'user',
            message: 'User registered for trial',
            timeAgo: '15 minutes ago',
            icon: '👤',
            details: {}
          },
        ];
        setRecentActivities(mockActivities);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      change: stats?.userGrowthPercentage ? `${stats.userGrowthPercentage > 0 ? '+' : ''}${stats.userGrowthPercentage}%` : '+0%',
      changeType: (stats?.userGrowthPercentage || 0) >= 0 ? 'positive' : 'negative',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
      ),
      color: 'bg-blue-500',
    },
    {
      title: 'Total Questions',
      value: stats?.totalQuestions || 0,
      change: stats?.questionGrowthPercentage ? `${stats.questionGrowthPercentage > 0 ? '+' : ''}${stats.questionGrowthPercentage}%` : '+0%',
      changeType: (stats?.questionGrowthPercentage || 0) >= 0 ? 'positive' : 'negative',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-green-500',
    },
    {
      title: 'Exam Submissions',
      value: stats?.totalSubmissions || 0,
      change: stats?.submissionGrowthPercentage ? `${stats.submissionGrowthPercentage > 0 ? '+' : ''}${stats.submissionGrowthPercentage}%` : '+0%',
      changeType: (stats?.submissionGrowthPercentage || 0) >= 0 ? 'positive' : 'negative',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: 'bg-purple-500',
    },
    {
      title: 'Active Subscriptions',
      value: stats?.activeSubscriptions || 0,
      change: stats?.subscriptionGrowthPercentage ? `${stats.subscriptionGrowthPercentage > 0 ? '+' : ''}${stats.subscriptionGrowthPercentage}%` : '+0%',
      changeType: (stats?.subscriptionGrowthPercentage || 0) >= 0 ? 'positive' : 'negative',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      color: 'bg-orange-500',
    },
  ];


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Welcome to your admin dashboard</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-800">
                    {error}. Showing fallback data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statCards.map((card, index) => (
              <div key={index} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${card.color} text-white`}>
                    {card.icon}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value.toLocaleString()}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <span className={`text-sm font-medium ${
                    card.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.change}
                  </span>
                  <span className="text-sm text-gray-600 ml-1">from last month</span>
                </div>
              </div>
            ))}
          </div>

          {/* Analytics Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MonthlyUsersChart />
            <RevenueChart />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <a href="/admin/questions/add" className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Question
              </a>
              <a href="/admin/questions/add-with-rich-text" className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Add Question (Rich Text)
              </a>
              <a href="/admin/rich-text-demo" className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Rich Text Demo
              </a>
              <Link href="/admin/exam-papers/create" className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Create Exam Paper
              </Link>
            </div>
          </div>

          {/* Content Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Overview</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subjects</span>
                  <span className="font-semibold">{stats?.totalSubjects}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Topics</span>
                  <span className="font-semibold">{stats?.totalTopics}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subtopics</span>
                  <span className="font-semibold">{stats?.totalSubtopics}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tags</span>
                  <span className="font-semibold">{stats?.totalTags}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Exam Papers</span>
                  <span className="font-semibold">{stats?.totalExamPapers}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Subscription Plans</span>
                  <span className="font-semibold">{stats?.totalPlans}</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="text-2xl">{activity.icon}</div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.timeAgo}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No recent activities</p>
                )}
              </div>
            </div>
          </div>

          

          
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
} 