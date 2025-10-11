'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/lib/api';

interface LearningContent {
  id: string;
  title: string;
  description?: string;
  contentType: string;
  order: number;
  progress?: Array<{
    id: string;
    status: string;
    progress: number;
    completedAt?: string;
  }>;
}

interface SubjectHierarchy {
  id: string;
  name: string;
  description?: string;
  progress?: Array<{
    id: string;
    status: string;
    progress: number;
    completedAt?: string;
  }>;
  lessons: LessonHierarchy[];
  lmsContent: LearningContent[];
}

interface LessonHierarchy {
  id: string;
  name: string;
  description?: string;
  order: number;
  progress?: Array<{
    id: string;
    status: string;
    progress: number;
    completedAt?: string;
  }>;
  topics: TopicHierarchy[];
  lmsContent: LearningContent[];
}

interface TopicHierarchy {
  id: string;
  name: string;
  description?: string;
  order: number;
  progress?: Array<{
    id: string;
    status: string;
    progress: number;
    completedAt?: string;
  }>;
  subtopics: SubtopicHierarchy[];
  lmsContent: LearningContent[];
}

interface SubtopicHierarchy {
  id: string;
  name: string;
  description?: string;
  order: number;
  progress?: Array<{
    id: string;
    status: string;
    progress: number;
    completedAt?: string;
  }>;
  lmsContent: LearningContent[];
}

interface LearningTreeProps {
  sidebarCollapsed: boolean;
}

export default function LearningTree({ sidebarCollapsed }: LearningTreeProps) {
  const [hierarchy, setHierarchy] = useState<SubjectHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    loadHierarchy();
  }, []);

  const loadHierarchy = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/lms/hierarchy');
      setHierarchy(response.data);
      
      // Auto-expand first subject
      if (response.data.length > 0) {
        setExpandedItems(new Set([response.data[0].id]));
      }
    } catch (error) {
      console.error('Error loading hierarchy:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getProgressStatus = (progress: any[]) => {
    if (!progress || progress.length === 0) {
      return { status: 'NOT_STARTED', percent: 0 };
    }
    
    const latest = progress[0];
    return {
      status: latest.status,
      percent: latest.progress || 0
    };
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600';
      case 'IN_PROGRESS': return 'text-blue-600';
      case 'REVIEW': return 'text-yellow-600';
      case 'REVISIT': return 'text-orange-600';
      default: return 'text-gray-400';
    }
  };

  const getProgressIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return '✓';
      case 'IN_PROGRESS': return '▶';
      case 'REVIEW': return '↻';
      case 'REVISIT': return '↺';
      default: return '○';
    }
  };

  const navigateToContent = (contentId: string) => {
    router.push(`/student/lms/learn/${contentId}`);
  };

  const navigateToSubject = (subjectId: string) => {
    router.push(`/student/lms?subject=${subjectId}`);
  };

  const navigateToLesson = (subjectId: string, lessonId: string) => {
    router.push(`/student/lms?subject=${subjectId}&lesson=${lessonId}`);
  };

  const navigateToTopic = (subjectId: string, lessonId: string, topicId: string) => {
    router.push(`/student/lms?subject=${subjectId}&lesson=${lessonId}&topic=${topicId}`);
  };

  const navigateToSubtopic = (subjectId: string, lessonId: string, topicId: string, subtopicId: string) => {
    router.push(`/student/lms?subject=${subjectId}&lesson=${lessonId}&topic=${topicId}&subtopic=${subtopicId}`);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (hierarchy.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">No learning content available</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Learning Tree
        </h3>
      </div>
      
      <div className="space-y-1">
        {hierarchy.map((subject) => {
          const subjectProgress = getProgressStatus(subject.progress || []);
          const isSubjectExpanded = expandedItems.has(subject.id);
          
          return (
            <div key={subject.id} className="text-xs">
              {/* Subject */}
              <div className="flex items-center space-x-1 py-1">
                <button
                  onClick={() => toggleExpanded(subject.id)}
                  className="flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600"
                >
                  <svg 
                    className={`w-3 h-3 transition-transform ${isSubjectExpanded ? 'rotate-90' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => navigateToSubject(subject.id)}
                  className="flex items-center space-x-1 hover:bg-gray-100 rounded px-1 py-0.5 flex-1 text-left"
                >
                  <span className={`text-xs ${getProgressColor(subjectProgress.status)}`}>
                    {getProgressIcon(subjectProgress.status)}
                  </span>
                  <span className="text-xs font-medium text-gray-900 truncate">
                    {subject.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {Math.round(subjectProgress.percent)}%
                  </span>
                </button>
              </div>

              {/* Lessons */}
              {isSubjectExpanded && (
                <div className="ml-4 space-y-1">
                  {subject.lessons.map((lesson) => {
                    const lessonProgress = getProgressStatus(lesson.progress || []);
                    const isLessonExpanded = expandedItems.has(lesson.id);
                    
                    return (
                      <div key={lesson.id}>
                        <div className="flex items-center space-x-1 py-1">
                          <button
                            onClick={() => toggleExpanded(lesson.id)}
                            className="flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600"
                          >
                            <svg 
                              className={`w-3 h-3 transition-transform ${isLessonExpanded ? 'rotate-90' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => navigateToLesson(subject.id, lesson.id)}
                            className="flex items-center space-x-1 hover:bg-gray-100 rounded px-1 py-0.5 flex-1 text-left"
                          >
                            <span className={`text-xs ${getProgressColor(lessonProgress.status)}`}>
                              {getProgressIcon(lessonProgress.status)}
                            </span>
                            <span className="text-xs text-gray-800 truncate">
                              {lesson.name}
                            </span>
                            <span className="text-xs text-gray-500 ml-auto">
                              {Math.round(lessonProgress.percent)}%
                            </span>
                          </button>
                        </div>

                        {/* Topics */}
                        {isLessonExpanded && (
                          <div className="ml-4 space-y-1">
                            {lesson.topics.map((topic) => {
                              const topicProgress = getProgressStatus(topic.progress || []);
                              const isTopicExpanded = expandedItems.has(topic.id);
                              
                              return (
                                <div key={topic.id}>
                                  <div className="flex items-center space-x-1 py-1">
                                    <button
                                      onClick={() => toggleExpanded(topic.id)}
                                      className="flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600"
                                    >
                                      <svg 
                                        className={`w-3 h-3 transition-transform ${isTopicExpanded ? 'rotate-90' : ''}`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => navigateToTopic(subject.id, lesson.id, topic.id)}
                                      className="flex items-center space-x-1 hover:bg-gray-100 rounded px-1 py-0.5 flex-1 text-left"
                                    >
                                      <span className={`text-xs ${getProgressColor(topicProgress.status)}`}>
                                        {getProgressIcon(topicProgress.status)}
                                      </span>
                                      <span className="text-xs text-gray-700 truncate">
                                        {topic.name}
                                      </span>
                                      <span className="text-xs text-gray-500 ml-auto">
                                        {Math.round(topicProgress.percent)}%
                                      </span>
                                    </button>
                                  </div>

                                  {/* Subtopics */}
                                  {isTopicExpanded && (
                                    <div className="ml-4 space-y-1">
                                      {topic.subtopics.map((subtopic) => {
                                        const subtopicProgress = getProgressStatus(subtopic.progress || []);
                                        
                                        return (
                                          <div key={subtopic.id} className="flex items-center space-x-1 py-1">
                                            <div className="w-4 h-4"></div>
                                            <button
                                              onClick={() => navigateToSubtopic(subject.id, lesson.id, topic.id, subtopic.id)}
                                              className="flex items-center space-x-1 hover:bg-gray-100 rounded px-1 py-0.5 flex-1 text-left"
                                            >
                                              <span className={`text-xs ${getProgressColor(subtopicProgress.status)}`}>
                                                {getProgressIcon(subtopicProgress.status)}
                                              </span>
                                              <span className="text-xs text-gray-600 truncate">
                                                {subtopic.name}
                                              </span>
                                              <span className="text-xs text-gray-500 ml-auto">
                                                {Math.round(subtopicProgress.percent)}%
                                              </span>
                                            </button>
                                          </div>
                                        );
                                      })}
                                      
                                      {/* Topic Content */}
                                      {topic.lmsContent.map((content) => {
                                        const contentProgress = getProgressStatus(content.progress || []);
                                        
                                        return (
                                          <div key={content.id} className="flex items-center space-x-1 py-1">
                                            <div className="w-4 h-4"></div>
                                            <button
                                              onClick={() => navigateToContent(content.id)}
                                              className="flex items-center space-x-1 hover:bg-blue-50 rounded px-1 py-0.5 flex-1 text-left border-l-2 border-blue-200"
                                            >
                                              <span className={`text-xs ${getProgressColor(contentProgress.status)}`}>
                                                {getProgressIcon(contentProgress.status)}
                                              </span>
                                              <span className="text-xs text-blue-700 truncate">
                                                {content.title}
                                              </span>
                                              <span className="text-xs text-gray-500 ml-auto">
                                                {Math.round(contentProgress.percent)}%
                                              </span>
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                  
                                  {/* Topic Content (if no subtopics) */}
                                  {!isTopicExpanded && topic.lmsContent.length > 0 && (
                                    <div className="ml-4 space-y-1">
                                      {topic.lmsContent.map((content) => {
                                        const contentProgress = getProgressStatus(content.progress || []);
                                        
                                        return (
                                          <div key={content.id} className="flex items-center space-x-1 py-1">
                                            <div className="w-4 h-4"></div>
                                            <button
                                              onClick={() => navigateToContent(content.id)}
                                              className="flex items-center space-x-1 hover:bg-blue-50 rounded px-1 py-0.5 flex-1 text-left border-l-2 border-blue-200"
                                            >
                                              <span className={`text-xs ${getProgressColor(contentProgress.status)}`}>
                                                {getProgressIcon(contentProgress.status)}
                                              </span>
                                              <span className="text-xs text-blue-700 truncate">
                                                {content.title}
                                              </span>
                                              <span className="text-xs text-gray-500 ml-auto">
                                                {Math.round(contentProgress.percent)}%
                                              </span>
                                            </button>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        {/* Lesson Content (if no topics) */}
                        {!isLessonExpanded && lesson.lmsContent.length > 0 && (
                          <div className="ml-4 space-y-1">
                            {lesson.lmsContent.map((content) => {
                              const contentProgress = getProgressStatus(content.progress || []);
                              
                              return (
                                <div key={content.id} className="flex items-center space-x-1 py-1">
                                  <div className="w-4 h-4"></div>
                                  <button
                                    onClick={() => navigateToContent(content.id)}
                                    className="flex items-center space-x-1 hover:bg-blue-50 rounded px-1 py-0.5 flex-1 text-left border-l-2 border-blue-200"
                                  >
                                    <span className={`text-xs ${getProgressColor(contentProgress.status)}`}>
                                      {getProgressIcon(contentProgress.status)}
                                    </span>
                                    <span className="text-xs text-blue-700 truncate">
                                      {content.title}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-auto">
                                      {Math.round(contentProgress.percent)}%
                                    </span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Subject Content (if no lessons) */}
              {!isSubjectExpanded && subject.lmsContent.length > 0 && (
                <div className="ml-4 space-y-1">
                  {subject.lmsContent.map((content) => {
                    const contentProgress = getProgressStatus(content.progress || []);
                    
                    return (
                      <div key={content.id} className="flex items-center space-x-1 py-1">
                        <div className="w-4 h-4"></div>
                        <button
                          onClick={() => navigateToContent(content.id)}
                          className="flex items-center space-x-1 hover:bg-blue-50 rounded px-1 py-0.5 flex-1 text-left border-l-2 border-blue-200"
                        >
                          <span className={`text-xs ${getProgressColor(contentProgress.status)}`}>
                            {getProgressIcon(contentProgress.status)}
                          </span>
                          <span className="text-xs text-blue-700 truncate">
                            {content.title}
                          </span>
                          <span className="text-xs text-gray-500 ml-auto">
                            {Math.round(contentProgress.percent)}%
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
