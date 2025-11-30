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
      
      console.log('Questions loaded:', questionsData.length);
      const paragraphQs = questionsData.filter((q: Question) => getQuestionType(q) === 'PARAGRAPH');
      if (paragraphQs.length > 0) {
        console.log('Paragraph questions found:', paragraphQs.length);
        paragraphQs.forEach((pq: Question) => {
          console.log('Paragraph question:', pq.id, 'Sub-questions:', pq.subQuestions?.length || 0, pq.subQuestions);
        });
      }
      
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
      // Don't trigger shortcuts when typing in input fields, except for space key on radio buttons
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // Allow space key to work on radio buttons
        if (event.key === ' ' && event.target instanceof HTMLInputElement && event.target.type === 'radio') {
          // Continue to process the space key
        } else {
          return;
        }
      }

      // Don't trigger shortcuts if exam is not started or completed
      if (!examStarted || examCompleted) return;

      const currentQuestion = filteredQuestions[currentQuestionIndex];
      if (!currentQuestion) return;

      const currentAnswer = answers[currentQuestionIndex];
      
      // Handle option selection with A, B, C, D keys or numbers 1-4 (for MCQ questions)
      // Use uppercase letters (A-D) or number keys (1-4) to avoid conflict with navigation
      if ((isSingleChoiceQuestion(currentQuestion) || isMultipleChoiceQuestion(currentQuestion)) && currentQuestion.options) {
        const key = event.key;
        const optionIndexMap: { [key: string]: number } = {
          'A': 0, '1': 0,
          'B': 1, '2': 1,
          'C': 2, '3': 2,
          'D': 3, '4': 3,
          'E': 4, '5': 4,
          'F': 5, '6': 5
        };
        
        // Only handle uppercase letters or number keys to avoid conflict with navigation
        if (optionIndexMap.hasOwnProperty(key) && optionIndexMap[key] < currentQuestion.options.length) {
          event.preventDefault();
          const optionIndex = optionIndexMap[key];
          const selectedOption = currentQuestion.options[optionIndex];
          
          if (isSingleChoiceQuestion(currentQuestion)) {
            handleAnswerSelect(selectedOption.id);
            showInfo('Option Selected', `Selected option ${String.fromCharCode(65 + optionIndex)}`, 800);
          } else if (isMultipleChoiceQuestion(currentQuestion)) {
            const currentSelected = currentAnswer?.selectedOptionIds || [];
            const isAlreadySelected = currentSelected.includes(selectedOption.id);
            const newSelected = isAlreadySelected
              ? currentSelected.filter(id => id !== selectedOption.id)
              : [...currentSelected, selectedOption.id];
            
            setAnswers(prev => prev.map((answer, index) => 
              index === currentQuestionIndex 
                ? { ...answer, selectedOptionIds: newSelected, selectedOptionId: undefined, numericValue: undefined }
                : answer
            ));
            showInfo('Option Toggled', `${isAlreadySelected ? 'Deselected' : 'Selected'} option ${String.fromCharCode(65 + optionIndex)}`, 800);
          }
          return;
        }
      }

      switch (event.key) {
        case 'ArrowLeft':
        case 'p':
        case 'P':
          event.preventDefault();
          handlePreviousQuestion();
          showInfo('Navigation', 'Previous question', 1000);
          break;
        case 'ArrowRight':
        case 'n':
        case 'N':
          event.preventDefault();
          handleNextQuestion();
          showInfo('Navigation', 'Next question', 1000);
          break;
        case 'm':
        case 'M':
          event.preventDefault();
          handleMarkForReview();
          const isMarked = currentAnswer?.isMarkedForReview;
          showInfo('Mark for Review', isMarked ? 'Question unmarked' : 'Question marked for review', 1500);
          break;
        case 'h':
        case 'H':
          event.preventDefault();
          setShowShortcutsLegend(!showShortcutsLegend);
          break;
        case 'Escape':
          event.preventDefault();
          setShowShortcutsLegend(false);
          break;
        default:
          // Handle number keys 1-9 for quick navigation (both regular and numeric keypad)
          const keyCode = event.code;
          const isNumpadKey = keyCode.startsWith('Numpad');
          const isRegularNumber = event.key >= '1' && event.key <= '9';
          
          if (isRegularNumber || isNumpadKey) {
            let questionNumber: number;
            if (isNumpadKey) {
              // Extract number from keyCode (e.g., "Numpad1" -> 1)
              questionNumber = parseInt(keyCode.replace('Numpad', '')) - 1;
            } else {
              questionNumber = parseInt(event.key) - 1;
            }
            
            if (questionNumber >= 0 && questionNumber < filteredQuestions.length) {
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
  }, [currentQuestionIndex, answers, examStarted, examCompleted, filteredQuestions, showShortcutsLegend]);

  // Helper function to check if an answer has any value
  const hasAnswer = (answer: QuestionAnswer | undefined): boolean => {
    if (!answer) return false;
    return !!(
      answer.selectedOptionId || 
      answer.selectedOptionIds?.length || 
      answer.numericValue !== undefined
    );
  };

  const getQuestionStatus = (index: number) => {
    const answer = answers[index];
    if (!answer) return 'unanswered';
    
    const hasAnyAnswer = hasAnswer(answer);
    
    if (answer.isMarkedForReview && hasAnyAnswer) return 'answered-review';
    if (answer.isMarkedForReview) return 'review';
    if (hasAnyAnswer) return 'answered';
    return 'unanswered';
  };

  const getQuestionStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'bg-green-500 dark:bg-green-500 border border-gray-200 dark:border-gray-600 text-white dark:text-white font-semibold';
      case 'answered-review': return 'bg-blue-500 dark:bg-blue-500 border border-gray-200 dark:border-gray-600 text-white dark:text-white font-semibold';
      case 'review': return 'bg-yellow-500 dark:bg-yellow-500 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-semibold';
      case 'unanswered': return 'bg-white dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600 text-black dark:text-gray-300 font-bold';
      default: return 'bg-white dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600 text-black dark:text-gray-300 font-bold';
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
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
              <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <h1 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 truncate">{submission.examPaper.title}</h1>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Question {currentQuestionIndex + 1} of {filteredQuestions.length}
                      {filteredQuestions.length !== questions.length && (
                        <span className="text-gray-500 dark:text-gray-500 ml-1">
                          (filtered from {questions.length} total)
                        </span>
                      )}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 sm:flex-shrink-0">
                    {timeRemaining > 0 && (
                      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg px-3 sm:px-4 py-2">
                        <div className="text-xs sm:text-sm text-red-600 dark:text-red-400 font-medium">Time Remaining</div>
                        <div className="text-base sm:text-lg font-bold text-red-700 dark:text-red-300">{formatTime(timeRemaining)}</div>
                      </div>
                    )}
                    
                    <button
                      onClick={handleSubmitExam}
                      className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm sm:text-base whitespace-nowrap"
                    >
                      Submit Exam
                    </button>
                  </div>
                </div>
              </div>
            </div>


            <div className="flex flex-col lg:flex-row overflow-hidden">
              {/* Main Content */}
              <div className="flex-1 p-3 sm:p-4 lg:p-6 min-w-0 overflow-x-hidden">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 sm:p-4 lg:p-6 max-w-full overflow-x-hidden">
                  {/* Question */}
                  <div className="mb-6 overflow-x-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
                      <h2 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 break-words overflow-wrap-anywhere">
                        Question {currentQuestionIndex + 1} - <span className="hidden sm:inline">{currentQuestion.id} - </span>{
                          isParagraphQuestion(currentQuestion) ? 'Paragraph Questions' :
                          isOpenEndedQuestion(currentQuestion) ? 'Open Ended' :
                          isMultipleChoiceQuestion(currentQuestion) ? 'Multiple Choice' :
                          'Multiple Choice'
                        }
                      </h2>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          currentQuestion.difficulty === 'EASY' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
                          currentQuestion.difficulty === 'MEDIUM' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' :
                          'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                        }`}>
                          {currentQuestion.difficulty}
                        </span>
                        <button
                          onClick={handleMarkForReview}
                          className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap ${
                            currentAnswer?.isMarkedForReview
                              ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200'
                              : 'font-medium rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400'
                          }`}
                        >
                          <span className="hidden sm:inline">{currentAnswer?.isMarkedForReview ? '✓ Marked for Review' : 'Mark for Review'}</span>
                          <span className="sm:hidden">{currentAnswer?.isMarkedForReview ? '✓ Marked' : 'Mark'}</span>
                          <kbd className="ml-1 sm:ml-2 px-1 sm:px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-green-900 dark:text-green-100 rounded text-xs">M</kbd>
                        </button>
                      </div>
                    </div>
                    
                    {/* Question Type Specific Rendering */}
                    {isParagraphQuestion(currentQuestion) ? (
                      /* Paragraph Question with Sub-Questions */
                      <div className="space-y-6 max-w-full overflow-x-hidden">
                        {/* Display the paragraph passage */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 sm:p-6 mb-6 max-w-full overflow-x-auto">
                          <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-200 mb-3">Comprehension Passage</h3>
                          <div className="text-gray-900 dark:text-gray-100 text-sm sm:text-base leading-relaxed break-words overflow-wrap-anywhere">
                            <LatexContentDisplay content={currentQuestion.stem} />
                          </div>
                        </div>
                        
                        {/* Display all sub-questions */}
                        {currentQuestion.subQuestions && currentQuestion.subQuestions.length > 0 ? (
                          <div className="space-y-6 max-w-full overflow-x-hidden">
                            {currentQuestion.subQuestions.map((subQuestion, subIndex) => (
                              <div key={subQuestion.id} className="border-l-4 border-blue-500 dark:border-blue-400 pl-3 sm:pl-4 max-w-full overflow-x-hidden">
                                <div className="mb-4">
                                  <h4 className="text-base sm:text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                    Question {subIndex + 1}
                                  </h4>
                                  <div className="prose max-w-none text-gray-900 dark:text-gray-100 break-words overflow-wrap-anywhere text-sm sm:text-base">
                                    <LatexContentDisplay content={subQuestion.stem} />
                                  </div>
                                </div>
                                
                                {/* Sub-question options or numeric input */}
                                {isOpenEndedQuestion(subQuestion) ? (
                                  <div className="space-y-3">
                                    <div className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Enter your numeric answer:
                                      </label>
                                      <input
                                        type="number"
                                        step="any"
                                        value={currentAnswer?.subQuestionAnswers?.[subQuestion.id]?.numericValue || ''}
                                        onChange={(e) => handleSubQuestionNumericAnswer(subQuestion.id, parseFloat(e.target.value) || undefined)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        placeholder="Enter numeric value"
                                      />
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {subQuestion.options && subQuestion.options.length > 0 ? (
                                      subQuestion.options.map((option, optionIndex) => {
                                        const optionLetter = String.fromCharCode(65 + optionIndex); // A, B, C, D, etc.
                                        const isSubSelected = isMultipleChoiceQuestion(subQuestion)
                                          ? currentAnswer?.subQuestionAnswers?.[subQuestion.id]?.selectedOptionIds?.includes(option.id)
                                          : currentAnswer?.subQuestionAnswers?.[subQuestion.id]?.selectedOptionId === option.id;
                                        
                                        return (
                                          <label
                                            key={option.id}
                                            className={`flex items-start sm:items-center p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-colors max-w-full overflow-x-hidden ${
                                              isSubSelected
                                                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                          >
                                            {isMultipleChoiceQuestion(subQuestion) ? (
                                              <input
                                                type="checkbox"
                                                checked={isSubSelected}
                                                onChange={() => handleSubQuestionAnswerSelect(subQuestion.id, option.id)}
                                                className="sr-only"
                                              />
                                            ) : (
                                              <input
                                                type="radio"
                                                name={`subquestion-${subQuestion.id}`}
                                                value={option.id}
                                                checked={isSubSelected}
                                                onChange={() => handleSubQuestionAnswerSelect(subQuestion.id, option.id)}
                                                className="sr-only"
                                              />
                                            )}
                                            <div className={`w-5 h-5 sm:w-6 sm:h-6 ${isMultipleChoiceQuestion(subQuestion) ? 'rounded' : 'rounded-full'} border-2 flex-shrink-0 flex items-center justify-center mt-0.5 sm:mt-0 mr-2 sm:mr-3 ${
                                              isSubSelected
                                                ? 'border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-400'
                                                : 'border-gray-300 dark:border-gray-600'
                                            }`}>
                                              {isSubSelected && (
                                                isMultipleChoiceQuestion(subQuestion) ? (
                                                  <div className="text-white text-sm">✓</div>
                                                ) : (
                                                  <div className="w-2 h-2 bg-white rounded-full"></div>
                                                )
                                              )}
                                            </div>
                                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                              <span className={`text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border flex-shrink-0 ${
                                                isSubSelected
                                                  ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                                                  : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                                              }`}>
                                                {optionLetter}
                                              </span>
                                              <div className="flex-1 min-w-0 text-gray-900 dark:text-gray-100 break-words overflow-wrap-anywhere text-sm sm:text-base">
                                                <LatexContentDisplay content={option.text} />
                                              </div>
                                            </div>
                                          </label>
                                        );
                                      })
                                    ) : (
                                      <div className="text-gray-500 dark:text-gray-400 text-sm">No options available for this question.</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 dark:text-gray-400 text-sm">No sub-questions available for this paragraph question.</div>
                        )}
                      </div>
                    ) : (
                      /* Regular Questions (MCQ or Open Ended) */
                      <>
                        <div className="text-gray-900 dark:text-gray-100 text-lg mb-6">
                          <LatexContentDisplay content={currentQuestion.stem} />
                        </div>
                        
                        {isOpenEndedQuestion(currentQuestion) ? (
                      /* Open-ended Question */
                      <div className="space-y-3 max-w-full overflow-x-hidden">
                        <div className="p-3 sm:p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Enter your numeric answer:
                          </label>
                            <input
                            type="number"
                            step="any"
                            value={currentAnswer?.numericValue || ''}
                            onChange={(e) => handleNumericAnswerChange(parseFloat(e.target.value) || undefined)}
                            className="w-full px-3 py-2 text-base sm:text-lg border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                        
                        {currentQuestion.options?.map((option, index) => {
                          const optionLetter = String.fromCharCode(65 + index); // A, B, C, D, etc.
                          const isSelected = isMultipleChoiceQuestion(currentQuestion)
                            ? currentAnswer?.selectedOptionIds?.includes(option.id)
                            : currentAnswer?.selectedOptionId === option.id;
                          
                          return (
                            <label
                              key={option.id}
                              className={`flex items-start sm:items-center p-3 sm:p-4 rounded-lg border-2 cursor-pointer transition-colors max-w-full overflow-x-hidden ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                              }`}
                              onClick={() => handleAnswerSelect(option.id)}
                            >
                              <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center mt-0.5 sm:mt-0 mr-2 sm:mr-3 ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-400'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}>
                                {isSelected && (
                                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                <span className={`text-xs font-semibold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border flex-shrink-0 ${
                                  isSelected
                                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                                    : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                                }`}>
                                  {optionLetter}
                                </span>
                                <div className="flex-1 min-w-0 text-gray-900 dark:text-gray-100 break-words overflow-wrap-anywhere text-sm sm:text-base">
                                  <LatexContentDisplay content={option.text} />
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                      </>
                    )}
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handlePreviousQuestion}
                      disabled={currentQuestionIndex === 0}
                      className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                      <kbd className="ml-1 sm:ml-2 px-1 sm:px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-green-900 dark:text-green-100 rounded text-xs">←</kbd>
                    </button>
                    
                    <button
                      onClick={handleNextQuestion}
                      disabled={currentQuestionIndex === filteredQuestions.length - 1}
                      className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <kbd className="ml-1 sm:ml-2 px-1 py-0.5 bg-blue-500 rounded text-xs">→</kbd>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Right Sidebar - Additional Information */}
              {/* Desktop Sidebar */}
              <div className="hidden lg:block w-80 bg-white dark:bg-gray-800 shadow-lg p-6 flex-shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Exam Progress</h3>
                  <button
                    onClick={() => setShowShortcutsLegend(!showShortcutsLegend)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                    <span className="text-gray-600 dark:text-gray-400">Total Questions:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Answered:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{answers.filter(a => hasAnswer(a)).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Marked for Review:</span>
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">{answers.filter(a => a.isMarkedForReview).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Unanswered:</span>
                    <span className="font-medium text-gray-600 dark:text-gray-400">{answers.filter(a => !hasAnswer(a)).length}</span>
                  </div>
                  {timeRemaining > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Time Remaining:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{formatTime(timeRemaining)}</span>
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
                        <span className="text-gray-700 dark:text-gray-400 font-medium">Navigate:</span>
                        <div className="flex space-x-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">←</kbd>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">P</kbd>
                          <span className="text-gray-400 dark:text-gray-500">/</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">→</kbd>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">N</kbd>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-400 font-medium">Select Option:</span>
                        <div className="flex">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">A</kbd>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">B</kbd>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">C</kbd>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">D</kbd>
                          <span className="text-gray-400 dark:text-gray-500">/</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">1-4</kbd>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-400 font-medium">Mark Review:</span>
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">M</kbd>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-400 font-medium">Jump to Q:</span>
                        <div className="flex items-center space-x-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">1-9</kbd>
                          <span className="text-gray-500 dark:text-gray-400 text-[10px]">(Num Pad)</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-400 font-medium">Help:</span>
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">H</kbd>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Question Navigation */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Quick Navigation</h4>
                  <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 mb-4">
  {filteredQuestions.map((_, index) => {
    const status = getQuestionStatus(index);
    const isCurrent = index === currentQuestionIndex;
    const isAnswered = status === 'answered' || status === 'answered-review';

    // minimal base + tiny accessibility/focus additions
    const base =
      "w-10 h-10 rounded-lg text-sm flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 question-nav-btn relative";

    // keep your existing color helper for non-current tiles
    const colorClasses = isCurrent
      ? "ring-2 ring-blue-500 bg-blue-600 dark:bg-blue-600 border border-gray-200 dark:border-gray-600 text-white font-semibold"
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
        {isAnswered && (
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full"></span>
        )}
      </button>
    );
  })}
</div>

                  
                  {/* Question Status Legend */}
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">Answered</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">Answered & Marked</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">Marked for Review</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded mr-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">Unanswered</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile Sidebar - Below main content */}
              <div className="lg:hidden w-full bg-white dark:bg-gray-800 shadow-lg p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Exam Progress</h3>
                  <button
                    onClick={() => setShowShortcutsLegend(!showShortcutsLegend)}
                    className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
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
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Total Questions:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Answered:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{answers.filter(a => hasAnswer(a)).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Marked for Review:</span>
                    <span className="font-medium text-yellow-600 dark:text-yellow-400">{answers.filter(a => a.isMarkedForReview).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400 text-sm">Unanswered:</span>
                    <span className="font-medium text-gray-600 dark:text-gray-400">{answers.filter(a => !hasAnswer(a)).length}</span>
                  </div>
                  {timeRemaining > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 text-sm">Time Remaining:</span>
                      <span className="font-medium text-red-600 dark:text-red-400">{formatTime(timeRemaining)}</span>
                    </div>
                  )}
                </div>
                
                {/* Keyboard Shortcuts Legend */}
                {showShortcutsLegend && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.94l1-4H9.03z" clipRule="evenodd" />
                      </svg>
                      Keyboard Shortcuts
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-400 font-medium">Navigate:</span>
                        <div className="flex space-x-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">←</kbd>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">P</kbd>
                          <span className="text-gray-400 dark:text-gray-500">/</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">→</kbd>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">N</kbd>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-400 font-medium">Select Option:</span>
                        <div className="flex">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">A</kbd>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">B</kbd>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">C</kbd>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">D</kbd>
                          <span className="text-gray-400 dark:text-gray-500">/</span>
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">1-4</kbd>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-400 font-medium">Mark Review:</span>
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">M</kbd>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-400 font-medium">Jump to Q:</span>
                        <div className="flex items-center space-x-1">
                          <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">1-9</kbd>
                          <span className="text-gray-500 dark:text-gray-400 text-[10px]">(Num Pad)</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 dark:text-gray-400 font-medium">Help:</span>
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">H</kbd>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Question Navigation */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3 text-sm sm:text-base">Quick Navigation</h4>
                  <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 mb-4">
{filteredQuestions.map((_, index) => {
    const status = getQuestionStatus(index);
    const isCurrent = index === currentQuestionIndex;
    const isAnswered = status === 'answered' || status === 'answered-review';

    // minimal base + tiny accessibility/focus additions
    const base =
      "w-10 h-10 rounded-lg text-sm flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 question-nav-btn relative";

    // keep your existing color helper for non-current tiles
    const colorClasses = isCurrent
      ? "ring-2 ring-blue-500 bg-blue-600 dark:bg-blue-600 border border-gray-200 dark:border-gray-600 text-white font-semibold"
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
        {isAnswered && (
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 dark:bg-red-400 rounded-full"></span>
        )}
      </button>
    );
  })}
</div>
                  
                  {/* Question Status Legend */}
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">Answered</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">Answered & Marked</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">Marked for Review</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded mr-2"></div>
                      <span className="text-gray-700 dark:text-gray-300">Unanswered</span>
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