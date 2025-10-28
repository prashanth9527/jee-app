'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import QuestionReportModal from '@/components/QuestionReportModal';
import LatexContentDisplay from '@/components/LatexContentDisplay';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { useToastContext } from '@/contexts/ToastContext';

interface Question {
  id: string;
  stem: string;
  explanation?: string;
  tip_formula?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  // Legacy support
  isOpenEnded?: boolean;
  correctNumericAnswer?: number;
  answerTolerance?: number;
  // New question type system
  questionType?: 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'OPEN_ENDED' | 'PARAGRAPH';
  allowPartialMarking?: boolean;
  fullMarks?: number;
  partialMarks?: number;
  negativeMarks?: number;
  // Paragraph questions
  parentQuestionId?: string;
  subQuestions?: Question[];
  subject?: {
    id: string;
    name: string;
  };
  lesson?: {
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
  selectedOptionIds?: string[]; // For MCQ_MULTIPLE
  numericValue?: number;
  isCorrect?: boolean;
  timeSpent: number;
  isMarkedForReview: boolean;
  // For paragraph questions
  subQuestionAnswers?: {
    [subQuestionId: string]: {
      selectedOptionId?: string;
      selectedOptionIds?: string[];
      numericValue?: number;
      isCorrect?: boolean;
    };
  };
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params?.submissionId as string;
  const { showSuccess, showInfo } = useToastContext();
  
  const [submission, setSubmission] = useState<ExamSubmission | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [examCompleted, setExamCompleted] = useState(false);
  
  // State for paragraph questions
  const [expandedSubQuestions, setExpandedSubQuestions] = useState<Set<string>>(new Set());
  const [currentSubQuestionIndex, setCurrentSubQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [selectedQuestionForReport, setSelectedQuestionForReport] = useState<Question | null>(null);
  const [userConfirmedExit, setUserConfirmedExit] = useState(false);
  const [showShortcutsLegend, setShowShortcutsLegend] = useState(false);

  // Helper functions for question types
  const getQuestionType = (question: Question): 'MCQ_SINGLE' | 'MCQ_MULTIPLE' | 'OPEN_ENDED' | 'PARAGRAPH' => {
    if (question.questionType) {
      return question.questionType;
    }
    // Legacy support
    return question.isOpenEnded ? 'OPEN_ENDED' : 'MCQ_SINGLE';
  };

  const isParagraphQuestion = (question: Question): boolean => {
    return getQuestionType(question) === 'PARAGRAPH';
  };

  const isMultipleChoiceQuestion = (question: Question): boolean => {
    return getQuestionType(question) === 'MCQ_MULTIPLE';
  };

  const isOpenEndedQuestion = (question: Question): boolean => {
    return getQuestionType(question) === 'OPEN_ENDED';
  };

  const isSingleChoiceQuestion = (question: Question): boolean => {
    return getQuestionType(question) === 'MCQ_SINGLE';
  };
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);
  
  
  
  const questionStartTime = useRef<number>(Date.now());
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const fetchExamData = async () => {
    try {
      const response = await api.get(`/exams/submissions/${submissionId}`);
      const submissionData = response.data;
      
      setSubmission(submissionData);
      
      // Check if exam is already completed
      if (submissionData.submittedAt) {
        // Exam is already completed, redirect to results page
        router.push(`/student/exam/results/${submissionId}`);
        return;
      }
      
      // Fetch questions
      const questionsResponse = await api.get(`/exams/submissions/${submissionId}/questions`);
      const questionsData = questionsResponse.data;
      
      setQuestions(questionsData);
      setFilteredQuestions(questionsData);
      
      // Initialize answers array
      const initialAnswers: QuestionAnswer[] = questionsData.map((q: Question) => ({
        questionId: q.id,
        selectedOptionId: undefined,
        isCorrect: undefined,
        timeSpent: 0,
        isMarkedForReview: false,
      }));
      
      setAnswers(initialAnswers);
      
      // Initialize sub-question expansion for paragraph questions
      const paragraphQuestions = questionsData.filter((q: Question) => getQuestionType(q) === 'PARAGRAPH');
      if (paragraphQuestions.length > 0) {
        const expandedSet = new Set<string>();
        paragraphQuestions.forEach((question: Question) => {
          if (question.subQuestions && question.subQuestions.length > 0) {
            // Expand first sub-question by default
            expandedSet.add(question.subQuestions[0].id);
          }
        });
        setExpandedSubQuestions(expandedSet);
      }
      
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

  const showExitConfirmation = (targetUrl?: string) => {
    Swal.fire({
      title: 'Leave Exam?',
      text: 'You are currently taking an exam. Are you sure you want to leave? Your progress may be lost.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Leave',
      cancelButtonText: 'Stay in Exam',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
    }).then((result) => {
      if (result.isConfirmed) {
        // User confirmed they want to leave - set flag to prevent further dialogs
        setUserConfirmedExit(true);
        // Navigate to the original target or default to LMS
        const destination = targetUrl || pendingNavigation || '/student/lms';
        router.push(destination);
      }
    });
  };

  const submitExam = async (reason: string) => {
    try {
      if (!submission) {
        throw new Error('Exam submission not found');
      }

      // Prepare all answers for single submission
      const answersToSubmit = answers
        .filter(answer => answer.selectedOptionId || answer.numericValue !== undefined)
        .map(answer => ({
          questionId: answer.questionId,
          optionId: answer.selectedOptionId,
          numericValue: answer.numericValue,
        }));

      // Submit exam with all answers at once
      const response = await api.post(`/student/exams/${submission.examPaper.id}/submit`, {
        answers: answersToSubmit,
        submissionId: submissionId, // Pass the current submission ID
      });
      
      const responseData = response.data; 
      const newSubmissionId = responseData.submissionId;
      console.log(newSubmissionId);
      console.log(responseData);
      // Set exam completed state first
      setExamCompleted(true);
      
      // Use a more reliable redirect approach
      Swal.fire({
        title: 'Exam Submitted!',
        text: reason,
        icon: 'success',
        confirmButtonText: 'View Results',
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then(() => {
        // Try router.push first, fallback to window.location
        try {
          router.push(`/student/exam/results/${newSubmissionId}`);
        } catch (error) {
          console.warn('Router push failed, using window.location:', error);
          window.location.href = `/student/exam/results/${newSubmissionId}`;
        }
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


  const handleAnswerSelect = (optionId: string) => {
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    if (isMultipleChoiceQuestion(currentQuestion)) {
      // For multiple choice, toggle the option
      setAnswers(prev => prev.map((answer, index) => {
        if (index === currentQuestionIndex) {
          const currentSelected = answer.selectedOptionIds || [];
          const newSelected = currentSelected.includes(optionId)
            ? currentSelected.filter(id => id !== optionId)
            : [...currentSelected, optionId];
          return { ...answer, selectedOptionIds: newSelected, selectedOptionId: undefined, numericValue: undefined };
        }
        return answer;
      }));
    } else {
      // For single choice, replace the selection
    setAnswers(prev => prev.map((answer, index) => 
      index === currentQuestionIndex 
          ? { ...answer, selectedOptionId: optionId, selectedOptionIds: undefined, numericValue: undefined }
        : answer
    ));
    }
  };

  const handleNumericAnswerChange = (value: number | undefined) => {
    setAnswers(prev => prev.map((answer, index) => 
      index === currentQuestionIndex 
        ? { ...answer, numericValue: value, selectedOptionId: undefined, selectedOptionIds: undefined }
        : answer
    ));
  };

  // Handle sub-question answers for paragraph questions
  const handleSubQuestionAnswerSelect = (subQuestionId: string, optionId: string) => {
    const currentQuestion = filteredQuestions[currentQuestionIndex];
    if (!isParagraphQuestion(currentQuestion)) return;

    const subQuestion = currentQuestion.subQuestions?.find(sq => sq.id === subQuestionId);
    if (!subQuestion) return;

    setAnswers(prev => prev.map((answer, index) => {
      if (index === currentQuestionIndex) {
        const subAnswers = answer.subQuestionAnswers || {};
        const currentSubAnswer = subAnswers[subQuestionId] || {};
        
        if (isMultipleChoiceQuestion(subQuestion)) {
          // For multiple choice sub-questions
          const currentSelected = currentSubAnswer.selectedOptionIds || [];
          const newSelected = currentSelected.includes(optionId)
            ? currentSelected.filter(id => id !== optionId)
            : [...currentSelected, optionId];
          return {
            ...answer,
            subQuestionAnswers: {
              ...subAnswers,
              [subQuestionId]: { ...currentSubAnswer, selectedOptionIds: newSelected, selectedOptionId: undefined }
            }
          };
        } else {
          // For single choice sub-questions
          return {
            ...answer,
            subQuestionAnswers: {
              ...subAnswers,
              [subQuestionId]: { ...currentSubAnswer, selectedOptionId: optionId, selectedOptionIds: undefined }
            }
          };
        }
      }
      return answer;
    }));
  };

  const handleSubQuestionNumericAnswer = (subQuestionId: string, value: number | undefined) => {
    setAnswers(prev => prev.map((answer, index) => {
      if (index === currentQuestionIndex) {
        const subAnswers = answer.subQuestionAnswers || {};
        return {
          ...answer,
          subQuestionAnswers: {
            ...subAnswers,
            [subQuestionId]: { ...subAnswers[subQuestionId], numericValue: value }
          }
        };
      }
      return answer;
    }));
  };

  const handleMarkForReview = () => {
    setAnswers(prev => prev.map((answer, index) => 
      index === currentQuestionIndex 
        ? { ...answer, isMarkedForReview: !answer.isMarkedForReview }
        : answer
    ));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < filteredQuestions.length - 1) {
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

  // Prevent navigation away from exam
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (examStarted && !examCompleted) {
        e.preventDefault();
        e.returnValue = 'You are currently taking an exam. Are you sure you want to leave? Your progress may be lost.';
        return 'You are currently taking an exam. Are you sure you want to leave? Your progress may be lost.';
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      if (examStarted && !examCompleted) {
        e.preventDefault();
        showExitConfirmation();
      }
    };

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [examStarted, examCompleted]);

  // Override Next.js router to prevent navigation during exam
  useEffect(() => {
    if (examStarted && !examCompleted && !userConfirmedExit) {
      // Store original push method
      const originalPush = router.push;
      const originalReplace = router.replace;
      const originalBack = router.back;
      const originalForward = router.forward;

      // Override router methods
      router.push = (href: string, options?: any) => {
        setPendingNavigation(href);
        showExitConfirmation(href);
        return Promise.resolve(false);
      };

      router.replace = (href: string, options?: any) => {
        setPendingNavigation(href);
        showExitConfirmation(href);
        return Promise.resolve(false);
      };

      router.back = () => {
        showExitConfirmation();
        return Promise.resolve(false);
      };

      router.forward = () => {
        showExitConfirmation();
        return Promise.resolve(false);
      };

      // Restore original methods when exam is completed or component unmounts
      return () => {
        router.push = originalPush;
        router.replace = originalReplace;
        router.back = originalBack;
        router.forward = originalForward;
      };
    } else if (examCompleted) {
      // When exam is completed, restore original router methods immediately
      const originalPush = router.push;
      const originalReplace = router.replace;
      const originalBack = router.back;
      const originalForward = router.forward;

      // Restore original methods
      router.push = originalPush;
      router.replace = originalReplace;
      router.back = originalBack;
      router.forward = originalForward;
    }
  }, [examStarted, examCompleted, userConfirmedExit, router]);

  // Handle navigation within the app
  useEffect(() => {
    if (!examStarted || examCompleted || userConfirmedExit) return;

    // Intercept clicks on navigation links
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Capture the target URL
        const href = link.getAttribute('href');
        if (href) {
          setPendingNavigation(href);
          showExitConfirmation(href);
        } else {
          showExitConfirmation();
        }
        return false;
      }
    };

    // Intercept form submissions that might navigate away
    const handleFormSubmit = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      showExitConfirmation();
      return false;
    };

    // Intercept programmatic navigation
    const handleNavigation = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      showExitConfirmation();
      return false;
    };

    // Add event listeners with capture phase to intercept early
    document.addEventListener('click', handleLinkClick, true);
    document.addEventListener('submit', handleFormSubmit, true);
    document.addEventListener('beforeunload', handleNavigation, true);
    
    // Also intercept on the document body for better coverage
    document.body.addEventListener('click', handleLinkClick, true);
    
    // Cleanup
    return () => {
      document.removeEventListener('click', handleLinkClick, true);
      document.removeEventListener('submit', handleFormSubmit, true);
      document.removeEventListener('beforeunload', handleNavigation, true);
      document.body.removeEventListener('click', handleLinkClick, true);
    };
  }, [examStarted, examCompleted, userConfirmedExit]);

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





  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Don't trigger shortcuts if exam is not started or completed
      if (!examStarted || examCompleted) return;

      switch (event.key.toLowerCase()) {
        case 'arrowleft':
        case 'a':
          event.preventDefault();
          handlePreviousQuestion();
          showInfo('Navigation', 'Previous question', 1000);
          break;
        case 'arrowright':
        case 'd':
          event.preventDefault();
          handleNextQuestion();
          showInfo('Navigation', 'Next question', 1000);
          break;
        case 'm':
          event.preventDefault();
          handleMarkForReview();
          const currentAnswer = answers[currentQuestionIndex];
          const isMarked = currentAnswer?.isMarkedForReview;
          showInfo('Mark for Review', isMarked ? 'Question unmarked' : 'Question marked for review', 1500);
          break;
        case 'h':
          event.preventDefault();
          setShowShortcutsLegend(!showShortcutsLegend);
          break;
        case 'escape':
          event.preventDefault();
          setShowShortcutsLegend(false);
          break;
        default:
          // Handle number keys 1-9 for quick navigation
          if (event.key >= '1' && event.key <= '9') {
            const questionNumber = parseInt(event.key) - 1;
            if (questionNumber < filteredQuestions.length) {
              event.preventDefault();
              setCurrentQuestionIndex(questionNumber);
              showInfo('Quick Navigation', `Jumped to question ${questionNumber + 1}`, 1000);
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [currentQuestionIndex, answers, examStarted, examCompleted, filteredQuestions.length, showShortcutsLegend]);

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
      case 'unanswered': return 'bg-gray-500';
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

  const currentQuestion = filteredQuestions[currentQuestionIndex];
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
                      Question {currentQuestionIndex + 1} of {filteredQuestions.length}
                      {filteredQuestions.length !== questions.length && (
                        <span className="text-gray-500 ml-1">
                          (filtered from {questions.length} total)
                        </span>
                      )}
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
                        Question {currentQuestionIndex + 1} - {currentQuestion.id} - {(currentQuestion.isOpenEnded || !currentQuestion.options || currentQuestion.options.length === 0) ? 'Open Ended' : 'Multiple Choice'}
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
                              : 'px-3 py-1 text-sm font-medium rounded-md shadow-sm bg-white text-gray-800 border border-gray-200 hover:bg-gray-50         dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 dark:hover:bg-gray-600         transition-colors duration-150         focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400'
                          }`}
                        >
                          {currentAnswer?.isMarkedForReview ? '✓ Marked for Review' : 'Mark for Review'}
                          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-xs">M</kbd>
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-gray-900 text-lg mb-6">
                      <LatexContentDisplay content={currentQuestion.stem} />
                    </div>
                    
                    {/* Question Type Specific Rendering */}
                    {isParagraphQuestion(currentQuestion) ? (
                      /* Paragraph Question with Sub-Questions */
                      <div className="space-y-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h3 className="text-lg font-semibold text-blue-900 mb-2">Comprehension Passage</h3>
                          <p className="text-blue-800">Read the passage above and answer the following questions:</p>
                        </div>
                        
                        {currentQuestion.subQuestions?.map((subQuestion, subIndex) => (
                          <div key={subQuestion.id} className="bg-white border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-medium text-gray-900">
                                Question {subIndex + 1}
                              </h4>
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedSubQuestions);
                                  if (newExpanded.has(subQuestion.id)) {
                                    newExpanded.delete(subQuestion.id);
                                  } else {
                                    newExpanded.add(subQuestion.id);
                                  }
                                  setExpandedSubQuestions(newExpanded);
                                }}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                {expandedSubQuestions.has(subQuestion.id) ? '▼' : '▶'} 
                                {expandedSubQuestions.has(subQuestion.id) ? ' Hide' : ' Show'}
                              </button>
                            </div>
                            
                            {expandedSubQuestions.has(subQuestion.id) && (
                              <div className="space-y-4">
                                <div className="text-gray-900">
                                  <LatexContentDisplay content={subQuestion.stem} />
                                </div>
                                
                                {/* Sub-question options or numeric input */}
                                {isOpenEndedQuestion(subQuestion) ? (
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter your numeric answer:
                          </label>
                          <input
                            type="number"
                            step="any"
                                        value={currentAnswer?.subQuestionAnswers?.[subQuestion.id]?.numericValue || ''}
                                        onChange={(e) => handleSubQuestionNumericAnswer(subQuestion.id, parseFloat(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter numeric value"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                                    {subQuestion.options?.map((option, optionIndex) => (
                          <label
                            key={option.id}
                            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                                          isMultipleChoiceQuestion(subQuestion) 
                                            ? (currentAnswer?.subQuestionAnswers?.[subQuestion.id]?.selectedOptionIds?.includes(option.id)
                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300')
                                            : (currentAnswer?.subQuestionAnswers?.[subQuestion.id]?.selectedOptionId === option.id
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300')
                                        }`}
                                        onClick={() => handleSubQuestionAnswerSelect(subQuestion.id, option.id)}
                                      >
                                        <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                                          isMultipleChoiceQuestion(subQuestion) 
                                            ? (currentAnswer?.subQuestionAnswers?.[subQuestion.id]?.selectedOptionIds?.includes(option.id)
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-300')
                                            : (currentAnswer?.subQuestionAnswers?.[subQuestion.id]?.selectedOptionId === option.id
                                                ? 'border-blue-500 bg-blue-500'
                                                : 'border-gray-300')
                                        }`}>
                                          {isMultipleChoiceQuestion(subQuestion) 
                                            ? (currentAnswer?.subQuestionAnswers?.[subQuestion.id]?.selectedOptionIds?.includes(option.id) && (
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                              ))
                                            : (currentAnswer?.subQuestionAnswers?.[subQuestion.id]?.selectedOptionId === option.id && (
                                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                              ))
                                          }
                                        </div>
                                        <div className="text-gray-900">
                                          <LatexContentDisplay content={option.text} />
                                        </div>
                                      </label>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : isOpenEndedQuestion(currentQuestion) ? (
                      /* Open-ended Question */
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter your numeric answer:
                          </label>
                            <input
                            type="number"
                            step="any"
                            value={currentAnswer?.numericValue || ''}
                            onChange={(e) => handleNumericAnswerChange(parseFloat(e.target.value) || undefined)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter numeric value"
                          />
                        </div>
                      </div>
                    ) : (
                      /* MCQ Questions (Single or Multiple Choice) */
                      <div className="space-y-3">
                        {isMultipleChoiceQuestion(currentQuestion) && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                            <p className="text-yellow-800 text-sm">
                              <strong>Multiple Choice:</strong> Select all correct options. You must mark all correct options to get full marks.
                            </p>
                          </div>
                        )}
                        
                        {currentQuestion.options?.map((option, index) => (
                          <label
                            key={option.id}
                            className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                              isMultipleChoiceQuestion(currentQuestion)
                                ? (currentAnswer?.selectedOptionIds?.includes(option.id)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300')
                                : (currentAnswer?.selectedOptionId === option.id
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300')
                            }`}
                            onClick={() => handleAnswerSelect(option.id)}
                          >
                            <div className={`w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center ${
                              isMultipleChoiceQuestion(currentQuestion)
                                ? (currentAnswer?.selectedOptionIds?.includes(option.id)
                                ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300')
                                : (currentAnswer?.selectedOptionId === option.id
                                    ? 'border-blue-500 bg-blue-500'
                                    : 'border-gray-300')
                            }`}>
                              {isMultipleChoiceQuestion(currentQuestion)
                                ? (currentAnswer?.selectedOptionIds?.includes(option.id) && (
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                  ))
                                : (currentAnswer?.selectedOptionId === option.id && (
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  ))
                              }
                            </div>
                            <div className="text-gray-900">
                              <LatexContentDisplay content={option.text} />
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                      <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-xs">←</kbd>
                    </button>
                    
                    <button
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === filteredQuestions.length - 1}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <kbd className="ml-2 px-1 py-0.5 bg-blue-500 rounded text-xs">→</kbd>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Right Sidebar - Additional Information */}
              <div className="w-80 bg-white shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Exam Progress</h3>
                  <button
                    onClick={() => setShowShortcutsLegend(!showShortcutsLegend)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Toggle Keyboard Shortcuts"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.94l1-4H9.03z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                {/* Exam Progress */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Questions:</span>
                    <span className="font-medium">{questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Answered:</span>
                    <span className="font-medium text-green-600">{answers.filter(a => a.selectedOptionId).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Marked for Review:</span>
                    <span className="font-medium text-yellow-600">{answers.filter(a => a.isMarkedForReview).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unanswered:</span>
                    <span className="font-medium text-gray-600">{answers.filter(a => !a.selectedOptionId).length}</span>
                  </div>
                  {timeRemaining > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time Remaining:</span>
                      <span className="font-medium text-red-600">{formatTime(timeRemaining)}</span>
                    </div>
                  )}
                </div>
                
                {/* Keyboard Shortcuts Legend */}
                {showShortcutsLegend && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.94l1-4H9.03z" clipRule="evenodd" />
                      </svg>
                      Keyboard Shortcuts
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Navigate:</span>
                        <div className="flex space-x-1">
                          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-xs">←</kbd>
                          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-xs">A</kbd>
                          <span className="text-gray-400">/</span>
                          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-xs">→</kbd>
                          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-xs">D</kbd>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Mark Review:</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-xs">M</kbd>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Jump to Q:</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-xs">1-9</kbd>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Toggle Help:</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-xs">H</kbd>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Question Navigation */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Quick Navigation</h4>
                  <div className="grid grid-cols-5 gap-2 mb-4">
  {filteredQuestions.map((_, index) => {
    const status = getQuestionStatus(index);
    const isCurrent = index === currentQuestionIndex;

    // minimal base + tiny accessibility/focus additions
    const base =
      "w-10 h-10 rounded-lg text-sm font-medium flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

    // keep your existing color helper for non-current tiles
    const colorClasses = isCurrent
      ? "ring-2 ring-blue-500 bg-blue-600 text-white dark:bg-blue-500 dark:text-white"
      : getQuestionStatusColor(status); // existing function

    return (
      <button
        key={index}
        type="button"
        onClick={() => handleJumpToQuestion(index)}
        title={`Question ${index + 1}${isCurrent ? " (current)" : ""}`}
        aria-current={isCurrent ? "true" : undefined}
        className={`${base} ${colorClasses}`}
      >
        {index + 1}
      </button>
    );
  })}
</div>

                  
                  {/* Question Status Legend */}
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