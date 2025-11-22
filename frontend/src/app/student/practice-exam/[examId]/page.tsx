'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import StudentLayout from '@/components/StudentLayout';
import LatexContentDisplay from '@/components/LatexContentDisplay';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import { useToastContext } from '@/contexts/ToastContext';

enum QuestionType {
  MCQ_SINGLE = 'MCQ_SINGLE',
  MCQ_MULTIPLE = 'MCQ_MULTIPLE',
  OPEN_ENDED = 'OPEN_ENDED',
  PARAGRAPH = 'PARAGRAPH'
}

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  order: number;
}

interface Question {
  id: string;
  stem: string;
  options: QuestionOption[];
  explanation: string;
  difficulty: string;
  yearAppeared?: number;
  correctNumericAnswer?: number;
  questionType: QuestionType;
  isOpenEnded: boolean;
  answerTolerance?: number;
  lesson?: {
    id: string;
    name: string;
    subject?: { name: string };
  };
  subQuestions?: Question[];
  parentQuestionId?: string;
}

interface ExamPaper {
  id: string;
  title: string;
  description: string;
  timeLimitMin: number | null;
  examType: string;
  subjects: { id: string; name: string }[];
  questions: Question[];
  questionCount: number;
}

interface PracticeState {
  selectedAnswers: { [questionId: string]: string | string[] | number };
  checkedQuestions: { [questionId: string]: boolean };
  currentQuestionIndex: number;
  markedForReview: { [questionId: string]: boolean };
}

export default function PracticeExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.examId as string;
  const { showSuccess, showInfo } = useToastContext();

  const [examPaper, setExamPaper] = useState<ExamPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [practiceState, setPracticeState] = useState<PracticeState>({
    selectedAnswers: {},
    checkedQuestions: {},
    currentQuestionIndex: 0,
    markedForReview: {}
  });
  const [showShortcutsLegend, setShowShortcutsLegend] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchExamData();
    }
  }, [examId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      console.log('Key event triggered:', event.key, 'Target:', event.target);
      
      // Don't trigger shortcuts when typing in input fields, except for space key on radio buttons
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        // Allow space key to work on radio buttons for checking answers
        if (event.key === ' ' && event.target instanceof HTMLInputElement && event.target.type === 'radio') {
          console.log('Space key on radio button - allowing shortcut');
          // Continue to process the space key
        } else {
          console.log('Ignoring key event - typing in input field');
          return;
        }
      }

      if (!examPaper) {
        console.log('Ignoring key event - no exam paper');
        return;
      }

      // Get current values inside the handler
      const currentQuestion = examPaper.questions[practiceState.currentQuestionIndex];
      const selectedAnswer = practiceState.selectedAnswers[currentQuestion?.id || ''];
      const isChecked = practiceState.checkedQuestions[currentQuestion?.id || ''];

      console.log('Current question:', currentQuestion?.id, 'Index:', practiceState.currentQuestionIndex);
      
      if (!currentQuestion) {
        console.log('No current question found');
        return;
      }

      console.log('Key pressed:', event.key, 'Code:', event.code);
      
      // Handle option selection with A, B, C, D keys or numbers 1-4 (for MCQ questions)
      // Use uppercase letters (A-D) or number keys (1-4) to avoid conflict with navigation (lowercase 'a' and 'd')
      if ((currentQuestion.questionType === QuestionType.MCQ_SINGLE || currentQuestion.questionType === QuestionType.MCQ_MULTIPLE) && !isChecked) {
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
        if (optionIndexMap.hasOwnProperty(key) && currentQuestion.options && optionIndexMap[key] < currentQuestion.options.length) {
          event.preventDefault();
          const optionIndex = optionIndexMap[key];
          const selectedOption = currentQuestion.options[optionIndex];
          
          if (currentQuestion.questionType === QuestionType.MCQ_SINGLE) {
            handleAnswerSelect(currentQuestion.id, selectedOption.id);
            showInfo('Option Selected', `Selected option ${String.fromCharCode(65 + optionIndex)}`, 800);
          } else if (currentQuestion.questionType === QuestionType.MCQ_MULTIPLE) {
            const currentAnswers = (selectedAnswer as string[]) || [];
            const isAlreadySelected = currentAnswers.includes(selectedOption.id);
            const newAnswers = isAlreadySelected
              ? currentAnswers.filter(id => id !== selectedOption.id)
              : [...currentAnswers, selectedOption.id];
            handleAnswerSelect(currentQuestion.id, newAnswers);
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
          event.preventDefault();
          handleMarkForReview(currentQuestion.id);
          const isMarked = practiceState.markedForReview[currentQuestion.id];
          showInfo('Mark for Review', isMarked ? 'Question unmarked' : 'Question marked for review', 1500);
          break;
        case ' ':
          event.preventDefault();
          console.log('Space key detected!');
          
          // Check answer if answer is selected and not already checked
          console.log('Space pressed - Debug info:', {
            isChecked,
            selectedAnswer,
            questionType: currentQuestion.questionType,
            questionId: currentQuestion.id,
            practiceState: practiceState.selectedAnswers
          });
          
          const hasValidAnswer = (
            (currentQuestion.questionType === QuestionType.MCQ_SINGLE && selectedAnswer) ||
            (currentQuestion.questionType === QuestionType.MCQ_MULTIPLE && (selectedAnswer as string[]).length > 0) ||
            (currentQuestion.questionType === QuestionType.OPEN_ENDED && selectedAnswer !== undefined) ||
            (currentQuestion.questionType === QuestionType.PARAGRAPH && currentQuestion.subQuestions?.every(subQ => practiceState.selectedAnswers[subQ.id]))
          );
          
          console.log('Answer validation:', {
            hasValidAnswer,
            isChecked,
            canCheck: !isChecked && hasValidAnswer
          });
          
          if (!isChecked && hasValidAnswer) {
            handleCheckAnswer(currentQuestion.id);
            showSuccess('Answer Checked', 'Your answer has been checked', 1500);
          } else {
            console.log('Space key condition not met:', {
              isChecked,
              hasValidAnswer,
              questionType: currentQuestion.questionType,
              selectedAnswer
            });
            showInfo('Cannot Check Answer', 'Please select an answer first or answer is already checked', 2000);
          }
          break;
        case 'h':
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
            
            if (questionNumber >= 0 && questionNumber < examPaper?.questionCount) {
              event.preventDefault();
              setPracticeState(prev => ({ ...prev, currentQuestionIndex: questionNumber }));
              showInfo('Quick Navigation', `Jumped to question ${questionNumber + 1}`, 1000);
            }
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    console.log('Keyboard event listener attached');
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      console.log('Keyboard event listener removed');
    };
  }, [practiceState.currentQuestionIndex, practiceState.selectedAnswers, practiceState.checkedQuestions, practiceState.markedForReview, examPaper, showShortcutsLegend]);

  const fetchExamData = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/student/practice-exam/${examId}`);
      setExamPaper(response.data);
      
      // Track that user started practice session
      await api.post(`/student/practice-exam/${examId}/track`);
    } catch (error: any) {
      console.error('Error fetching exam data:', error);
      setError(error.response?.data?.message || 'Failed to load exam');
      Swal.fire({
        title: 'Error',
        text: 'Failed to load exam data',
        icon: 'error',
        confirmButtonText: 'OK'
      }).then(() => {
        router.push('/student/exam-papers');
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answer: string | string[] | number) => {
    setPracticeState(prev => ({
      ...prev,
      selectedAnswers: {
        ...prev.selectedAnswers,
        [questionId]: answer
      }
    }));
  };

  const handleMultipleChoiceSelect = (questionId: string, optionId: string) => {
    const currentAnswers = (practiceState.selectedAnswers[questionId] as string[]) || [];
    const newAnswers = currentAnswers.includes(optionId)
      ? currentAnswers.filter(id => id !== optionId)
      : [...currentAnswers, optionId];
    
    handleAnswerSelect(questionId, newAnswers);
  };

  const handleNumericAnswerChange = (questionId: string, value: string) => {
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      handleAnswerSelect(questionId, numericValue);
    }
  };

  const handleMarkForReview = (questionId: string) => {
    setPracticeState(prev => ({
      ...prev,
      markedForReview: {
        ...prev.markedForReview,
        [questionId]: !prev.markedForReview[questionId]
      }
    }));
  };

  const getQuestionStatus = (questionId: string) => {
    const hasAnswer = practiceState.selectedAnswers[questionId] !== undefined;
    const isMarked = practiceState.markedForReview[questionId];
    const isChecked = practiceState.checkedQuestions[questionId];
    
    if (isChecked) return 'checked';
    if (hasAnswer && isMarked) return 'answered-review';
    if (hasAnswer) return 'answered';
    if (isMarked) return 'review';
    return 'unanswered';
  };

  const getQuestionStatusColor = (status: string) => {
    switch (status) {
      case 'checked': return 'bg-green-500 dark:bg-green-500 border border-gray-200 dark:border-gray-600 text-white dark:text-white font-semibold';
      case 'answered': return 'bg-green-500 dark:bg-green-500 border border-gray-200 dark:border-gray-600 text-white dark:text-white font-semibold';
      case 'answered-review': return 'bg-blue-500 dark:bg-blue-500 border border-gray-200 dark:border-gray-600 text-white dark:text-white font-semibold';
      case 'review': return 'bg-yellow-500 dark:bg-yellow-500 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white font-semibold';
      case 'unanswered': return 'bg-white dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-300 font-bold';
      default: return 'bg-white dark:bg-gray-700 border-2 border-gray-400 dark:border-gray-600 text-gray-900 dark:text-gray-300 font-bold';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800 border-green-200';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'HARD': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getExamTypeColor = (examType: string) => {
    switch (examType) {
      case 'REGULAR': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'PRACTICE_EXAM': return 'bg-green-100 text-green-800 border-green-200';
      case 'PYQ_PRACTICE': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'AI_EXAM': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'CONTENT_EXAM': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getExamTypeLabel = (examType: string) => {
    switch (examType) {
      case 'REGULAR': return 'REGULAR';
      case 'PRACTICE_EXAM': return 'PRACTICE';
      case 'PYQ_PRACTICE': return 'PYQ';
      case 'AI_EXAM': return 'AI';
      case 'CONTENT_EXAM': return 'CONTENT';
      default: return examType;
    }
  };

  const handleExitPractice = () => {
    Swal.fire({
      title: 'Exit Practice?',
      text: 'Are you sure you want to exit the practice session?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Exit',
      cancelButtonText: 'Continue Practice'
    }).then((result) => {
      if (result.isConfirmed) {
        router.push('/student/exam-papers');
      }
    });
  };

  const handleStartExam = async () => {
    try {
      const result = await Swal.fire({
        title: 'Start Real Exam?',
        text: 'This will start a timed exam session. Are you ready to begin?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Start Exam',
        cancelButtonText: 'Continue Practice'
      });

      if (result.isConfirmed) {
        const response = await api.post(`/exams/papers/${examId}/start`);
        const { submissionId } = response.data;
        router.push(`/student/exam/${submissionId}`);
      }
    } catch (error: any) {
      console.error('Error starting exam:', error);
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to start exam',
        icon: 'error',
      });
    }
  };

  const handleCheckAnswer = (questionId: string) => {
    setPracticeState(prev => ({
      ...prev,
      checkedQuestions: {
        ...prev.checkedQuestions,
        [questionId]: true
      }
    }));
  };

  const handleNextQuestion = () => {
    if (practiceState.currentQuestionIndex < (examPaper?.questions.length || 0) - 1) {
      setPracticeState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1
      }));
    }
  };

  const handlePreviousQuestion = () => {
    if (practiceState.currentQuestionIndex > 0) {
      setPracticeState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1
      }));
    }
  };



  if (loading) {
    return (
      <ProtectedRoute>
        <SubscriptionGuard>
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading practice exam...</p>
              </div>
            </div>
          </StudentLayout>
        </SubscriptionGuard>
      </ProtectedRoute>
    );
  }

  if (error || !examPaper) {
    return (
      <ProtectedRoute>
        <SubscriptionGuard>
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-red-500 text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Exam</h2>
                <p className="text-gray-600 mb-4">{error || 'Exam not found'}</p>
                <button
                  onClick={() => router.push('/student/exam-papers')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Back to Exam Papers
                </button>
              </div>
            </div>
          </StudentLayout>
        </SubscriptionGuard>
      </ProtectedRoute>
    );
  }

  const validateAnswer = (question: Question, selectedAnswer: string | string[] | number): boolean => {
    switch (question.questionType) {
      case QuestionType.MCQ_SINGLE:
        const correctOption = question.options.find(option => option.isCorrect);
        return correctOption ? selectedAnswer === correctOption.id : false;
      
      case QuestionType.MCQ_MULTIPLE:
        const correctOptions = question.options.filter(option => option.isCorrect).map(option => option.id);
        const selectedArray = (selectedAnswer as string[]) || [];
        if (selectedArray.length === 0) return false;
        return correctOptions.length === selectedArray.length && 
               correctOptions.every(optionId => selectedArray.includes(optionId));
      
      case QuestionType.OPEN_ENDED:
        if (question.correctNumericAnswer !== undefined) {
          const tolerance = question.answerTolerance || 0.01;
          const numericAnswer = selectedAnswer as number;
          return Math.abs(numericAnswer - question.correctNumericAnswer) <= tolerance;
        }
        return false; // For non-numeric open ended questions, we can't auto-validate
      
      case QuestionType.PARAGRAPH:
        // For paragraph questions, we need to validate sub-questions
        if (question.subQuestions) {
          return question.subQuestions.every(subQ => {
            const subAnswer = practiceState.selectedAnswers[subQ.id];
            return validateAnswer(subQ, subAnswer);
          });
        }
        return false;
      
      default:
        return false;
    }
  };

  const currentQuestion = examPaper.questions[practiceState.currentQuestionIndex];
  const isChecked = practiceState.checkedQuestions[currentQuestion.id];
  const selectedAnswer = practiceState.selectedAnswers[currentQuestion.id];
  const isCorrect = validateAnswer(currentQuestion, selectedAnswer);

  const renderQuestionInput = (question: Question) => {
    switch (question.questionType) {
      case QuestionType.MCQ_SINGLE:
        return (
          <div className="space-y-3">
            {question.options.map((option: QuestionOption, index: number) => {
              const optionLetter = String.fromCharCode(65 + index); // A, B, C, D, etc.
              return (
                <label
                  key={option.id}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedAnswer === option.id
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${
                    isChecked && option.isCorrect
                      ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20'
                      : ''
                  } ${
                    isChecked && selectedAnswer === option.id && !isCorrect
                      ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20'
                      : ''
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.id}
                    checked={selectedAnswer === option.id}
                    onChange={(e) => handleAnswerSelect(question.id, e.target.value)}
                    className="sr-only"
                    disabled={isChecked}
                  />
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center ${
                      selectedAnswer === option.id
                        ? 'border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-400'
                        : 'border-gray-300 dark:border-gray-600'
                    } ${
                      isChecked && option.isCorrect
                        ? 'border-green-500 bg-green-500 dark:border-green-400 dark:bg-green-400'
                        : ''
                    } ${
                      isChecked && selectedAnswer === option.id && !isCorrect
                        ? 'border-red-500 bg-red-500 dark:border-red-400 dark:bg-red-400'
                        : ''
                    }`}>
                      {selectedAnswer === option.id && (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`text-xs font-semibold px-2 py-1 rounded border ${
                        selectedAnswer === option.id
                          ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                      }`}>
                        {optionLetter}
                      </span>
                      <div className="flex-1">
                        <LatexContentDisplay content={option.text} />
                      </div>
                    </div>
                    {isChecked && option.isCorrect && (
                      <div className="text-green-600 dark:text-green-400 ml-2">✓</div>
                    )}
                    {isChecked && selectedAnswer === option.id && !isCorrect && (
                      <div className="text-red-600 dark:text-red-400 ml-2">✗</div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        );

      case QuestionType.MCQ_MULTIPLE:
        const selectedArray = (selectedAnswer as string[]) || [];
        return (
          <div className="space-y-3">
            {question.options.map((option: QuestionOption, index: number) => {
              const optionLetter = String.fromCharCode(65 + index); // A, B, C, D, etc.
              return (
                <label
                  key={option.id}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    selectedArray.includes(option.id)
                      ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${
                    isChecked && option.isCorrect
                      ? 'border-green-500 bg-green-50 dark:border-green-400 dark:bg-green-900/20'
                      : ''
                  } ${
                    isChecked && selectedArray.includes(option.id) && !option.isCorrect
                      ? 'border-red-500 bg-red-50 dark:border-red-400 dark:bg-red-900/20'
                      : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedArray.includes(option.id)}
                    onChange={() => handleMultipleChoiceSelect(question.id, option.id)}
                    className="sr-only"
                    disabled={isChecked}
                  />
                  <div className="flex items-center">
                    <div className={`w-6 h-6 border-2 mr-3 flex items-center justify-center rounded ${
                      selectedArray.includes(option.id)
                        ? 'border-blue-500 bg-blue-500 dark:border-blue-400 dark:bg-blue-400'
                        : 'border-gray-300 dark:border-gray-600'
                    } ${
                      isChecked && option.isCorrect
                        ? 'border-green-500 bg-green-500 dark:border-green-400 dark:bg-green-400'
                        : ''
                    } ${
                      isChecked && selectedArray.includes(option.id) && !option.isCorrect
                        ? 'border-red-500 bg-red-500 dark:border-red-400 dark:bg-red-400'
                        : ''
                    }`}>
                      {selectedArray.includes(option.id) && (
                        <div className="text-white text-sm">✓</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <span className={`text-xs font-semibold px-2 py-1 rounded border ${
                        selectedArray.includes(option.id)
                          ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
                          : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                      }`}>
                        {optionLetter}
                      </span>
                      <div className="flex-1">
                        <LatexContentDisplay content={option.text} />
                      </div>
                    </div>
                    {isChecked && option.isCorrect && (
                      <div className="text-green-600 dark:text-green-400 ml-2">✓</div>
                    )}
                    {isChecked && selectedArray.includes(option.id) && !option.isCorrect && (
                      <div className="text-red-600 dark:text-red-400 ml-2">✗</div>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        );

      case QuestionType.OPEN_ENDED:
        return (
          <div className="space-y-4">
            <div className="relative">
              <input
                type="number"
                step="any"
                value={selectedAnswer || ''}
                onChange={(e) => handleNumericAnswerChange(question.id, e.target.value)}
                placeholder="Enter your answer"
                className={`w-full p-4 border-2 rounded-lg text-lg ${
                  isChecked
                    ? isCorrect
                      ? 'border-green-500 bg-green-50'
                      : 'border-red-500 bg-red-50'
                    : 'border-gray-300 focus:border-blue-500'
                }`}
                disabled={isChecked}
              />
              {isChecked && (
                <div className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-2xl ${
                  isCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isCorrect ? '✓' : '✗'}
                </div>
              )}
            </div>
            {isChecked && question.correctNumericAnswer !== undefined && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800 font-medium">
                  Correct Answer: {question.correctNumericAnswer}
                </p>
                {question.answerTolerance && (
                  <p className="text-blue-600 text-sm">
                    Tolerance: ±{question.answerTolerance}
                  </p>
                )}
              </div>
            )}
          </div>
        );

      case QuestionType.PARAGRAPH:
        return (
          <div className="space-y-6">
            {question.subQuestions?.map((subQ, index) => (
              <div key={subQ.id} className="border-l-4 border-blue-500 pl-4">
                <div className="mb-3">
                  <h4 className="text-lg font-medium text-gray-800">
                    Question {index + 1}
                  </h4>
                  <div className="prose max-w-none mt-2">
                    <LatexContentDisplay content={subQ.stem} />
                  </div>
                </div>
                {renderQuestionInput(subQ)}
              </div>
            ))}
          </div>
        );

      default:
        return <div className="text-gray-500">Unsupported question type</div>;
    }
  };

  return (
    <ProtectedRoute>
      <SubscriptionGuard>
        <StudentLayout>
          <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">{examPaper.title}</h1>
                    <p className="text-sm text-gray-600">
                      Question {practiceState.currentQuestionIndex + 1} of {examPaper.questionCount}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleStartExam}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Start Exam
                    </button>
                    <button
                      onClick={handleExitPractice}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Exit Practice
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
                        Question {practiceState.currentQuestionIndex + 1} - {currentQuestion.id} - {currentQuestion.questionType}
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
                          onClick={() => handleMarkForReview(currentQuestion.id)}
                          className={`px-3 py-1 text-sm rounded-md transition-colors ${
                            practiceState.markedForReview[currentQuestion.id]
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'px-3 py-1 text-sm font-medium rounded-md shadow-sm bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-400'
                          }`}
                          title="Mark for Review (Press M)"
                        >
                          {practiceState.markedForReview[currentQuestion.id] ? '✓ Marked for Review' : 'Mark for Review'}
                          <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-green-700 dark:text-green-300 rounded text-xs">M</kbd>
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-gray-900 text-lg mb-6">
                      <LatexContentDisplay content={currentQuestion.stem} />
                    </div>
                    
                    {/* Answer Input */}
                    <div className="mb-6">
                      {renderQuestionInput(currentQuestion)}
                    </div>

                    {/* Check Answer Button */}
                    {!isChecked && (
                      (currentQuestion.questionType === QuestionType.MCQ_SINGLE && selectedAnswer) ||
                      (currentQuestion.questionType === QuestionType.MCQ_MULTIPLE && selectedAnswer && Array.isArray(selectedAnswer) && selectedAnswer.length > 0) ||
                      (currentQuestion.questionType === QuestionType.OPEN_ENDED && selectedAnswer !== undefined) ||
                      (currentQuestion.questionType === QuestionType.PARAGRAPH && currentQuestion.subQuestions?.every(subQ => practiceState.selectedAnswers[subQ.id]))
                    ) && (
                      <div className="text-center mb-6">
                        <button
                          onClick={() => handleCheckAnswer(currentQuestion.id)}
                          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                          title="Check Answer (Press Space)"
                        >
                          Check Answer
                          <kbd className="ml-2 px-2 py-1 bg-blue-500 rounded text-xs">Space</kbd>
                        </button>
                      </div>
                    )}

                    {/* Explanation */}
                    {isChecked && currentQuestion.explanation && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-lg font-semibold text-blue-900 mb-2">Explanation</h3>
                        <div className="prose max-w-none text-blue-800">
                          <LatexContentDisplay content={currentQuestion.explanation} />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <button
                      onClick={handlePreviousQuestion}
                      disabled={practiceState.currentQuestionIndex === 0}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Previous Question (Press ← or A)"
                    >
                      Previous
                      <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded text-xs">←</kbd>
                    </button>
                    
                    <button
                      onClick={handleNextQuestion}
                      disabled={practiceState.currentQuestionIndex === examPaper.questionCount - 1}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Next Question (Press → or D)"
                    >
                      Next
                      <kbd className="ml-2 px-1 py-0.5 bg-blue-500 rounded text-xs">→</kbd>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Right Sidebar - Question Navigation */}
              <div className="w-80 bg-white shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Practice Progress</h3>
                  <button
                    onClick={() => setShowShortcutsLegend(!showShortcutsLegend)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title={showShortcutsLegend ? "Hide shortcuts" : "Show shortcuts"}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.94l1-4H9.03z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                {/* Keyboard Shortcuts Legend */}
                {showShortcutsLegend && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.94l1-4H9.03z" clipRule="evenodd" />
                        </svg>
                        Keyboard Shortcuts
                      </h4>
                      <button
                        onClick={() => setShowShortcutsLegend(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Hide shortcuts legend"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
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
                        <span className="text-gray-700 dark:text-gray-400 font-medium">Check Answer:</span>
                        <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">Space</kbd>
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
                
                
                
                {/* Practice Progress */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Questions:</span>
                    <span className="font-medium">{examPaper.questionCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Answered:</span>
                    <span className="font-medium text-green-600">
                      {Object.keys(practiceState.selectedAnswers).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Marked for Review:</span>
                    <span className="font-medium text-yellow-600">
                      {Object.values(practiceState.markedForReview).filter(Boolean).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Checked:</span>
                    <span className="font-medium text-blue-600">
                      {Object.values(practiceState.checkedQuestions).filter(Boolean).length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unanswered:</span>
                    <span className="font-medium text-gray-600">
                      {examPaper.questionCount - Object.keys(practiceState.selectedAnswers).length}
                    </span>
                  </div>
                </div>
                
                {/* Question Navigation */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">Quick Navigation</h4>
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <span>Press</span>
                      <kbd className="px-2 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded text-xs font-semibold shadow-sm">1-9</kbd>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">(Num Pad)</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {examPaper.questions.map((question, index) => {
                      const status = getQuestionStatus(question.id);
                      const isCurrent = index === practiceState.currentQuestionIndex;
                      
                      return (
                        <button
                          key={question.id}
                          onClick={() => setPracticeState(prev => ({ ...prev, currentQuestionIndex: index }))}
                          className={`w-10 h-10 rounded-lg text-sm flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 question-nav-btn ${
                            isCurrent
                              ? 'ring-2 ring-blue-500 bg-blue-600 dark:bg-blue-600 border border-gray-200 dark:border-gray-600 text-white font-semibold'
                              : getQuestionStatusColor(status)
                          }`}
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
                      <span>Answered/Checked</span>
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

          </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
}
