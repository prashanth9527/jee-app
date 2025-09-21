'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import QuestionReportModal from '@/components/QuestionReportModal';
import api from '@/lib/api';
import Swal from 'sweetalert2';

interface Question {
  id: string;
  stem: string;
  explanation?: string;
  tip_formula?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  alternativeExplanations?: Array<{
    id: string;
    explanation: string;
    source: string;
    createdAt: string;
  }>;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
  }[];
}

interface ExamSubmission {
  id: string;
  examPaper: {
    id: string;
    title: string;
    timeLimitMin?: number;
  };
  startedAt: string;
  totalQuestions: number;
  questionIds: string[];
}

interface QuestionAnswer {
  questionId: string;
  selectedOptionId?: string;
  isCorrect?: boolean;
  timeSpent: number;
  isMarkedForReview: boolean;
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params?.submissionId as string;
  
  const [submission, setSubmission] = useState<ExamSubmission | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [examCompleted, setExamCompleted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [selectedQuestionForReport, setSelectedQuestionForReport] = useState<Question | null>(null);
  
  const questionStartTime = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchExamData = async () => {
    try {
      const response = await api.get(`/exams/submissions/${submissionId}`);
      const submissionData = response.data;
      
      setSubmission(submissionData);
      
      // Fetch questions
      const questionsResponse = await api.get(`/exams/submissions/${submissionId}/questions`);
      const questionsData = questionsResponse.data;
      
      setQuestions(questionsData);
      
      // Initialize answers array
      const initialAnswers: QuestionAnswer[] = questionsData.map((q: Question) => ({
        questionId: q.id,
        selectedOptionId: undefined,
        isCorrect: undefined,
        timeSpent: 0,
        isMarkedForReview: false,
      }));
      
      setAnswers(initialAnswers);
      
      // Set timer if exam has time limit
      if (submissionData.examPaper.timeLimitMin) {
        setTimeRemaining(submissionData.examPaper.timeLimitMin * 60);
      }
      
      setExamStarted(true);
    } catch (error) {
      console.error('Error fetching exam data:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load exam data',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = async () => {
    await submitExam('Time limit reached');
  };

  const submitExam = async (reason: string) => {
    try {
      // Submit all answers
      for (let i = 0; i < answers.length; i++) {
        const answer = answers[i];
        if (answer.selectedOptionId) {
          await api.post(`/exams/submissions/${submissionId}/answer`, {
            questionId: answer.questionId,
            selectedOptionId: answer.selectedOptionId,
          });
        }
      }

      // Finalize exam
      await api.post(`/exams/submissions/${submissionId}/finalize`);
      
      setExamCompleted(true);
      
      Swal.fire({
        title: 'Exam Submitted!',
        text: reason,
        icon: 'success',
        confirmButtonText: 'View Results',
      }).then(() => {
        setShowResults(true);
      });
      
    } catch (error) {
      console.error('Error submitting exam:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to submit exam',
        icon: 'error',
      });
    }
  };

  const fetchExamResults = async () => {
    try {
      const response = await api.get(`/exams/submissions/${submissionId}/results`);
      const results = response.data;
      
      // Update answers with correct/incorrect status
      setAnswers(prev => prev.map(answer => {
        const resultAnswer = results.answers.find((ra: any) => ra.questionId === answer.questionId);
        return {
          ...answer,
          isCorrect: resultAnswer?.isCorrect || false,
        };
      }));
      
    } catch (error) {
      console.error('Error fetching exam results:', error);
    }
  };

  const handleAnswerSelect = (optionId: string) => {
    setAnswers(prev => prev.map((answer, index) => 
      index === currentQuestionIndex 
        ? { ...answer, selectedOptionId: optionId }
        : answer
    ));
  };

  const handleMarkForReview = () => {
    setAnswers(prev => prev.map((answer, index) => 
      index === currentQuestionIndex 
        ? { ...answer, isMarkedForReview: !answer.isMarkedForReview }
        : answer
    ));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleJumpToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const handleSubmitExam = async () => {
    const result = await Swal.fire({
      title: 'Submit Exam?',
      text: 'Are you sure you want to submit your exam? You cannot change your answers after submission.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Submit Exam',
      cancelButtonText: 'Continue Exam',
    });

    if (result.isConfirmed) {
      await submitExam('Exam submitted by student');
    }
  };

  useEffect(() => {
    if (submissionId) {
      fetchExamData();
    }
  }, [submissionId]);

  useEffect(() => {
    if (examStarted && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [examStarted, timeRemaining]);

  useEffect(() => {
    // Update time spent on current question when switching
    if (examStarted && questions.length > 0) {
      const now = Date.now();
      const timeSpent = Math.floor((now - questionStartTime.current) / 1000);
      
      setAnswers(prev => prev.map((answer, index) => 
        index === currentQuestionIndex 
          ? { ...answer, timeSpent: answer.timeSpent + timeSpent }
          : answer
      ));
      
      questionStartTime.current = now;
    }
  }, [currentQuestionIndex, examStarted]);

  useEffect(() => {
    if (showResults) {
      fetchExamResults();
    }
  }, [showResults]);



  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (index: number) => {
    const answer = answers[index];
    if (!answer) return 'unanswered';
    
    if (answer.isMarkedForReview && answer.selectedOptionId) return 'answered-review';
    if (answer.isMarkedForReview) return 'review';
    if (answer.selectedOptionId) return 'answered';
    return 'unanswered';
  };

  const getQuestionStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'bg-green-500';
      case 'answered-review': return 'bg-blue-500';
      case 'review': return 'bg-yellow-500';
      case 'unanswered': return 'bg-gray-300';
      default: return 'bg-gray-300';
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading exam...</p>
              </div>
            </div>
          </StudentLayout>
        </SubscriptionGuard>
      </ProtectedRoute>
    );
  }

  if (examCompleted && showResults) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Exam Results</h1>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-blue-900">Total Questions</h3>
                    <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-green-900">Correct Answers</h3>
                    <p className="text-2xl font-bold text-green-600">
                      {answers.filter(a => a.isCorrect).length}
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-purple-900">Score</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {Math.round((answers.filter(a => a.isCorrect).length / questions.length) * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Question Review */}
              <div className="space-y-4">
                {questions.map((question, index) => {
                  const answer = answers[index];
                  const isCorrect = answer?.isCorrect;
                  const selectedOption = question.options.find(opt => opt.id === answer?.selectedOptionId);
                  const correctOption = question.options.find(opt => opt.isCorrect);
                  
                  return (
                    <div key={question.id} className="bg-white rounded-lg shadow p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Question {index + 1}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                          <span className="text-sm text-gray-500">
                            Time: {formatTime(answer?.timeSpent || 0)}
                          </span>
                          <button
                            onClick={() => {
                              setSelectedQuestionForReport(question);
                              setReportModalOpen(true);
                            }}
                            className="px-3 py-1 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                          >
                            Report Issue
                          </button>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-gray-900 mb-4">{question.stem}</p>
                        
                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <div
                              key={option.id}
                              className={`p-3 rounded-lg border ${
                                option.isCorrect
                                  ? 'bg-green-50 border-green-200'
                                  : option.id === answer?.selectedOptionId && !option.isCorrect
                                  ? 'bg-red-50 border-red-200'
                                  : 'bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className="flex items-center">
                                <span className={`w-4 h-4 rounded-full border-2 mr-3 ${
                                  option.isCorrect
                                    ? 'bg-green-500 border-green-500'
                                    : option.id === answer?.selectedOptionId
                                    ? 'bg-red-500 border-red-500'
                                    : 'border-gray-300'
                                }`}>
                                  {option.isCorrect && (
                                    <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </span>
                                <span className={`${
                                  option.isCorrect
                                    ? 'text-green-800 font-medium'
                                    : option.id === answer?.selectedOptionId && !option.isCorrect
                                    ? 'text-red-800 font-medium'
                                    : 'text-gray-700'
                                }`}>
                                  {option.text}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Tips & Formulas */}
                      {question.tip_formula && (
                        <div className="bg-yellow-50 rounded-lg p-4 mb-4 border border-yellow-200">
                          <h4 className="font-semibold text-yellow-900 mb-2">💡 Tips & Formulas</h4>
                          <p className="text-yellow-800">{question.tip_formula}</p>
                        </div>
                      )}
                      
                      {/* Explanations */}
                      {(question.explanation || (question.alternativeExplanations && question.alternativeExplanations.length > 0)) && (
                        <div className="space-y-4">
                          {/* Original Explanation */}
                          {question.explanation && (
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h4 className="font-semibold text-blue-900 mb-2">Original Explanation</h4>
                              <p className="text-blue-800">{question.explanation}</p>
                            </div>
                          )}

                          {/* Alternative Explanations */}
                          {question.alternativeExplanations && question.alternativeExplanations.length > 0 && (
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900">Additional Explanations</h4>
                              {question.alternativeExplanations.map((altExp, altIndex) => (
                                <div key={altExp.id} className="bg-green-50 rounded-lg p-4 border border-green-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-md font-semibold text-green-900">
                                      Alternative Explanation {altIndex + 1}
                                    </h5>
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      {altExp.source === 'REPORT_APPROVED' ? 'Student Suggested' : 'Community'}
                                    </span>
                                  </div>
                                  <p className="text-green-800">{altExp.explanation}</p>
                                  <div className="mt-2 text-xs text-green-600">
                                    Added on {new Date(altExp.createdAt).toLocaleDateString()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </StudentLayout>
        </SubscriptionGuard>
      </ProtectedRoute>
    );
  }

  if (!submission || questions.length === 0) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-600">Exam not found or no questions available.</p>
              </div>
            </div>
          </StudentLayout>
        </SubscriptionGuard>
      </ProtectedRoute>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];

  if (!submissionId) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h2 className="text-xl font-semibold text-gray-900">Invalid Exam ID</h2>
                <p className="mt-2 text-gray-600">The exam ID is missing or invalid.</p>
                <button 
                  onClick={() => router.push('/student/exam-papers')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Back to Exams
                </button>
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
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">{submission.examPaper.title}</h1>
                    <p className="text-sm text-gray-600">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    {timeRemaining > 0 && (
                      <div className="bg-red-50 rounded-lg px-4 py-2">
                        <div className="text-sm text-red-600 font-medium">Time Remaining</div>
                        <div className="text-lg font-bold text-red-700">{formatTime(timeRemaining)}</div>
                      </div>
                    )}
                    
                    <button
                      onClick={handleSubmitExam}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                    >
                      Submit Exam
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex">
              {/* Main Content */}
              <div className="flex-1 p-6">
                <div className="bg-white rounded-lg shadow p-6">
                  {/* Question */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Question {currentQuestionIndex + 1}
                      </h2>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          currentQuestion.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                          currentQuestion.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {currentQuestion.difficulty}
                        </span>
                        <button
                          onClick={handleMarkForReview}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            currentAnswer?.isMarkedForReview
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {currentAnswer?.isMarkedForReview ? '✓ Marked for Review' : 'Mark for Review'}
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-900 text-lg mb-6">{currentQuestion.stem}</p>
                    
                    {/* Options */}
                    <div className="space-y-3">
                      {currentQuestion.options.map((option) => (
                        <label
                          key={option.id}
                          className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                            currentAnswer?.selectedOptionId === option.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`question-${currentQuestion.id}`}
                            value={option.id}
                            checked={currentAnswer?.selectedOptionId === option.id}
                            onChange={() => handleAnswerSelect(option.id)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                            currentAnswer?.selectedOptionId === option.id
                              ? 'border-blue-500 bg-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {currentAnswer?.selectedOptionId === option.id && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <span className="text-gray-900">{option.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    
                    <button
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Question Palette */}
              <div className="w-80 bg-white shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Palette</h3>
                
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {questions.map((_, index) => {
                    const status = getQuestionStatus(index);
                    return (
                      <button
                        key={index}
                        onClick={() => handleJumpToQuestion(index)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          index === currentQuestionIndex
                            ? 'ring-2 ring-blue-500'
                            : ''
                        } ${getQuestionStatusColor(status)} text-white`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                    <span>Answered & Marked</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                    <span>Marked for Review</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
                    <span>Unanswered</span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    <div>Answered: {answers.filter(a => a.selectedOptionId).length}</div>
                    <div>Marked for Review: {answers.filter(a => a.isMarkedForReview).length}</div>
                    <div>Unanswered: {answers.filter(a => !a.selectedOptionId).length}</div>
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