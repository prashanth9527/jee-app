'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import LatexContentDisplay, { 
  LatexQuestionStem, 
  LatexQuestionExplanation, 
  LatexQuestionTips,
  LatexQuestionOption 
} from '@/components/LatexContentDisplay';
import LatexRichTextEditor from '@/components/LatexRichTextEditor';

interface Question {
  id: string;
  stem: string;
  explanation: string | null;
  tip_formula: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  yearAppeared: number | null;
  isPreviousYear: boolean;
  isAIGenerated: boolean;
  status: 'approved' | 'underreview' | 'rejected';
  exerciseName: string | null;
  subject: {
    id: string;
    name: string;
  } | null;
  lesson: {
    id: string;
    name: string;
  } | null;
  topic: {
    id: string;
    name: string;
  } | null;
  subtopic: {
    id: string;
    name: string;
  } | null;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
  tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ReviewStats {
  total: number;
  approved: number;
  underreview: number;
  rejected: number;
  completionPercentage: number;
}

export default function PDFReviewPage() {
  const params = useParams();
  const router = useRouter();
  const cacheId = params?.cacheId as string;

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Omit<Question, 'tags'>> & { tags?: string[] }>({});
  const [pdfData, setPdfData] = useState<{ fileName: string; filePath: string; latexFilePath?: string; processingStatus?: string; recordType?: 'pyq' | 'question' | 'lms' } | null>(null);
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [examTimeLimit, setExamTimeLimit] = useState<number | ''>('');
  const [examType, setExamType] = useState<'REGULAR' | 'REGULAR_ADV' | 'AI_EXAM' | 'CONTENT_EXAM' | 'PRACTICE_EXAM' | 'PYQ_PRACTICE'>('REGULAR');
  const [previousYear, setPreviousYear] = useState('');
  const [groupedQuestions, setGroupedQuestions] = useState<Record<string, Question[]>>({});
  const [originalSelectedQuestions, setOriginalSelectedQuestions] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (cacheId) {
      fetchQuestions();
      fetchStats();
    }
  }, [cacheId]);

  const fetchQuestions = async () => {
    try {
      const response = await api.get(`/admin/pdf-review/${cacheId}`);
      if (response.data.success) {
        const fetchedQuestions = response.data.data;
        setQuestions(fetchedQuestions);
        
        // Group questions by exerciseName
        const grouped = fetchedQuestions.reduce((acc: Record<string, Question[]>, question: Question) => {
          const exerciseName = question.exerciseName || 'No Exercise';
          if (!acc[exerciseName]) {
            acc[exerciseName] = [];
          }
          acc[exerciseName].push(question);
          return acc;
        }, {});
        setGroupedQuestions(grouped);
        
        // Set PDF data from the response
        if (response.data.pdfCache) {
          setPdfData(response.data.pdfCache);
        }
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Error fetching questions:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get(`/admin/pdf-review/stats/${cacheId}`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
    }
  };


  const approveQuestion = async (questionId: string) => {
    try {
      const response = await api.put(`/admin/pdf-review/approve/${questionId}`);
      if (response.data.success) {
        toast.success('Question approved successfully!');
        fetchQuestions();
        fetchStats();
      }
    } catch (error: any) {
      console.error('Error approving question:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const rejectQuestion = async (questionId: string) => {
    try {
      const response = await api.put(`/admin/pdf-review/reject/${questionId}`);
      if (response.data.success) {
        toast.success('Question rejected successfully!');
        fetchQuestions();
        fetchStats();
      }
    } catch (error: any) {
      console.error('Error rejecting question:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const bulkApproveQuestions = async () => {
    if (selectedQuestions.size === 0) {
      toast.warning('Please select questions to approve');
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to approve ${selectedQuestions.size} selected questions?`
    );

    if (!confirmed) return;

    try {
      const response = await api.post('/admin/pdf-review/bulk-approve', {
        questionIds: Array.from(selectedQuestions)
      });

      if (response.data.success) {
        toast.success(`${response.data.data.approvedCount} questions approved successfully!`);
        setSelectedQuestions(new Set());
        fetchQuestions();
        fetchStats();
      }
    } catch (error: any) {
      console.error('Error bulk approving questions:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const approveAllQuestions = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to approve ALL ${questions.length} questions?`
    );

    if (!confirmed) return;

    try {
      const response = await api.post(`/admin/pdf-review/approve-all/${cacheId}`);
      if (response.data.success) {
        toast.success(`${response.data.data.approvedCount} questions approved successfully! PDF marked as completed.`);
        fetchQuestions();
        fetchStats();
      }
    } catch (error: any) {
      console.error('Error approving all questions:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const updateQuestion = async () => {
    if (!questions[currentQuestionIndex]) return;

    try {
      const response = await api.put(
        `/admin/pdf-review/update/${questions[currentQuestionIndex].id}`,
        editData
      );

      if (response.data.success) {
        toast.success('Question updated successfully!');
        setIsEditing(false);
        setEditData({});
        fetchQuestions();
      }
    } catch (error: any) {
      console.error('Error updating question:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const startEditing = () => {
    const currentQuestion = questions[currentQuestionIndex];
    setEditData({
      stem: currentQuestion.stem,
      explanation: currentQuestion.explanation,
      tip_formula: currentQuestion.tip_formula,
      difficulty: currentQuestion.difficulty,
      yearAppeared: currentQuestion.yearAppeared,
      isPreviousYear: currentQuestion.isPreviousYear,
      options: currentQuestion.options.map(opt => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect,
        order: opt.order
      })),
      tags: currentQuestion.tags.map(t => t.tag.name)
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({});
  };

  const toggleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const selectAllQuestions = () => {
    const allQuestionIds = questions.map(q => q.id);
    setSelectedQuestions(new Set(allQuestionIds));
  };

  const deselectAllQuestions = () => {
    setSelectedQuestions(new Set());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'underreview':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HARD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCreateExam = async () => {
    if (selectedQuestions.size === 0) {
      toast.warning('Please select at least one question to create an exam');
      return;
    }

    try {
      const response = await api.post('/admin/pdf-review/create-exam', {
        questionIds: Array.from(selectedQuestions),
        title: examTitle || undefined,
        description: examDescription || undefined,
        timeLimitMin: examTimeLimit || undefined,
        examType: examType,
        previousYear: previousYear || undefined
      });

      if (response.data.success) {
        const examId = response.data.data.examPaper.id;
        const examTitle = response.data.data.examPaper.title;
        
        toast.success(`Exam "${examTitle}" created successfully with ${response.data.data.questionCount} questions!`);
        setShowCreateExamModal(false);
        setExamTitle('');
        setExamDescription('');
        setExamTimeLimit('');
        setExamType('REGULAR');
        setPreviousYear('');
        
        // Restore original selected questions if they were stored
        if (originalSelectedQuestions) {
          setSelectedQuestions(originalSelectedQuestions);
          setOriginalSelectedQuestions(null);
        } else {
          setSelectedQuestions(new Set());
        }
        
        // Optionally redirect to exam preview page
        const viewExam = window.confirm('Exam created! Would you like to preview it now?');
        if (viewExam) {
          window.open(`/admin/exam-papers/create-enhanced?edit=${examId}`, '_blank');
        }
      }
    } catch (error: any) {
      console.error('Error creating exam:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const openCreateExamModal = () => {
    if (selectedQuestions.size === 0) {
      toast.warning('Please select questions first');
      return;
    }
    
    // Auto-generate title suggestion based on selected questions
    const selectedQs = questions.filter(q => selectedQuestions.has(q.id));
    const subjects = [...new Set(selectedQs.map(q => q.subject?.name).filter(Boolean))];
    const lessons = [...new Set(selectedQs.map(q => q.lesson?.name).filter(Boolean))];
    const topics = [...new Set(selectedQs.map(q => q.topic?.name).filter(Boolean))];
    const subtopics = [...new Set(selectedQs.map(q => q.subtopic?.name).filter(Boolean))];
    
    console.log('Title Generation Debug:', {
      selectedCount: selectedQs.length,
      subjects,
      lessons,
      topics,
      subtopics
    });
    
    // Generate detailed title based on metadata hierarchy
    let suggestedTitle = '';
    
    if (subtopics.length === 1) {
      // Single subtopic - most specific
      const subject = subjects.length === 1 ? subjects[0] : '';
      const topic = topics.length === 1 ? topics[0] : '';
      if (subject && topic) {
        suggestedTitle = `${subject} - ${topic} - ${subtopics[0]} Practice`;
      } else if (subject) {
        suggestedTitle = `${subject} - ${subtopics[0]} Practice`;
      } else {
        suggestedTitle = `${subtopics[0]} - Practice Exam`;
      }
    } else if (topics.length === 1) {
      // Single topic
      const subject = subjects.length === 1 ? subjects[0] : '';
      suggestedTitle = subject 
        ? `${subject} - ${topics[0]} Practice`
        : `${topics[0]} - Practice Exam`;
    } else if (lessons.length === 1) {
      // Single lesson
      const subject = subjects.length === 1 ? subjects[0] : '';
      suggestedTitle = subject 
        ? `${subject} - ${lessons[0]} Practice`
        : `${lessons[0]} - Practice Exam`;
    } else if (subjects.length === 1) {
      // Single subject with multiple topics/subtopics
      if (topics.length > 1) {
        suggestedTitle = `${subjects[0]} - ${topics.slice(0, 2).join(', ')} Practice`;
      } else {
        suggestedTitle = `${subjects[0]} - Practice Exam`;
      }
    } else if (subjects.length > 1) {
      // Multiple subjects
      suggestedTitle = `${subjects.join(', ')} - Mixed Practice`;
    } else {
      // No metadata
      suggestedTitle = 'Practice Exam';
    }
    
    console.log('Generated Title:', suggestedTitle);
    
    setExamTitle(suggestedTitle);
    setExamDescription(`Practice exam with ${selectedQuestions.size} questions`);
    setExamTimeLimit(selectedQuestions.size * 2); // 2 minutes per question
    setShowCreateExamModal(true);
  };

  const createExamForExercise = (exerciseName: string) => {
    const exerciseQuestions = groupedQuestions[exerciseName];
    if (!exerciseQuestions || exerciseQuestions.length === 0) {
      toast.warning('No questions found in this exercise');
      return;
    }

    // Filter to only selected questions from this exercise
    const selectedExerciseQuestions = exerciseQuestions.filter(q => selectedQuestions.has(q.id));
    
    // If no questions selected from this exercise, use all questions from the exercise
    const questionsToUse = selectedExerciseQuestions.length > 0 ? selectedExerciseQuestions : exerciseQuestions;
    
    // Store original selected questions to restore later
    setOriginalSelectedQuestions(new Set(selectedQuestions));
    
    // Temporarily set the selected questions to only this exercise's questions
    setSelectedQuestions(new Set(questionsToUse.map(q => q.id)));
    
    // Generate title suggestion based on the exercise
    const subjects = [...new Set(questionsToUse.map(q => q.subject?.name).filter(Boolean))];
    const lessons = [...new Set(questionsToUse.map(q => q.lesson?.name).filter(Boolean))];
    const topics = [...new Set(questionsToUse.map(q => q.topic?.name).filter(Boolean))];
    const subtopics = [...new Set(questionsToUse.map(q => q.subtopic?.name).filter(Boolean))];
    
    // Generate detailed title based on metadata hierarchy
    let suggestedTitle = '';
    
    if (subtopics.length === 1) {
      // Single subtopic - most specific
      const subject = subjects.length === 1 ? subjects[0] : '';
      const topic = topics.length === 1 ? topics[0] : '';
      if (subject && topic) {
        suggestedTitle = `${subject} - ${topic} - ${subtopics[0]} Practice`;
      } else if (subject) {
        suggestedTitle = `${subject} - ${subtopics[0]} Practice`;
      } else {
        suggestedTitle = `${subtopics[0]} - Practice Exam`;
      }
    } else if (topics.length === 1) {
      // Single topic
      const subject = subjects.length === 1 ? subjects[0] : '';
      suggestedTitle = subject 
        ? `${subject} - ${topics[0]} Practice`
        : `${topics[0]} - Practice Exam`;
    } else if (lessons.length === 1) {
      // Single lesson
      const subject = subjects.length === 1 ? subjects[0] : '';
      suggestedTitle = subject 
        ? `${subject} - ${lessons[0]} Practice`
        : `${lessons[0]} - Practice Exam`;
    } else if (subjects.length === 1) {
      // Single subject with multiple topics/subtopics
      if (topics.length > 1) {
        suggestedTitle = `${subjects[0]} - ${topics.slice(0, 2).join(', ')} Practice`;
      } else {
        suggestedTitle = `${subjects[0]} - Practice Exam`;
      }
    } else if (subjects.length > 1) {
      // Multiple subjects
      suggestedTitle = `${subjects.join(', ')} - Mixed Practice`;
    } else {
      // No metadata - use exercise name
      suggestedTitle = exerciseName;
    }
    
    setExamTitle(suggestedTitle);
    setExamDescription(`Practice exam from ${exerciseName} with ${questionsToUse.length} questions`);
    setExamTimeLimit(questionsToUse.length * 2); // 2 minutes per question
    setShowCreateExamModal(true);
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (questions.length === 0) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <AdminLayout>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">No Questions Found</h1>
            <p className="text-gray-600">No questions were found for this PDF processing cache.</p>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="flex h-screen bg-gray-50">
          {/* Left Sidebar - Question List */}
          <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
            {/* Breadcrumb Navigation */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <nav className="flex items-center space-x-2 text-sm">
                <button
                  onClick={() => router.push('/admin/pdf-processor-cache')}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  PDF Processor
                </button>
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                <span className="text-gray-600">Question Review</span>
              </nav>
            </div>

            {/* Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-bold text-gray-900">Question Review</h1>
                <button
                  onClick={() => router.push('/admin/pdf-processor-cache')}
                  className="text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                  title="Back to PDF Processor"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span className="text-sm">Back to PDFs</span>
                </button>
              </div>

              {/* Stats */}
              {stats && (
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-semibold text-gray-900">{stats.total}</div>
                    <div className="text-gray-600">Total</div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="font-semibold text-green-800">{stats.approved}</div>
                    <div className="text-green-600">Approved</div>
                  </div>
                  <div className="bg-yellow-50 p-2 rounded">
                    <div className="font-semibold text-yellow-800">{stats.underreview}</div>
                    <div className="text-yellow-600">Under Review</div>
                  </div>
                  <div className="bg-red-50 p-2 rounded">
                    <div className="font-semibold text-red-800">{stats.rejected}</div>
                    <div className="text-red-600">Rejected</div>
                  </div>
                </div>
              )}

              {/* Progress Bar */}
              {stats && (
                <div className="mt-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{stats.completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stats.completionPercentage}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Bulk Actions */}
            <div className="p-4 border-b border-gray-200">
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <button
                    onClick={selectAllQuestions}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
                  >
                    Select All
                  </button>
                  <button
                    onClick={deselectAllQuestions}
                    className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-700"
                  >
                    Deselect All
                  </button>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={bulkApproveQuestions}
                    disabled={selectedQuestions.size === 0}
                    className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Approve Selected ({selectedQuestions.size})
                  </button>
                  <button
                    onClick={approveAllQuestions}
                    className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-md text-sm hover:bg-purple-700"
                  >
                    Approve All
                  </button>
                </div>
                <button
                  onClick={openCreateExamModal}
                  disabled={selectedQuestions.size === 0}
                  className="w-full bg-indigo-600 text-white px-3 py-2 rounded-md text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Exam ({selectedQuestions.size})</span>
                </button>
              </div>
            </div>

            {/* Question List - Grouped by Exercise */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                {Object.entries(groupedQuestions).map(([exerciseName, exerciseQuestions]) => {
                  // Count selected questions in this exercise
                  const selectedInExercise = exerciseQuestions.filter(q => selectedQuestions.has(q.id)).length;
                  
                  return (
                    <div key={exerciseName} className="mb-4">
                      {/* Exercise Header */}
                      <div className="sticky top-0 bg-blue-600 border border-indigo-200 rounded-lg p-3 mb-2 shadow-sm z-10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <h3 className="font-semibold text-indigo-900">{exerciseName}</h3>
                            <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">
                              {exerciseQuestions.length} questions
                            </span>
                            {selectedInExercise > 0 && (
                              <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full font-medium">
                                {selectedInExercise} selected
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              createExamForExercise(exerciseName);
                            }}
                            className="bg-indigo-600 text-white px-3 py-1.5 rounded-md text-xs hover:bg-indigo-700 flex items-center space-x-1 shadow-sm transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span>
                              {selectedInExercise > 0 
                                ? `Create Exam (${selectedInExercise})` 
                                : 'Create Exam (All)'}
                            </span>
                          </button>
                        </div>
                      </div>

                    {/* Questions in this Exercise */}
                    {exerciseQuestions.map((question) => {
                      const globalIndex = questions.findIndex(q => q.id === question.id);
                      return (
                        <div
                          key={question.id}
                          className={`p-3 mb-2 rounded-lg border cursor-pointer transition-all ${
                            globalIndex === currentQuestionIndex
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setCurrentQuestionIndex(globalIndex)}
                        >
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={selectedQuestions.has(question.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                toggleQuestionSelection(question.id);
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">
                                  Q{globalIndex + 1}
                                </span>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(question.status)}`}>
                                  {question.status}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 line-clamp-2">
                                <LatexContentDisplay 
                                  content={question.stem} 
                                  className="text-sm"
                                />
                              </div>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(question.difficulty)}`}>
                                  {question.difficulty}
                                </span>
                                {question.subject && (
                                  <span className="text-xs text-gray-500">
                                    {question.subject.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content - Question Display */}
          <div className="flex-1 flex flex-col">
            {currentQuestion && (
              <>
                {/* Breadcrumb Navigation */}
                <div className="bg-gray-50 border-b border-gray-200 p-3">
                  <nav className="flex items-center space-x-2 text-sm">
                    <button
                      onClick={() => router.push('/admin/pdf-processor-cache')}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      PDF Processor
                    </button>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-600">Question Review</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-gray-800 font-medium">Question {currentQuestionIndex + 1}</span>
                  </nav>
                </div>

                {/* Question Header */}
                <div className="bg-white border-b border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        Question {currentQuestionIndex + 1} of {questions.length}
                      </h2>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(currentQuestion.status)}`}>
                          {currentQuestion.status}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(currentQuestion.difficulty)}`}>
                          {currentQuestion.difficulty}
                        </span>
                        {currentQuestion.subject && (
                          <span className="text-sm text-gray-600">
                            {currentQuestion.subject.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      {!isEditing ? (
                        <>
                          {/* Mark as Completed Button */}
                          <button
                            onClick={async () => {
                              try {
                                const response = await api.put(`/admin/pdf-processor/mark-completed/${cacheId}`);
                                if (response.data.success) {
                                  toast.success('PDF marked as completed successfully!');
                                  // Update the PDF data to reflect the new status
                                  setPdfData(prev => prev ? { ...prev, processingStatus: 'COMPLETED' } : null);
                                  // Refresh the page data to ensure consistency
                                  await fetchQuestions();
                                }
                              } catch (error: any) {
                                console.error('Error marking PDF as completed:', error);
                                toast.error(`Error: ${error.response?.data?.message || error.message}`);
                              }
                            }}
                            disabled={pdfData?.processingStatus === 'COMPLETED'}
                            className={`px-4 py-2 rounded-md border transition-all duration-200 ${
                              pdfData?.processingStatus === 'COMPLETED'
                                ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed opacity-60'
                                : 'bg-purple-600 text-white hover:bg-purple-700 border-purple-500 hover:shadow-md'
                            }`}
                            title={pdfData?.processingStatus === 'COMPLETED' ? 'PDF processing already completed' : 'Mark PDF processing as completed'}
                          >
                            {pdfData?.processingStatus === 'COMPLETED' ? 'Already Completed' : 'Mark as completed'}
                          </button>
                          
                          {/* View PDF Button */}
                          {pdfData?.filePath && (
                            <button
                              onClick={() => {
                                try {
                                  // Extract the relative path from the full file path
                                  // The filePath should be something like: C:\wamp64\www\nodejs\jee-app\content\JEE\Previous Papers\2025\Session2\Physics\0804-Physics Paper+With+Sol Evening.pdf
                                  // We need to extract: JEE/Previous Papers/2025/Session2/Physics/0804-Physics Paper+With+Sol Evening.pdf
                                  
                                  // Find the 'content' directory in the path
                                  const contentIndex = pdfData.filePath.indexOf('content');
                                  if (contentIndex === -1) {
                                    console.error('Content directory not found in file path:', pdfData.filePath);
                                    toast.error('Invalid file path');
                                    return;
                                  }
                                  
                                  // Extract the relative path from content directory
                                  // Find the position after 'content' and the path separator
                                  const contentStart = contentIndex + 'content'.length;
                                  const pathSeparator = pdfData.filePath[contentStart] === '\\' || pdfData.filePath[contentStart] === '/' ? 1 : 0;
                                  const relativePath = pdfData.filePath.substring(contentStart + pathSeparator);
                                  // Convert backslashes to forward slashes for URL
                                  const normalizedPath = relativePath.replace(/\\/g, '/');
                                  // Only encode the filename, not the path separators
                                  const pathParts = normalizedPath.split('/');
                                  const encodedParts = pathParts.map(part => encodeURIComponent(part));
                                  const encodedPath = encodedParts.join('/');
                                  
                                  // Use the backend API for static files
                                  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
                                  const fileUrl = `${apiBase}/static/pdf/${encodedPath}`;
                                  console.log('Opening PDF URL:', fileUrl);
                                  window.open(fileUrl, '_blank');
                                } catch (error) {
                                  console.error('Error opening PDF:', error);
                                  toast.error('Failed to open PDF file');
                                }
                              }}
                              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 border border-red-500"
                              title="Open PDF file in new window"
                            >
                              View PDF
                            </button>
                          )}
                          
                           {/* View LaTeX Button */}
                           {pdfData?.latexFilePath && (
                             <button
                               onClick={() => {
                                 try {
                                   // Use the direct AWS URL from latexFilePath
                                   const fileUrl = pdfData.latexFilePath!;
                                   console.log('Opening LaTeX URL:', fileUrl);
                                   window.open(fileUrl, '_blank');
                                 } catch (error) {
                                   console.error('Error opening LaTeX file:', error);
                                   toast.error('Failed to open LaTeX file');
                                 }
                               }}
                               className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 border border-orange-500"
                               title="Open LaTeX file in new window"
                             >
                               View LaTeX
                             </button>
                           )}
                          
                          <button
                            onClick={startEditing}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => approveQuestion(currentQuestion.id)}
                            disabled={currentQuestion.status === 'approved'}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectQuestion(currentQuestion.id)}
                            disabled={currentQuestion.status === 'rejected'}
                            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={updateQuestion}
                            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Question Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="max-w-4xl mx-auto">
                    {/* Question Stem */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Question</h3>
                      {isEditing ? (
                        <LatexRichTextEditor
                          value={editData.stem || ''}
                          onChange={(content) => setEditData({ ...editData, stem: content })}
                          placeholder="Enter the question text with LaTeX support..."
                          height={200}
                          className="border border-gray-300 rounded-md"
                        />
                      ) : (
                        <LatexQuestionStem stem={currentQuestion.stem} />
                      )}
                    </div>

                    {/* Options */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Options</h3>
                      <div className="space-y-3">
                        {isEditing ? (
                          editData.options?.map((option, index) => (
                            <div key={index} className="flex items-center space-x-3">
                              <span className="w-8 text-sm font-medium text-gray-600">
                                {String.fromCharCode(65 + index)}
                              </span>
                              <div className="flex-1">
                                <LatexRichTextEditor
                                  value={option.text}
                                  onChange={(content) => {
                                    const newOptions = [...(editData.options || [])];
                                    newOptions[index] = { ...option, text: content };
                                    setEditData({ ...editData, options: newOptions });
                                  }}
                                  placeholder={`Enter option ${String.fromCharCode(65 + index)} text with LaTeX support...`}
                                  height={100}
                                  className="border border-gray-300 rounded-md"
                                />
                              </div>
                              <input
                                type="radio"
                                name="correctOption"
                                checked={option.isCorrect}
                                onChange={() => {
                                  const newOptions = (editData.options || []).map((opt, i) => ({
                                    ...opt,
                                    isCorrect: i === index
                                  }));
                                  setEditData({ ...editData, options: newOptions });
                                }}
                                className="w-4 h-4"
                              />
                            </div>
                          ))
                        ) : (
                          currentQuestion.options.map((option, index) => (
                            <div
                              key={option.id}
                              className={`p-3 rounded-md border ${
                                option.isCorrect
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200'
                              }`}
                            >
                              <LatexQuestionOption 
                                option={option}
                                index={index}
                                showCorrect={true}
                                className="w-full"
                              />
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Explanation</h3>
                      {isEditing ? (
                        <LatexRichTextEditor
                          value={editData.explanation || ''}
                          onChange={(content) => setEditData({ ...editData, explanation: content })}
                          placeholder="Enter the explanation with LaTeX support..."
                          height={250}
                          className="border border-gray-300 rounded-md"
                        />
                      ) : (
                        <LatexQuestionExplanation 
                          explanation={currentQuestion.explanation || 'No explanation provided'} 
                        />
                      )}
                    </div>

                    {/* Tip Formula */}
                    <div className="bg-white rounded-lg shadow p-6 mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Tip/Formula</h3>
                      {isEditing ? (
                        <LatexRichTextEditor
                          value={editData.tip_formula || ''}
                          onChange={(content) => setEditData({ ...editData, tip_formula: content })}
                          placeholder="Enter tips and formulas with LaTeX support..."
                          height={150}
                          className="border border-gray-300 rounded-md"
                        />
                      ) : (
                        <LatexQuestionTips 
                          tipFormula={currentQuestion.tip_formula || 'No tip/formula provided'} 
                        />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Metadata</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subject
                          </label>
                          <p className="text-gray-800">
                            {currentQuestion.subject?.name || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lesson
                          </label>
                          <p className="text-gray-800">
                            {currentQuestion.lesson?.name || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Topic
                          </label>
                          <p className="text-gray-800">
                            {currentQuestion.topic?.name || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subtopic
                          </label>
                          <p className="text-gray-800">
                            {currentQuestion.subtopic?.name || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Year Appeared
                          </label>
                          <p className="text-gray-800">
                            {currentQuestion.yearAppeared || 'Not specified'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Tags
                          </label>
                          <div className="flex flex-wrap gap-1">
                            {currentQuestion.tags.map((tag) => (
                              <span
                                key={tag.tag.id}
                                className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800"
                              >
                                {tag.tag.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation Footer */}
                <div className="bg-white border-t border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <button
                      onClick={() => setCurrentQuestionIndex(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Create Exam Modal */}
        {showCreateExamModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-fit max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create Practice Exam</h2>
                  <button
                    onClick={() => setShowCreateExamModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Selected Questions Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">
                        {selectedQuestions.size} question{selectedQuestions.size !== 1 ? 's' : ''} selected
                      </span>
                    </div>
                  </div>

                  {/* Exam Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Exam Title *
                    </label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="e.g., Physics - Mechanics Practice Exam"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Leave empty to auto-generate based on subject/topic
                    </p>
                  </div>

                  {/* Exam Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={examDescription}
                      onChange={(e) => setExamDescription(e.target.value)}
                      placeholder="Brief description of the exam..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>

                  {/* Time Limit */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      value={examTimeLimit}
                      onChange={(e) => setExamTimeLimit(e.target.value ? parseInt(e.target.value) : '')}
                      placeholder="e.g., 60"
                      min="1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Recommended: {selectedQuestions.size * 2} minutes (2 min per question)
                    </p>
                  </div>

                  {/* Exam Type and Previous Year */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Exam Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Exam Type *
                      </label>
                      <select
                        value={examType}
                        onChange={(e) => {
                          const newExamType = e.target.value as any;
                          setExamType(newExamType);
                          // Clear previousYear if exam type is not PYQ_PRACTICE
                          if (newExamType !== 'PYQ_PRACTICE') {
                            setPreviousYear('');
                          }
                        }}
                        className="w-full px-4 py-2 rounded-md border
    bg-white text-gray-900 border-gray-300
    focus:outline-none focus:ring-2 focus:ring-indigo-400
    dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                      >
                        <option value="REGULAR">Regular Exam</option>
                        <option value="REGULAR_ADV">Regular Exam-Advanced</option>
                        <option value="AI_EXAM">AI Generated Exam</option>
                        <option value="CONTENT_EXAM">Content Exam</option>
                        <option value="PRACTICE_EXAM">Practice Exam</option>
                        <option value="PYQ_PRACTICE">Previous Year Questions Practice</option>
                      </select>
                      <p className="mt-1 text-sm text-gray-500">
                        Select the type of exam you want to create
                      </p>
                    </div>

                    {/* Previous Year - Only visible when Exam Type is PYQ_PRACTICE */}
                    {examType === 'PYQ_PRACTICE' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Previous Year
                        </label>
                        <select
                          value={previousYear}
                          onChange={(e) => setPreviousYear(e.target.value)}
                          className="w-full px-4 py-2 rounded-md border
    bg-white text-gray-900 border-gray-300
    focus:outline-none focus:ring-2 focus:ring-indigo-400
    dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                        >
                          <option value="">Select year (optional)</option>
                          {Array.from({ length: 50 }, (_, i) => {
                            const year = new Date().getFullYear() - i;
                            return (
                              <option key={year} value={year.toString()}>
                                {year}
                              </option>
                            );
                          })}
                        </select>
                        <p className="mt-1 text-sm text-gray-500">
                          Optional: Select the previous year for this exam
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4">
                    <button
                      onClick={handleCreateExam}
                      className="flex-1 px-6 py-3 rounded-md text-sm font-semibold
    text-white bg-indigo-600 hover:bg-indigo-500
    border border-indigo-700
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400
    dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:border-indigo-300"
                    >
                      Create Exam
                    </button>
                  <button
                    onClick={() => {
                      setShowCreateExamModal(false);
                      // Restore original selected questions if they were stored
                      if (originalSelectedQuestions) {
                        setSelectedQuestions(originalSelectedQuestions);
                        setOriginalSelectedQuestions(null);
                      }
                    }}
                    className="flex-1 px-6 py-3 rounded-md text-sm font-medium
    text-gray-800 bg-gray-200 hover:bg-gray-300
    ring-1 ring-inset ring-gray-300
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500
    dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:ring-gray-600"
                  >
                    Cancel
                  </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}
