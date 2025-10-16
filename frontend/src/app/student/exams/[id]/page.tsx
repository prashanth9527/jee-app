'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';
import { useToastContext } from '@/contexts/ToastContext';
import api from '@/lib/api';

interface ExamData {
  id: string;
  title: string;
  description: string;
  questionCount: number;
  timeLimitMin: number;
  examType: string;
  questions: Array<{
    id: string;
    stem: string;
    options: Array<{
      id: string;
      text: string;
      isCorrect: boolean;
    }>;
    explanation: string;
    difficulty: string;
  }>;
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const { showSuccess, showError } = useToastContext();
  const examId = params?.id as string;

  const [examData, setExamData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStarted, setExamStarted] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);

  useEffect(() => {
    if (examId) {
      loadExamData();
    }
  }, [examId]);

  useEffect(() => {
    if (examStarted && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleSubmitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [examStarted, timeRemaining]);

  const loadExamData = async () => {
    try {
      console.log('Loading exam data for ID:', examId);
      const response = await api.get(`/student/exams/${examId}`);
      console.log('Exam data loaded:', response.data);
      
      setExamData(response.data);
      setTimeRemaining(response.data.timeLimitMin * 60); // Convert to seconds
    } catch (error: any) {
      console.error('Failed to load exam:', error);
      console.error('Error details:', error.response?.data);

      const errorMessage = error.response?.data?.message || 'Could not load exam data. Please try again.';
      showError('Failed to Load Exam', errorMessage);
      
      // Redirect back to LMS after a short delay
      setTimeout(() => {
        router.push('/student/lms');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  const startExam = () => {
    setExamStarted(true);
    showSuccess('Exam Started', 'Good luck with your practice exam!');
  };

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmitExam = async () => {
    if (examSubmitted) return;

    setExamSubmitted(true);
    try {
      console.log('Submitting exam:', { examId, answers });
      
      const response = await api.post(`/student/exams/${examId}/submit`, {
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          optionId
        }))
      });

      console.log('Exam submitted successfully:', response.data);
      showSuccess('Exam Submitted', `Your score: ${response.data.scorePercent}%`);
      
      // Redirect to results page or back to LMS
      setTimeout(() => {
        router.push('/student/lms');
      }, 2000);
    } catch (error: any) {
      console.error('Failed to submit exam:', error);
      console.error('Error details:', error.response?.data);

      const errorMessage = error.response?.data?.message || 'Could not submit exam. Please try again.';
      showError('Submission Failed', errorMessage);
      
      // Reset submission state to allow retry
      setExamSubmitted(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <StudentLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading exam...</p>
            </div>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    );
  }

  if (!examData) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <StudentLayout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600">Exam not found</p>
              <button
                onClick={() => router.push('/student/lms')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Back to LMS
              </button>
            </div>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    );
  }

  if (!examStarted) {
    return (
      <ProtectedRoute allowedRoles={['STUDENT']}>
        <StudentLayout>
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{examData.title}</h1>
                <p className="text-gray-600 mb-6">{examData.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{examData.questionCount}</div>
                    <div className="text-sm text-blue-800">Questions</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{examData.timeLimitMin}</div>
                    <div className="text-sm text-green-800">Minutes</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{examData.examType}</div>
                    <div className="text-sm text-purple-800">Type</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={startExam}
                    className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-lg"
                  >
                    Start Exam
                  </button>
                  <div>
                    <button
                      onClick={() => router.push('/student/lms')}
                      className="flex items-center text-gray-600 hover:text-gray-800 mx-auto"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to LMS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </StudentLayout>
      </ProtectedRoute>
    );
  }

  const currentQ = examData.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / examData.questions.length) * 100;

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentLayout>
        <div className="max-w-4xl mx-auto p-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-semibold text-gray-900">{examData.title}</h1>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-red-600">
                  <Clock className="h-5 w-5 mr-2" />
                  <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Question {currentQuestion + 1} of {examData.questions.length}
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Question {currentQuestion + 1}</h2>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  currentQ.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                  currentQ.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {currentQ.difficulty}
                </span>
              </div>
              
              <p className="text-gray-800 text-lg leading-relaxed mb-6">
                {currentQ.stem}
              </p>

              <div className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <label
                    key={option.id}
                    className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                      answers[currentQ.id] === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQ.id}`}
                      value={option.id}
                      checked={answers[currentQ.id] === option.id}
                      onChange={() => handleAnswerSelect(currentQ.id, option.id)}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <span className="font-medium mr-3">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span>{option.text}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t">
              <button
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex space-x-2">
                {examData.questions.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestion(index)}
                    className={`w-8 h-8 rounded-full text-sm font-medium ${
                      index === currentQuestion
                        ? 'bg-blue-600 text-white'
                        : answers[examData.questions[index].id]
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              {currentQuestion === examData.questions.length - 1 ? (
                <button
                  onClick={handleSubmitExam}
                  disabled={examSubmitted}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {examSubmitted ? 'Submitting...' : 'Submit Exam'}
                </button>
              ) : (
                <button
                  onClick={() => setCurrentQuestion(prev => Math.min(examData.questions.length - 1, prev + 1))}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Next
                </button>
              )}
            </div>
          </div>
        </div>
      </StudentLayout>
    </ProtectedRoute>
  );
}
