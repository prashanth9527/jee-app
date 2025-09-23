'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';

interface Badge {
  id: string;
  userId: string;
  lessonId: string;
  badgeType: string;
  title: string;
  description?: string;
  iconUrl?: string;
  earnedAt: string;
  lessonProgress: {
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
  };
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/lesson-progress/badges/earned');
      setBadges(response.data);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
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

  const getBadgeColor = (badgeType: string) => {
    const colors: Record<string, string> = {
      COMPLETION: 'bg-yellow-100 border-yellow-300 text-yellow-800',
      SPEED_DEMON: 'bg-red-100 border-red-300 text-red-800',
      PERFECT_SCORE: 'bg-green-100 border-green-300 text-green-800',
      PERSEVERANCE: 'bg-purple-100 border-purple-300 text-purple-800',
      EARLY_BIRD: 'bg-orange-100 border-orange-300 text-orange-800',
      NIGHT_OWL: 'bg-indigo-100 border-indigo-300 text-indigo-800',
      STREAK_MASTER: 'bg-pink-100 border-pink-300 text-pink-800',
      TOP_PERFORMER: 'bg-blue-100 border-blue-300 text-blue-800',
      CONTENT_EXPLORER: 'bg-teal-100 border-teal-300 text-teal-800',
      QUIZ_MASTER: 'bg-gray-100 border-gray-300 text-gray-800'
    };
    return colors[badgeType] || 'bg-gray-100 border-gray-300 text-gray-800';
  };

  const filteredBadges = badges.filter(badge => {
    if (filter === 'all') return true;
    return badge.lessonProgress.lesson.subject.stream.name === filter;
  });

  const streams = [...new Set(badges.map(badge => badge.lessonProgress.lesson.subject.stream.name))];
  const badgeTypes = [...new Set(badges.map(badge => badge.badgeType))];

  const badgeStats = {
    total: badges.length,
    byType: badgeTypes.map(type => ({
      type,
      count: badges.filter(b => b.badgeType === type).length
    })),
    byStream: streams.map(stream => ({
      stream,
      count: badges.filter(b => b.lessonProgress.lesson.subject.stream.name === stream).length
    }))
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
                <h1 className="text-2xl font-bold text-gray-900">🏆 My Badges</h1>
                <p className="text-gray-600 mt-1">Celebrate your learning achievements!</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-yellow-600">{badgeStats.total}</div>
                <div className="text-sm text-gray-500">Badges Earned</div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{badgeStats.total}</div>
                <div className="text-sm text-gray-500">Total Badges</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{badgeStats.byType.length}</div>
                <div className="text-sm text-gray-500">Badge Types</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{badgeStats.byStream.length}</div>
                <div className="text-sm text-gray-500">Subjects</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {badgeStats.byType.reduce((sum, type) => sum + type.count, 0)}
                </div>
                <div className="text-sm text-gray-500">Achievements</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Badges</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All ({badgeStats.total})
              </button>
              {badgeStats.byStream.map(({ stream, count }) => (
                <button
                  key={stream}
                  onClick={() => setFilter(stream)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === stream
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {stream} ({count})
                </button>
              ))}
            </div>
          </div>

          {/* Badge Types Overview */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Badge Types</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {badgeStats.byType.map(({ type, count }) => (
                <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl mb-2">{getBadgeIcon(type)}</div>
                  <div className="text-sm font-medium text-gray-900">{type.replace('_', ' ')}</div>
                  <div className="text-lg font-bold text-blue-600">{count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Badges Grid */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {filter === 'all' ? 'All Badges' : `${filter} Badges`} ({filteredBadges.length})
            </h2>
            
            {filteredBadges.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <p className="text-gray-500 mb-4">No badges earned yet!</p>
                <Link 
                  href="/student/lms" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Learning
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBadges.map((badge) => (
                  <div key={badge.id} className={`p-6 rounded-lg border-2 ${getBadgeColor(badge.badgeType)}`}>
                    <div className="flex items-center space-x-3 mb-4">
                      <span className="text-3xl">{getBadgeIcon(badge.badgeType)}</span>
                      <div>
                        <div className="font-semibold text-lg">{badge.title}</div>
                        <div className="text-sm opacity-80">{badge.description}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="opacity-80">Lesson:</span>
                        <span className="font-medium">{badge.lessonProgress.lesson.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-80">Subject:</span>
                        <span className="font-medium">{badge.lessonProgress.lesson.subject.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="opacity-80">Earned:</span>
                        <span className="font-medium">
                          {new Date(badge.earnedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-current border-opacity-20">
                      <Link
                        href={`/student/lesson-progress/${badge.lessonId}`}
                        className="block text-center py-2 px-4 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
                      >
                        View Progress
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Leaderboard Link */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">See How You Rank</h2>
              <p className="text-gray-600 mb-4">Compare your achievements with other students</p>
              <Link
                href="/student/leaderboard"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
              >
                <span className="mr-2">🏆</span>
                View Leaderboard
              </Link>
            </div>
          </div>
        </div>
      </StudentLayout>
    </ProtectedRoute>
  );
}






