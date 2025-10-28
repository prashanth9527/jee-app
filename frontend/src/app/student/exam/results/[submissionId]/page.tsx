'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
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
  isOpenEnded?: boolean;
  correctNumericAnswer?: number;
  answerTolerance?: number;
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

interface ExamResults {
  submissionId: string;
  scorePercent: number;
  correctCount: number;
  totalQuestions: number;
  submittedAt: string;
  examTitle: string;
  totalMarksObtained: number;
  totalMarksAvailable: number;
  answers: Array<{
    questionId: string;
    question: string;
    selectedOption: {
      id: string;
      text: string;
      isCorrect: boolean;
    };
    correctOption: {
      id: string;
      text: string;
      isCorrect: boolean;
    };
    isCorrect: boolean;
    marksObtained: number;
    fullMarks: number;
    partialMarks: number;
    negativeMarks: number;
    allowPartialMarking: boolean;
  }>;
}

export default function ExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params?.submissionId as string;
  const { showSuccess, showInfo } = useToastContext();
  
  const [results, setResults] = useState<ExamResults | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [selectedQuestionForReport, setSelectedQuestionForReport] = useState<Question | null>(null);
  const [submittedReports, setSubmittedReports] = useState<Set<string>>(new Set());
  const [submissionData, setSubmissionData] = useState<any>(null);
  const [helpModalOpen, setHelpModalOpen] = useState<boolean>(false);
  const [showShortcutsLegend, setShowShortcutsLegend] = useState(false);

  const fetchResults = async () => {
    try {
      // Get submission details first
      const submissionResponse = await api.get(`/exams/submissions/${submissionId}`);
      const submissionData = submissionResponse.data;
      setSubmissionData(submissionData);
      
      if (!submissionData.submittedAt) {
        // Exam not completed, redirect to exam page
        router.push(`/student/exam/${submissionId}`);
        return;
      }

      // Get exam results
      const resultsResponse = await api.get(`/exams/submissions/${submissionId}/results`);
      const resultsData = resultsResponse.data;
      
      setResults(resultsData);
      
      // Fetch all questions for complete performance picture
      const questionsResponse = await api.get(`/exams/submissions/${submissionId}/questions`);
      const questionsData = questionsResponse.data;
      setQuestions(questionsData);
      
      // Fetch existing reports for this user
      await fetchExistingReports();
      
    } catch (error) {
      console.error('Error fetching exam results:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to load exam results',
        icon: 'error',
      }).then(() => {
        router.push('/student/exam-history');
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (submissionId) {
      fetchResults();
    }
  }, [submissionId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

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
            if (questionNumber < questions.length) {
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
  }, [currentQuestionIndex, questions.length, showShortcutsLegend]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getQuestionStatus = (questionId: string) => {
    const answer = results?.answers.find(a => a.questionId === questionId);
    if (!answer) return 'not-answered';
    if (answer.isCorrect) return 'correct';
    return 'incorrect';
  };

  const getQuestionStatusColor = (status: string) => {
    switch (status) {
      case 'correct': return 'bg-green-500';
      case 'incorrect': return 'bg-red-500';
      case 'not-answered': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
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

  const handleRetake = async () => {
    try {
      // For all exam types, start a new exam session with the same exam paper
      const examId = submissionData?.examPaper?.id;
      if (examId) {
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

  const isReportSubmitted = (questionId: string) => {
    return submittedReports.has(questionId);
  };

  const markReportAsSubmitted = (questionId: string) => {
    setSubmittedReports(prev => new Set([...prev, questionId]));
  };

  const fetchExistingReports = async () => {
    try {
      const reportsResponse = await api.get('/student/question-reports/my-reports');
      const reports = reportsResponse.data;
      
      // Extract question IDs from reports and add to submittedReports set
      const reportedQuestionIds: Set<string> = new Set(reports.map((report: any) => report.questionId as string));
      setSubmittedReports(reportedQuestionIds);
    } catch (error) {
      console.error('Error fetching existing reports:', error);
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
                <p className="mt-4 text-gray-600">Loading exam results...</p>
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
                <p className="text-gray-600">Exam results not found.</p>
                <button 
                  onClick={() => router.push('/student/exam-history')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Back to Exam History
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
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{results.examTitle}</h1>
                  <p className="text-sm text-gray-600">
                    Submitted on {new Date(results.submittedAt).toLocaleDateString()} at {new Date(results.submittedAt).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => router.push('/student/exam-history')}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Back to History
                  </button>
                  <button
                    onClick={() => setHelpModalOpen(true)}
                    className="px-3 py-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                    title="How are marks and scores calculated?"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>                  
                    <button
                      onClick={handleRetake}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Retake Exam
                    </button>                 
                </div>
              </div>
              
              {/* Score Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900">Total Questions</h3>
                  <p className="text-2xl font-bold text-blue-600">{results.totalQuestions}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-green-900">Correct Answers</h3>
                  <p className="text-2xl font-bold text-green-600">{results.correctCount}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900">Score</h3>
                  <p className="text-2xl font-bold text-gray-600">{results.scorePercent}%</p>
                </div>
                <div className="bg-teal-500 text-white rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-teal-900">Marks</h3>
                  <p className="text-2xl font-bold text-purple-600">{results.totalMarksObtained}/{results.totalMarksAvailable}</p>
                </div>
              </div>
            </div>

            <div className="flex">
              {/* Main Content - Single Question Display */}
              <div className="flex-1 p-6">
                {questions.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6">
                    {(() => {
                      const question = questions[currentQuestionIndex];
                      const answer = results.answers.find(a => a.questionId === question.id);
                      const isAnswered = !!answer;
                      const isCorrect = answer?.isCorrect || false;
                      const status = getQuestionStatus(question.id);
                      
                      return (
                        <>
                          {/* Question Header */}
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                              <h2 className="text-xl font-semibold text-gray-900">
                                Question {currentQuestionIndex + 1} of {questions.length}
                              </h2>
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                status === 'correct' 
                                  ? 'bg-emerald-100 text-emerald-800' 
                                  : status === 'incorrect'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}>
                                {status === 'correct' ? 'Correct' : status === 'incorrect' ? 'Incorrect' : 'Not Answered'}
                              </span>
                              {answer && (
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  answer.marksObtained > 0 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : answer.marksObtained < 0
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}>
                                  Marks: {answer.marksObtained}/{answer.fullMarks}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                Status: {isAnswered ? (isCorrect ? 'Correct' : 'Incorrect') : 'Not Answered'}
                              </span>
                              {isReportSubmitted(question.id) ? (
                                <span className="px-3 py-1 text-sm bg-green-500 text-white rounded-md">
                                  ✓ Reported
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedQuestionForReport(question);
                                    setReportModalOpen(true);
                                  }}
                                  className="px-3 py-1 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors"
                                >
                                  Report Issue
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Question Content */}
                          <div className="mb-6">
                            <div className="text-gray-900 text-lg mb-6">
                              <LatexContentDisplay content={question.stem} />
                            </div>
                            
                            {/* Options or Numeric Answer Display */}
                            {question.isOpenEnded ? (
                              <div className="space-y-3">
                                <div className="p-4 rounded-lg border-2 bg-gray-50 border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <span className="text-lg text-gray-700 font-medium">
                                        Your Answer: {answer?.selectedOption?.text || 'No answer provided'}
                                      </span>
                                      {answer?.isCorrect ? (
                                        <span className="ml-3 text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                                          Correct
                                        </span>
                                      ) : (
                                        <span className="ml-3 text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                                          Incorrect
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="mt-2 text-sm text-gray-600">
                                    Correct Answer: {question.correctNumericAnswer}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {question.options?.map((option) => {
                                  const isSelected = answer?.selectedOption.id === option.id;
                                  const isCorrectOption = option.isCorrect;
                                  
                                  return (
                                    <div
                                      key={option.id}
                                      className={`p-4 rounded-lg border-2 ${
                                        isCorrectOption
                                          ? 'bg-green-50 border-green-200'
                                          : isSelected && !isCorrectOption
                                          ? 'bg-red-50 border-red-200'
                                          : 'bg-gray-50 border-gray-200'
                                      }`}
                                    >
                                      <div className="flex items-center">
                                        <span className={`w-5 h-5 rounded-full border-2 mr-4 ${
                                          isCorrectOption
                                            ? 'bg-green-500 border-green-500'
                                            : isSelected
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-gray-300'
                                        }`}>
                                          {isCorrectOption && (
                                            <svg className="w-3 h-3 text-white mx-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          )}
                                        </span>
                                        <span className={`text-lg ${
                                          isCorrectOption
                                            ? 'text-white-800 font-medium'
                                            : isSelected && !isCorrectOption
                                            ? 'text-white-800 font-medium'
                                            : 'text-white-700'
                                        }`}>
                                          <LatexContentDisplay content={option.text} />
                                        </span>
                                        {isSelected && (
                                          <span className="ml-3 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                            Your Answer
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          
                          {/* Tips & Formulas */}
                          {question.tip_formula && (
                            <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
                              <h4 className="font-semibold text-white-900 mb-2">💡 Tips & Formulas</h4>
                              <div className="text-white-800">
                                <LatexContentDisplay content={question.tip_formula} />
                              </div>
                            </div>
                          )}
                          
                          {/* Explanations */}
                          {(question.explanation || (question.alternativeExplanations && question.alternativeExplanations.length > 0)) && (
                            <div className="space-y-4">
                              {/* Original Explanation */}
                              {question.explanation && (
                                <div className="bg-blue-50 rounded-lg p-4">
                                  <h4 className="font-semibold text-blue-900 mb-2">Explanation</h4>
                                  <div className="text-blue-800">
                                    <LatexContentDisplay content={question.explanation} />
                                  </div>
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
                                      <div className="text-green-800">
                                        <LatexContentDisplay content={altExp.explanation} />
                                      </div>
                                      <div className="mt-2 text-xs text-green-600">
                                        Added on {new Date(altExp.createdAt).toLocaleDateString()}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                          
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
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
              
              {/* Right Sidebar - Question Navigation */}
              <div className="w-80 bg-white shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Question Navigation</h3>
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
                          <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">←</kbd>
                          <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">A</kbd>
                          <span className="text-gray-400">/</span>
                          <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">→</kbd>
                          <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">D</kbd>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Jump to Q:</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">1-9</kbd>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Toggle Help:</span>
                        <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-xs">H</kbd>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Question Grid */}
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {questions.map((question, index) => {
                    const status = getQuestionStatus(question.id);
                    const isCurrent = index === currentQuestionIndex;
                    
                    return (
                      <button
                        key={question.id}
                        onClick={() => handleJumpToQuestion(index)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium flex items-center justify-center transition-colors ${
                          isCurrent
                            ? 'ring-2 ring-blue-500 bg-blue-600 text-white'
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
                    <span>Correct</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
                    <span>Incorrect</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
                    <span>Not Answered</span>
                  </div>
                </div>
                
                {/* Performance Summary */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Performance Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Correct:</span>
                      <span className="font-medium text-green-600">
                        {results.answers.filter(a => a.isCorrect).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Incorrect:</span>
                      <span className="font-medium text-red-600">
                        {results.answers.filter(a => !a.isCorrect).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Not Answered:</span>
                      <span className="font-medium text-gray-600">
                        {questions.length - results.answers.length}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-200">
                      <span className="text-gray-600 font-medium">Total Marks:</span>
                      <span className="font-bold text-purple-600">
                        {results.totalMarksObtained}/{results.totalMarksAvailable}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Marks Percentage:</span>
                      <span className="font-medium text-purple-600">
                        {Math.round((results.totalMarksObtained / results.totalMarksAvailable) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Report Issue Modal */}
          <ReportIssueModal
            isOpen={reportModalOpen}
            onClose={() => setReportModalOpen(false)}
            question={selectedQuestionForReport}
            submissionId={submissionId}
            submittedReports={submittedReports}
            onReportSubmitted={(questionId) => markReportAsSubmitted(questionId)}
          />
          
          {/* Help Modal */}
          <HelpModal
            isOpen={helpModalOpen}
            onClose={() => setHelpModalOpen(false)}
            results={results}
          />

        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
}

// Report Issue Modal Component
function ReportIssueModal({ 
  isOpen, 
  onClose, 
  question,
  submissionId,
  submittedReports,
  onReportSubmitted
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  question: Question | null;
  submissionId: string;
  submittedReports: Set<string>;
  onReportSubmitted: (questionId: string) => void;
}) {
  const [reportType, setReportType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !reportType || !description.trim()) return;
    
    // Check if already reported (double-check with backend)
    if (submittedReports.has(question.id)) {
      Swal.fire({
        title: 'Already Reported',
        text: 'You have already submitted a report for this question.',
        icon: 'info',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'swal-dark-popup',
          title: 'swal-dark-title',
          confirmButton: 'swal-dark-confirm'
        }
      });
      return;
    }

    setSubmitting(true);
    try {
      // Double-check with backend to prevent race conditions
      const existingReportsResponse = await api.get('/student/question-reports/my-reports');
      const existingReports = existingReportsResponse.data;
      const alreadyReported = existingReports.some((report: any) => report.questionId === question.id);
      
      if (alreadyReported) {
        Swal.fire({
          title: 'Already Reported',
          text: 'You have already submitted a report for this question.',
          icon: 'info',
          confirmButtonText: 'OK',
          customClass: {
            popup: 'swal-dark-popup',
            title: 'swal-dark-title',
            confirmButton: 'swal-dark-confirm'
          }
        });
        return;
      }

      await api.post('/student/question-reports', {
        questionId: question.id,
        reportType: reportType,
        reason: description.trim(),
        description: description.trim()
      });
      
      Swal.fire({
        title: 'Report Submitted',
        text: 'Thank you for your feedback. We will review this issue.',
        icon: 'success',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'swal-dark-popup',
          title: 'swal-dark-title',
          confirmButton: 'swal-dark-confirm'
        }
      });
      
      // Mark this question as reported
      onReportSubmitted(question.id);
      
      onClose();
      setDescription('');
      setReportType('');
    } catch (error) {
      console.error('Error submitting report:', error);
      Swal.fire({
        title: 'Error',
        text: 'Failed to submit report. Please try again.',
        icon: 'error',
        confirmButtonText: 'OK',
        customClass: {
          popup: 'swal-dark-popup',
          title: 'swal-dark-title',
          confirmButton: 'swal-dark-confirm'
        }
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !question) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 shadow-xl report-modal">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Report Issue</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Question:</p>
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm">
            <LatexContentDisplay content={question.stem} />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Issue Type
            </label>
            <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 
                        bg-white dark:bg-gray-800 
                        text-gray-900 dark:text-white 
                        rounded-md px-3 py-2 
                        focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
            >
              <option value="" style={{ backgroundColor: 'white', color: 'black' }}>Select issue type</option>
              <option value="INCORRECT_ANSWER" style={{ backgroundColor: 'white', color: 'black' }}>Incorrect Answer</option>
              <option value="INCORRECT_EXPLANATION" style={{ backgroundColor: 'white', color: 'black' }}>Incorrect Explanation</option>
              <option value="SUGGESTED_EXPLANATION" style={{ backgroundColor: 'white', color: 'black' }}>Suggested Explanation</option>
              <option value="GRAMMATICAL_ERROR" style={{ backgroundColor: 'white', color: 'black' }}>Grammatical Error</option>
              <option value="TECHNICAL_ERROR" style={{ backgroundColor: 'white', color: 'black' }}>Technical Error</option>
              <option value="OTHER" style={{ backgroundColor: 'white', color: 'black' }}>Other</option>
            </select>
        </div>


          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please describe the issue in detail..."
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !reportType || !description.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Help Modal Component
function HelpModal({ 
  isOpen, 
  onClose, 
  results 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  results: ExamResults | null;
}) {
  if (!isOpen || !results) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Marks & Score Calculation Guide</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Overview */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">📊 Your Current Results</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-700 dark:text-blue-300">Score:</span>
                <span className="font-bold ml-2">{results.scorePercent}%</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Marks:</span>
                <span className="font-bold ml-2">{results.totalMarksObtained}/{results.totalMarksAvailable}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Correct:</span>
                <span className="font-bold ml-2">{results.correctCount}/{results.totalQuestions}</span>
              </div>
              <div>
                <span className="text-blue-700 dark:text-blue-300">Marks %:</span>
                <span className="font-bold ml-2">{Math.round((results.totalMarksObtained / results.totalMarksAvailable) * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Score vs Marks Explanation */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">🎯 Score vs Marks - What's the Difference?</h4>
            <div className="space-y-3 text-sm text-green-800 dark:text-green-200">
              <div>
                <strong>Score Percentage:</strong> Based on number of correct answers
                <br />
                <code className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded">Score = (Correct Answers ÷ Total Questions) × 100</code>
                <br />
                <span className="text-xs">Example: 5 correct out of 25 = (5÷25) × 100 = 20%</span>
              </div>
              <div>
                <strong>Marks:</strong> Based on marking scheme (includes negative marking)
                <br />
                <code className="bg-green-100 dark:bg-green-800 px-2 py-1 rounded">Total Marks = Sum of all question marks (positive + negative)</code>
                <br />
                <span className="text-xs">Example: 5 correct (+20) + 20 wrong (-20) = 0 marks</span>
              </div>
            </div>
          </div>

          {/* Question Type Marking Schemes */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">📝 Marking Schemes by Question Type</h4>
            
            {/* MCQ Single */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <h5 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">🔘 MCQ Single Choice</h5>
              <div className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                <div>✅ <strong>Correct Answer:</strong> +4 marks</div>
                <div>❌ <strong>Wrong Answer:</strong> -1 mark</div>
                <div>⭕ <strong>Not Attempted:</strong> 0 marks</div>
                <div className="text-xs mt-2 bg-yellow-100 dark:bg-yellow-800 p-2 rounded">
                  <strong>Example:</strong> If you answer 5 correctly and 20 incorrectly: (5×4) + (20×-1) = 20 - 20 = 0 marks
                </div>
              </div>
            </div>

            {/* Open Ended */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h5 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">✏️ Open Ended Questions</h5>
              <div className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
                <div>✅ <strong>Correct Answer:</strong> +4 marks</div>
                <div>❌ <strong>Wrong Answer:</strong> -1 mark</div>
                <div>⭕ <strong>Not Attempted:</strong> 0 marks</div>
                <div className="text-xs mt-2 bg-purple-100 dark:bg-purple-800 p-2 rounded">
                  <strong>Example:</strong> Numerical questions where you enter a value. Correct value = +4, wrong value = -1
                </div>
              </div>
            </div>

            {/* Paragraph */}
            <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
              <h5 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">📄 Paragraph Questions</h5>
              <div className="text-sm text-indigo-800 dark:text-indigo-200 space-y-1">
                <div>✅ <strong>Correct Answer:</strong> +2 marks</div>
                <div>❌ <strong>Wrong Answer:</strong> 0 marks</div>
                <div>⭕ <strong>Not Attempted:</strong> 0 marks</div>
                <div className="text-xs mt-2 bg-indigo-100 dark:bg-indigo-800 p-2 rounded">
                  <strong>Example:</strong> Questions with passage followed by questions. Only correct answers get +2 marks
                </div>
              </div>
            </div>

            {/* MCQ Multiple */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <h5 className="font-semibold text-red-900 dark:text-red-100 mb-2">☑️ MCQ Multiple Choice</h5>
              <div className="text-sm text-red-800 dark:text-red-200 space-y-1">
                <div>✅ <strong>All Correct Options:</strong> +4 marks</div>
                <div>🟡 <strong>3 out of 4 Correct:</strong> +3 marks</div>
                <div>🟡 <strong>2 out of 3+ Correct:</strong> +2 marks</div>
                <div>🟡 <strong>1 out of 2+ Correct:</strong> +1 mark</div>
                <div>❌ <strong>Any Wrong Selection:</strong> -2 marks</div>
                <div>⭕ <strong>Not Attempted:</strong> 0 marks</div>
                <div className="text-xs mt-2 bg-red-100 dark:bg-red-800 p-2 rounded">
                  <strong>Example:</strong> If correct options are A, B, D: Selecting A,B,D = +4, Selecting A,B = +2, Selecting A,C = -2
                </div>
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">💡 Tips for Better Performance</h4>
            <div className="text-sm text-gray-700 dark:text-gray-300 space-y-2">
              <div>• <strong>Don't guess randomly:</strong> Negative marking means wrong answers cost you marks</div>
              <div>• <strong>Attempt questions you're confident about:</strong> Correct answers give you full marks</div>
              <div>• <strong>For MCQ Multiple:</strong> Only select options you're sure about to avoid negative marking</div>
              <div>• <strong>Time management:</strong> Focus on questions you can solve rather than attempting all</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}
