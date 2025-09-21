'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';

interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  progress: number;
  timeSpent: number;
  startedAt: string;
  completedAt?: string;
  lastAccessedAt: string;
  contentCompleted: number;
  totalContent: number;
  topicsCompleted: number;
  totalTopics: number;
  averageScore?: number;
  attempts: number;
  lesson: {
    id: string;
    name: string;
    description?: string;
    subject: {
      id: string;
      name: string;
      stream: {
        id: string;
        name: string;
      };
    };
    topics: Array<{
      id: string;
      name: string;
      description?: string;
    }>;
    lmsContent: Array<{
      id: string;
      title: string;
      contentType: string;
      duration?: number;
    }>;
  };
  badges: Array<{
    id: string;
    badgeType: string;
    title: string;
    description?: string;
    iconUrl?: string;
    earnedAt: string;
  }>;
}

export default function LessonProgressPage() {
  const params = useParams();
  const router = useRouter();
  const lessonId = params?.lessonId as string;
  
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lessonId) {
      loadLessonProgress();
    }
  }, [lessonId]);

  const loadLessonProgress = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/student/lesson-progress/${lessonId}`);
      setProgress(response.data);
    } catch (error) {
      console.error('Error loading lesson progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (!progress) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <StudentLayout>
          <div className="text-center py-12">
            <p className="text-gray-500">Lesson progress not found.</p>
            <Link href="/student/lms" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
              ← Back to Learning Content
            </Link>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    );
  }

  if (!lessonId) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <StudentLayout>
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900">Invalid Lesson ID</h2>
            <p className="mt-2 text-gray-600">The lesson ID is missing or invalid.</p>
            <button 
              onClick={() => router.push('/student/lms')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to LMS
            </button>
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
                <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
                  <Link href="/student/lms" className="hover:text-blue-600">Learning Content</Link>
                  <span>›</span>
                  <span>{progress.lesson.subject.stream.name}</span>
                  <span>›</span>
                  <span>{progress.lesson.subject.name}</span>
                  <span>›</span>
                  <span className="text-gray-900">{progress.lesson.name}</span>
                </nav>
                <h1 className="text-2xl font-bold text-gray-900">{progress.lesson.name}</h1>
                {progress.lesson.description && (
                  <p className="text-gray-600 mt-1">{progress.lesson.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round(progress.progress)}%
                </div>
                <div className="text-sm text-gray-500">Complete</div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2 ${getStatusColor(progress.status)}`}>
                  {progress.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div 
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${progress.progress}%` }}
              ></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{progress.contentCompleted}</div>
                <div className="text-sm text-gray-500">Content Completed</div>
                <div className="text-xs text-gray-400">of {progress.totalContent}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{progress.topicsCompleted}</div>
                <div className="text-sm text-gray-500">Topics Completed</div>
                <div className="text-xs text-gray-400">of {progress.totalTopics}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {progress.averageScore ? `${Math.round(progress.averageScore)}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-500">Average Score</div>
                <div className="text-xs text-gray-400">{progress.attempts} attempts</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {formatTime(progress.timeSpent)}
                </div>
                <div className="text-sm text-gray-500">Time Spent</div>
                <div className="text-xs text-gray-400">
                  Started {new Date(progress.startedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          {progress.badges.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">🏆 Badges Earned</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {progress.badges.map((badge) => (
                  <div key={badge.id} className="flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <span className="text-2xl">{getBadgeIcon(badge.badgeType)}</span>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{badge.title}</div>
                      <div className="text-sm text-gray-600">{badge.description}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Earned {new Date(badge.earnedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Content and Topics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Topics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Topics</h2>
              <div className="space-y-3">
                {progress.lesson.topics.map((topic, index) => (
                  <div key={topic.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{topic.name}</div>
                      {topic.description && (
                        <div className="text-sm text-gray-600">{topic.description}</div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Learning Content</h2>
              <div className="space-y-3">
                {progress.lesson.lmsContent.map((content, index) => (
                  <div key={content.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-medium text-green-600">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{content.title}</div>
                      <div className="text-sm text-gray-600 capitalize">
                        {content.contentType.toLowerCase().replace('_', ' ')}
                        {content.duration && ` • ${content.duration} min`}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Completed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Continue Learning</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Link
                href={`/student/practice?lessonId=${lessonId}`}
                className="block p-4 bg-blue-600 text-white rounded-lg text-center hover:bg-blue-700 transition-colors"
              >
                <div className="text-lg font-medium">Practice Questions</div>
                <div className="text-sm opacity-90">Test your knowledge</div>
              </Link>
              <Link
                href={`/student/lms/lesson/${lessonId}`}
                className="block p-4 bg-green-600 text-white rounded-lg text-center hover:bg-green-700 transition-colors"
              >
                <div className="text-lg font-medium">View Content</div>
                <div className="text-sm opacity-90">Access learning materials</div>
              </Link>
              <Link
                href={`/student/performance?lessonId=${lessonId}`}
                className="block p-4 bg-purple-600 text-white rounded-lg text-center hover:bg-purple-700 transition-colors"
              >
                <div className="text-lg font-medium">View Performance</div>
                <div className="text-sm opacity-90">See detailed analytics</div>
              </Link>
            </div>
          </div>
        </div>
      </StudentLayout>
    </ProtectedRoute>
  );
}


