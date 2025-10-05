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
        setQuestions(response.data.data);
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
              </div>
            </div>

            {/* Question List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className={`p-3 mb-2 rounded-lg border cursor-pointer transition-all ${
                      index === currentQuestionIndex
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setCurrentQuestionIndex(index)}
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
                            Q{index + 1}
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
                ))}
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
                                }
                              } catch (error: any) {
                                console.error('Error marking PDF as completed:', error);
                                toast.error(`Error: ${error.response?.data?.message || error.message}`);
                              }
                            }}
                            disabled={pdfData?.processingStatus === 'COMPLETED'}
                            className={`px-4 py-2 rounded-md border ${
                              pdfData?.processingStatus === 'COMPLETED'
                                ? 'bg-gray-300 text-gray-500 border-gray-300 cursor-not-allowed'
                                : 'bg-purple-600 text-white hover:bg-purple-700 border-purple-500'
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
                                  // Extract just the filename from the full path
                                  const fileName = pdfData.filePath.split(/[\\/]/).pop();
                                  const fileUrl = `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}/static/pdf/${fileName}`;
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
                                  const fileName = pdfData.latexFilePath!.split(/[\\/]/).pop();
                                  const fileUrl = `${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}/static/latex/${fileName}`;
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
      </AdminLayout>
    </ProtectedRoute>
  );
}
