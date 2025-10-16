'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';
import ContentSummarySidebar from '@/components/ContentSummarySidebar';
import ContentLearningPanel from '@/components/ContentLearningPanel';
import Swal from 'sweetalert2';
import { ChevronRight, ChevronDown, Brain } from 'lucide-react';

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

export default function StudentLMSPage() {
  const router = useRouter();
  const [hierarchy, setHierarchy] = useState<SubjectHierarchy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<LearningContent | null>(null);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const [allContentList, setAllContentList] = useState<LearningContent[]>([]);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [summarySidebarVisible, setSummarySidebarVisible] = useState(false);
  const [learningSidebarVisible, setLearningSidebarVisible] = useState(false);
  const [resumingSubject, setResumingSubject] = useState<string | null>(null);

  // Toggle logic: when summary sidebar opens, collapse left sidebar
  useEffect(() => {
    if (summarySidebarVisible && sidebarVisible) {
      setSidebarVisible(false);
    }
  }, [summarySidebarVisible]);

  useEffect(() => {
    loadHierarchy();
  }, []);

  // Keyboard navigation and shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!selectedContent) return;
      
      // Arrow keys for navigation
      if (e.key === 'ArrowLeft' && canNavigatePrevious()) {
        navigateToPrevious();
      } else if (e.key === 'ArrowRight' && canNavigateNext()) {
        navigateToNext();
      }
      // F key for fullscreen toggle
      else if (e.key === 'f' || e.key === 'F') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          toggleFullscreen();
        }
      }
      // S key for sidebar toggle
      else if (e.key === 's' || e.key === 'S') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setSidebarVisible(prev => !prev);
        }
      }
      // M key for summary sidebar toggle
      else if (e.key === 'm' || e.key === 'M') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setSummarySidebarVisible(prev => !prev);
        }
      }
      // L key for learning tools sidebar toggle
      else if (e.key === 'l' || e.key === 'L') {
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          setLearningSidebarVisible(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedContent, selectedContentId, allContentList, isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(prev => !prev);
  };

  const loadHierarchy = async () => {
    try {
      setLoading(true);
      const response = await api.get('/student/lms/hierarchy');
      setHierarchy(response.data);
      
      // Build flat list of all content for navigation
      const contentList: LearningContent[] = [];
      response.data.forEach((subject: SubjectHierarchy) => {
        subject.lessons.forEach((lesson) => {
          lesson.topics.forEach((topic) => {
            topic.subtopics.forEach((subtopic) => {
              contentList.push(...subtopic.lmsContent);
            });
            contentList.push(...topic.lmsContent);
          });
          contentList.push(...lesson.lmsContent);
        });
        contentList.push(...subject.lmsContent);
      });
      setAllContentList(contentList);
      
      // Auto-expand first subject
      if (response.data.length > 0) {
        setExpandedItems(new Set([response.data[0].id]));
      }
    } catch (error: any) {
      console.error('Error loading hierarchy:', error);
      
      let errorMessage = 'Failed to load learning hierarchy';
      if (error.response?.status === 403) {
        errorMessage = 'You do not have access to learning content. Please contact your administrator to assign you to a stream.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Content',
        text: errorMessage,
        confirmButtonText: 'Retry',
        showCancelButton: true,
        cancelButtonText: 'Go to Dashboard'
      }).then((result) => {
        if (result.isConfirmed) {
          loadHierarchy();
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          router.push('/student');
        }
      });
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

  const handleContentSelect = async (contentId: string) => {
    try {
      setSelectedContentId(contentId);
      setLoadingContent(true);
      const response = await api.get(`/student/lms/content/${contentId}`);
      setSelectedContent(response.data);
    } catch (error) {
      console.error('Error loading content:', error);
      Swal.fire('Error', 'Failed to load content', 'error');
    } finally {
      setLoadingContent(false);
    }
  };

  const startLearning = (contentId: string) => {
    router.push(`/student/lms/learn/${contentId}`);
  };

  const markAsComplete = async () => {
    if (!selectedContent || updatingProgress) return;
    try {
      setUpdatingProgress(true);
      await api.post(`/student/lms/content/${selectedContent.id}/progress`, null, {
        params: {
          status: 'COMPLETED',
          progressPercent: '100'
        }
      });
      
      // Update local state without reloading
      setSelectedContent(prev => prev ? {
        ...prev,
        progress: [{
          id: prev.progress?.[0]?.id || '',
          status: 'COMPLETED',
          progress: 100,
          completedAt: new Date().toISOString()
        }]
      } : null);

      // Update the content in allContentList
      setAllContentList(prev => prev.map(item => 
        item.id === selectedContent.id 
          ? { ...item, progress: [{ id: item.progress?.[0]?.id || '', status: 'COMPLETED', progress: 100, completedAt: new Date().toISOString() }] }
          : item
      ));

      // Update hierarchy in background without causing reload
      updateHierarchyProgress(selectedContent.id, 'COMPLETED', 100);
      
      // Show success toast with celebration
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: '🎉 Marked as completed!',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#f0fdf4',
        iconColor: '#22c55e'
      });

      // Check if all content is completed for extra celebration
      const updatedProgress = getOverallProgress();
      if (updatedProgress.completed === updatedProgress.total && updatedProgress.total > 0) {
        setTimeout(() => {
          Swal.fire({
            title: '🎊 Congratulations!',
            html: '<p class="text-lg">You have completed all learning content!</p><p class="text-sm text-gray-600 mt-2">Amazing work! Keep up the great learning journey.</p>',
            icon: 'success',
            confirmButtonText: 'Awesome!',
            confirmButtonColor: '#22c55e',
            timer: 5000
          });
        }, 2500);
      }
    } catch (error) {
      console.error('Error marking as complete:', error);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Failed to update progress',
        showConfirmButton: false,
        timer: 2000
      });
    } finally {
      setUpdatingProgress(false);
    }
  };

  const markAsRevisit = async () => {
    if (!selectedContent || updatingProgress) return;
    try {
      setUpdatingProgress(true);
      // Set progress to 75% when marking for revisit (indicates needs review, not complete)
      const revisitProgress = 75;
      
      await api.post(`/student/lms/content/${selectedContent.id}/progress`, null, {
        params: {
          status: 'REVISIT',
          progressPercent: revisitProgress.toString()
        }
      });
      
      // Update local state without reloading
      setSelectedContent(prev => prev ? {
        ...prev,
        progress: [{
          id: prev.progress?.[0]?.id || '',
          status: 'REVISIT',
          progress: revisitProgress,
          completedAt: prev.progress?.[0]?.completedAt
        }]
      } : null);

      // Update the content in allContentList
      setAllContentList(prev => prev.map(item => 
        item.id === selectedContent.id 
          ? { ...item, progress: [{ id: item.progress?.[0]?.id || '', status: 'REVISIT', progress: revisitProgress, completedAt: item.progress?.[0]?.completedAt }] }
          : item
      ));

      // Update hierarchy in background without causing reload
      updateHierarchyProgress(selectedContent.id, 'REVISIT', revisitProgress);
      
      // Show success toast
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'success',
        title: 'Marked for revisit!',
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true
      });
    } catch (error) {
      console.error('Error marking as revisit:', error);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Failed to update progress',
        showConfirmButton: false,
        timer: 2000
      });
    } finally {
      setUpdatingProgress(false);
    }
  };

  const updateHierarchyProgress = (contentId: string, status: string, progress: number) => {
    setHierarchy(prevHierarchy => {
      return prevHierarchy.map(subject => ({
        ...subject,
        lessons: subject.lessons.map(lesson => ({
          ...lesson,
          topics: lesson.topics.map(topic => ({
            ...topic,
            subtopics: topic.subtopics.map(subtopic => ({
              ...subtopic,
              lmsContent: subtopic.lmsContent.map(content =>
                content.id === contentId
                  ? { ...content, progress: [{ id: content.progress?.[0]?.id || '', status, progress, completedAt: content.progress?.[0]?.completedAt }] }
                  : content
              )
            })),
            lmsContent: topic.lmsContent.map(content =>
              content.id === contentId
                ? { ...content, progress: [{ id: content.progress?.[0]?.id || '', status, progress, completedAt: content.progress?.[0]?.completedAt }] }
                : content
            )
          })),
          lmsContent: lesson.lmsContent.map(content =>
            content.id === contentId
              ? { ...content, progress: [{ id: content.progress?.[0]?.id || '', status, progress, completedAt: content.progress?.[0]?.completedAt }] }
              : content
          )
        })),
        lmsContent: subject.lmsContent.map(content =>
          content.id === contentId
            ? { ...content, progress: [{ id: content.progress?.[0]?.id || '', status, progress, completedAt: content.progress?.[0]?.completedAt }] }
            : content
        )
      }));
    });
  };

  const navigateToPrevious = () => {
    if (!selectedContentId || allContentList.length === 0) return;
    const currentIndex = allContentList.findIndex(c => c.id === selectedContentId);
    if (currentIndex > 0) {
      handleContentSelect(allContentList[currentIndex - 1].id);
    }
  };

  const navigateToNext = () => {
    if (!selectedContentId || allContentList.length === 0) return;
    const currentIndex = allContentList.findIndex(c => c.id === selectedContentId);
    if (currentIndex < allContentList.length - 1) {
      handleContentSelect(allContentList[currentIndex + 1].id);
    }
  };

  const canNavigatePrevious = () => {
    if (!selectedContentId || allContentList.length === 0) return false;
    const currentIndex = allContentList.findIndex(c => c.id === selectedContentId);
    return currentIndex > 0;
  };

  const canNavigateNext = () => {
    if (!selectedContentId || allContentList.length === 0) return false;
    const currentIndex = allContentList.findIndex(c => c.id === selectedContentId);
    return currentIndex < allContentList.length - 1;
  };

  const getOverallProgress = () => {
    if (allContentList.length === 0) return { completed: 0, total: 0, percentage: 0 };
    
    const completed = allContentList.filter(content => 
      content.progress && content.progress.length > 0 && content.progress[0].status === 'COMPLETED'
    ).length;
    
    const total = allContentList.length;
    const percentage = Math.round((completed / total) * 100);
    
    return { completed, total, percentage };
  };

  const getFilteredHierarchy = () => {
    if (!selectedSubjectId) return hierarchy;
    return hierarchy.filter(subject => subject.id === selectedSubjectId);
  };

  const searchInHierarchy = (query: string) => {
    if (!query.trim()) return;
    
    const lowerQuery = query.toLowerCase();
    const itemsToExpand = new Set<string>();
    const filtered = getFilteredHierarchy();

    filtered.forEach(subject => {
      let subjectMatches = false;

      subject.lessons.forEach(lesson => {
        let lessonMatches = false;

        if (lesson.name.toLowerCase().includes(lowerQuery)) {
          lessonMatches = true;
          itemsToExpand.add(subject.id);
        }

        lesson.topics.forEach(topic => {
          let topicMatches = false;

          if (topic.name.toLowerCase().includes(lowerQuery)) {
            topicMatches = true;
            itemsToExpand.add(subject.id);
            itemsToExpand.add(lesson.id);
          }

          topic.subtopics.forEach(subtopic => {
            if (subtopic.name.toLowerCase().includes(lowerQuery)) {
              itemsToExpand.add(subject.id);
              itemsToExpand.add(lesson.id);
              itemsToExpand.add(topic.id);
            }
          });

          topic.lmsContent.forEach(content => {
            if (content.title.toLowerCase().includes(lowerQuery)) {
              itemsToExpand.add(subject.id);
              itemsToExpand.add(lesson.id);
              itemsToExpand.add(topic.id);
            }
          });
        });
      });
    });

    setExpandedItems(itemsToExpand);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim()) {
      searchInHierarchy(query);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setExpandedItems(new Set());
  };

  const handleSubjectSelect = (subjectId: string) => {
    setSelectedSubjectId(subjectId);
    setSelectedContent(null);
    setSelectedContentId(null);
  };

  const handleBackToSubjects = () => {
    setSelectedSubjectId(null);
    setSelectedContent(null);
    setSelectedContentId(null);
  };

  const handleResumeLearning = async (subjectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setResumingSubject(subjectId);
      const response = await api.get(`/student/lms/resume/${subjectId}`);
      
      if (response.data) {
        // Navigate directly to the learning page
        router.push(`/student/lms/learn/${response.data.id}`);
      } else {
        // If no content found, just open the subject
        handleSubjectSelect(subjectId);
      }
    } catch (error) {
      console.error('Error resuming learning:', error);
      Swal.fire('Error', 'Failed to resume learning', 'error');
      // Fallback to opening subject
      handleSubjectSelect(subjectId);
    } finally {
      setResumingSubject(null);
    }
  };

  const calculateItemProgress = (
    item: SubjectHierarchy | LessonHierarchy | TopicHierarchy | SubtopicHierarchy,
    type: 'subject' | 'lesson' | 'topic' | 'subtopic'
  ): { completed: number; total: number; percentage: number } => {
    let allContent: LearningContent[] = [];

    if (type === 'subject') {
      const subject = item as SubjectHierarchy;
      subject.lessons.forEach(lesson => {
        lesson.topics.forEach(topic => {
          topic.subtopics.forEach(subtopic => {
            allContent.push(...subtopic.lmsContent);
          });
          allContent.push(...topic.lmsContent);
        });
        allContent.push(...lesson.lmsContent);
      });
      allContent.push(...subject.lmsContent);
    } else if (type === 'lesson') {
      const lesson = item as LessonHierarchy;
      lesson.topics.forEach(topic => {
        topic.subtopics.forEach(subtopic => {
          allContent.push(...subtopic.lmsContent);
        });
        allContent.push(...topic.lmsContent);
      });
      allContent.push(...lesson.lmsContent);
    } else if (type === 'topic') {
      const topic = item as TopicHierarchy;
      topic.subtopics.forEach(subtopic => {
        allContent.push(...subtopic.lmsContent);
      });
      allContent.push(...topic.lmsContent);
    } else if (type === 'subtopic') {
      const subtopic = item as SubtopicHierarchy;
      allContent.push(...subtopic.lmsContent);
    }

    const total = allContent.length;
    const completed = allContent.filter(content =>
      content.progress && content.progress.length > 0 && content.progress[0].status === 'COMPLETED'
    ).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { completed, total, percentage };
  };

  const renderContentByType = () => {
    if (!selectedContent) return null;

    switch (selectedContent.contentType) {
      case 'VIDEO':
        return (
          <div className="space-y-4">
            {selectedContent.youtubeId ? (
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${selectedContent.youtubeId}`}
                  className="w-full h-full"
                  allowFullScreen
                  title={selectedContent.title}
                />
              </div>
            ) : selectedContent.fileUrl ? (
              <video
                controls
                className="w-full rounded-lg"
              >
                <source src={selectedContent.fileUrl} type="video/mp4" />
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
            {selectedContent.fileUrl ? (
              <iframe
                src={selectedContent.fileUrl}
                className="w-full h-[600px] border rounded-lg"
                title={selectedContent.title}
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
            {selectedContent.fileUrl ? (
              <div className="bg-gray-100 p-8 rounded-lg">
                <audio controls className="w-full">
                  <source src={selectedContent.fileUrl} type="audio/mpeg" />
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
            {selectedContent.externalUrl ? (
              <iframe
                src={selectedContent.externalUrl}
                className="w-full h-[600px] border rounded-lg"
                title={selectedContent.title}
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
            {selectedContent.contentData?.htmlContent ? (
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: selectedContent.contentData.htmlContent }}
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

  const getContentTypeIcon = (contentType: string) => {
    switch (contentType) {
      case 'VIDEO': return '🎥';
      case 'DOCUMENT': return '📄';
      case 'AUDIO': return '🎵';
      case 'INTERACTIVE': return '🎮';
      case 'QUIZ': return '❓';
      case 'TEXT': return '📝';
      default: return '📚';
    }
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

  // Render tree structure for left sidebar
  const renderTreeItem = (
    item: SubjectHierarchy | LessonHierarchy | TopicHierarchy | SubtopicHierarchy | LearningContent,
    level: number,
    type: 'subject' | 'lesson' | 'topic' | 'subtopic' | 'content',
    parentIds?: { subjectId?: string; lessonId?: string; topicId?: string }
  ) => {
    const itemProgress = type === 'content' 
      ? getProgressStatus((item as any).progress || [])
      : { status: 'NOT_STARTED', percent: 0 };
    
    const calculatedProgress = type !== 'content' 
      ? calculateItemProgress(item as any, type)
      : null;
    
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = 
      (type === 'subject' && (item as SubjectHierarchy).lessons.length > 0) ||
      (type === 'lesson' && (item as LessonHierarchy).topics.length > 0) ||
      (type === 'topic' && ((item as TopicHierarchy).subtopics.length > 0 || (item as TopicHierarchy).lmsContent.length > 0)) ||
      (type === 'subtopic' && (item as SubtopicHierarchy).lmsContent.length > 0);
    
    // Check if item matches search query
    const itemName = type === 'content' ? (item as LearningContent).title : (item as any).name;
    const matchesSearch = searchQuery.trim() && itemName.toLowerCase().includes(searchQuery.toLowerCase());

    return (
      <div key={item.id}>
        <div 
          className={`flex items-center space-x-2 py-2 px-2 rounded cursor-pointer hover:bg-gray-100 ${
            type === 'content' && selectedContentId === item.id ? 'bg-blue-50 border-l-4 border-blue-600' : 
            matchesSearch ? 'bg-yellow-50 border-l-2 border-yellow-400' : ''
          }`}
          style={{ paddingLeft: `${level * 16}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(item.id);
              }}
              className="flex-shrink-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4" />}
          
          <button
            onClick={() => {
              if (type === 'content') {
                handleContentSelect(item.id);
              } else if (hasChildren) {
                toggleExpanded(item.id);
              }
            }}
            className="flex items-center space-x-2 flex-1 text-left min-w-0"
          >
            {type === 'content' ? (
              <>
                <span className={`text-sm ${getProgressColor(itemProgress.status)}`}>
                  {getProgressIcon(itemProgress.status)}
                </span>
                <span className="text-sm text-blue-700 truncate flex-1">
                  {(item as LearningContent).title}
                </span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {Math.round(itemProgress.percent)}%
                </span>
              </>
            ) : (
              <>
                <span className={`text-sm flex-shrink-0 ${
                  calculatedProgress && calculatedProgress.percentage === 100 ? 'text-green-600' :
                  calculatedProgress && calculatedProgress.percentage > 0 ? 'text-blue-600' :
                  'text-gray-400'
                }`}>
                  {calculatedProgress && calculatedProgress.percentage === 100 ? '✓' :
                   calculatedProgress && calculatedProgress.percentage > 0 ? '▶' :
                   '○'}
                </span>
                <span className={`text-sm truncate flex-1 ${
                  type === 'subject' ? 'font-bold text-gray-900' :
                  type === 'lesson' ? 'font-semibold text-gray-800' :
                  type === 'topic' ? 'font-medium text-gray-700' :
                  'text-gray-600'
                }`}>
                  {(item as any).name}
                </span>
                {calculatedProgress && calculatedProgress.total > 0 && (
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    <span className={`text-xs font-medium ${
                      calculatedProgress.percentage === 100 ? 'text-green-600' :
                      calculatedProgress.percentage > 0 ? 'text-blue-600' :
                      'text-gray-500'
                    }`}>
                      {calculatedProgress.completed}/{calculatedProgress.total}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({calculatedProgress.percentage}%)
                    </span>
                  </div>
                )}
              </>
            )}
          </button>
        </div>

        {/* Render children */}
        {isExpanded && (
          <>
            {type === 'subject' && (item as SubjectHierarchy).lessons.map(lesson =>
              renderTreeItem(lesson, level + 1, 'lesson', { subjectId: item.id })
            )}
            {type === 'lesson' && (item as LessonHierarchy).topics.map(topic =>
              renderTreeItem(topic, level + 1, 'topic', { ...parentIds, lessonId: item.id })
            )}
            {type === 'topic' && (
              <>
                {(item as TopicHierarchy).subtopics.map(subtopic =>
                  renderTreeItem(subtopic, level + 1, 'subtopic', { ...parentIds, topicId: item.id })
                )}
                {(item as TopicHierarchy).lmsContent.map(content =>
                  renderTreeItem(content, level + 1, 'content', { ...parentIds, topicId: item.id })
                )}
              </>
            )}
            {type === 'subtopic' && (item as SubtopicHierarchy).lmsContent.map(content =>
              renderTreeItem(content, level + 1, 'content', parentIds)
            )}
          </>
        )}
      </div>
    );
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

  // Render subject selection cards
  if (!selectedSubjectId) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <StudentLayout>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Learning Management</h1>
                <p className="text-gray-600 mt-1">Select a subject to start learning</p>
              </div>
            </div>

            {/* Overall Progress Card */}
            {allContentList.length > 0 && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold mb-1">Overall Progress</h2>
                    <p className="text-blue-100">Track your learning journey across all subjects</p>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-bold">{getOverallProgress().percentage}%</div>
                    <p className="text-sm text-blue-100 mt-1">
                      {getOverallProgress().completed} of {getOverallProgress().total} completed
                    </p>
                  </div>
                </div>
                <div className="mt-4 w-full bg-white/20 rounded-full h-3">
                  <div
                    className="bg-white h-3 rounded-full transition-all duration-500"
                    style={{ width: `${getOverallProgress().percentage}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Subject Cards */}
            {hierarchy.length === 0 ? (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">📚</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Subjects Available</h3>
                  <p className="text-gray-600 mb-4">
                    There are no learning subjects available for your stream yet. Please contact your administrator or check back later.
                  </p>
                  <button
                    onClick={() => loadHierarchy()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {hierarchy.map((subject) => {
                const progress = calculateItemProgress(subject, 'subject');
                return (
                  <div
                    key={subject.id}
                    onClick={() => handleSubjectSelect(subject.id)}
                    className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-500 overflow-hidden group"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {subject.name}
                        </h3>
                        <span className={`flex-shrink-0 text-2xl ${
                          progress.percentage === 100 ? 'text-green-600' :
                          progress.percentage > 0 ? 'text-blue-600' :
                          'text-gray-400'
                        }`}>
                          {progress.percentage === 100 ? '✓' :
                           progress.percentage > 0 ? '▶' :
                           '○'}
                        </span>
                      </div>

                      {subject.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{subject.description}</p>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-semibold text-gray-900">
                            {progress.completed} / {progress.total} completed
                          </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              progress.percentage === 100 ? 'bg-gradient-to-r from-green-500 to-green-600' :
                              progress.percentage > 0 ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                              'bg-gray-300'
                            }`}
                            style={{ width: `${progress.percentage}%` }}
                          ></div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-semibold ${
                            progress.percentage === 100 ? 'text-green-600' :
                            progress.percentage > 0 ? 'text-blue-600' :
                            'text-gray-500'
                          }`}>
                            {progress.percentage}% Complete
                          </span>
                          <span className="text-sm text-gray-500">
                            {subject.lessons.length} lessons
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 px-6 py-3 border-t border-gray-100">
                      <div className="flex items-center justify-between gap-2">
                        {progress.percentage > 0 && progress.percentage < 100 ? (
                          <>
                            <button 
                              onClick={(e) => handleResumeLearning(subject.id, e)}
                              disabled={resumingSubject === subject.id}
                              className="flex-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {resumingSubject === subject.id ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  <span>Loading...</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Resume</span>
                                </>
                              )}
                            </button>
                            <button 
                              onClick={() => handleSubjectSelect(subject.id)}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-2 flex items-center"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                              </svg>
                            </button>
                          </>
                        ) : (
                          <button className="text-sm font-medium text-blue-600 group-hover:text-blue-700 flex items-center">
                            <span>{progress.percentage === 100 ? 'Review Content' : 'Start Learning'}</span>
                            <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        )}
                      </div>
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

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentLayout>
        <div className={`flex bg-gray-50 ${isFullscreen ? 'fixed inset-0 z-50' : 'h-[calc(100vh-200px)] max-h-[calc(100vh-200px)]'}`}>
          {/* Left Sidebar - Tree Structure */}
          <div className={`bg-white shadow-lg border-r border-gray-200 transition-all duration-300 ${
            sidebarVisible ? 'w-80' : 'w-0'
          } h-full overflow-hidden`}>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Back to Subjects Button */}
                  <button
                    onClick={handleBackToSubjects}
                    className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-3 text-sm font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back to Subjects</span>
                  </button>

                  <h2 className="text-lg font-semibold text-gray-900">
                    {getFilteredHierarchy()[0]?.name || 'Learning Path'}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Navigate through your courses</p>
                  
                  {/* Search Box */}
                  <div className="mt-3 relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={handleSearch}
                      placeholder="Search lessons, topics..."
                      className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {searchQuery ? (
                      <button
                        onClick={clearSearch}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    ) : (
                      <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Subject Progress */}
                  {getFilteredHierarchy().length > 0 && (
                    <div className="mt-3">
                      {(() => {
                        const subjectProgress = calculateItemProgress(getFilteredHierarchy()[0], 'subject');
                        return (
                          <>
                            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                              <span>Subject Progress</span>
                              <span className="font-semibold">{subjectProgress.completed} / {subjectProgress.total}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${subjectProgress.percentage}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{subjectProgress.percentage}% Complete</p>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="p-2">
              {getFilteredHierarchy().length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">No learning content available</p>
              ) : (
                getFilteredHierarchy().map(subject => renderTreeItem(subject, 0, 'subject'))
              )}
            </div>
          </div>

          {/* Right Content Area */}
          <div className="flex-1 p-6 relative h-full overflow-hidden">
            {/* Floating Sidebar Toggle Button (when sidebar is hidden) */}
            {!sidebarVisible && (
              <button
                onClick={() => setSidebarVisible(true)}
                className="fixed left-4 top-24 z-40 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 hover:scale-110"
                title="Show sidebar (S)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            )}


            {loadingContent ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-4 text-sm text-gray-600">Loading content...</p>
                </div>
              </div>
            ) : !selectedContent ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No content selected</h3>
                  <p className="mt-1 text-sm text-gray-500">Select a content item from the tree to view details</p>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg">
                {/* Header with Title and Action Buttons */}
                <div className="border-b border-gray-200 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {/* Sidebar Toggle Button */}
                      <button
                        onClick={() => setSidebarVisible(!sidebarVisible)}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title={sidebarVisible ? "Hide sidebar (S)" : "Show sidebar (S)"}
                      >
                        {sidebarVisible ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                          </svg>
                        )}
                      </button>

                      <div className="flex-1">
                        <h1 className="text-2xl font-bold text-gray-900">{selectedContent.title}</h1>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>{selectedContent.subject.name}</span>
                          {selectedContent.lesson && <span>• {selectedContent.lesson.name}</span>}
                          {selectedContent.topic && <span>• {selectedContent.topic.name}</span>}
                          {selectedContent.subtopic && <span>• {selectedContent.subtopic.name}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-3 ml-4">
                      {/* Fullscreen Toggle Button */}
                      <button
                        onClick={toggleFullscreen}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title={isFullscreen ? "Exit fullscreen (F)" : "Enter fullscreen (F)"}
                      >
                        {isFullscreen ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                          </svg>
                        )}
                      </button>
                      
                      {/* Learning Tools Button */}
                      <button
                        onClick={() => setLearningSidebarVisible(!learningSidebarVisible)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center space-x-2"
                        title="Toggle Learning Tools (L)"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>Learning Tools</span>
                      </button>
                      
                      {/* AI Summary Button */}
                      <button
                        onClick={() => setSummarySidebarVisible(!summarySidebarVisible)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm flex items-center space-x-2"
                        title="Toggle AI Summary (M)"
                      >
                        <Brain className="w-4 h-4" />
                        <span>AI Summary</span>
                      </button>
                      
                      <button
                        onClick={markAsComplete}
                        disabled={updatingProgress}
                        className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center space-x-2 ${
                          updatingProgress ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {updatingProgress ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Updating...</span>
                          </>
                        ) : (
                          <span>Mark as Complete</span>
                        )}
                      </button>
                      <button
                        onClick={markAsRevisit}
                        disabled={updatingProgress}
                        className={`px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium text-sm ${
                          updatingProgress ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        Mark as Revisit
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar and Status */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">Progress</span>
                        {selectedContent.progress && selectedContent.progress.length > 0 && selectedContent.progress[0].status === 'COMPLETED' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Completed
                          </span>
                        )}
                        {selectedContent.progress && selectedContent.progress.length > 0 && selectedContent.progress[0].status === 'REVISIT' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                            </svg>
                            Revisit
                          </span>
                        )}
                        {selectedContent.progress && selectedContent.progress.length > 0 && selectedContent.progress[0].status === 'IN_PROGRESS' && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                            <svg className="w-3 h-3 mr-1 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                            In Progress
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedContent.progress && selectedContent.progress.length > 0 
                          ? `${Math.round(selectedContent.progress[0].progress || 0)}%`
                          : '0%'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          selectedContent.progress && selectedContent.progress.length > 0 && selectedContent.progress[0].status === 'COMPLETED'
                            ? 'bg-gradient-to-r from-green-500 to-green-600'
                            : selectedContent.progress && selectedContent.progress.length > 0 && selectedContent.progress[0].status === 'REVISIT'
                            ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600'
                        }`}
                        style={{ 
                          width: `${selectedContent.progress && selectedContent.progress.length > 0 
                            ? selectedContent.progress[0].progress || 0 
                            : 0}%` 
                        }}
                      >
                        {selectedContent.progress && selectedContent.progress.length > 0 && selectedContent.progress[0].progress >= 100 && (
                          <div className="h-full flex items-center justify-end pr-2">
                            <svg className="w-4 h-4 text-white animate-bounce" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content Area */}
                <div className="p-6">
                  {selectedContent.description && (
                    <div className="mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
                      <p className="text-gray-600">{selectedContent.description}</p>
                    </div>
                  )}

                  {/* Render Content Based on Type */}
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>
                    {renderContentByType()}
                  </div>


                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <button
                      onClick={navigateToPrevious}
                      disabled={!canNavigatePrevious()}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                        canNavigatePrevious()
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Previous</span>
                    </button>

                    <div className="text-sm text-gray-600">
                      {allContentList.length > 0 && selectedContentId && (
                        <span>
                          {allContentList.findIndex(c => c.id === selectedContentId) + 1} of {allContentList.length}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={navigateToNext}
                      disabled={!canNavigateNext()}
                      className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                        canNavigateNext()
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Next</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Keyboard Shortcuts Help */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">←</kbd>
                        <span>Previous</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">→</kbd>
                        <span>Next</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">S</kbd>
                        <span>Sidebar</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">L</kbd>
                        <span>Learning Tools</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">M</kbd>
                        <span>AI Summary</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded">F</kbd>
                        <span>Fullscreen</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content Summary Sidebar */}
        <ContentSummarySidebar
          contentId={selectedContentId}
          isVisible={summarySidebarVisible}
          onClose={() => setSummarySidebarVisible(false)}
        />

                    {/* Learning Tools Sidebar */}
                    {selectedContent && (
                      <div className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-white shadow-2xl border-l border-gray-200 transform transition-transform duration-300 z-50 overflow-hidden ${
                        learningSidebarVisible ? 'translate-x-0' : 'translate-x-full'
                      }`}>
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Learning Tools</h3>
                <button
                  onClick={() => setLearningSidebarVisible(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1">
                <ContentLearningPanel
                  contentId={selectedContent.id}
                  contentTitle={selectedContent.title}
                  onExamCreated={(examId) => {
                    console.log('Exam created:', examId);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </StudentLayout>
    </ProtectedRoute>
  );
}
