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
  isAIGenerated?: boolean;
  aiPrompt?: string;
  options: {
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
  submission: Submission;
  answers: Answer[];
}

export default function PracticeTestResultsPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.submissionId as string;

  const [results, setResults] = useState<ExamResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null);

  useEffect(() => {
    if (submissionId) {
      fetchResults();
    }
  }, [submissionId]);

  const fetchResults = async () => {
    try {
      const response = await api.get(`/exams/submissions/${submissionId}/results`);
      setResults(response.data);
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

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HARD': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
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

  if (loading) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <p className="mt-6 text-lg font-medium text-gray-700">Loading results...</p>
                <p className="mt-2 text-sm text-gray-500">Please wait while we analyze your performance</p>
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
                <p className="text-gray-600 mb-6">The test results you're looking for could not be found.</p>
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

  const { submission, answers } = results;
  const correctAnswers = answers.filter(a => a.isCorrect).length;
  const incorrectAnswers = answers.filter(a => !a.isCorrect).length;
  const unansweredCount = submission.totalQuestions - answers.length;

  return (
    <ProtectedRoute requiredRole="STUDENT">
      <SubscriptionGuard>
        <StudentLayout>
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Test Results</h1>
              <p className="text-lg text-gray-600">{submission.examPaper.title}</p>
            </div>

            {/* Score Summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <div className="text-center mb-8">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Score</h2>
                <div className={`text-5xl font-bold mb-2 ${getScoreColor(submission.scorePercent)}`}>
                  {submission.scorePercent.toFixed(1)}%
                </div>
                <p className="text-lg text-gray-600 mb-4">{getScoreMessage(submission.scorePercent)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{correctAnswers}</div>
                  <div className="text-sm text-green-700">Correct</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{incorrectAnswers}</div>
                  <div className="text-sm text-red-700">Incorrect</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-2xl font-bold text-gray-600">{unansweredCount}</div>
                  <div className="text-sm text-gray-700">Unanswered</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{submission.totalQuestions}</div>
                  <div className="text-sm text-blue-700">Total</div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Taken:</span>
                    <span className="font-semibold">{formatDuration(submission.startedAt, submission.submittedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span className="font-semibold">{new Date(submission.startedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span className="font-semibold">{new Date(submission.submittedAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Time Limit:</span>
                    <span className="font-semibold">
                      {submission.examPaper.timeLimitMin ? `${submission.examPaper.timeLimitMin} minutes` : 'No limit'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Question Review */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Question Review</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Question Navigation */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-lg p-4 sticky top-24">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Questions</h3>
                    <div className="grid grid-cols-5 gap-2">
                      {answers.map((answer, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedQuestionIndex(index)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                            selectedQuestionIndex === index
                              ? 'bg-blue-600 text-white'
                              : answer.isCorrect
                              ? 'bg-green-100 text-green-800 border border-green-300'
                              : 'bg-red-100 text-red-800 border border-red-300'
                          }`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                    
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                        <span className="text-gray-600">Correct</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                        <span className="text-gray-600">Incorrect</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Details */}
                <div className="lg:col-span-3">
                  {selectedQuestionIndex !== null && answers[selectedQuestionIndex] && (
                    <div className="space-y-6">
                      {(() => {
                        const answer = answers[selectedQuestionIndex];
                        const question = answer.question;
                        
                        return (
                          <>
                            {/* Question Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-lg font-semibold text-gray-900">
                                  Question {selectedQuestionIndex + 1}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                                  {question.difficulty}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  answer.isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {answer.isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                </span>
                              </div>
                            </div>

                            {/* Question Stem */}
                            <div className="bg-gray-50 rounded-lg p-6">
                              <p className="text-lg text-gray-900 leading-relaxed whitespace-pre-wrap">
                                {question.stem}
                              </p>
                            </div>

                            {/* Options */}
                            <div className="space-y-3">
                              {question.options.map((option) => {
                                const isSelected = answer.selectedOption?.id === option.id;
                                const isCorrect = option.isCorrect;
                                
                                let optionClass = 'p-4 rounded-lg border-2';
                                if (isCorrect) {
                                  optionClass += ' bg-green-50 border-green-300';
                                } else if (isSelected && !isCorrect) {
                                  optionClass += ' bg-red-50 border-red-300';
                                } else {
                                  optionClass += ' bg-gray-50 border-gray-200';
                                }

                                return (
                                  <div key={option.id} className={optionClass}>
                                    <div className="flex items-center space-x-3">
                                      {isCorrect && <span className="text-green-600 text-lg">✓</span>}
                                      {isSelected && !isCorrect && <span className="text-red-600 text-lg">✗</span>}
                                      {!isSelected && !isCorrect && <span className="text-gray-400 text-lg">○</span>}
                                      <span className={`font-medium ${
                                        isCorrect ? 'text-green-800' : 
                                        isSelected && !isCorrect ? 'text-red-800' : 
                                        'text-gray-700'
                                      }`}>
                                        {option.text}
                                      </span>
                                      {isSelected && <span className="text-sm text-gray-500">(Your answer)</span>}
                                      {isCorrect && <span className="text-sm text-green-600 font-medium">(Correct answer)</span>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                                                         {/* Explanation */}
                             {question.explanation && (
                               <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                                 <div className="flex items-center justify-between mb-3">
                                   <h4 className="text-lg font-semibold text-blue-900">Explanation</h4>
                                   {question.isAIGenerated && (
                                     <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                       AI Generated
                                     </span>
                                   )}
                                 </div>
                                 <p className="text-blue-800 leading-relaxed whitespace-pre-wrap">
                                   {question.explanation}
                                 </p>
                               </div>
                             )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {selectedQuestionIndex === null && (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">📝</div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Question</h3>
                      <p className="text-gray-600">Click on any question number to review your answer and see the explanation.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push('/student/practice')}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Take Another Test
                </button>
                <button
                  onClick={() => router.push('/student/performance')}
                  className="flex-1 bg-gray-600 text-white py-3 px-6 rounded-lg hover:bg-gray-700 transition-colors font-semibold"
                >
                  View Performance
                </button>
                <button
                  onClick={() => router.push('/student')}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
} 