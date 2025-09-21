'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';
import Swal from 'sweetalert2';
import { ChevronLeft, ChevronRight, Menu, X, Play, Pause, CheckCircle, Circle } from 'lucide-react';

interface LearningContent {
  id: string;
  title: string;
  description?: string;
  contentType: string;
  contentData?: any;
  fileUrl?: string;
  externalUrl?: string;
  youtubeId?: string;
  duration?: number;
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

interface ContentHierarchy {
  subject: { id: string; name: string };
  lessons: Array<{
    id: string;
    name: string;
    topics: Array<{
      id: string;
      name: string;
      subtopics: Array<{
        id: string;
        name: string;
        content: LearningContent[];
      }>;
      content: LearningContent[];
    }>;
    content: LearningContent[];
  }>;
}

export default function LearningPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params?.id as string;
  
  const [content, setContent] = useState<LearningContent | null>(null);
  const [hierarchy, setHierarchy] = useState<ContentHierarchy | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (contentId) {
      loadContent();
      loadHierarchy();
    }
  }, [contentId]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/student/lms/content/${contentId}`);
      setContent(response.data);
      
      // Set initial progress
      if (response.data.progress && response.data.progress.length > 0) {
        setProgress(response.data.progress[0].progress || 0);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      Swal.fire('Error', 'Failed to load learning content', 'error');
      router.push('/student/lms');
    } finally {
      setLoading(false);
    }
  };

  const loadHierarchy = async () => {
    try {
      const response = await api.get('/student/lms/content');
      const allContent = response.data;
      
      // Group content by hierarchy
      const grouped: any = {};
      
      allContent.forEach((item: LearningContent) => {
        const subjectId = item.subject.id;
        const lessonId = item.lesson?.id || 'no-lesson';
        const topicId = item.topic?.id || 'no-topic';
        const subtopicId = item.subtopic?.id || 'no-subtopic';
        
        if (!grouped[subjectId]) {
          grouped[subjectId] = {
            subject: item.subject,
            lessons: {}
          };
        }
        
        if (!grouped[subjectId].lessons[lessonId]) {
          grouped[subjectId].lessons[lessonId] = {
            id: lessonId,
            name: item.lesson?.name || 'General',
            topics: {}
          };
        }
        
        if (!grouped[subjectId].lessons[lessonId].topics[topicId]) {
          grouped[subjectId].lessons[lessonId].topics[topicId] = {
            id: topicId,
            name: item.topic?.name || 'General',
            subtopics: {},
            content: []
          };
        }
        
        if (!grouped[subjectId].lessons[lessonId].topics[topicId].subtopics[subtopicId]) {
          grouped[subjectId].lessons[lessonId].topics[topicId].subtopics[subtopicId] = {
            id: subtopicId,
            name: item.subtopic?.name || 'General',
            content: []
          };
        }
        
        grouped[subjectId].lessons[lessonId].topics[topicId].subtopics[subtopicId].content.push(item);
        grouped[subjectId].lessons[lessonId].topics[topicId].content.push(item);
        grouped[subjectId].lessons[lessonId].content.push(item);
      });
      
      // Convert to array format
      const hierarchyData = Object.values(grouped).map((subject: any) => ({
        subject: subject.subject,
        lessons: Object.values(subject.lessons).map((lesson: any) => ({
          ...lesson,
          topics: Object.values(lesson.topics).map((topic: any) => ({
            ...topic,
            subtopics: Object.values(topic.subtopics)
          }))
        }))
      }));
      
      setHierarchy(hierarchyData[0] || null);
    } catch (error) {
      console.error('Error loading hierarchy:', error);
    }
  };

  const updateProgress = async (newProgress: number, status: string = 'IN_PROGRESS') => {
    try {
      await api.post(`/student/lms/content/${contentId}/progress`, null, {
        params: {
          status,
          progressPercent: newProgress.toString()
        }
      });
      setProgress(newProgress);
      
      if (status === 'COMPLETED') {
        Swal.fire({
          title: 'Congratulations!',
          text: 'You have completed this learning content!',
          icon: 'success',
          timer: 2000
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleProgressChange = (newProgress: number) => {
    setProgress(newProgress);
    updateProgress(newProgress);
  };

  const markAsCompleted = () => {
    updateProgress(100, 'COMPLETED');
  };

  const navigateToContent = (newContentId: string) => {
    router.push(`/student/lms/learn/${newContentId}`);
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

  const renderContent = () => {
    if (!content) return null;

    switch (content.contentType) {
      case 'VIDEO':
        return (
          <div className="space-y-4">
            {content.youtubeId ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${content.youtubeId}`}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : content.fileUrl ? (
              <video
                controls
                className="w-full rounded-lg"
                onTimeUpdate={(e) => {
                  const video = e.target as HTMLVideoElement;
                  const newProgress = (video.currentTime / video.duration) * 100;
                  if (newProgress > progress) {
                    handleProgressChange(newProgress);
                  }
                }}
              >
                <source src={content.fileUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Video content not available</p>
              </div>
            )}
          </div>
        );

      case 'DOCUMENT':
        return (
          <div className="space-y-4">
            {content.fileUrl ? (
              <iframe
                src={content.fileUrl}
                className="w-full h-96 border rounded-lg"
                title={content.title}
              />
            ) : (
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <p className="text-gray-500">Document content not available</p>
              </div>
            )}
          </div>
        );

      case 'AUDIO':
        return (
          <div className="space-y-4">
            {content.fileUrl ? (
              <div className="bg-gray-100 p-8 rounded-lg">
                <audio
                  controls
                  className="w-full"
                  onTimeUpdate={(e) => {
                    const audio = e.target as HTMLAudioElement;
                    const newProgress = (audio.currentTime / audio.duration) * 100;
                    if (newProgress > progress) {
                      handleProgressChange(newProgress);
                    }
                  }}
                >
                  <source src={content.fileUrl} type="audio/mpeg" />
                  Your browser does not support the audio tag.
                </audio>
              </div>
            ) : (
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <p className="text-gray-500">Audio content not available</p>
              </div>
            )}
          </div>
        );

      case 'INTERACTIVE':
        return (
          <div className="space-y-4">
            {content.externalUrl ? (
              <iframe
                src={content.externalUrl}
                className="w-full h-96 border rounded-lg"
                title={content.title}
              />
            ) : (
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <p className="text-gray-500">Interactive content not available</p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="bg-gray-100 p-8 rounded-lg text-center">
            <p className="text-gray-500">Content type not supported</p>
          </div>
        );
    }
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

  if (!content) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <StudentLayout>
          <div className="text-center py-12">
            <p className="text-gray-500">Content not found</p>
            <button
              onClick={() => router.push('/student/lms')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Back to Learning Content
            </button>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentLayout>
        <div className="flex h-screen bg-gray-50">
          {/* Sidebar */}
          <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-white shadow-lg overflow-hidden flex-shrink-0`}>
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Learning Path</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto h-full pb-20">
              {hierarchy && (
                <div className="p-4 space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">{hierarchy.subject.name}</h3>
                    {hierarchy.lessons.map((lesson) => (
                      <div key={lesson.id} className="ml-4 space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">{lesson.name}</span>
                        </div>
                        {lesson.topics.map((topic) => (
                          <div key={topic.id} className="ml-4 space-y-1">
                            <div className="text-sm text-gray-600">{topic.name}</div>
                            {topic.subtopics.map((subtopic) => (
                              <div key={subtopic.id} className="ml-4 space-y-1">
                                <div className="text-sm text-gray-500">{subtopic.name}</div>
                                {subtopic.content.map((item) => (
                                  <button
                                    key={item.id}
                                    onClick={() => navigateToContent(item.id)}
                                    className={`w-full text-left p-2 rounded text-sm flex items-center space-x-2 ${
                                      item.id === contentId
                                        ? 'bg-blue-100 text-blue-900'
                                        : 'hover:bg-gray-100'
                                    }`}
                                  >
                                    <span>{getContentTypeIcon(item.contentType)}</span>
                                    <span className="flex-1 truncate">{item.title}</span>
                                    {item.progress && item.progress.length > 0 && (
                                      item.progress[0].status === 'COMPLETED' ? (
                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                      ) : item.progress[0].status === 'IN_PROGRESS' ? (
                                        <Circle className="w-4 h-4 text-blue-600" />
                                      ) : null
                                    )}
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="bg-white shadow-sm border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {!sidebarOpen && (
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <Menu className="w-5 h-5" />
                    </button>
                  )}
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">{content.title}</h1>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{content.subject.name}</span>
                      {content.lesson && <span>• {content.lesson.name}</span>}
                      {content.topic && <span>• {content.topic.name}</span>}
                      {content.subtopic && <span>• {content.subtopic.name}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => router.push('/student/lms')}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className={`${sidebarOpen ? 'max-w-4xl mx-auto' : 'max-w-none'} space-y-6`}>
                {/* Progress Bar */}
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progress</span>
                    <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <button
                      onClick={() => handleProgressChange(Math.max(0, progress - 10))}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      -10%
                    </button>
                    <button
                      onClick={() => handleProgressChange(Math.min(100, progress + 10))}
                      className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      +10%
                    </button>
                    <button
                      onClick={markAsCompleted}
                      className="px-4 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Mark Complete
                    </button>
                  </div>
                </div>

                {/* Content Description */}
                {content.description && (
                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                    <p className="text-gray-600">{content.description}</p>
                  </div>
                )}

                {/* Main Content */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </StudentLayout>
    </ProtectedRoute>
  );
}
