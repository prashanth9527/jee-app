'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';
import Swal from 'sweetalert2';
import { ChevronLeft, ChevronRight, ChevronDown, Menu, X, Play, Pause, CheckCircle, Circle, Brain, FileText } from 'lucide-react';
import ContentSummarySidebar from '@/components/ContentSummarySidebar';
import ContentLearningPanel from '@/components/ContentLearningPanel';

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
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [expandedSubtopics, setExpandedSubtopics] = useState<Set<string>>(new Set());
  const [loadingHierarchy, setLoadingHierarchy] = useState(false);
  const [showSummarySidebar, setShowSummarySidebar] = useState(false);
  const [showLearningPanel, setShowLearningPanel] = useState(false);
  const [isContentFullscreen, setIsContentFullscreen] = useState(false);

  useEffect(() => {
    if (contentId) {
      loadContent();
    }
  }, [contentId]);

  useEffect(() => {
    if (content) {
      loadHierarchy();
    }
  }, [content]);

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
      setLoadingHierarchy(true);
      // Get the full hierarchy from the backend
      const response = await api.get('/student/lms/hierarchy');
      const subjects = response.data;
      
      if (!content) return;
      
      // Find the subject that contains the current content
      const currentSubject = subjects.find((subject: any) => subject.id === content.subject.id);
      
      if (!currentSubject) {
        console.error('Subject not found for content');
        return;
      }
      
      // Build a flat list of all content in this subject for easy navigation
      const allContentInSubject: LearningContent[] = [];
      
      currentSubject.lessons.forEach((lesson: any) => {
        // Add lesson-level content
        if (lesson.lmsContent) {
          allContentInSubject.push(...lesson.lmsContent);
        }
        
        lesson.topics.forEach((topic: any) => {
          // Add topic-level content
          if (topic.lmsContent) {
            allContentInSubject.push(...topic.lmsContent);
          }
          
          topic.subtopics.forEach((subtopic: any) => {
            // Add subtopic-level content
            if (subtopic.lmsContent) {
              allContentInSubject.push(...subtopic.lmsContent);
            }
          });
        });
      });
      
      // Transform to the format expected by the sidebar
      const hierarchyData: ContentHierarchy = {
        subject: currentSubject,
        lessons: currentSubject.lessons.map((lesson: any) => ({
          id: lesson.id,
          name: lesson.name,
          topics: lesson.topics.map((topic: any) => ({
            id: topic.id,
            name: topic.name,
            subtopics: topic.subtopics.map((subtopic: any) => ({
              id: subtopic.id,
              name: subtopic.name,
              content: subtopic.lmsContent || []
            })),
            content: topic.lmsContent || []
          })),
          content: lesson.lmsContent || []
        }))
      };
      
      setHierarchy(hierarchyData);
      
      // Auto-expand the path to current content
      if (content.lesson) {
        setExpandedLessons(new Set([content.lesson.id]));
      }
      if (content.topic) {
        setExpandedTopics(new Set([content.topic.id]));
      }
      if (content.subtopic) {
        setExpandedSubtopics(new Set([content.subtopic.id]));
      }
    } catch (error) {
      console.error('Error loading hierarchy:', error);
    } finally {
      setLoadingHierarchy(false);
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

  const markAsReview = () => {
    updateProgress(100, 'REVIEW');
  };

  const markAsRevisit = () => {
    updateProgress(100, 'REVISIT');
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

      case 'TEXT':
        return (
          <div className="space-y-4">
            {content.contentData?.htmlContent ? (
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: content.contentData.htmlContent }}
              />
            ) : (
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <p className="text-gray-500">Text content not available</p>
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
          <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-white shadow-lg overflow-hidden flex-shrink-0`}>
            <div className="px-3 py-2 border-b">
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
            
            <div className="overflow-y-auto h-full pb-4">
              {loadingHierarchy ? (
                <div className="p-3 space-y-2">
                  {/* Skeleton Loader */}
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    <div className="ml-4 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      <div className="ml-4 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                        <div className="ml-4 space-y-1">
                          <div className="h-3 bg-gray-100 rounded w-full"></div>
                          <div className="h-3 bg-gray-100 rounded w-full"></div>
                          <div className="h-3 bg-gray-100 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      <div className="ml-4 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-4/5"></div>
                        <div className="ml-4 space-y-1">
                          <div className="h-3 bg-gray-100 rounded w-full"></div>
                          <div className="h-3 bg-gray-100 rounded w-4/5"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : hierarchy ? (
                <div className="p-2 space-y-1">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 px-2 text-sm">{hierarchy.subject.name}</h3>
                    {hierarchy.lessons.map((lesson) => (
                      <div key={lesson.id} className="space-y-1">
                        <button
                          onClick={() => {
                            const newExpanded = new Set(expandedLessons);
                            if (newExpanded.has(lesson.id)) {
                              newExpanded.delete(lesson.id);
                            } else {
                              newExpanded.add(lesson.id);
                            }
                            setExpandedLessons(newExpanded);
                          }}
                          className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-left"
                        >
                          <ChevronRight className={`w-4 h-4 transition-transform ${
                            expandedLessons.has(lesson.id) ? 'rotate-90' : ''
                          }`} />
                          <span className="text-sm font-medium text-gray-800">{lesson.name}</span>
                        </button>
                        {expandedLessons.has(lesson.id) && (
                          <div className="ml-6 space-y-1">
                            {lesson.topics.map((topic) => (
                              <div key={topic.id} className="space-y-1">
                                <button
                                  onClick={() => {
                                    const newExpanded = new Set(expandedTopics);
                                    if (newExpanded.has(topic.id)) {
                                      newExpanded.delete(topic.id);
                                    } else {
                                      newExpanded.add(topic.id);
                                    }
                                    setExpandedTopics(newExpanded);
                                  }}
                                  className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-left"
                                >
                                  <ChevronRight className={`w-4 h-4 transition-transform ${
                                    expandedTopics.has(topic.id) ? 'rotate-90' : ''
                                  }`} />
                                  <span className="text-sm font-medium text-gray-700">{topic.name}</span>
                                </button>
                                {expandedTopics.has(topic.id) && (
                                  <div className="ml-6 space-y-1">
                                    {topic.subtopics.map((subtopic) => (
                                      <div key={subtopic.id} className="space-y-1">
                                        <button
                                          onClick={() => {
                                            const newExpanded = new Set(expandedSubtopics);
                                            if (newExpanded.has(subtopic.id)) {
                                              newExpanded.delete(subtopic.id);
                                            } else {
                                              newExpanded.add(subtopic.id);
                                            }
                                            setExpandedSubtopics(newExpanded);
                                          }}
                                          className="w-full flex items-center space-x-2 p-2 hover:bg-gray-100 rounded text-left"
                                        >
                                          <ChevronRight className={`w-4 h-4 transition-transform ${
                                            expandedSubtopics.has(subtopic.id) ? 'rotate-90' : ''
                                          }`} />
                                          <span className="text-sm text-gray-600">{subtopic.name}</span>
                                        </button>
                                        {expandedSubtopics.has(subtopic.id) && (
                                          <div className="ml-6 space-y-1">
                                            {subtopic.content.map((item) => (
                                              <button
                                                key={item.id}
                                                onClick={() => navigateToContent(item.id)}
                                                className={`w-full text-left p-2 rounded text-sm flex items-center space-x-2 ${
                                                  item.id === contentId
                                                    ? 'bg-blue-100 text-blue-900 border-l-2 border-blue-600'
                                                    : 'hover:bg-gray-50'
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
                                        )}
                                      </div>
                                    ))}
                                    {topic.content && topic.content.length > 0 && (
                                      <div className="ml-6 space-y-1">
                                        {topic.content.map((item) => (
                                          <button
                                            key={item.id}
                                            onClick={() => navigateToContent(item.id)}
                                            className={`w-full text-left p-2 rounded text-sm flex items-center space-x-2 ${
                                              item.id === contentId
                                                ? 'bg-blue-100 text-blue-900 border-l-2 border-blue-600'
                                                : 'hover:bg-gray-50'
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
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <p className="text-sm">No learning path available</p>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header */}
            <div className="bg-white shadow-sm border-b px-4 py-2">
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
                    <h1 className="text-lg font-semibold text-gray-900">{content.title}</h1>
                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                      <span>{content.subject.name}</span>
                      {content.lesson && <span>• {content.lesson.name}</span>}
                      {content.topic && <span>• {content.topic.name}</span>}
                      {content.subtopic && <span>• {content.subtopic.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {/* AI Summary Button */}
                  <button
                    onClick={() => setShowSummarySidebar(!showSummarySidebar)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      showSummarySidebar
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                    title="AI Summary & Mind Map"
                  >
                    <Brain className="w-4 h-4" />
                    <span className="hidden md:inline">AI Summary</span>
                  </button>

                  {/* Learning Tools Button */}
                  <button
                    onClick={() => setShowLearningPanel(!showLearningPanel)}
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                      showLearningPanel
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                    title="Notes, Questions & Analysis"
                  >
                    <FileText className="w-4 h-4" />
                    <span className="hidden md:inline">Learning Tools</span>
                  </button>

                  <button
                    onClick={() => router.push('/student/lms')}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {/* Progress Bar */}
                <div className="bg-white rounded-lg shadow p-3">
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
                  <div className="flex justify-between mt-3">
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
                    <div className="flex space-x-2">
                      <button
                        onClick={markAsCompleted}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Complete
                      </button>
                      <button
                        onClick={markAsReview}
                        className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                      >
                        Review
                      </button>
                      <button
                        onClick={markAsRevisit}
                        className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
                      >
                        Revisit
                      </button>
                    </div>
                  </div>
                </div>

                {/* Content Description */}
                {content.description && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                    <p className="text-gray-600">{content.description}</p>
                  </div>
                )}

                {/* Main Content */}
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">Content</h2>
                    <button
                      onClick={() => setIsContentFullscreen(!isContentFullscreen)}
                      className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                      title={isContentFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                      {isContentFullscreen ? (
                        <>
                          <X className="w-4 h-4" />
                          <span className="hidden md:inline">Exit Fullscreen</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                          <span className="hidden md:inline">Fullscreen</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className={isContentFullscreen ? 'fixed inset-0 z-50 bg-white overflow-auto p-6' : ''}>
                    {isContentFullscreen && (
                      <div className="flex items-center justify-between mb-4 sticky top-0 bg-white pb-4 border-b">
                        <h2 className="text-xl font-semibold text-gray-900">{content.title}</h2>
                        <button
                          onClick={() => setIsContentFullscreen(false)}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                        >
                          <X className="w-5 h-5" />
                          <span>Exit Fullscreen</span>
                        </button>
                      </div>
                    )}
                    {renderContent()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Summary Sidebar */}
          <ContentSummarySidebar
            contentId={showSummarySidebar && content ? content.id : null}
            isVisible={showSummarySidebar}
            onClose={() => setShowSummarySidebar(false)}
          />

          {/* Learning Tools Panel */}
          {showLearningPanel && content && (
            <div className="fixed right-0 top-0 h-full w-full md:w-[500px] lg:w-[600px] bg-white shadow-2xl z-50 overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
                <h3 className="text-lg font-semibold text-gray-900">Learning Tools</h3>
                <button
                  onClick={() => setShowLearningPanel(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  title="Close"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <ContentLearningPanel
                contentId={content.id}
                contentTitle={content.title}
              />
            </div>
          )}
        </div>
      </StudentLayout>
    </ProtectedRoute>
  );
}
