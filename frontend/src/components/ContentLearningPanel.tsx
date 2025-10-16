'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Pencil,
  Lightbulb,
  BarChart3,
  Play,
  CheckCircle,
  Clock,
  GraduationCap
} from 'lucide-react';
import api from '@/lib/api';
import { useToastContext } from '@/contexts/ToastContext';
import LatexRichTextEditor from '@/components/LatexRichTextEditor';

interface ContentLearningPanelProps {
  contentId: string;
  contentTitle: string;
  onExamCreated?: (examId: string) => void;
}

interface Notes {
  notes: string;
  lastUpdated: string;
  version: number;
}

interface AIQuestion {
  stem: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  explanation: string;
  difficulty: string;
  topic: string;
  subtopic?: string;
}

interface PerformanceAnalysis {
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  difficultyLevel: string;
  learningStyle: string;
  recommendedActions: string[];
  nextSteps: string[];
}

export default function ContentLearningPanel({ 
  contentId, 
  contentTitle, 
  onExamCreated 
}: ContentLearningPanelProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToastContext();
  const [activeTab, setActiveTab] = useState<'notes' | 'questions' | 'analysis'>('notes');
  const [questionsSubTab, setQuestionsSubTab] = useState<'ai-questions' | 'quizzes'>('ai-questions');
  const [notes, setNotes] = useState<Notes | null>(null);
  const [notesContent, setNotesContent] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<AIQuestion[]>([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [performanceAnalysis, setPerformanceAnalysis] = useState<PerformanceAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [creatingExam, setCreatingExam] = useState(false);
  const [examCreated, setExamCreated] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<number[]>([]);
  const [createdExamId, setCreatedExamId] = useState<string | null>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [aiUsage, setAiUsage] = useState<any>(null);
  const [loadingUsage, setLoadingUsage] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadNotes();
    loadPerformanceAnalysis();
    loadQuizzes();
    loadAIUsage();
  }, [contentId]);

  const loadNotes = async () => {
    try {
      const response = await api.get(`/student/content-learning/notes/${contentId}`);
      if (response.data) {
        setNotes(response.data);
        setNotesContent(response.data.notes || '');
      }
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const loadQuizzes = async () => {
    setLoadingQuizzes(true);
    try {
      const response = await api.get(`/student/content-learning/exams/${contentId}`);
      setQuizzes(response.data || []);
    } catch (error) {
      console.error('Failed to load quizzes:', error);
      setQuizzes([]);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const loadAIUsage = async () => {
    setLoadingUsage(true);
    try {
      const response = await api.get(`/student/content-learning/usage/${contentId}`);
      setAiUsage(response.data);
    } catch (error) {
      console.error('Failed to load AI usage:', error);
      setAiUsage(null);
    } finally {
      setLoadingUsage(false);
    }
  };

  const saveNotes = async () => {
    if (!notesContent.trim()) return;
    
    setSavingNotes(true);
    try {
      const response = await api.post(`/student/content-learning/notes/${contentId}`, {
        notes: notesContent
      });
      setNotes(response.data);
      
      // Show success toast
      showSuccess(
        'Notes Saved!',
        'Your notes have been saved successfully.'
      );
    } catch (error) {
      console.error('Failed to save notes:', error);
      
      // Show error toast
      showError(
        'Save Failed',
        'Failed to save notes. Please try again.'
      );
    } finally {
      setSavingNotes(false);
    }
  };

  const generateAIQuestions = async () => {
    if (!contentId) {
      console.error('Content ID is missing');
      return;
    }
    
    setGeneratingQuestions(true);
    setExamCreated(false);
    try {
      // Check usage before generating
      const usageResponse = await api.post(`/student/content-learning/check-usage/${contentId}`, {
        featureType: 'AI_QUESTIONS'
      });
      
      if (!usageResponse.data.canUse) {
        showError(
          'Usage Limit Reached',
          usageResponse.data.message
        );
        return;
      }
      
      const requestBody = {
        contentId,
        questionCount,
        difficulty
      };
      
      console.log('Sending AI questions request:', requestBody);
      console.log('Content ID:', contentId);
      console.log('Question Count:', questionCount);
      console.log('Difficulty:', difficulty);
      console.log('API base URL:', api.defaults.baseURL);
      console.log('Auth token:', localStorage.getItem('token') ? 'Present' : 'Missing');
      
      const response = await api.post('/student/content-learning/generate-questions', requestBody);
      
      console.log('AI questions response:', response.data);
      
      setAiQuestions(response.data.questions);
      setSelectedQuestions([]); // Reset selection when new questions are generated
      setExamCreated(false); // Reset exam created status
      
      // Show success toast
      showSuccess(
        'Questions Generated!',
        `Successfully generated ${response.data.questions.length} AI questions. Select the ones you want for your practice exam.`
      );
      
      // Reload usage after successful generation
      loadAIUsage();
      
      if (onExamCreated) {
        onExamCreated(response.data.examPaperId);
      }
    } catch (error: any) {
      console.error('Failed to generate questions:', error);
      console.error('Error details:', error.response?.data);

      // Show error toast
      const errorMessage = error.response?.data?.message || 'Failed to generate questions. Please try again.';
      showError(
        'Question Generation Failed',
        errorMessage
      );
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const toggleQuestionSelection = (questionIndex: number) => {
    setSelectedQuestions(prev => {
      if (prev.includes(questionIndex)) {
        return prev.filter(index => index !== questionIndex);
      } else {
        return [...prev, questionIndex];
      }
    });
  };

  const selectAllQuestions = () => {
    setSelectedQuestions(aiQuestions.map((_, index) => index));
  };

  const deselectAllQuestions = () => {
    setSelectedQuestions([]);
  };

  const createExamFromSelectedQuestions = async () => {
    if (selectedQuestions.length === 0) {
      console.error('No questions selected for exam');
      return;
    }

    setCreatingExam(true);
    try {
      // First, create questions in the database
      const questionsToCreate = selectedQuestions.map(index => aiQuestions[index]);
      
      const questionsResponse = await api.post('/student/content-learning/create-questions', {
        contentId,
        questions: questionsToCreate
      });

      console.log('Questions created:', questionsResponse.data);

      // Then create the exam with the created question IDs
      const response = await api.post(`/student/content-learning/create-exam/${contentId}`, {
        questionIds: questionsResponse.data.questionIds,
        title: `AI Generated Quiz - ${contentTitle}`,
        description: `Practice quiz with ${selectedQuestions.length} selected AI-generated questions`,
        timeLimitMin: selectedQuestions.length * 2 // 2 minutes per question
      });

      console.log('Exam created successfully:', response.data);
      setExamCreated(true);
      setCreatedExamId(response.data.id);
      
      // Show success toast
      showSuccess(
        'Practice Exam Created!',
        `Successfully created practice exam with ${selectedQuestions.length} questions. You can now start the exam.`
      );
      
      if (onExamCreated) {
        onExamCreated(response.data.id);
      }
    } catch (error: any) {
      console.error('Failed to create exam:', error);
      console.error('Error details:', error.response?.data);

      // Show error toast
      const errorMessage = error.response?.data?.message || 'Failed to create practice exam. Please try again.';
      showError(
        'Exam Creation Failed',
        errorMessage
      );
    } finally {
      setCreatingExam(false);
    }
  };

  const startExam = async () => {
    console.log('Starting exam with ID:', createdExamId);
    
    if (!createdExamId) {
      console.error('No exam ID available for starting exam');
      showError(
        'No Exam Available',
        'Please create a practice exam first before starting.'
      );
      return;
    }

    try {
      // Call the start exam endpoint to create a submission
      console.log('Starting exam via API:', `/exams/papers/${createdExamId}/start`);
      const response = await api.post(`/exams/papers/${createdExamId}/start`);
      const { submissionId } = response.data;
      
      console.log('Exam started, submission ID:', submissionId);
      
      // Redirect to exam page with submission ID
      console.log('Redirecting to exam page:', `/student/exam/${submissionId}`);
      router.push(`/student/exam/${submissionId}`);
    } catch (error: any) {
      console.error('Failed to start exam:', error);
      console.error('Error details:', error.response?.data);

      const errorMessage = error.response?.data?.message || 'Failed to start exam. Please try again.';
      showError(
        'Failed to Start Exam',
        errorMessage
      );
    }
  };

  const startQuiz = async (quizId: string) => {
    try {
      console.log('Starting quiz:', quizId);
      const response = await api.post(`/exams/papers/${quizId}/start`);
      const { submissionId } = response.data;
      
      console.log('Quiz started, submission ID:', submissionId);
      router.push(`/student/exam/${submissionId}`);
    } catch (error: any) {
      console.error('Failed to start quiz:', error);
      const errorMessage = error.response?.data?.message || 'Failed to start quiz. Please try again.';
      showError('Failed to Start Quiz', errorMessage);
    }
  };

  const loadPerformanceAnalysis = async () => {
    try {
      const response = await api.get(`/student/content-learning/performance-analysis/${contentId}`);
      if (response.data) {
        setPerformanceAnalysis(response.data);
      }
    } catch (error) {
      console.error('Failed to load performance analysis:', error);
    }
  };

  const analyzePerformance = async () => {
    setAnalyzing(true);
    try {
      const response = await api.post(`/student/content-learning/analyze-performance/${contentId}`);
      setPerformanceAnalysis(response.data);
    } catch (error) {
      console.error('Failed to analyze performance:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const tabs = [
    { id: 'notes', name: 'Notes', icon: Pencil },
    { id: 'questions', name: 'AI Questions', icon: Lightbulb },
    { id: 'analysis', name: 'Performance', icon: BarChart3 }
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header - Mobile Responsive */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center">
          <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
          <span className="hidden sm:inline">Learning Tools - </span>
          <span className="truncate">{contentTitle}</span>
        </h3>
      </div>

      {/* Tabs - Mobile Responsive */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-2 sm:space-x-8 px-4 sm:px-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 sm:py-4 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">{tab.name}</span>
              <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content - Mobile Responsive */}
      <div className="p-4 sm:p-6">
        {activeTab === 'notes' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Notes
                <span className="ml-2 text-xs text-gray-500">(Supports LaTeX math equations)</span>
              </label>
              <LatexRichTextEditor
                value={notesContent}
                onChange={(value) => {
                  setNotesContent(value);
                  // Auto-save after 2 seconds of no typing
                  if (autoSaveTimeoutRef.current) {
                    clearTimeout(autoSaveTimeoutRef.current);
                  }
                  autoSaveTimeoutRef.current = setTimeout(() => {
                    saveNotes();
                  }, 2000);
                }}
                placeholder="Write your notes here... You can use LaTeX for math equations (e.g., $x^2 + y^2 = z^2$ or $$\frac{a}{b}$$)"
                height={250}
              />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div className="text-xs sm:text-sm text-gray-500">
                {notes && (
                  <>
                    <div className="hidden sm:block">
                      Last updated: {new Date(notes.lastUpdated).toLocaleString()}
                      <span className="ml-2">Version {notes.version}</span>
                    </div>
                    <div className="sm:hidden">
                      v{notes.version} • {new Date(notes.lastUpdated).toLocaleDateString()}
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {savingNotes && (
                  <div className="flex items-center text-xs sm:text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600 mr-1 sm:mr-2"></div>
                    <span className="hidden sm:inline">Saving...</span>
                    <span className="sm:hidden">...</span>
                  </div>
                )}
                <button
                  onClick={saveNotes}
                  disabled={savingNotes || !notesContent.trim()}
                  className="px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  <span className="hidden sm:inline">Save Notes</span>
                  <span className="sm:hidden">Save</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'questions' && (
          <div className="space-y-6">
            {/* Sub-tabs for Questions */}
            <div className="border-b border-gray-200">
              <nav className="flex space-x-4">
                <button
                  onClick={() => setQuestionsSubTab('ai-questions')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    questionsSubTab === 'ai-questions'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  AI Questions
                </button>
                <button
                  onClick={() => setQuestionsSubTab('quizzes')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    questionsSubTab === 'quizzes'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Quizzes
                </button>
              </nav>
            </div>

            {/* AI Questions Sub-tab */}
            {questionsSubTab === 'ai-questions' && (
              <div className="space-y-6">
                {/* Question Generation Controls - Mobile Responsive */}
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h4 className="text-sm sm:text-md font-medium text-gray-900">Generate AI Questions</h4>
                    {aiUsage && (
                      <div className="text-xs text-gray-600">
                        {aiUsage.AI_QUESTIONS?.usageCount || 0}/{aiUsage.AI_QUESTIONS?.limit || 3} uses
                      </div>
                    )}
                  </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Number of Questions
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full px-2 sm:px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
                  >
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <button
                    onClick={generateAIQuestions}
                    disabled={generatingQuestions || (aiUsage && aiUsage.AI_QUESTIONS?.usageCount >= aiUsage.AI_QUESTIONS?.limit)}
                    className={`w-full px-3 sm:px-4 py-2 rounded-md flex items-center justify-center text-xs sm:text-sm ${
                      aiUsage && aiUsage.AI_QUESTIONS?.usageCount >= aiUsage.AI_QUESTIONS?.limit
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed'
                    }`}
                  >
                    {generatingQuestions ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                        <span className="hidden sm:inline">Generating...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : aiUsage && aiUsage.AI_QUESTIONS?.usageCount >= aiUsage.AI_QUESTIONS?.limit ? (
                      <>
                        <span className="hidden sm:inline">Limit Reached</span>
                        <span className="sm:hidden">Limit</span>
                      </>
                    ) : (
                      <>
                        <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Generate Questions</span>
                        <span className="sm:hidden">Generate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Generated Questions */}
            {aiQuestions.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-md font-medium text-gray-900">Generated Questions</h4>
                    {selectedQuestions.length > 0 && (
                      <p className="text-xs text-blue-600 mt-1">
                        {selectedQuestions.length} of {aiQuestions.length} questions selected
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllQuestions}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllQuestions}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                {aiQuestions.map((question, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${
                    selectedQuestions.includes(index) 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-gray-200'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(index)}
                          onChange={() => toggleQuestionSelection(index)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <h5 className="font-medium text-gray-900">Question {index + 1}</h5>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        question.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-3">{question.stem}</p>
                    
                    <div className="space-y-2 mb-4">
                      {question.options.map((option, optIndex) => (
                        <div key={optIndex} className={`p-2 rounded ${
                          option.isCorrect ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                        }`}>
                          <span className="font-medium mr-2">
                            {String.fromCharCode(65 + optIndex)}.
                          </span>
                          {option.text}
                          {option.isCorrect && (
                            <CheckCircle className="h-4 w-4 text-green-600 inline ml-2" />
                          )}
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-blue-50 p-3 rounded">
                      <h6 className="font-medium text-blue-900 mb-1">Explanation:</h6>
                      <p className="text-blue-800 text-sm">{question.explanation}</p>
                    </div>
                  </div>
                ))}
                
                {/* Exam Creation Button */}
                {aiQuestions.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900">Ready to Practice?</h5>
                        <p className="text-sm text-gray-600">
                          {examCreated 
                            ? `Practice exam ready with ${selectedQuestions.length} selected questions`
                            : selectedQuestions.length > 0
                            ? `Create a practice exam with ${selectedQuestions.length} selected questions`
                            : `Select questions to create a practice exam`
                          }
                        </p>
                        {selectedQuestions.length > 0 && !examCreated && (
                          <p className="text-xs text-blue-600 mt-1">
                            {selectedQuestions.length} of {aiQuestions.length} questions selected
                          </p>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {examCreated ? (
                          <button
                            onClick={startExam}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium text-sm transition-colors"
                          >
                            <Play className="h-4 w-4 inline mr-2" />
                            Start Exam
                          </button>
                        ) : (
                          <button
                            onClick={createExamFromSelectedQuestions}
                            disabled={creatingExam || selectedQuestions.length === 0}
                            className={`px-4 py-2 rounded-md font-medium text-sm ${
                              creatingExam || selectedQuestions.length === 0
                                ? 'bg-gray-400 text-white cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {creatingExam ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline mr-2"></div>
                                Creating Exam...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 inline mr-2" />
                                Create Practice Exam
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
              </div>
            )}

            {/* Quizzes Sub-tab */}
            {questionsSubTab === 'quizzes' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-md font-medium text-gray-900">Available Quizzes</h4>
                  <button
                    onClick={loadQuizzes}
                    disabled={loadingQuizzes}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-sm"
                  >
                    {loadingQuizzes ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Refresh
                      </>
                    )}
                  </button>
                </div>

                {loadingQuizzes ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading quizzes...</p>
                  </div>
                ) : quizzes.length > 0 ? (
                  <div className="space-y-4">
                    {quizzes.map((quiz) => (
                      <div key={quiz.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-1">{quiz.title}</h5>
                            {quiz.description && (
                              <p className="text-sm text-gray-600 mb-2">{quiz.description}</p>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {quiz.timeLimitMin ? `${quiz.timeLimitMin} min` : 'No time limit'}
                              </span>
                              <span className="flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {quiz.questionCount || quiz.questionIds?.length || 0} questions
                              </span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                {quiz.examType || 'Practice'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => startQuiz(quiz.id)}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center text-sm"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Start Quiz
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Quizzes Available</h3>
                    <p className="text-gray-600 mb-4">
                      No quizzes have been created for this content yet.
                    </p>
                    <p className="text-sm text-gray-500">
                      Generate AI questions first to create practice quizzes.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-medium text-gray-900">Performance Analysis</h4>
              <button
                onClick={analyzePerformance}
                disabled={analyzing}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {analyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Analyze Performance
                  </>
                )}
              </button>
            </div>

            {performanceAnalysis ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h5 className="font-medium text-green-900 mb-3 flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Your Strengths
                  </h5>
                  <ul className="space-y-2">
                    {performanceAnalysis.strengths.map((strength, index) => (
                      <li key={index} className="text-green-800 text-sm flex items-start">
                        <span className="text-green-600 mr-2">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="bg-red-50 rounded-lg p-4">
                  <h5 className="font-medium text-red-900 mb-3 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Areas to Improve
                  </h5>
                  <ul className="space-y-2">
                    {performanceAnalysis.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-red-800 text-sm flex items-start">
                        <span className="text-red-600 mr-2">•</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Suggestions */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h5 className="font-medium text-blue-900 mb-3 flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2" />
                    AI Suggestions
                  </h5>
                  <ul className="space-y-2">
                    {performanceAnalysis.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-blue-800 text-sm flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Learning Style & Difficulty */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h5 className="font-medium text-purple-900 mb-3 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2" />
                    Learning Insights
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-purple-800">Learning Style:</span>
                      <span className="ml-2 text-sm text-purple-700">{performanceAnalysis.learningStyle}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-purple-800">Difficulty Level:</span>
                      <span className="ml-2 text-sm text-purple-700">{performanceAnalysis.difficultyLevel}</span>
                    </div>
                  </div>
                </div>

                {/* Recommended Actions */}
                <div className="md:col-span-2 bg-yellow-50 rounded-lg p-4">
                  <h5 className="font-medium text-yellow-900 mb-3 flex items-center">
                    <Play className="h-5 w-5 mr-2" />
                    Recommended Next Steps
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h6 className="text-sm font-medium text-yellow-800 mb-2">Actions:</h6>
                      <ul className="space-y-1">
                        {performanceAnalysis.recommendedActions.map((action, index) => (
                          <li key={index} className="text-yellow-700 text-sm flex items-start">
                            <span className="text-yellow-600 mr-2">•</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h6 className="text-sm font-medium text-yellow-800 mb-2">Next Steps:</h6>
                      <ul className="space-y-1">
                        {performanceAnalysis.nextSteps.map((step, index) => (
                          <li key={index} className="text-yellow-700 text-sm flex items-start">
                            <span className="text-yellow-600 mr-2">•</span>
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No performance analysis available yet.</p>
                <p className="text-sm text-gray-400 mt-2">Click "Analyze Performance" to get AI-powered insights.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
