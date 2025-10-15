'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';
import EnhancedContentViewer from '@/components/EnhancedContentViewer';
import InlineExamModal from '@/components/InlineExamModal';
import { 
  BookOpen, 
  Play, 
  CheckCircle,
  ArrowLeft,
  GraduationCap
} from 'lucide-react';

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
  subject?: {
    id: string;
    name: string;
  };
  topic?: {
    id: string;
    name: string;
  };
  subtopic?: {
    id: string;
    name: string;
  };
  progress?: {
    status: string;
    progress: number;
    completedAt?: string;
  }[];
}

interface ExamResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  answers: Array<{
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
  }>;
}

export default function ContentViewPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params?.id as string;
  
  const [content, setContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(true);
  const [showExamModal, setShowExamModal] = useState(false);
  const [currentExamId, setCurrentExamId] = useState<string | null>(null);
  const [examResults, setExamResults] = useState<ExamResults | null>(null);

  useEffect(() => {
    if (contentId) {
      loadContent();
    }
  }, [contentId]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/student/lms/content/${contentId}`);
      setContent(response.data);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentComplete = (completedContentId: string) => {
    // Show completion notification
    console.log('Content completed:', completedContentId);
    // You can add a toast notification here
  };

  const handleExamStart = (examId: string) => {
    setCurrentExamId(examId);
    setShowExamModal(true);
  };

  const handleExamSubmit = (results: ExamResults) => {
    setExamResults(results);
    setShowExamModal(false);
    
    // Show results
    console.log('Exam completed:', results);
    // You can add a results modal here
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <StudentLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading content...</p>
            </div>
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
            <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Content Not Found</h2>
            <p className="text-gray-600 mb-4">The content you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={handleBack}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </button>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentLayout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center">
                  <button
                    onClick={handleBack}
                    className="mr-4 p-2 text-gray-500 hover:text-gray-700"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">{content.title}</h1>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      {content.subject && (
                        <span className="mr-4">{content.subject.name}</span>
                      )}
                      {content.topic && (
                        <span className="mr-4">• {content.topic.name}</span>
                      )}
                      {content.subtopic && (
                        <span>• {content.subtopic.name}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {content.progress && content.progress.length > 0 && (
                    <div className="flex items-center text-sm text-gray-500">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      {content.progress[0].progress}% Complete
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <EnhancedContentViewer
              content={content}
              onContentComplete={handleContentComplete}
              onExamStart={handleExamStart}
            />
          </div>

          {/* Exam Modal */}
          {showExamModal && currentExamId && (
            <InlineExamModal
              examId={currentExamId}
              isOpen={showExamModal}
              onClose={() => setShowExamModal(false)}
              onSubmit={handleExamSubmit}
            />
          )}

          {/* Exam Results Modal */}
          {examResults && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Exam Completed!</h3>
                  <div className="space-y-2 mb-6">
                    <div className="text-3xl font-bold text-blue-600">
                      {examResults.score}%
                    </div>
                    <p className="text-gray-600">
                      {examResults.correctAnswers} out of {examResults.totalQuestions} questions correct
                    </p>
                    <p className="text-sm text-gray-500">
                      Time spent: {Math.floor(examResults.timeSpent / 60)}m {examResults.timeSpent % 60}s
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setExamResults(null)}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    >
                      Close
                    </button>
                    <button
                      onClick={() => {
                        setExamResults(null);
                        // Navigate to performance analysis or next content
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      View Analysis
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </StudentLayout>
    </ProtectedRoute>
  );
}
