'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';

interface LeaderboardEntry {
  id: string;
  userId: string;
  lessonId: string;
  status: string;
  progress: number;
  timeSpent: number;
  averageScore?: number;
  user: {
    id: string;
  fullName: string;
    profilePicture?: string;
  };
  lesson: {
    id: string;
    name: string;
    subject: {
      id: string;
      name: string;
      stream: {
        id: string;
        name: string;
      };
    };
  };
  badges: Array<{
    id: string;
    badgeType: string;
    title: string;
  }>;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [filter, timeFilter]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('subjectId', filter);
      params.append('limit', '50');
      
      const response = await api.get(`/student/lesson-progress/leaderboard?${params.toString()}`);
      setLeaderboard(response.data);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return '🥇';
      case 1:
        return '🥈';
      case 2:
        return '🥉';
      default:
        return `#${index + 1}`;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'bg-yellow-100 border-yellow-300';
      case 1:
        return 'bg-gray-100 border-gray-300';
      case 2:
        return 'bg-orange-100 border-orange-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  const getBadgeIcon = (badgeType: string) => {
    const icons: Record<string, string> = {
      COMPLETION: '🏆',
      SPEED_DEMON: '⚡',
      PERFECT_SCORE: '💯',
      PERSEVERANCE: '💪',
      EARLY_BIRD: '🐦',
      NIGHT_OWL: '🦉',
      STREAK_MASTER: '🔥',
      TOP_PERFORMER: '⭐',
      CONTENT_EXPLORER: '🗺️',
      QUIZ_MASTER: '🧠'
    };
    return icons[badgeType] || '🏆';
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Get unique subjects for filter
  const subjects = [...new Set(leaderboard.map(entry => entry.lesson.subject.name))];

  // Calculate stats
  const stats = {
    totalStudents: leaderboard.length,
    averageScore: leaderboard.reduce((sum, entry) => sum + (entry.averageScore || 0), 0) / Math.max(1, leaderboard.length),
    totalBadges: leaderboard.reduce((sum, entry) => sum + entry.badges.length, 0)
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
          <StudentLayout>
            <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          </StudentLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
        <StudentLayout>
          <div className="space-y-6">
            {/* Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🏆 Leaderboard</h1>
                <p className="text-gray-600 mt-1">See how you rank among your peers</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{stats.totalStudents}</div>
                <div className="text-sm text-gray-500">Students</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
                <div className="text-sm text-gray-500">Total Students</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{Math.round(stats.averageScore)}%</div>
                <div className="text-sm text-gray-500">Average Score</div>
                  </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{stats.totalBadges}</div>
                <div className="text-sm text-gray-500">Badges Earned</div>
                  </div>
                </div>
              </div>

          {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Results</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Subjects
              </button>
              {subjects.map((subject) => (
                  <button
                  key={subject}
                  onClick={() => setFilter(subject)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === subject
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {subject}
                  </button>
              ))}
            </div>
          </div>

          {/* Top 3 Podium */}
          {leaderboard.length >= 3 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">🏆 Top Performers</h2>
              <div className="grid grid-cols-3 gap-4">
                {leaderboard.slice(0, 3).map((entry, index) => (
                  <div key={entry.id} className={`p-6 rounded-lg border-2 ${getRankColor(index)}`}>
                    <div className="text-center">
                      <div className="text-4xl mb-2">{getRankIcon(index)}</div>
                      <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                        {entry.user.profilePicture ? (
                          <img 
                            src={entry.user.profilePicture} 
                            alt={entry.user.fullName}
                            className="w-16 h-16 rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl font-bold text-gray-600">
                            {entry.user.fullName.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="font-semibold text-gray-900">{entry.user.fullName}</div>
                      <div className="text-sm text-gray-600 mb-2">{entry.lesson.name}</div>
                      <div className="text-lg font-bold text-blue-600">{Math.round(entry.averageScore || 0)}%</div>
                      <div className="text-xs text-gray-500">{formatTime(entry.timeSpent)}</div>
                      <div className="flex justify-center space-x-1 mt-2">
                        {entry.badges.slice(0, 3).map((badge) => (
                          <span key={badge.id} title={badge.title} className="text-sm">
                            {getBadgeIcon(badge.badgeType)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Leaderboard */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Complete Rankings</h2>
            
            {leaderboard.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-500 mb-4">No data available for the selected filter.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry, index) => (
                  <div key={entry.id} className={`flex items-center space-x-4 p-4 rounded-lg border ${getRankColor(index)}`}>
                    <div className="flex-shrink-0 w-8 text-center font-bold text-gray-600">
                      {getRankIcon(index)}
              </div>

                    <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {entry.user.profilePicture ? (
                        <img 
                          src={entry.user.profilePicture} 
                          alt={entry.user.fullName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-gray-600">
                          {entry.user.fullName.charAt(0).toUpperCase()}
                        </span>
                            )}
                          </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">{entry.user.fullName}</div>
                      <div className="text-sm text-gray-600 truncate">{entry.lesson.name}</div>
                      <div className="text-xs text-gray-500">{entry.lesson.subject.name}</div>
                              </div>
                    
                    <div className="flex-shrink-0 text-center">
                      <div className="text-lg font-bold text-blue-600">{Math.round(entry.averageScore || 0)}%</div>
                      <div className="text-xs text-gray-500">Score</div>
                            </div>
                    
                    <div className="flex-shrink-0 text-center">
                      <div className="text-lg font-bold text-green-600">{Math.round(entry.progress)}%</div>
                      <div className="text-xs text-gray-500">Progress</div>
                            </div>
                    
                    <div className="flex-shrink-0 text-center">
                      <div className="text-lg font-bold text-purple-600">{formatTime(entry.timeSpent)}</div>
                      <div className="text-xs text-gray-500">Time</div>
                          </div>
                    
                    <div className="flex-shrink-0">
                      <div className="flex space-x-1">
                        {entry.badges.slice(0, 3).map((badge) => (
                          <span key={badge.id} title={badge.title} className="text-sm">
                            {getBadgeIcon(badge.badgeType)}
                          </span>
                        ))}
                        {entry.badges.length > 3 && (
                          <span className="text-xs text-gray-500">+{entry.badges.length - 3}</span>
                        )}
                      </div>
              </div>
                  </div>
                ))}
                </div>
              )}
            </div>

          {/* Motivation Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow p-6 text-white">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Keep Learning! 🚀</h2>
              <p className="mb-4 opacity-90">
                Every lesson completed brings you closer to your goals. Stay consistent and watch yourself climb the leaderboard!
              </p>
              <div className="flex justify-center space-x-4">
                <Link
                  href="/student/lms"
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-all duration-300 font-medium"
                >
                  Continue Learning
                </Link>
                <Link
                  href="/student/badges"
                  className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-all duration-300 font-medium"
                >
                  View My Badges
                </Link>
              </div>
            </div>
          </div>
          </div>
        </StudentLayout>
    </ProtectedRoute>
  );
} 