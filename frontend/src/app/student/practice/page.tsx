'use client';

import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import SubscriptionGuard from '@/components/SubscriptionGuard';
import api from '@/lib/api';
import Swal from 'sweetalert2';

interface Subject {
  id: string;
  name: string;
  description: string | null;
  _count: {
    questions: number;
  };
}

interface Topic {
  id: string;
  name: string;
  description: string | null;
  subject: {
    name: string;
  };
  _count: {
    questions: number;
  };
}

interface Subtopic {
  id: string;
  name: string;
  description: string | null;
  topic: {
    name: string;
    subject: {
      name: string;
    };
  };
  _count: {
    questions: number;
  };
}

interface PracticeTestConfig {
  subjectId?: string;
  lessonId?: string;
  topicId?: string;
  subtopicId?: string;
  questionCount: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
  timeLimit: number; // in minutes
  useAI: boolean; // Whether to use AI-generated questions
}

function PracticeTestPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('');
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [config, setConfig] = useState<PracticeTestConfig>({
    questionCount: 10,
    difficulty: 'MIXED',
    timeLimit: 30,
    useAI: false
  });

  useEffect(() => {
    fetchSubjects();
    fetchSubscriptionStatus();
  }, []);

  // Handle subject parameter from URL
  useEffect(() => {
    if (searchParams) {
      const subjectParam = searchParams.get('subject');
      if (subjectParam && subjects.length > 0) {
        // Find the subject by name
        const subject = subjects.find(s => s.name.toLowerCase() === subjectParam.toLowerCase());
        if (subject) {
          setSelectedSubject(subject.id);
          setConfig(prev => ({ ...prev, subjectId: subject.id }));
        }
      }
    }
  }, [searchParams, subjects]);

  useEffect(() => {
    if (selectedSubject) {
      fetchLessons(selectedSubject);
      fetchTopics(selectedSubject);
    } else {
      setLessons([]);
      setTopics([]);
      setSubtopics([]);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedTopic) {
      fetchSubtopics(selectedTopic);
    } else {
      setSubtopics([]);
    }
  }, [selectedTopic]);

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/student/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const response = await api.get('/student/subscription-status');
      setSubscriptionStatus(response.data.subscriptionStatus);
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    }
  };

  const fetchLessons = async (subjectId: string) => {
    try {
      const response = await api.get(`/student/lessons?subjectId=${subjectId}`);
      setLessons(response.data);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setLessons([]);
    }
  };

  const fetchTopics = async (subjectId: string, lessonId?: string) => {
    try {
      let url = `/student/topics?subjectId=${subjectId}`;
      if (lessonId) {
        url = `/student/topics?subjectId=${subjectId}&lessonId=${lessonId}`;
      }
      const response = await api.get(url);
      setTopics(response.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
      setTopics([]);
    }
  };


  const fetchSubtopics = async (topicId: string) => {
    try {
      const response = await api.get(`/student/subtopics?topicId=${topicId}`);
      setSubtopics(response.data);
    } catch (error) {
      console.error('Error fetching subtopics:', error);
      setSubtopics([]);
    }
  };

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedLesson('');
    setSelectedTopic('');
    setSelectedSubtopic('');
    setConfig(prev => ({ ...prev, subjectId, lessonId: undefined, topicId: undefined, subtopicId: undefined }));
  };

  const handleTopicChange = (topicId: string) => {
    setSelectedTopic(topicId);
    setSelectedSubtopic('');
    setConfig(prev => ({ ...prev, topicId, subtopicId: undefined }));
  };

  const handleLessonChange = (lessonId: string) => {
    setSelectedLesson(lessonId);
    setSelectedTopic('');
    setSelectedSubtopic('');
    setSubtopics([]);
    setConfig(prev => ({ ...prev, lessonId, topicId: undefined, subtopicId: undefined }));
    
    // Load topics for the selected lesson
    if (lessonId) {
      fetchTopics(selectedSubject, lessonId);
    } else {
      // If no lesson selected, fetch topics for the subject
      fetchTopics(selectedSubject);
    }
  };

  const handleSubtopicChange = (subtopicId: string) => {
    setSelectedSubtopic(subtopicId);
    setConfig(prev => ({ ...prev, subtopicId }));
  };

  const handleConfigChange = (field: keyof PracticeTestConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const createPracticeTest = async () => {
    if (!selectedSubject) {
      Swal.fire({
        title: 'Subject Required',
        text: 'Please select a subject to create a practice test',
        icon: 'warning',
      });
      return;
    }

    if (config.useAI && subscriptionStatus?.planType !== 'AI_ENABLED') {
      Swal.fire({
        title: 'AI Access Required',
        text: 'AI-generated questions require an AI-enabled subscription. Please upgrade your plan.',
        icon: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      
      if (config.useAI) {
        // Generate AI practice test
        const aiTestData = {
          subjectId: selectedSubject,
          lessonId: selectedLesson || undefined,
          topicId: selectedTopic || undefined,
          subtopicId: selectedSubtopic || undefined,
          questionCount: config.questionCount,
          difficulty: config.difficulty === 'MIXED' ? 'MEDIUM' : config.difficulty,
          timeLimitMin: config.timeLimit
        };

        const aiResponse = await api.post('/student/exams/ai/generate-practice-test', aiTestData);
        const paperId = aiResponse.data.examPaper.id;

        // Start the practice test
        const startResponse = await api.post(`/student/exams/papers/${paperId}/start`);
        const { submissionId } = startResponse.data;

        // Redirect to the practice test
        router.push(`/student/practice/test/${submissionId}`);
      } else {
        // Generate manual practice test using existing database questions
        const manualTestData = {
          subjectId: selectedSubject,
          lessonId: selectedLesson || undefined,
          topicId: selectedTopic || undefined,
          subtopicId: selectedSubtopic || undefined,
          questionCount: config.questionCount,
          difficulty: config.difficulty,
          timeLimitMin: config.timeLimit
        };

        const manualResponse = await api.post('/student/exams/manual/generate-practice-test', manualTestData);
        const paperId = manualResponse.data.examPaper.id;

        // Start the practice test
        const startResponse = await api.post(`/student/exams/papers/${paperId}/start`);
        const { submissionId } = startResponse.data;

        // Redirect to the practice test
        router.push(`/student/practice/test/${submissionId}`);
      }
    } catch (error: any) {
      console.error('Error creating practice test:', error);
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to create practice test',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const [questionAvailability, setQuestionAvailability] = useState<any>(null);

  const getAvailableQuestions = async () => {
    if (!selectedSubject) return 0;
    
    try {
      const params = new URLSearchParams({
        subjectId: selectedSubject,
        ...(selectedLesson && { lessonId: selectedLesson }),
        ...(selectedTopic && { topicId: selectedTopic }),
        ...(selectedSubtopic && { subtopicId: selectedSubtopic }),
        ...(config.difficulty !== 'MIXED' && { difficulty: config.difficulty })
      });
      
      const response = await api.get(`/student/question-availability?${params}`);
      setQuestionAvailability(response.data);
      return response.data.totalQuestions;
    } catch (error) {
      console.error('Error fetching question availability:', error);
      return 0;
    }
  };

  useEffect(() => {
    if (selectedSubject) {
      getAvailableQuestions();
    }
  }, [selectedSubject, selectedLesson, selectedTopic, selectedSubtopic, config.difficulty]);

  const availableQuestions = questionAvailability?.totalQuestions || 0;

  if (loading && subjects.length === 0) {
    return (
      <ProtectedRoute requiredRole="STUDENT">
        <SubscriptionGuard>
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <p className="mt-6 text-lg font-medium text-gray-700">Loading practice options...</p>
                <p className="mt-2 text-sm text-gray-500">Please wait while we fetch available subjects and topics</p>
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
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Practice Tests</h1>
              <p className="text-lg text-gray-600">Create custom practice tests to improve your skills</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Configuration Panel */}
              <div className="lg:col-span-2 space-y-6">
                {/* Subject Selection */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Content</h2>
                  
                  {/* Subject */}
                  <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Subject *</label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => handleSubjectChange(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                    >
                      <option value="">Choose a subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject._count.questions} questions)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Additional Filters Row */}
                  {selectedSubject && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      {/* Lesson */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Lesson (Optional)</label>
                        <select
                          value={selectedLesson}
                          onChange={(e) => handleLessonChange(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white text-sm"
                        >
                          <option value="">All lessons</option>
                          {lessons.map((lesson) => (
                            <option key={lesson.id} value={lesson.id}>
                              {lesson.name} ({lesson._count?.questions || 0})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Topic */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Topic (Optional)</label>
                        <select
                          value={selectedTopic}
                          onChange={(e) => handleTopicChange(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white text-sm"
                          disabled={!topics.length}
                        >
                          <option value="">All topics</option>
                          {topics.map((topic) => (
                            <option key={topic.id} value={topic.id}>
                              {topic.name} ({topic._count?.questions || 0})
                            </option>
                          ))}
                        </select>
                        {!topics.length && (
                          <p className="text-xs text-gray-500 mt-1">
                            {selectedLesson ? 'No topics' : 'Loading...'}
                          </p>
                        )}
                      </div>

                      {/* Subtopic */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Subtopic (Optional)</label>
                        <select
                          value={selectedSubtopic}
                          onChange={(e) => handleSubtopicChange(e.target.value)}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white text-sm"
                          disabled={!selectedTopic || !subtopics.length}
                        >
                          <option value="">All subtopics</option>
                          {subtopics.map((subtopic) => (
                            <option key={subtopic.id} value={subtopic.id}>
                              {subtopic.name} ({subtopic._count?.questions || 0})
                            </option>
                          ))}
                        </select>
                        {selectedTopic && !subtopics.length && (
                          <p className="text-xs text-gray-500 mt-1">
                            No subtopics
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Test Configuration */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Configuration</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Question Count */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Number of Questions</label>
                      <select
                        value={config.questionCount}
                        onChange={(e) => handleConfigChange('questionCount', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                      >
                        <option value={5}>5 questions</option>
                        <option value={10}>10 questions</option>
                        <option value={15}>15 questions</option>
                        <option value={20}>20 questions</option>
                        <option value={25}>25 questions</option>
                        <option value={30}>30 questions</option>
                      </select>
                    </div>

                    {/* Difficulty */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Difficulty Level</label>
                      <select
                        value={config.difficulty}
                        onChange={(e) => handleConfigChange('difficulty', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                      >
                        <option value="MIXED">Mixed difficulty</option>
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>

                    {/* Time Limit */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Time Limit</label>
                      <select
                        value={config.timeLimit}
                        onChange={(e) => handleConfigChange('timeLimit', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                      >
                        <option value={15}>15 minutes</option>
                        <option value={30}>30 minutes</option>
                        <option value={45}>45 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                      </select>
                    </div>

                    {/* AI Generation Toggle */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Question Source</label>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="questionSource"
                            value="manual"
                            checked={!config.useAI}
                            onChange={() => handleConfigChange('useAI', false)}
                            className="mr-2 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">Database Questions</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="questionSource"
                            value="ai"
                            checked={config.useAI}
                            onChange={() => handleConfigChange('useAI', true)}
                            disabled={subscriptionStatus?.planType !== 'AI_ENABLED'}
                            className="mr-2 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                          />
                          <span className={`text-sm ${subscriptionStatus?.planType !== 'AI_ENABLED' ? 'text-gray-400' : 'text-gray-700'}`}>
                            AI Generated
                            {subscriptionStatus?.planType !== 'AI_ENABLED' && (
                              <span className="ml-1 text-xs text-red-500">(Premium)</span>
                            )}
                          </span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Start Test Button */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <button
                    onClick={createPracticeTest}
                    disabled={!selectedSubject || loading || (!config.useAI && config.questionCount > availableQuestions)}
                    className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold text-lg shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent mr-3"></div>
                        Creating Practice Test...
                      </div>
                    ) : (
                      'Start Practice Test'
                    )}
                  </button>
                  
                  {!config.useAI && config.questionCount > availableQuestions && (
                    <p className="mt-3 text-sm text-red-600 text-center">
                      Only {availableQuestions} questions available. Please reduce the question count.
                    </p>
                  )}
                  {config.useAI && (
                    <p className="mt-3 text-sm text-blue-600 text-center">
                      AI will generate {config.questionCount} questions based on your selection.
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Stats Panel */}
              <div className="space-y-6">
                {/* Available Questions */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Questions</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Questions:</span>
                      <span className="font-semibold text-gray-900">{availableQuestions}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Selected Questions:</span>
                      <span className={`font-semibold ${!config.useAI && config.questionCount > availableQuestions ? 'text-red-600' : 'text-green-600'}`}>
                        {config.questionCount}
                      </span>
                    </div>
                    
                    {/* Difficulty Breakdown */}
                    {questionAvailability?.difficultyBreakdown && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">By Difficulty:</h4>
                        <div className="space-y-1">
                          {questionAvailability.difficultyBreakdown.map((item: any) => (
                            <div key={item.difficulty} className="flex items-center justify-between text-sm">
                              <span className="text-gray-600 capitalize">{item.difficulty.toLowerCase()}:</span>
                              <span className="font-medium text-gray-900">{item.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                                 {/* Quick Start Options */}
                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start</h3>
                   <div className="space-y-3">
                     {subjects.slice(0, 3).map((subject) => (
                       <button
                         key={subject.id}
                         onClick={() => {
                           setSelectedSubject(subject.id);
                           setConfig(prev => ({ ...prev, subjectId: subject.id }));
                         }}
                         className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                       >
                         <div className="font-medium text-gray-900">{subject.name}</div>
                         <div className="text-sm text-gray-600">{subject._count.questions} questions</div>
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Quick Actions */}
                 <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                   <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                   <div className="space-y-3">
                     <Link
                       href="/student/practice/history"
                       className="flex items-center w-full p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                     >
                       <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                       </svg>
                       <div className="text-left">
                         <div className="font-medium text-gray-900">Test History</div>
                         <div className="text-sm text-gray-600">View past practice tests</div>
                       </div>
                     </Link>
                     <Link
                       href="/student/performance"
                       className="flex items-center w-full p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                     >
                       <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                       </svg>
                       <div className="text-left">
                         <div className="font-medium text-gray-900">Performance</div>
                         <div className="text-sm text-gray-600">View detailed analytics</div>
                       </div>
                     </Link>
                   </div>
                 </div>

                                 {/* AI Features */}
                 {subscriptionStatus?.planType === 'AI_ENABLED' && (
                   <div className="bg-purple-50 rounded-lg border border-purple-200 p-6">
                     <h3 className="text-lg font-semibold text-purple-900 mb-3">🤖 AI Features</h3>
                     <ul className="space-y-2 text-sm text-purple-800">
                       <li>• Generate unlimited custom questions</li>
                       <li>• AI-powered explanations for every answer</li>
                       <li>• Personalized difficulty adjustment</li>
                       <li>• Real-time question generation</li>
                     </ul>
                   </div>
                 )}

                 {/* Tips */}
                 <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                   <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 Practice Tips</h3>
                   <ul className="space-y-2 text-sm text-blue-800">
                     <li>• Start with mixed difficulty to assess your level</li>
                     <li>• Focus on specific topics to improve weak areas</li>
                     <li>• Review explanations after each test</li>
                     <li>• Practice regularly for better retention</li>
                   </ul>
                 </div>
              </div>
            </div>
          </div>
        </StudentLayout>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
}

export default function PracticeTestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <PracticeTestPageContent />
    </Suspense>
  );
} 