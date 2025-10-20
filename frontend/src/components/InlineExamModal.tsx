'use client';

import { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Play,
  Pause
} from 'lucide-react';
import api from '@/lib/api';

interface Question {
  id: string;
  stem: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  explanation?: string;
  difficulty?: string;
}

interface Exam {
  id: string;
  title: string;
  timeLimitMin?: number;
  questions: Question[];
}

interface InlineExamModalProps {
  examId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (results: ExamResults) => void;
}

interface ExamResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  answers: Array<{
    questionId: string;
    selectedOptionId: string;
    isCorrect: boolean;
  }>;
}

export default function InlineExamModal({ 
  examId, 
  isOpen, 
  onClose, 
  onSubmit 
}: InlineExamModalProps) {
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && examId) {
      loadExam();
    }
  }, [isOpen, examId]);

  useEffect(() => {
    if (exam && exam.timeLimitMin) {
      setTimeRemaining(exam.timeLimitMin * 60);
    }
  }, [exam]);

  useEffect(() => {
    if (timeRemaining > 0 && !isPaused) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handleSubmit();
    }
  }, [timeRemaining, isPaused]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/student/exams/papers/${examId}`);
      setExam(response.data);
      setStartTime(new Date());
    } catch (error) {
      console.error('Failed to load exam:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < (exam?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!exam) return;
    
    setIsSubmitting(true);
    try {
      // Create submission
      const submissionResponse = await api.post('/student/exams/submissions', {
        examPaperId: examId
      });
      
      const submissionId = submissionResponse.data.id;
      
      // Prepare all answers for single submission
      const answersToSubmit = Object.entries(answers)
        .filter(([_, optionId]) => optionId)
        .map(([questionId, optionId]) => ({
          questionId,
          optionId,
        }));

      // Submit exam with all answers at once
      const finalizeResponse = await api.post(`/student/exams/${exam.id}/submit`, {
        answers: answersToSubmit,
        submissionId: submissionId, // Pass the submission ID
      });
      
      const timeSpent = startTime ? Math.floor((Date.now() - startTime.getTime()) / 1000) : 0;
      
      onSubmit({
        score: finalizeResponse.data.scorePercent || 0,
        totalQuestions: exam.questions.length,
        correctAnswers: finalizeResponse.data.correctCount || 0,
        timeSpent,
        answers: Object.entries(answers).map(([questionId, optionId]) => ({
          questionId,
          selectedOptionId: optionId,
          isCorrect: exam.questions.find(q => q.id === questionId)?.options.find(o => o.id === optionId)?.isCorrect || false
        }))
      });
      
      onClose();
    } catch (error) {
      console.error('Failed to submit exam:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const getProgressPercentage = () => {
    if (!exam) return 0;
    return ((currentQuestionIndex + 1) / exam.questions.length) * 100;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{exam?.title}</h2>
            <p className="text-sm text-gray-500">
              Question {currentQuestionIndex + 1} of {exam?.questions.length}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {exam?.timeLimitMin && (
              <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                timeRemaining < 300 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
              }`}>
                <Clock className="h-4 w-4 mr-1" />
                {formatTime(timeRemaining)}
              </div>
            )}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : exam && exam.questions[currentQuestionIndex] ? (
            <div className="space-y-6">
              {/* Question */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {exam.questions[currentQuestionIndex].stem}
                </h3>
                
                {/* Options */}
                <div className="space-y-3">
                  {exam.questions[currentQuestionIndex].options.map((option, index) => (
                    <label
                      key={option.id}
                      className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        answers[exam.questions[currentQuestionIndex].id] === option.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${exam.questions[currentQuestionIndex].id}`}
                        value={option.id}
                        checked={answers[exam.questions[currentQuestionIndex].id] === option.id}
                        onChange={() => handleAnswerSelect(exam.questions[currentQuestionIndex].id, option.id)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <span className="font-medium text-gray-700">
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="ml-2 text-gray-700">{option.text}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No questions available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex space-x-2">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentQuestionIndex === (exam?.questions.length || 0) - 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-500">
              {Object.keys(answers).length} of {exam?.questions.length} answered
            </div>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Submit Exam
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
