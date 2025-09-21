'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';

interface AdaptiveTestSession {
  sessionId: string;
  userId: string;
  questions: AdaptiveQuestion[];
  currentQuestionIndex: number;
  answers: Array<{
    questionId: string;
    answer: number;
    timeSpent: number;
    isCorrect: boolean;
    timestamp: Date;
  }>;
  difficultyProgression: Array<{
    questionIndex: number;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    reason: string;
  }>;
  estimatedScore: number;
  timeRemaining: number;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED';
  startedAt: Date;
  completedAt?: Date;
}

interface AdaptiveQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topicId: string;
  subtopicId?: string;
  estimatedTime: number;
  isAIGenerated: boolean;
}

interface AssessmentResult {
  sessionId: string;
  userId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  timeSpent: number;
  averageTimePerQuestion: number;
  difficultyAnalysis: {
    easy: { correct: number; total: number };
    medium: { correct: number; total: number };
    hard: { correct: number; total: number };
  };
  topicPerformance: Array<{
    topicId: string;
    topicName: string;
    score: number;
    questions: number;
  }>;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  nextSteps: string[];
  confidenceLevel: number;
}

export default function AdaptiveAssessmentsPage() {
  const [testSessions, setTestSessions] = useState<AdaptiveTestSession[]>([]);
  const [currentSession, setCurrentSession] = useState<AdaptiveTestSession | null>(null);
  const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('create');
  const [testConfig, setTestConfig] = useState({
    subjectId: '',
    topicId: '',
    subtopicId: '',
    questionCount: 10,
    timeLimit: 30,
    difficultyStart: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    adaptiveMode: true,
    focusAreas: [] as string[]
  });
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [subtopics, setSubtopics] = useState<any[]>([]);
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState<number>(0);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    if (testConfig.subjectId) {
      loadTopics(testConfig.subjectId);
    }
  }, [testConfig.subjectId]);

  useEffect(() => {
    if (testConfig.topicId) {
      loadSubtopics(testConfig.topicId);
    }
  }, [testConfig.topicId]);

  const loadSubjects = async () => {
    try {
      const response = await api.get('/admin/lms/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadTopics = async (subjectId: string) => {
    try {
      const response = await api.get(`/admin/lms/subjects/${subjectId}/topics`);
      setTopics(response.data);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const loadSubtopics = async (topicId: string) => {
    try {
      const response = await api.get(`/admin/lms/topics/${topicId}/subtopics`);
      setSubtopics(response.data);
    } catch (error) {
      console.error('Error loading subtopics:', error);
    }
  };

  const createAdaptiveTest = async () => {
    try {
      setLoading(true);
      const response = await api.post('/ai/advanced/assessments/create-adaptive-test', testConfig);
      setCurrentSession(response.data);
      setActiveTab('test');
      setCurrentQuestionStartTime(Date.now());
    } catch (error) {
      console.error('Error creating adaptive test:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (questionId: string, answer: number) => {
    if (!currentSession) return;

    const timeSpent = Math.floor((Date.now() - currentQuestionStartTime) / 1000);
    
    try {
      const response = await api.post(`/ai/advanced/assessments/${currentSession.sessionId}/submit-answer`, {
        questionId,
        answer,
        timeSpent
      });
      
      setCurrentSession(response.data);
      setCurrentQuestionStartTime(Date.now());

      if (response.data.status === 'COMPLETED') {
        setActiveTab('result');
        loadAssessmentResult(response.data.sessionId);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const loadAssessmentResult = async (sessionId: string) => {
    try {
      const response = await api.get(`/ai/advanced/assessments/${sessionId}/result`);
      setAssessmentResult(response.data);
    } catch (error) {
      console.error('Error loading assessment result:', error);
    }
  };

  const pauseTest = async () => {
    if (!currentSession) return;
    
    try {
      await api.post(`/ai/advanced/assessments/${currentSession.sessionId}/pause`);
      setActiveTab('sessions');
    } catch (error) {
      console.error('Error pausing test:', error);
    }
  };

  const resumeTest = async (sessionId: string) => {
    try {
      const response = await api.post(`/ai/advanced/assessments/${sessionId}/resume`);
      setCurrentSession(response.data);
      setActiveTab('test');
      setCurrentQuestionStartTime(Date.now());
    } catch (error) {
      console.error('Error resuming test:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HARD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">🎯 AI Adaptive Assessments</h1>
                <p className="text-gray-600 mt-1">Personalized tests that adapt to your performance in real-time</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'create', label: 'Create Test', icon: '➕' },
                  { id: 'test', label: 'Take Test', icon: '📝' },
                  { id: 'result', label: 'Results', icon: '📊' },
                  { id: 'sessions', label: 'My Sessions', icon: '📚' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Create Test Tab */}
              {activeTab === 'create' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">🎯 Create Adaptive Test</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Test Configuration */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                        <select
                          value={testConfig.subjectId}
                          onChange={(e) => {
                            setTestConfig({...testConfig, subjectId: e.target.value, topicId: '', subtopicId: ''});
                            setTopics([]);
                            setSubtopics([]);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a subject</option>
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {testConfig.subjectId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Topic (Optional)</label>
                          <select
                            value={testConfig.topicId}
                            onChange={(e) => {
                              setTestConfig({...testConfig, topicId: e.target.value, subtopicId: ''});
                              setSubtopics([]);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All topics</option>
                            {topics.map((topic) => (
                              <option key={topic.id} value={topic.id}>
                                {topic.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {testConfig.topicId && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Subtopic (Optional)</label>
                          <select
                            value={testConfig.subtopicId}
                            onChange={(e) => setTestConfig({...testConfig, subtopicId: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">All subtopics</option>
                            {subtopics.map((subtopic) => (
                              <option key={subtopic.id} value={subtopic.id}>
                                {subtopic.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
                        <select
                          value={testConfig.questionCount}
                          onChange={(e) => setTestConfig({...testConfig, questionCount: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={5}>5 questions</option>
                          <option value={10}>10 questions</option>
                          <option value={15}>15 questions</option>
                          <option value={20}>20 questions</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Limit (minutes)</label>
                        <select
                          value={testConfig.timeLimit}
                          onChange={(e) => setTestConfig({...testConfig, timeLimit: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={15}>15 minutes</option>
                          <option value={30}>30 minutes</option>
                          <option value={45}>45 minutes</option>
                          <option value={60}>60 minutes</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Starting Difficulty</label>
                        <select
                          value={testConfig.difficultyStart}
                          onChange={(e) => setTestConfig({...testConfig, difficultyStart: e.target.value as 'EASY' | 'MEDIUM' | 'HARD'})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="EASY">Easy</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HARD">Hard</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="adaptiveMode"
                          checked={testConfig.adaptiveMode}
                          onChange={(e) => setTestConfig({...testConfig, adaptiveMode: e.target.checked})}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="adaptiveMode" className="ml-2 block text-sm text-gray-700">
                          Enable Adaptive Mode
                        </label>
                      </div>
                    </div>

                    {/* Test Preview */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">Test Preview</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Questions:</span>
                          <span className="text-sm font-medium">{testConfig.questionCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Time Limit:</span>
                          <span className="text-sm font-medium">{testConfig.timeLimit} minutes</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Starting Difficulty:</span>
                          <span className={`text-sm font-medium px-2 py-1 rounded ${getDifficultyColor(testConfig.difficultyStart)}`}>
                            {testConfig.difficultyStart}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Adaptive Mode:</span>
                          <span className="text-sm font-medium">{testConfig.adaptiveMode ? 'Enabled' : 'Disabled'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button
                      onClick={createAdaptiveTest}
                      disabled={loading || !testConfig.subjectId}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                      {loading ? '🔄 Creating Test...' : '🚀 Start Adaptive Test'}
                    </button>
                  </div>
                </div>
              )}

              {/* Take Test Tab */}
              {activeTab === 'test' && currentSession && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Question {currentSession.currentQuestionIndex + 1} of {currentSession.questions.length}
                    </h3>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-600">
                        Time Remaining: {formatTime(currentSession.timeRemaining)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Estimated Score: {currentSession.estimatedScore}%
                      </div>
                      <button
                        onClick={pauseTest}
                        className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                      >
                        Pause
                      </button>
                    </div>
                  </div>

                  {currentSession.currentQuestionIndex < currentSession.questions.length && (
                    <div className="bg-white border rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentSession.questions[currentSession.currentQuestionIndex].difficulty)}`}>
                          {currentSession.questions[currentSession.currentQuestionIndex].difficulty}
                        </span>
                        <span className="text-sm text-gray-600">
                          {currentSession.questions[currentSession.currentQuestionIndex].estimatedTime}s estimated
                        </span>
                      </div>

                      <h4 className="text-lg font-medium text-gray-900 mb-4">
                        {currentSession.questions[currentSession.currentQuestionIndex].question}
                      </h4>

                      <div className="space-y-3 mb-6">
                        {currentSession.questions[currentSession.currentQuestionIndex].options.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => submitAnswer(
                              currentSession.questions[currentSession.currentQuestionIndex].id,
                              index
                            )}
                            className="w-full text-left p-4 border border-gray-300 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors"
                          >
                            <span className="font-medium mr-3">{String.fromCharCode(65 + index)}.</span>
                            {option}
                          </button>
                        ))}
                      </div>

                      {currentSession.difficultyProgression.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">Difficulty Progression</h5>
                          <div className="flex space-x-2">
                            {currentSession.difficultyProgression.map((prog, index) => (
                              <div key={index} className="text-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getDifficultyColor(prog.difficulty)}`}>
                                  {index + 1}
                                </div>
                                <div className="text-xs text-gray-600 mt-1">{prog.difficulty}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Results Tab */}
              {activeTab === 'result' && assessmentResult && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">🎉 Test Completed!</h3>
                    <div className="text-4xl font-bold text-blue-600 mb-2">{assessmentResult.score}%</div>
                    <p className="text-gray-600">
                      {assessmentResult.correctAnswers} out of {assessmentResult.totalQuestions} questions correct
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">⏱️ Time Performance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-700">Total Time:</span>
                          <span className="text-sm font-medium">{formatTime(assessmentResult.timeSpent)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-blue-700">Avg per Question:</span>
                          <span className="text-sm font-medium">{assessmentResult.averageTimePerQuestion}s</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">📊 Difficulty Analysis</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700">Easy:</span>
                          <span className="text-sm font-medium">{assessmentResult.difficultyAnalysis.easy.correct}/{assessmentResult.difficultyAnalysis.easy.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700">Medium:</span>
                          <span className="text-sm font-medium">{assessmentResult.difficultyAnalysis.medium.correct}/{assessmentResult.difficultyAnalysis.medium.total}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-green-700">Hard:</span>
                          <span className="text-sm font-medium">{assessmentResult.difficultyAnalysis.hard.correct}/{assessmentResult.difficultyAnalysis.hard.total}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-2">🎯 Confidence Level</h4>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{assessmentResult.confidenceLevel}%</div>
                        <div className="text-sm text-purple-700">AI Confidence</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-green-50 rounded-lg p-4">
                      <h4 className="font-semibold text-green-900 mb-2">✅ Strengths</h4>
                      <ul className="space-y-1">
                        {assessmentResult.strengths.map((strength, index) => (
                          <li key={index} className="text-sm text-green-700">• {strength}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-red-50 rounded-lg p-4">
                      <h4 className="font-semibold text-red-900 mb-2">⚠️ Areas for Improvement</h4>
                      <ul className="space-y-1">
                        {assessmentResult.weaknesses.map((weakness, index) => (
                          <li key={index} className="text-sm text-red-700">• {weakness}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">🚀 Recommendations</h4>
                    <ul className="space-y-1">
                      {assessmentResult.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm text-blue-700">• {rec}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">📈 Next Steps</h4>
                    <ul className="space-y-1">
                      {assessmentResult.nextSteps.map((step, index) => (
                        <li key={index} className="text-sm text-purple-700">• {step}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Sessions Tab */}
              {activeTab === 'sessions' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">📚 My Test Sessions</h3>
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📝</div>
                    <p className="text-gray-500 mb-4">No test sessions yet</p>
                    <p className="text-sm text-gray-400">Create your first adaptive test to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </StudentLayout>
    </ProtectedRoute>
  );
}


