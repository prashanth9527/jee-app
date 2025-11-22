'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import QuestionReportModal from '@/components/QuestionReportModal';
import api, { bookmarkApi } from '@/lib/api';
import Swal from 'sweetalert2';
import LatexContentDisplay from '@/components/LatexContentDisplay';

interface Question {
  id: string;
  stem: string;
  explanation?: string;
  tip_formula?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  isOpenEnded?: boolean;
  correctNumericAnswer?: number;
  answerTolerance?: number;
  isAIGenerated?: boolean;
  aiPrompt?: string;
  alternativeExplanations?: Array<{
    id: string;
    explanation: string;
    source: string;
    createdAt: string;
  }>;
  options?: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

interface Answer {
  questionId: string;
  question: Question;
  selectedOption: {
    id: string;
    text: string;
    isCorrect: boolean;
  } | null;
  isCorrect: boolean;
}

interface Submission {
  id: string;
  examPaper: {
    id: string;
    title: string;
    timeLimitMin: number | null;
  };
  startedAt: string;
  submittedAt: string;
  totalQuestions: number;
  correctCount: number;
  scorePercent: number;
}

interface ExamResults {
  submissionId: string;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  examTitle: string;
  answers: Array<{
    questionId: string;
    question: string;
    selectedOption: {
      id: string;
      text: string;
      isCorrect: boolean;
    } | null;
    correctOption: {
      id: string;
      text: string;
      isCorrect: boolean;
    } | null;
    isCorrect: boolean;
  }>;
}

export default function PracticeTestResultsPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params?.submissionId as string;

  const [results, setResults] = useState<ExamResults | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [selectedQuestionForReport, setSelectedQuestionForReport] = useState<Question | null>(null);
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Set<string>>(new Set());
  const [bookmarkLoading, setBookmarkLoading] = useState<Set<string>>(new Set());
  const [submittedReports, setSubmittedReports] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (submissionId) {
      fetchResults();
      fetchExistingReports();
    }
  }, [submissionId]);

  const fetchResults = async () => {
    try {
      const response = await api.get(`/exams/submissions/${submissionId}/results`);
      setResults(response.data);
      
      // Fetch all questions for complete performance picture
      const questionsResponse = await api.get(`/exams/submissions/${submissionId}/questions`);
      setQuestions(questionsResponse.data);
      // Auto-select first question for initial render
      if (questionsResponse.data && questionsResponse.data.length > 0) {
        setSelectedQuestionIndex(0);
      }
      
      // Fetch bookmark status for all questions
      if (response.data.answers) {
        const questionIds = response.data.answers.map((answer: any) => answer.questionId);
        try {
          const bookmarkResponse = await bookmarkApi.getBookmarkStatus(questionIds);
          const bookmarkedSet = new Set<string>(
            bookmarkResponse.data
              .filter((item: any) => item.isBookmarked)
              .map((item: any) => item.questionId as string)
          );
          setBookmarkedQuestions(bookmarkedSet);
        } catch (bookmarkError) {
          console.error('Error fetching bookmark status:', bookmarkError);
        }
      }
    } catch (error: any) {
      console.error('Error fetching results:', error);
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to load test results',
        icon: 'error',
      }).then(() => {
        router.push('/student/practice');
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingReports = async () => {
    try {
      const response = await api.get('/student/question-reports/my-reports');
      const reportedQuestionIds = new Set<string>(
        response.data.map((report: any) => report.questionId)
      );
      setSubmittedReports(reportedQuestionIds);
    } catch (error) {
      console.error('Error fetching existing reports:', error);
    }
  };

  // Safety: if results and questions are loaded but nothing selected, select first
  useEffect(() => {
    if (!loading && selectedQuestionIndex === null && questions.length > 0) {
      setSelectedQuestionIndex(0);
    }
  }, [loading, questions, selectedQuestionIndex]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HARD': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const toggleBookmark = async (questionId: string) => {
    if (bookmarkLoading.has(questionId)) return;
    
    setBookmarkLoading(prev => new Set(prev).add(questionId));
    
    try {
      const isBookmarked = bookmarkedQuestions.has(questionId);
      
      if (isBookmarked) {
        await bookmarkApi.remove(questionId);
        setBookmarkedQuestions(prev => {
          const newSet = new Set(prev);
          newSet.delete(questionId);
          return newSet;
        });
        Swal.fire({
          title: 'Bookmark Removed',
          text: 'Question removed from bookmarks',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      } else {
        await bookmarkApi.create(questionId);
        setBookmarkedQuestions(prev => new Set(prev).add(questionId));
        Swal.fire({
          title: 'Bookmark Added',
          text: 'Question added to bookmarks',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to update bookmark',
        icon: 'error',
      });
    } finally {
      setBookmarkLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent! Keep up the great work!';
    if (score >= 80) return 'Great job! You\'re doing well!';
    if (score >= 70) return 'Good effort! Keep practicing!';
    if (score >= 60) return 'Not bad! Focus on weak areas.';
    return 'Keep practicing! Review the explanations carefully.';
  };

  const formatDuration = (startedAt: string, submittedAt: string) => {
    const start = new Date(startedAt);
    const end = new Date(submittedAt);
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`;
    }
    return `${diffSecs}s`;
  };

  const handleRetake = async () => {
    try {
      // Get the submission data to find the exam paper ID
      const submissionResponse = await api.get(`/exams/submissions/${submissionId}`);
      const examId = submissionResponse.data.examPaper.id;
      
      if (examId) {
        // Start a new exam session with the same exam paper
        const response = await api.post(`/student/exams/papers/${examId}/start`);
        const newSubmissionId = response.data.submissionId;
        router.push(`/student/exam/${newSubmissionId}`);
      }
    } catch (error) {
      console.error('Error starting retake:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to start exam retake. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <p className="mt-6 text-lg font-medium text-gray-900">Loading results...</p>
                <p className="mt-2 text-sm text-gray-700">Please wait while we analyze your performance</p>
              </div>
            </div>
          </StudentLayout>
        </SubscriptionGuard>
      </ProtectedRoute>
    );
  }

  if (!results) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Results Not Found</h1>
                <p className="text-gray-700 mb-6">The test results you're looking for could not be found.</p>
                <button
                  onClick={() => router.push('/student/practice')}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Back to Practice
                </button>
              </div>
            </div>
          </StudentLayout>
        </SubscriptionGuard>
      </ProtectedRoute>
    );
  }

  const { answers, totalQuestions } = results;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const incorrectAnswers = answers.filter(a => !a.isCorrect).length;
  const unansweredCount = totalQuestions - answers.length;

  // Create a map of answers by questionId for quick lookup
  const answersMap = new Map(answers.map(answer => [answer.questionId, answer]));
  
  // Create a combined array of all questions with their answer status
  const allQuestionsWithStatus = questions.map((question, index) => {
    const answer = answersMap.get(question.id);
    return {
      question,
      answer,
      index,
      status: answer ? (answer.isCorrect ? 'correct' : 'incorrect') : 'unanswered'
    };
  });

  return (
    <ProtectedRoute requiredRole="STUDENT">
      <SubscriptionGuard>
        <StudentLayout>
          <div className="flex flex-col lg:flex-row h-screen bg-gray-50 dark:bg-gray-900 hide-scrollbar overflow-x-hidden">
            {/* Mobile Backdrop */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar - Score Summary */}
            <div className={`fixed inset-y-0 right-0 z-50 w-80 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out ${
              sidebarOpen ? 'translate-x-0' : 'translate-x-full'
            }`}>
              <div className="h-full overflow-y-auto hide-scrollbar">
                <div className="p-6">
                  {/* Sidebar Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Test Results</h2>
                    <button
                      onClick={() => setSidebarOpen(false)}
                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
            </div>

                  {/* Score Display */}
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your Score</h3>
                    <div className={`text-5xl font-bold mb-2 ${getScoreColor(results.scorePercent)}`}>
                      {results.scorePercent.toFixed(1)}%
                </div>
                    <p className="text-lg text-gray-800 dark:text-gray-300 mb-4">{getScoreMessage(results.scorePercent)}</p>
              </div>

                  {/* Statistics Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="text-2xl font-bold text-green-600 dark:text-green-400">{correctAnswers}</div>
                      <div className="text-sm text-green-700 dark:text-green-300">Correct</div>
                </div>
                    <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <div className="text-2xl font-bold text-red-600 dark:text-red-400">{incorrectAnswers}</div>
                      <div className="text-sm text-red-700 dark:text-red-300">Incorrect</div>
                </div>
                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">{unansweredCount}</div>
                      <div className="text-sm text-gray-800 dark:text-gray-400">Unanswered</div>
                </div>
                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{results.totalQuestions}</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">Total</div>
                </div>
              </div>

                  {/* Test Details */}
                  <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Test Details</h4>
                    <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Time Taken:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">N/A</span>
                  </div>
                  <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Started:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">N/A</span>
                  </div>
                  <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Completed:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{new Date(results.submittedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                        <span className="text-gray-700 dark:text-gray-300 font-medium">Time Limit:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">No limit</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden hide-scrollbar">
              {/* Top Header with Hamburger */}
              <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
                    <button
                      onClick={() => setSidebarOpen(true)}
                      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    <div className="min-w-0 flex-1">
                      <h1 className="text-base sm:text-lg lg:text-2xl font-bold text-gray-900 dark:text-white truncate">{results.examTitle}</h1>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Practice Test Results</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:flex-shrink-0">
                    <button
                      onClick={() => router.push('/student/exam-history')}
                      className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-1 sm:space-x-2"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      <span className="hidden sm:inline">Back to History</span>
                      <span className="sm:hidden">Back</span>
                    </button>
                    <button
                      onClick={handleRetake}
                      className="px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-1 sm:space-x-2"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Retake</span>
                    </button>
                    <span className="hidden lg:inline text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                      Click hamburger to view statistics
                    </span>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 hide-scrollbar">

            {/* Question Review */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4 lg:p-6">
              <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">Question Review</h2>
              
              <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
                {/* Question Details - Show First on Mobile */}
                <div className="flex-1 lg:order-2 min-w-0">
                  {selectedQuestionIndex !== null && allQuestionsWithStatus[selectedQuestionIndex] && (
                    <div className="space-y-6">
                      {(() => {
                        const item = allQuestionsWithStatus[selectedQuestionIndex];
                        const { question, answer, status } = item;
                        
                        if (!question) {
                          return <div>Question not found</div>;
                        }
                        
                        return (
                          <>
                            {/* Question Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                                <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                  Question {selectedQuestionIndex + 1}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                                  {question.difficulty}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  status === 'correct' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 
                                  status === 'incorrect' ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300' : 
                                  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                                }`}>
                                  {status === 'correct' ? '✓ Correct' : 
                                   status === 'incorrect' ? '✗ Incorrect' : 
                                   '○ Unanswered'}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => toggleBookmark(question.id)}
                                  disabled={bookmarkLoading.has(question.id)}
                                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors flex items-center space-x-1 ${
                                    bookmarkedQuestions.has(question.id)
                                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                  } ${bookmarkLoading.has(question.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  {bookmarkLoading.has(question.id) ? (
                                    <>
                                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                                      </svg>
                                      <span>Loading...</span>
                                    </>
                                  ) : (
                                    <>
                                      {bookmarkedQuestions.has(question.id) ? (
                                        <>
                                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"/>
                                          </svg>
                                          <span>Bookmarked</span>
                                        </>
                                      ) : (
                                        <>
                                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"/>
                                          </svg>
                                          <span>Bookmark</span>
                                        </>
                                      )}
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedQuestionForReport(question);
                                    setReportModalOpen(true);
                                  }}
                                  disabled={submittedReports.has(question.id)}
                                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap ${
                                    submittedReports.has(question.id)
                                      ? 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-300 cursor-not-allowed'
                                      : 'bg-orange-500 text-white hover:bg-orange-600'
                                  }`}
                                >
                                  {submittedReports.has(question.id) ? 'Reported' : 'Report Issue'}
                                </button>
                              </div>
                            </div>

                            {/* Question Stem */}
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 sm:p-6 max-w-full overflow-x-auto">
                              <p className="text-sm sm:text-base lg:text-lg text-gray-900 dark:text-gray-100 leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                <LatexContentDisplay content={question.stem} />
                              </p>
                            </div>

                            {/* Options or Numeric Answer Display */}
                            {question.isOpenEnded ? (
                              <div className="space-y-3 max-w-full overflow-x-auto">
                                <div className="p-3 sm:p-4 rounded-lg border-2 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
                                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-sm sm:text-base lg:text-lg text-gray-700 dark:text-gray-300 font-medium">
                                        Your Answer: {answer?.selectedOption?.text || 'No answer provided'}
                                      </span>
                                      {answer?.isCorrect ? (
                                        <span className="text-xs sm:text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded whitespace-nowrap">
                                          Correct
                                        </span>
                                      ) : (
                                        <span className="text-xs sm:text-sm bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded whitespace-nowrap">
                                          Incorrect
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                    Correct Answer: {question.correctNumericAnswer}
                                  </div>
                                </div>
                              </div>
                            ) : (
                            <div className="space-y-3 max-w-full overflow-x-auto">
                                {question.options?.map((option) => {
                                  const isSelected = answer?.selectedOption?.id === option.id;
                                const isCorrect = option.isCorrect;
                                
                                let optionClass = 'p-3 sm:p-4 rounded-lg border-2';
                                if (isCorrect) {
                                  optionClass += ' bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700';
                                } else if (isSelected && !isCorrect) {
                                  optionClass += ' bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700';
                                } else {
                                  optionClass += ' bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700';
                                }

                                return (
                                  <div key={option.id} className={optionClass}>
                                    <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                                      {isCorrect && <span className="text-green-600 dark:text-green-400 text-base sm:text-lg flex-shrink-0">✓</span>}
                                      {isSelected && !isCorrect && <span className="text-red-600 dark:text-red-400 text-base sm:text-lg flex-shrink-0">✗</span>}
                                      {!isSelected && !isCorrect && <span className="text-gray-400 dark:text-gray-500 text-base sm:text-lg flex-shrink-0">○</span>}
                                      <span className={`flex-1 min-w-0 font-medium text-sm sm:text-base break-words overflow-wrap-anywhere ${
                                        isCorrect ? 'text-green-800 dark:text-green-300' : 
                                        isSelected && !isCorrect ? 'text-red-800 dark:text-red-300' : 
                                        'text-gray-700 dark:text-gray-300'
                                      }`}>
                                          <LatexContentDisplay content={option.text} />
                                      </span>
                                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 flex-shrink-0">
                                        {isSelected && <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">(Your answer)</span>}
                                        {isCorrect && <span className="text-xs sm:text-sm text-green-600 dark:text-green-400 font-medium whitespace-nowrap">(Correct)</span>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            )}

                            {/* Tips & Formulas */}
                            {question.tip_formula && (
                              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 sm:p-6 border border-yellow-200 dark:border-yellow-800 mb-4 max-w-full overflow-x-auto">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                  <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-yellow-900 dark:text-yellow-200">💡 Tips & Formulas</h4>
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300 whitespace-nowrap">
                                    Helpful Hints
                                  </span>
                                </div>
                                <p className="text-yellow-800 dark:text-yellow-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                  <LatexContentDisplay content={question.tip_formula} />
                                </p>
                              </div>
                            )}

                            {/* Explanations */}
                            {(question.explanation || (question.alternativeExplanations && question.alternativeExplanations.length > 0)) && (
                              <div className="space-y-4 max-w-full overflow-x-auto">
                                {/* Original Explanation */}
                                {question.explanation && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 sm:p-6 border border-blue-200 dark:border-blue-800">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                      <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-blue-900 dark:text-blue-200">Original Explanation</h4>
                                      {question.isAIGenerated && (
                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 whitespace-nowrap">
                                          AI Generated
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-blue-800 dark:text-blue-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">
                                      <LatexContentDisplay content={question.explanation} />
                                    </p>
                                  </div>
                                )}

                                {/* Alternative Explanations */}
                                {question.alternativeExplanations && question.alternativeExplanations.length > 0 && (
                                  <div className="space-y-3">
                                    <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white">Additional Explanations</h4>
                                    {question.alternativeExplanations.map((altExp, index) => (
                                      <div key={altExp.id} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 sm:p-6 border border-green-200 dark:border-green-800">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                          <h5 className="text-sm sm:text-base font-semibold text-green-900 dark:text-green-200">
                                            Alternative Explanation {index + 1}
                                          </h5>
                                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 whitespace-nowrap">
                                            {altExp.source === 'REPORT_APPROVED' ? 'Student Suggested' : 'Community'}
                                          </span>
                                        </div>
                                        <p className="text-green-800 dark:text-green-200 text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere">{altExp.explanation}</p>
                                        <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                                          Added on {new Date(altExp.createdAt).toLocaleDateString()}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Question Navigation - Show at Bottom on Mobile */}
                <div className="lg:order-1 lg:w-64 lg:flex-shrink-0">
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4 lg:sticky lg:top-24">
                    <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Questions</h3>
                    <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2">
                      {allQuestionsWithStatus.map((item, index) => (
                        <button
                          key={item.question.id}
                          onClick={() => setSelectedQuestionIndex(index)}
                          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                            selectedQuestionIndex === index
                              ? 'bg-blue-600 text-white ring-2 ring-blue-500'
                              : item.status === 'correct'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-300 dark:border-green-700'
                              : item.status === 'incorrect'
                              ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-700'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                    
                    <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 rounded"></div>
                        <span className="text-gray-700 dark:text-gray-300">Correct</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded"></div>
                        <span className="text-gray-700 dark:text-gray-300">Incorrect</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded"></div>
                        <span className="text-gray-700 dark:text-gray-300">Unanswered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

              </div>
            </div>

            {/* Question Report Modal */}
            {reportModalOpen && selectedQuestionForReport && (
              <QuestionReportModal
                isOpen={reportModalOpen}
                onClose={() => {
                  setReportModalOpen(false);
                  setSelectedQuestionForReport(null);
                }}
                onReportSubmitted={(questionId) => {
                  setSubmittedReports(prev => new Set([...prev, questionId]));
                }}
                questionId={selectedQuestionForReport.id}
                questionStem={selectedQuestionForReport.stem}
                currentExplanation={selectedQuestionForReport.explanation}
                currentOptions={selectedQuestionForReport.options}
              />
            )}
          </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
} 