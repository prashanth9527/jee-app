'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import LatexContentDisplay from '@/components/LatexContentDisplay';

interface Question {
  id: string;
  stem: string;
  explanation?: string;
  tip_formula?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  options: {
    id: string;
    text: string;
    order: number;
  }[];
}

interface Submission {
  id: string;
  examPaper: {
    id: string;
    title: string;
    timeLimitMin: number | null;
  };
  startedAt: string;
  totalQuestions: number;
  questionIds: string[];
}

export default function PracticeTestPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params?.submissionId as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [questionPage, setQuestionPage] = useState(0);
  const questionsPerPage = 20;

  const currentQuestion = questions[currentQuestionIndex];

  useEffect(() => {
    if (submissionId) {
      fetchSubmissionData();
    }
  }, [submissionId]);

  useEffect(() => {
    if (submission && submission.examPaper.timeLimitMin) {
      const totalSeconds = submission.examPaper.timeLimitMin * 60;
      setTimeRemaining(totalSeconds);

      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [submission]);

  // Auto-navigate to correct page when current question changes
  useEffect(() => {
    const newPage = Math.floor(currentQuestionIndex / questionsPerPage);
    if (newPage !== questionPage) {
      setQuestionPage(newPage);
    }
  }, [currentQuestionIndex, questionPage, questionsPerPage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't interfere with form inputs
      }

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setCurrentQuestionIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
          break;
        case '1':
        case '2':
        case '3':
        case '4':
          e.preventDefault();
          const optionIndex = parseInt(e.key) - 1;
          if (currentQuestion && currentQuestion.options[optionIndex]) {
            handleAnswerSelect(currentQuestion.id, currentQuestion.options[optionIndex].id);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestion, questions.length]);

  const fetchSubmissionData = async () => {
    try {
      const [submissionResponse, questionsResponse] = await Promise.all([
        api.get(`/exams/submissions/${submissionId}`),
        api.get(`/exams/submissions/${submissionId}/questions`)
      ]);

      setSubmission(submissionResponse.data);
      setQuestions(questionsResponse.data);
    } catch (error: any) {
      console.error('Error fetching submission data:', error);
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to load practice test',
        icon: 'error',
      }).then(() => {
        router.push('/student/practice');
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = async (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));

    try {
      await api.post(`/exams/submissions/${submissionId}/answer`, {
        questionId,
        selectedOptionId: optionId
      });
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const handleAutoSubmit = async () => {
    const result = await Swal.fire({
      title: 'Time\'s Up!',
      text: 'Your time has expired. The test will be submitted automatically.',
      icon: 'warning',
      confirmButtonText: 'Submit Test',
      allowOutsideClick: false,
      allowEscapeKey: false,
    });

    if (result.isConfirmed) {
      await submitTest();
    }
  };

  const handleSubmitTest = async () => {
    const unansweredCount = submission!.totalQuestions - Object.keys(answers).length;
    
    if (unansweredCount > 0) {
      const result = await Swal.fire({
        title: 'Unanswered Questions',
        text: `You have ${unansweredCount} unanswered question(s). Are you sure you want to submit?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Submit Anyway',
        cancelButtonText: 'Continue Test',
      });

      if (!result.isConfirmed) {
        return;
      }
    }

    await submitTest();
  };

  const submitTest = async () => {
    try {
      setSubmitting(true);
      
      // Finalize the submission
      await api.post(`/exams/submissions/${submissionId}/finalize`);
      
      // Redirect to results page
      router.push(`/student/practice/results/${submissionId}`);
    } catch (error: any) {
      console.error('Error submitting test:', error);
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to submit test',
        icon: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HARD': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const isAnswered = currentQuestion && answers[currentQuestion.id];

  if (loading) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <p className="mt-6 text-lg font-medium text-gray-700">Loading practice test...</p>
                <p className="mt-2 text-sm text-gray-500">Please wait while we prepare your questions</p>
              </div>
            </div>
          </StudentLayout>
        </SubscriptionGuard>
      </ProtectedRoute>
    );
  }



  return (
    <ProtectedRoute requiredRole="STUDENT">
      <SubscriptionGuard>
        <StudentLayout>
          <div className="min-h-screen bg-gray-50">
            {/* Header with Timer */}
            <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-40">
              <div className="px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                  <div className="flex-1">
                    <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{submission?.examPaper.title}</h1>
                    <p className="text-sm text-gray-600 mt-1">Question {currentQuestionIndex + 1} of {submission?.totalQuestions}</p>
                  </div>
                  <div className="flex items-center space-x-4 sm:space-x-6">
                    <div className="text-center sm:text-right">
                      <div className="text-xs sm:text-sm text-gray-600 font-medium">Time Remaining</div>
                      <div className={`text-lg sm:text-xl font-bold ${timeRemaining < 300 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
                        {formatTime(timeRemaining)}
                      </div>
                    </div>
                    <button
                      onClick={handleSubmitTest}
                      disabled={submitting}
                      className="bg-red-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl hover:bg-red-700 transition-all duration-200 font-semibold disabled:opacity-50 shadow-sm hover:shadow-md"
                    >
                      {submitting ? 'Submitting...' : 'Submit Test'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Question Navigation */}
                <div className="xl:col-span-1 order-2 xl:order-1">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 xl:sticky xl:top-24">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-base font-semibold text-gray-900">Question Navigation</h3>
                      <div className="text-xs text-gray-500">
                        {Object.keys(answers).length}/{submission?.totalQuestions}
                      </div>
                    </div>
                    
                    {/* Question Grid with Pagination */}
                    <div className="mb-4">
                      <div className="grid grid-cols-5 xl:grid-cols-3 gap-1.5 mb-3 max-h-64 overflow-y-auto">
                        {questions
                          .slice(questionPage * questionsPerPage, (questionPage + 1) * questionsPerPage)
                          .map((_, index) => {
                            const actualIndex = questionPage * questionsPerPage + index;
                            const questionId = submission?.questionIds[actualIndex];
                        const isAnswered = questionId && answers[questionId];
                            const isCurrent = actualIndex === currentQuestionIndex;
                        
                        return (
                          <button
                                key={actualIndex}
                                onClick={() => setCurrentQuestionIndex(actualIndex)}
                                className={`w-7 h-7 xl:w-8 xl:h-8 rounded-md text-xs font-medium transition-all duration-200 ${
                              isCurrent
                                    ? 'bg-blue-600 text-white shadow-md scale-105'
                                : isAnswered
                                    ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:border-gray-300 border border-transparent'
                                }`}
                                title={`Question ${actualIndex + 1}${isAnswered ? ' (Answered)' : ''}`}
                              >
                                {actualIndex + 1}
                              </button>
                            );
                          })}
                      </div>
                      
                      {/* Pagination Controls */}
                      {questions.length > questionsPerPage && (
                        <div className="flex items-center justify-between text-xs">
                          <button
                            onClick={() => setQuestionPage(prev => Math.max(0, prev - 1))}
                            disabled={questionPage === 0}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                          >
                            ← Prev
                          </button>
                          <span className="text-gray-600">
                            {questionPage + 1} of {Math.ceil(questions.length / questionsPerPage)}
                          </span>
                          <button
                            onClick={() => setQuestionPage(prev => Math.min(Math.ceil(questions.length / questionsPerPage) - 1, prev + 1))}
                            disabled={questionPage >= Math.ceil(questions.length / questionsPerPage) - 1}
                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <div className="text-lg font-bold text-blue-600">{Object.keys(answers).length}</div>
                          <div className="text-xs text-gray-600">Answered</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-gray-600">{submission?.totalQuestions ? submission.totalQuestions - Object.keys(answers).length : 0}</div>
                          <div className="text-xs text-gray-600">Remaining</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-green-600">{Math.round((Object.keys(answers).length / (submission?.totalQuestions || 1)) * 100)}%</div>
                          <div className="text-xs text-gray-600">Complete</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span className="text-gray-600">Current</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-100 border border-green-300 rounded-full"></div>
                        <span className="text-gray-600">Answered</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-100 rounded-full"></div>
                        <span className="text-gray-600">Unanswered</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Content */}
                <div className="xl:col-span-4 order-1 xl:order-2">
                  {/* Progress Bar */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Test Progress</span>
                      <span className="text-sm text-gray-500">
                        {Object.keys(answers).length} of {submission?.totalQuestions} answered
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(Object.keys(answers).length / (submission?.totalQuestions || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  {currentQuestion && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-8">
                      {/* Question Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                          <span className="text-xl font-bold text-gray-900">
                            Question {currentQuestionIndex + 1}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(currentQuestion.difficulty)}`}>
                            {currentQuestion.difficulty}
                          </span>
                        </div>
                        <div className={`text-sm font-medium ${isAnswered ? 'text-green-600' : 'text-gray-500'}`}>
                          {isAnswered ? '✓ Answered' : '○ Unanswered'}
                        </div>
                      </div>

                      {/* Question Stem */}
                      <div className="mb-8">
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                          <div className="text-lg text-gray-900 leading-relaxed font-medium">
                            <LatexContentDisplay content={currentQuestion.stem} />
                          </div>
                        </div>
                      </div>

                      {/* Tips & Formulas */}
                      {currentQuestion.tip_formula && (
                        <div className="mb-8 p-5 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl">
                          <div className="flex items-center mb-3">
                            <span className="text-xl mr-3">💡</span>
                            <h4 className="text-sm font-bold text-yellow-800 uppercase tracking-wide">Tips & Formulas</h4>
                          </div>
                          <div 
                            className="text-sm text-yellow-800 leading-relaxed font-medium prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ 
                              __html: currentQuestion.tip_formula
                                .replace(/<br\s*\/?>/gi, '<br>')
                                .replace(/\n/g, '<br>')
                            }}
                          />
                        </div>
                      )}

                      {/* Options */}
                      <div className="space-y-3">
                        <h4 className="text-base font-semibold text-gray-800 mb-4">Choose your answer:</h4>
                        {currentQuestion.options
                          .sort((a, b) => a.order - b.order)
                          .map((option, index) => (
                            <label
                              key={option.id}
                              className={`flex items-start p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 group ${
                                answers[currentQuestion.id] === option.id
                                  ? 'border-blue-500 bg-blue-50 shadow-md'
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25 hover:shadow-sm'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${currentQuestion.id}`}
                                value={option.id}
                                checked={answers[currentQuestion.id] === option.id}
                                onChange={() => handleAnswerSelect(currentQuestion.id, option.id)}
                                className="mt-1 mr-4 text-blue-600 focus:ring-blue-500 focus:ring-2"
                              />
                              <div className="flex items-center">
                                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 mr-3 group-hover:bg-blue-100 transition-colors">
                                  {String.fromCharCode(65 + index)}
                                </span>
                                <div className="text-gray-900 leading-relaxed font-medium">
                                  <LatexContentDisplay content={option.text} />
                                </div>
                              </div>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex flex-col sm:flex-row items-center justify-between mt-8 space-y-4 sm:space-y-0">
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>

                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600 font-medium">
                      {currentQuestionIndex + 1} of {submission?.totalQuestions}
                      </div>
                      <div className="hidden sm:block w-px h-6 bg-gray-300"></div>
                      <div className="text-xs text-gray-500">
                        {Math.round(((currentQuestionIndex + 1) / (submission?.totalQuestions || 1)) * 100)}% Complete
                      </div>
                    </div>

                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                    >
                      Next
                      <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Question Navigation Overlay */}
            <div className="xl:hidden fixed bottom-4 right-4 z-50">
              <div className="bg-white rounded-full shadow-lg border border-gray-200 p-2">
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-600 font-medium px-2">
                    {currentQuestionIndex + 1}/{submission?.totalQuestions}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="w-8 h-8 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="w-8 h-8 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Question Grid Overlay */}
            <div className="xl:hidden fixed bottom-20 left-4 right-4 z-40">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">Quick Navigation</h4>
                  <div className="text-xs text-gray-500">
                    {Object.keys(answers).length}/{submission?.totalQuestions} answered
                  </div>
                </div>
                <div className="grid grid-cols-8 gap-1.5">
                  {questions.map((_, index) => {
                    const questionId = submission?.questionIds[index];
                    const isAnswered = questionId && answers[questionId];
                    const isCurrent = index === currentQuestionIndex;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestionIndex(index)}
                        className={`w-8 h-8 rounded-md text-xs font-medium transition-all duration-200 ${
                          isCurrent
                            ? 'bg-blue-600 text-white shadow-md'
                            : isAnswered
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
} 