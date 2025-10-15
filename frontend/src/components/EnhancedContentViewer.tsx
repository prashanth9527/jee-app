'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Play, 
  Clock, 
  CheckCircle,
  GraduationCap,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import ContentLearningPanel from './ContentLearningPanel';
import api from '@/lib/api';

interface Content {
  id: string;
  title: string;
  description?: string;
  contentType: string;
  contentData?: any;
  fileUrl?: string;
  externalUrl?: string;
  youtubeId?: string;
  duration?: number;
  difficulty?: string;
  progress?: {
    status: string;
    progress: number;
    completedAt?: string;
  }[];
}

interface EnhancedContentViewerProps {
  content: Content;
  onContentComplete?: (contentId: string) => void;
  onExamStart?: (examId: string) => void;
}

export default function EnhancedContentViewer({ 
  content, 
  onContentComplete,
  onExamStart 
}: EnhancedContentViewerProps) {
  const [showLearningPanel, setShowLearningPanel] = useState(false);
  const [contentProgress, setContentProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (content.progress && content.progress.length > 0) {
      const progress = content.progress[0];
      setContentProgress(progress.progress);
      setIsCompleted(progress.status === 'COMPLETED');
    }
    
    // Start tracking time when component mounts
    setStartTime(new Date());
    
    // Update time spent every minute
    const interval = setInterval(() => {
      if (startTime) {
        setTimeSpent(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [content.progress, startTime]);

  const updateProgress = async (progress: number) => {
    try {
      await api.post(`/student/lms/content/${content.id}/progress`, { progress });
      setContentProgress(progress);
      
      if (progress >= 100 && !isCompleted) {
        setIsCompleted(true);
        if (onContentComplete) {
          onContentComplete(content.id);
        }
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const renderContent = () => {
    switch (content.contentType) {
      case 'TEXT':
        return (
          <div className="prose max-w-none">
            <div dangerouslySetInnerHTML={{ __html: content.contentData?.html || content.description || '' }} />
          </div>
        );
      
      case 'VIDEO':
        return (
          <div className="aspect-video">
            {content.youtubeId ? (
              <iframe
                src={`https://www.youtube.com/embed/${content.youtubeId}`}
                className="w-full h-full rounded-lg"
                allowFullScreen
              />
            ) : content.fileUrl ? (
              <video
                src={content.fileUrl}
                controls
                className="w-full h-full rounded-lg"
                onEnded={() => updateProgress(100)}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">Video content not available</p>
              </div>
            )}
          </div>
        );
      
      case 'FILE':
        return (
            <div className="text-center py-8">
              <BookOpen className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Document Available</h3>
              <p className="text-gray-600 mb-4">Click to download and view the document</p>
              <a
                href={content.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Download Document
              </a>
            </div>
        );
      
      case 'URL':
        return (
          <div className="text-center py-8">
            <Play className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">External Content</h3>
            <p className="text-gray-600 mb-4">Click to open the external resource</p>
            <a
              href={content.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Open Content
            </a>
          </div>
        );
      
      default:
        return (
          <div className="text-center py-8">
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Content type not supported in preview</p>
          </div>
        );
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Content Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{content.title}</h1>
              {content.description && (
                <p className="text-gray-600 mt-1">{content.description}</p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {content.duration && (
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {Math.floor(content.duration / 60)} min
                </div>
              )}
              {content.difficulty && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  content.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                  content.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {content.difficulty}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">{contentProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${contentProgress}%` }}
            />
          </div>
          {isCompleted && (
            <div className="flex items-center mt-2 text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-sm font-medium">Completed</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Learning Tools Sidebar */}
        <div className="space-y-6">
          {/* Learning Panel Toggle */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4">
              <button
                onClick={() => setShowLearningPanel(!showLearningPanel)}
                className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="font-medium text-blue-900">Learning Tools</span>
                </div>
                {showLearningPanel ? (
                  <ArrowLeft className="h-4 w-4 text-blue-600" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-blue-600" />
                )}
              </button>
            </div>
          </div>

          {/* Time Tracking */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Time Spent
              </h3>
              <div className="text-2xl font-bold text-blue-600">
                {formatTime(timeSpent)}
              </div>
              <p className="text-sm text-gray-500 mt-1">Active learning time</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => updateProgress(Math.min(contentProgress + 25, 100))}
                  className="w-full text-left px-3 py-2 text-sm bg-green-50 hover:bg-green-100 rounded-md text-green-700"
                >
                  Mark 25% Complete
                </button>
                <button
                  onClick={() => updateProgress(Math.min(contentProgress + 50, 100))}
                  className="w-full text-left px-3 py-2 text-sm bg-blue-50 hover:bg-blue-100 rounded-md text-blue-700"
                >
                  Mark 50% Complete
                </button>
                <button
                  onClick={() => updateProgress(100)}
                  className="w-full text-left px-3 py-2 text-sm bg-purple-50 hover:bg-purple-100 rounded-md text-purple-700"
                >
                  Mark Complete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Panel */}
      {showLearningPanel && (
        <div className="mt-6">
          <ContentLearningPanel
            contentId={content.id}
            contentTitle={content.title}
            onExamCreated={onExamStart}
          />
        </div>
      )}
    </div>
  );
}
