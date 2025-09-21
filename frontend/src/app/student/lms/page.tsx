'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';
import Swal from 'sweetalert2';

interface Subject {
  id: string;
  name: string;
  _count: { lmsContent: number };
}

interface Lesson {
  id: string;
  name: string;
  subject: { id: string; name: string };
  _count: { lmsContent: number };
}

interface Topic {
  id: string;
  name: string;
  subject: { id: string; name: string };
  lesson?: { id: string; name: string };
  _count: { lmsContent: number };
}

interface Subtopic {
  id: string;
  name: string;
  topic: { 
    id: string; 
    name: string;
    subject: { id: string; name: string };
  };
  _count: { lmsContent: number };
}

interface LearningContent {
  id: string;
  title: string;
  description?: string;
  contentType: string;
  subject: { id: string; name: string };
  lesson?: { id: string; name: string };
  topic?: { id: string; name: string };
  subtopic?: { id: string; name: string };
  progress: Array<{
    id: string;
    status: string;
    completedAt?: string;
    progress: number;
  }>;
}

export default function StudentLMSPage() {
  const router = useRouter();
  const [content, setContent] = useState<LearningContent[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filters, setFilters] = useState({
    subjectId: '',
    lessonId: '',
    topicId: '',
    subtopicId: ''
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadContent();
  }, [filters]);

  const loadInitialData = async () => {
    try {
      const [subjectsRes, lessonsRes, topicsRes, subtopicsRes] = await Promise.all([
        api.get('/student/lms/subjects'),
        api.get('/student/lms/lessons'),
        api.get('/student/lms/topics'),
        api.get('/student/lms/subtopics')
      ]);

      setSubjects(subjectsRes.data);
      setLessons(lessonsRes.data);
      setTopics(topicsRes.data);
      setSubtopics(subtopicsRes.data);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Swal.fire('Error', 'Failed to load data', 'error');
    }
  };

  const loadContent = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (filters.subjectId) params.append('subjectId', filters.subjectId);
      if (filters.lessonId) params.append('lessonId', filters.lessonId);
      if (filters.topicId) params.append('topicId', filters.topicId);
      if (filters.subtopicId) params.append('subtopicId', filters.subtopicId);

      const response = await api.get(`/student/lms/content?${params}`);
      setContent(response.data);
    } catch (error) {
      console.error('Error loading content:', error);
      Swal.fire('Error', 'Failed to load learning content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset dependent filters
      if (key === 'subjectId') {
        newFilters.lessonId = '';
        newFilters.topicId = '';
        newFilters.subtopicId = '';
      } else if (key === 'lessonId') {
        newFilters.topicId = '';
        newFilters.subtopicId = '';
      } else if (key === 'topicId') {
        newFilters.subtopicId = '';
      }
      
      return newFilters;
    });
  };

  const startLearning = (contentId: string) => {
    router.push(`/student/lms/learn/${contentId}`);
  };

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'VIDEO': return '🎥';
      case 'DOCUMENT': return '📄';
      case 'AUDIO': return '🎵';
      case 'INTERACTIVE': return '🎮';
      case 'QUIZ': return '❓';
      default: return '📚';
    }
  };

  const getProgressStatus = (progress: any[]) => {
    if (!progress || progress.length === 0) return { status: 'not-started', percent: 0 };
    const userProgress = progress[0];
    return { 
      status: userProgress.status, 
      percent: userProgress.progress || 0 
    };
  };

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Learning Content</h1>
              <p className="text-gray-600 mt-1">Browse and access learning materials organized by lessons</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      {subject.name} ({subject._count.lmsContent})
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
                  disabled={!filters.subjectId}
                >
                  <option value="" className="text-gray-600">All Lessons</option>
                  {lessons
                    .filter(lesson => !filters.subjectId || lesson.subject.id === filters.subjectId)
                    .map(lesson => (
                      <option key={lesson.id} value={lesson.id} className="text-gray-900">
                        {lesson.name} ({lesson._count.lmsContent})
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
                  disabled={!filters.subjectId}
                >
                  <option value="" className="text-gray-600">All Topics</option>
                  {topics
                    .filter(topic => {
                      const subjectMatch = !filters.subjectId || topic.subject.id === filters.subjectId;
                      const lessonMatch = !filters.lessonId || topic.lesson?.id === filters.lessonId;
                      return subjectMatch && lessonMatch;
                    })
                    .map(topic => (
                      <option key={topic.id} value={topic.id} className="text-gray-900">
                        {topic.name} ({topic._count.lmsContent})
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
                  disabled={!filters.subjectId || !filters.topicId}
                >
                  <option value="" className="text-gray-600">All Subtopics</option>
                  {subtopics
                    .filter(subtopic => {
                      const subjectMatch = !filters.subjectId || subtopic.topic.subject.id === filters.subjectId;
                      const topicMatch = !filters.topicId || subtopic.topic.id === filters.topicId;
                      return subjectMatch && topicMatch;
                    })
                    .map(subtopic => (
                      <option key={subtopic.id} value={subtopic.id} className="text-gray-900">
                        {subtopic.name} ({subtopic._count.lmsContent})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Content List */}
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          ) : content.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-gray-500 text-center">No learning content available with the current filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {content.map((item) => {
                const progress = getProgressStatus(item.progress);
                return (
                  <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{getContentTypeIcon(item.contentType)}</span>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-600">{item.contentType}</p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          progress.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          progress.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {progress.status === 'COMPLETED' ? 'Completed' :
                           progress.status === 'IN_PROGRESS' ? 'In Progress' : 'Not Started'}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>
                      )}

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium">Subject:</span>
                          <span className="ml-2">{item.subject.name}</span>
                        </div>
                        {item.lesson && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">Lesson:</span>
                            <span className="ml-2">{item.lesson.name}</span>
                          </div>
                        )}
                        {item.topic && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">Topic:</span>
                            <span className="ml-2">{item.topic.name}</span>
                          </div>
                        )}
                        {item.subtopic && (
                          <div className="flex items-center text-sm text-gray-600">
                            <span className="font-medium">Subtopic:</span>
                            <span className="ml-2">{item.subtopic.name}</span>
                          </div>
                        )}
                      </div>

                      {progress.status === 'IN_PROGRESS' && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{progress.percent}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${progress.percent}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => startLearning(item.id)}
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        {progress.status === 'COMPLETED' ? 'Review' : 
                         progress.status === 'IN_PROGRESS' ? 'Continue' : 'Start Learning'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </StudentLayout>
    </ProtectedRoute>
  );
}
