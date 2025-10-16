'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';
import { useToastContext } from '@/contexts/ToastContext';

interface LessonSummary {
  keyConcepts: string[];
  importantFormulas: string[];
  commonMistakes: string[];
  practiceTips: string[];
  relatedTopics: string[];
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';
  estimatedStudyTime: number;
  prerequisites: string[];
  learningObjectives: string[];
}

interface TopicExplanation {
  overview: string;
  keyPoints: string[];
  detailedExplanation: string;
  examples: Array<{
    problem: string;
    solution: string;
    explanation: string;
  }>;
  visualAids: Array<{
    type: 'DIAGRAM' | 'CHART' | 'GRAPH' | 'FORMULA';
    description: string;
    content: string;
  }>;
  commonQuestions: Array<{
    question: string;
    answer: string;
  }>;
  practiceExercises: Array<{
    problem: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    hints: string[];
  }>;
}

interface MicroLesson {
  lessonId: string;
  title: string;
  duration: number;
  content: {
    introduction: string;
    mainContent: string;
    summary: string;
    keyTakeaways: string[];
  };
  interactiveElements: Array<{
    type: 'QUIZ' | 'EXERCISE' | 'REFLECTION';
    content: string;
    expectedResponse?: string;
  }>;
  assessment: {
    questions: Array<{
      question: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>;
  };
}

export default function AIContentGeneratorPage() {
  const [activeTab, setActiveTab] = useState('lesson-summary');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [subtopics, setSubtopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [contentExists, setContentExists] = useState(false);
  const [hasAISubscription, setHasAISubscription] = useState<boolean | null>(null);
  const { showError, showInfo } = useToastContext();

  useEffect(() => {
    loadSubjects();
    checkAISubscription();
  }, []);

  const checkAISubscription = async () => {
    try {
      const response = await api.get('/subscriptions/status');
      setHasAISubscription(response.data.plan === 'AI_ENABLED');
    } catch (error) {
      console.error('Error checking AI subscription:', error);
      setHasAISubscription(false);
    }
  };

  useEffect(() => {
    if (selectedSubject) {
      loadLessons(selectedSubject);
    } else {
      setLessons([]);
      setTopics([]);
      setSubtopics([]);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedTopic) {
      loadSubtopics(selectedTopic);
    } else {
      setSubtopics([]);
    }
  }, [selectedTopic]);

  const loadSubjects = async () => {
    try {
      const response = await api.get('/student/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadLessons = async (subjectId: string) => {
    try {
      const response = await api.get(`/student/lms/lessons?subjectId=${subjectId}`);
      setLessons(response.data);
    } catch (error) {
      console.error('Error loading lessons:', error);
      setLessons([]);
    }
  };

  const loadTopics = async (subjectId: string, lessonId?: string) => {
    try {
      let url = `/student/topics?subjectId=${subjectId}`;
      if (lessonId) {
        url = `/student/topics?subjectId=${subjectId}&lessonId=${lessonId}`;
      }
      const response = await api.get(url);
      setTopics(response.data);
    } catch (error) {
      console.error('Error loading topics:', error);
      setTopics([]);
    }
  };

  const loadSubtopics = async (topicId: string) => {
    try {
      const response = await api.get(`/student/subtopics?topicId=${topicId}`);
      setSubtopics(response.data);
    } catch (error) {
      console.error('Error loading subtopics:', error);
      setSubtopics([]);
    }
  };

  const generateLessonSummary = async () => {
    if (!selectedLesson) return;

    try {
      setLoading(true);
      
      // Check if content already exists
      const checkResponse = await api.get(`/ai/advanced/content/check/LESSON_SUMMARY/${selectedLesson}`);
      if (checkResponse.data.exists) {
        setGeneratedContent(checkResponse.data.content);
        setContentExists(true);
        return;
      }

      const response = await api.get(`/ai/advanced/content/lesson-summary/${selectedLesson}`);
      setGeneratedContent(response.data);
      setContentExists(false);
    } catch (error: any) {
      console.error('Error generating lesson summary:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate lesson summary';
      
      if (errorMessage.includes('AI_ENABLED subscription')) {
        showError('Upgrade Required', 'AI content generation requires AI_ENABLED subscription. Please upgrade your plan to use this feature.');
      } else {
        showError('Generation Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateTopicExplanation = async () => {
    if (!selectedTopic) return;

    try {
      setLoading(true);
      
      // Check if content already exists
      const checkResponse = await api.get(`/ai/advanced/content/check/TOPIC_EXPLANATION/${selectedTopic}`);
      if (checkResponse.data.exists) {
        setGeneratedContent(checkResponse.data.content);
        setContentExists(true);
        return;
      }

      const response = await api.get(`/ai/advanced/content/topic-explanation/${selectedTopic}`);
      setGeneratedContent(response.data);
      setContentExists(false);
    } catch (error: any) {
      console.error('Error generating topic explanation:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate topic explanation';
      
      if (errorMessage.includes('AI_ENABLED subscription')) {
        showError('Upgrade Required', 'AI content generation requires AI_ENABLED subscription. Please upgrade your plan to use this feature.');
      } else {
        showError('Generation Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateMicroLesson = async () => {
    if (!selectedSubtopic) return;

    try {
      setLoading(true);
      
      // Check if content already exists
      const checkResponse = await api.get(`/ai/advanced/content/check/MICRO_LESSON/${selectedSubtopic}`);
      if (checkResponse.data.exists) {
        setGeneratedContent(checkResponse.data.content);
        setContentExists(true);
        return;
      }

      const response = await api.get(`/ai/advanced/content/micro-lesson/${selectedSubtopic}`);
      setGeneratedContent(response.data);
      setContentExists(false);
    } catch (error: any) {
      console.error('Error generating micro lesson:', error);
      const errorMessage = error.response?.data?.message || 'Failed to generate micro lesson';
      
      if (errorMessage.includes('AI_ENABLED subscription')) {
        showError('Upgrade Required', 'AI content generation requires AI_ENABLED subscription. Please upgrade your plan to use this feature.');
      } else {
        showError('Generation Failed', errorMessage);
      }
    } finally {
      setLoading(false);
    }
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
                <h1 className="text-2xl font-bold text-gray-900">🤖 AI Content Generator</h1>
                <p className="text-gray-600 mt-1">Generate personalized learning content using AI</p>
                {hasAISubscription === false && (
                  <div className="mt-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-orange-700">
                          <strong>AI Subscription Required:</strong> This feature requires an AI_ENABLED subscription. Please upgrade your plan to generate AI content.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sidebar - Content Selection */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Select Content</h3>
                
                {/* Subject Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                      setSelectedLesson('');
                      setSelectedTopic('');
                      setSelectedSubtopic('');
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

                {/* Lesson Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lesson</label>
                  <select
                    value={selectedLesson}
                    onChange={(e) => {
                      setSelectedLesson(e.target.value);
                      setSelectedTopic('');
                      setSelectedSubtopic('');
                      if (e.target.value && selectedSubject) {
                        loadTopics(selectedSubject, e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedSubject}
                  >
                    <option value="">Select a lesson</option>
                    {lessons.map((lesson) => (
                      <option key={lesson.id} value={lesson.id}>
                        {lesson.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Topic Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => {
                      setSelectedTopic(e.target.value);
                      setSelectedSubtopic('');
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedSubject}
                  >
                    <option value="">Select a topic</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subtopic Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subtopic</label>
                  <select
                    value={selectedSubtopic}
                    onChange={(e) => setSelectedSubtopic(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={!selectedSubject || !selectedTopic}
                  >
                    <option value="">Select a subtopic</option>
                    {subtopics.map((subtopic) => (
                      <option key={subtopic.id} value={subtopic.id}>
                        {subtopic.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Content Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Content Type</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setActiveTab('lesson-summary')}
                      className={`w-full text-left px-3 py-2 rounded-md border ${
                        activeTab === 'lesson-summary'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      📝 Lesson Summary
                    </button>
                    <button
                      onClick={() => setActiveTab('topic-explanation')}
                      className={`w-full text-left px-3 py-2 rounded-md border ${
                        activeTab === 'topic-explanation'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      🔍 Topic Explanation
                    </button>
                    <button
                      onClick={() => setActiveTab('micro-lesson')}
                      className={`w-full text-left px-3 py-2 rounded-md border ${
                        activeTab === 'micro-lesson'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      ⚡ Micro Lesson
                    </button>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={() => {
                    if (hasAISubscription === false) {
                      showError('Upgrade Required', 'AI content generation requires AI_ENABLED subscription. Please upgrade your plan to use this feature.');
                      return;
                    }
                    if (activeTab === 'lesson-summary') generateLessonSummary();
                    else if (activeTab === 'topic-explanation') generateTopicExplanation();
                    else if (activeTab === 'micro-lesson') generateMicroLesson();
                  }}
                  disabled={loading || !selectedSubject || (
                    (activeTab === 'lesson-summary' && !selectedLesson) ||
                    (activeTab === 'topic-explanation' && !selectedTopic) ||
                    (activeTab === 'micro-lesson' && !selectedSubtopic)
                  )}
                  className={`w-full px-4 py-2 rounded-lg transition-colors ${
                    hasAISubscription === false 
                      ? 'bg-orange-500 text-white hover:bg-orange-600' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed'
                  }`}
                >
                  {loading ? '🔄 Generating...' : 
                   hasAISubscription === false ? '🔒 Upgrade to Generate Content' : 
                   '🚀 Generate Content'}
                </button>
              </div>
            </div>

            {/* Main Content - Generated Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {activeTab === 'lesson-summary' && '📝 Generated Lesson Summary'}
                  {activeTab === 'topic-explanation' && '🔍 Generated Topic Explanation'}
                  {activeTab === 'micro-lesson' && '⚡ Generated Micro Lesson'}
                </h3>

                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">AI is generating content...</span>
                  </div>
                )}

                {generatedContent && !loading && (
                  <div className="space-y-6">
                    {contentExists && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm text-blue-700">
                              <strong>Previously Generated Content:</strong> This content was generated earlier and is being displayed from your saved content.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* Lesson Summary */}
                    {activeTab === 'lesson-summary' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-bold text-gray-900">Lesson Summary</h4>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(generatedContent.difficultyLevel || 'MEDIUM')}`}>
                            {generatedContent.difficultyLevel || 'MEDIUM'}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-blue-50 rounded-lg p-4">
                            <h5 className="font-semibold text-blue-900 mb-2">🎯 Key Concepts</h5>
                            <ul className="space-y-1">
                              {(generatedContent.keyConcepts || []).map((concept: string, index: number) => (
                                <li key={index} className="text-sm text-blue-800">• {concept}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-green-50 rounded-lg p-4">
                            <h5 className="font-semibold text-green-900 mb-2">📚 Learning Objectives</h5>
                            <ul className="space-y-1">
                              {(generatedContent.learningObjectives || []).map((objective: string, index: number) => (
                                <li key={index} className="text-sm text-green-800">• {objective}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-yellow-50 rounded-lg p-4">
                            <h5 className="font-semibold text-yellow-900 mb-2">⚠️ Common Mistakes</h5>
                            <ul className="space-y-1">
                              {(generatedContent.commonMistakes || []).map((mistake: string, index: number) => (
                                <li key={index} className="text-sm text-yellow-800">• {mistake}</li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-purple-50 rounded-lg p-4">
                            <h5 className="font-semibold text-purple-900 mb-2">💡 Practice Tips</h5>
                            <ul className="space-y-1">
                              {(generatedContent.practiceTips || []).map((tip: string, index: number) => (
                                <li key={index} className="text-sm text-purple-800">• {tip}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {(generatedContent.importantFormulas || []).length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="font-semibold text-gray-900 mb-2">📐 Important Formulas</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {(generatedContent.importantFormulas || []).map((formula: string, index: number) => (
                                <div key={index} className="bg-white rounded p-2 text-sm font-mono">
                                  {formula}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <span>Estimated study time: {generatedContent.estimatedStudyTime || 0} minutes</span>
                          <span>Prerequisites: {(generatedContent.prerequisites || []).length} topics</span>
                        </div>
                      </div>
                    )}

                    {/* Topic Explanation */}
                    {activeTab === 'topic-explanation' && (
                      <div className="space-y-6">
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h5 className="font-semibold text-blue-900 mb-2">📖 Overview</h5>
                          <p className="text-blue-800">{generatedContent.overview || 'No overview available'}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2">🎯 Key Points</h5>
                            <ul className="space-y-1">
                              {(generatedContent.keyPoints || []).map((point: string, index: number) => (
                                <li key={index} className="text-sm text-gray-700">• {point}</li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2">❓ Common Questions</h5>
                            <div className="space-y-2">
                              {(generatedContent.commonQuestions || []).slice(0, 3).map((qa: any, index: number) => (
                                <div key={index} className="bg-white rounded p-2 border">
                                  <p className="text-sm font-medium">{qa.question}</p>
                                  <p className="text-xs text-gray-600 mt-1">{qa.answer}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h5 className="font-semibold text-gray-900 mb-2">📝 Detailed Explanation</h5>
                          <p className="text-gray-700">{generatedContent.detailedExplanation || 'No detailed explanation available'}</p>
                        </div>

                        {(generatedContent.examples || []).length > 0 && (
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2">📚 Examples</h5>
                            <div className="space-y-4">
                              {(generatedContent.examples || []).slice(0, 2).map((example: any, index: number) => (
                                <div key={index} className="bg-white border rounded-lg p-4">
                                  <p className="font-medium text-gray-900 mb-2">{example.problem}</p>
                                  <p className="text-sm text-gray-700 mb-2">{example.solution}</p>
                                  <p className="text-xs text-gray-600">{example.explanation}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Suggested Readings */}
                        {(generatedContent.suggestedReadings || []).length > 0 && (
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2">📖 Suggested Readings</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {(generatedContent.suggestedReadings || []).map((reading: any, index: number) => (
                                <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h6 className="font-medium text-blue-900 mb-1">{reading.title}</h6>
                                      <p className="text-sm text-blue-700 mb-2">{reading.description}</p>
                                      <div className="flex items-center space-x-2 text-xs text-blue-600">
                                        <span className="bg-blue-200 px-2 py-1 rounded">{reading.type}</span>
                                        <span className="bg-blue-200 px-2 py-1 rounded">{reading.difficulty}</span>
                                      </div>
                                    </div>
                                    <a 
                                      href={reading.url} 
                                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      Read →
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Related Content */}
                        {(generatedContent.relatedContent || []).length > 0 && (
                          <div>
                            <h5 className="font-semibold text-gray-900 mb-2">🔗 Related Content</h5>
                            <div className="grid grid-cols-1 gap-3">
                              {(generatedContent.relatedContent || []).map((content: any, index: number) => (
                                <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h6 className="font-medium text-gray-900 mb-1">{content.title}</h6>
                                      <p className="text-sm text-gray-600 mb-2">{content.description}</p>
                                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                                        <span>{content.subject}</span>
                                        <span>•</span>
                                        <span>{content.topic}</span>
                                        {content.subtopic && (
                                          <>
                                            <span>•</span>
                                            <span>{content.subtopic}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                    <a 
                                      href={content.url} 
                                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      View →
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Micro Lesson */}
                    {activeTab === 'micro-lesson' && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xl font-bold text-gray-900">{generatedContent.title || 'Untitled Lesson'}</h4>
                          <span className="text-sm text-gray-600">{generatedContent.duration || 0} minutes</span>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-4">
                          <h5 className="font-semibold text-blue-900 mb-2">🎯 Introduction</h5>
                          <p className="text-blue-800">{generatedContent.content?.introduction || 'No introduction available'}</p>
                        </div>

                        <div className="bg-green-50 rounded-lg p-4">
                          <h5 className="font-semibold text-green-900 mb-2">📚 Main Content</h5>
                          <p className="text-green-800">{generatedContent.content?.mainContent || 'No main content available'}</p>
                        </div>

                        <div className="bg-yellow-50 rounded-lg p-4">
                          <h5 className="font-semibold text-yellow-900 mb-2">📝 Summary</h5>
                          <p className="text-yellow-800">{generatedContent.content?.summary || 'No summary available'}</p>
                        </div>

                        <div className="bg-purple-50 rounded-lg p-4">
                          <h5 className="font-semibold text-purple-900 mb-2">🔑 Key Takeaways</h5>
                          <ul className="space-y-1">
                            {(generatedContent.content?.keyTakeaways || []).map((takeaway: string, index: number) => (
                              <li key={index} className="text-sm text-purple-800">• {takeaway}</li>
                            ))}
                          </ul>
                        </div>

                        {(generatedContent.assessment?.questions || []).length > 0 && (
                          <div className="bg-gray-50 rounded-lg p-4">
                            <h5 className="font-semibold text-gray-900 mb-2">🧠 Quick Assessment</h5>
                            <div className="space-y-3">
                              {(generatedContent.assessment?.questions || []).slice(0, 2).map((question: any, index: number) => (
                                <div key={index} className="bg-white rounded p-3 border">
                                  <p className="font-medium text-gray-900 mb-2">{question.question}</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {(question.options || []).map((option: string, optIndex: number) => (
                                      <div key={optIndex} className={`text-xs p-2 rounded ${
                                        optIndex === question.correctAnswer 
                                          ? 'bg-green-100 text-green-800' 
                                          : 'bg-gray-100 text-gray-700'
                                      }`}>
                                        {option}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!generatedContent && !loading && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🤖</div>
                    <p className="text-gray-500 mb-4">Select content and click generate to create AI-powered learning materials</p>
                    <p className="text-sm text-gray-400">Choose a subject, lesson, topic, or subtopic to get started</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </StudentLayout>
    </ProtectedRoute>
  );
}

