'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import api from '@/lib/api';
import Swal from 'sweetalert2';

interface Question {
  id: string;
  stem: string;
  explanation?: string;
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
  const submissionId = params.submissionId as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

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

  const currentQuestion = questions[currentQuestionIndex];
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
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{submission?.examPaper.title}</h1>
                    <p className="text-sm text-gray-600">Question {currentQuestionIndex + 1} of {submission?.totalQuestions}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Time Remaining</div>
                      <div className={`text-lg font-bold ${timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatTime(timeRemaining)}
                      </div>
                    </div>
                    <button
                      onClick={handleSubmitTest}
                      disabled={submitting}
                      className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Test'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Question Navigation */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-24">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Navigation</h3>
                    <div className="grid grid-cols-5 gap-2">
                      {questions.map((_, index) => {
                        const questionId = submission?.questionIds[index];
                        const isAnswered = questionId && answers[questionId];
                        const isCurrent = index === currentQuestionIndex;
                        
                        return (
                          <button
                            key={index}
                            onClick={() => setCurrentQuestionIndex(index)}
                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                              isCurrent
                                ? 'bg-blue-600 text-white'
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
                    
                    <div className="mt-6 space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-600 rounded"></div>
                        <span className="text-gray-600">Current</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                        <span className="text-gray-600">Answered</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-100 rounded"></div>
                        <span className="text-gray-600">Unanswered</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Content */}
                <div className="lg:col-span-3">
                  {currentQuestion && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                      {/* Question Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg font-semibold text-gray-900">
                            Question {currentQuestionIndex + 1}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(currentQuestion.difficulty)}`}>
                            {currentQuestion.difficulty}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {isAnswered ? '✓ Answered' : '○ Unanswered'}
                        </div>
                      </div>

                      {/* Question Stem */}
                      <div className="mb-8">
                        <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">
                          {currentQuestion.stem}
                        </p>
                      </div>

                      {/* Options */}
                      <div className="space-y-4">
                        {currentQuestion.options
                          .sort((a, b) => a.order - b.order)
                          .map((option) => (
                            <label
                              key={option.id}
                              className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                answers[currentQuestion.id] === option.id
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name={`question-${currentQuestion.id}`}
                                value={option.id}
                                checked={answers[currentQuestion.id] === option.id}
                                onChange={() => handleAnswerSelect(currentQuestion.id, option.id)}
                                className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-gray-900 leading-relaxed">{option.text}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between mt-8">
                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>

                    <div className="text-sm text-gray-600">
                      {currentQuestionIndex + 1} of {submission?.totalQuestions}
                    </div>

                    <button
                      onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
} 