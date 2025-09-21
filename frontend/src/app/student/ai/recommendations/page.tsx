'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';

interface SmartRecommendation {
  type: 'WEAK_AREA_FOCUS' | 'STRENGTH_BUILDING' | 'CONTENT_SUGGESTION' | 'STUDY_SCHEDULE' | 'PRACTICE_PLAN';
  title: string;
  description: string;
  content: any[];
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  estimatedTime: number; // in minutes
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  tags: string[];
}

interface AIRecommendation {
  recommendation: string;
  reasoning: string;
  actionItems: string[];
  expectedOutcome: string;
  timeToComplete: string;
}

export default function SmartRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('smart');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [subtopics, setSubtopics] = useState<any[]>([]);

  useEffect(() => {
    loadSubjects();
    loadSmartRecommendations();
  }, []);

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

  useEffect(() => {
    loadSmartRecommendations(selectedSubject, selectedLesson, selectedTopic, selectedSubtopic);
  }, [selectedSubject, selectedLesson, selectedTopic, selectedSubtopic]);

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

  const loadSmartRecommendations = async (subjectId?: string, lessonId?: string, topicId?: string, subtopicId?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (subjectId) params.append('subjectId', subjectId);
      if (lessonId) params.append('lessonId', lessonId);
      if (topicId) params.append('topicId', topicId);
      if (subtopicId) params.append('subtopicId', subtopicId);
      
      const queryString = params.toString();
      const url = `/ai/advanced/content/recommendations${queryString ? `?${queryString}` : ''}`;
      const response = await api.get(url);
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error loading smart recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAIRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ai/advanced/analytics/recommendations');
      setAiRecommendations(response.data);
    } catch (error) {
      console.error('Error loading AI recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 border-red-300 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'LOW': return 'bg-green-100 border-green-300 text-green-800';
      default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WEAK_AREA_FOCUS': return '⚠️';
      case 'STRENGTH_BUILDING': return '💪';
      case 'CONTENT_SUGGESTION': return '📚';
      case 'STUDY_SCHEDULE': return '📅';
      case 'PRACTICE_PLAN': return '🎯';
      default: return '💡';
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
                <h1 className="text-2xl font-bold text-gray-900">🧠 Smart Recommendations</h1>
                <p className="text-gray-600 mt-1">AI-powered personalized learning recommendations</p>
              </div>
              <button
                onClick={() => {
                  loadSmartRecommendations(selectedSubject, selectedLesson, selectedTopic, selectedSubtopic);
                  loadAIRecommendations();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Filter Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
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
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
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
                  <option value="">All Lessons</option>
                  {lessons.map((lesson) => (
                    <option key={lesson.id} value={lesson.id}>
                      {lesson.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
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
                  <option value="">All Topics</option>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subtopic</label>
                <select
                  value={selectedSubtopic}
                  onChange={(e) => setSelectedSubtopic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!selectedSubject || !selectedTopic}
                >
                  <option value="">All Subtopics</option>
                  {subtopics.map((subtopic) => (
                    <option key={subtopic.id} value={subtopic.id}>
                      {subtopic.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6">
                {[
                  { id: 'smart', label: 'Smart Recommendations', icon: '🎯' },
                  { id: 'ai', label: 'AI Insights', icon: '🤖' },
                  { id: 'personalized', label: 'Personalized Plan', icon: '👤' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      if (tab.id === 'ai') {
                        loadAIRecommendations();
                      }
                    }}
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
              {/* Smart Recommendations Tab */}
              {activeTab === 'smart' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">🎯 Smart Content Recommendations</h3>
                  
                  {loading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Loading recommendations...</span>
                    </div>
                  )}

                  {!loading && recommendations.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📚</div>
                      <p className="text-gray-500 mb-4">No recommendations available</p>
                      <p className="text-sm text-gray-400">Complete some lessons to get personalized recommendations</p>
                    </div>
                  )}

                  {!loading && recommendations.length > 0 && (
                    <div className="space-y-4">
                      {recommendations.map((rec, index) => (
                        <div key={index} className={`border rounded-lg p-6 ${getPriorityColor(rec.priority)}`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center">
                              <span className="text-2xl mr-3">{getTypeIcon(rec.type)}</span>
                              <div>
                                <h4 className="text-lg font-semibold">{rec.title}</h4>
                                <p className="text-sm opacity-80 mt-1">{rec.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                                {rec.priority}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(rec.difficulty)}`}>
                                {rec.difficulty}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div className="bg-white bg-opacity-50 rounded-lg p-3">
                              <p className="text-sm font-medium">⏱️ Estimated Time</p>
                              <p className="text-lg font-semibold">{rec.estimatedTime} min</p>
                            </div>
                            <div className="bg-white bg-opacity-50 rounded-lg p-3">
                              <p className="text-sm font-medium">📊 Difficulty</p>
                              <p className="text-lg font-semibold">{rec.difficulty}</p>
                            </div>
                            <div className="bg-white bg-opacity-50 rounded-lg p-3">
                              <p className="text-sm font-medium">🏷️ Type</p>
                              <p className="text-lg font-semibold">{rec.type.replace('_', ' ')}</p>
                            </div>
                          </div>

                          <div className="mb-4">
                            <p className="text-sm font-medium mb-2">🏷️ Tags:</p>
                            <div className="flex flex-wrap gap-2">
                              {rec.tags.map((tag, tagIndex) => (
                                <span key={tagIndex} className="px-2 py-1 bg-white bg-opacity-50 rounded-full text-xs">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>

                          {rec.content && rec.content.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">📚 Recommended Content:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {rec.content.slice(0, 4).map((content, contentIndex) => (
                                  <div key={contentIndex} className="bg-white bg-opacity-50 rounded p-2 text-sm">
                                    {content.title || content.name || 'Content Item'}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-4 flex justify-end">
                            <button className="px-4 py-2 bg-white bg-opacity-50 text-gray-800 rounded-lg hover:bg-opacity-70 transition-colors">
                              Start Learning
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* AI Insights Tab */}
              {activeTab === 'ai' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">🤖 AI Learning Recommendations</h3>
                  
                  {loading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-600">Generating AI recommendations...</span>
                    </div>
                  )}

                  {!loading && aiRecommendations.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🤖</div>
                      <p className="text-gray-500 mb-4">No AI recommendations available</p>
                      <p className="text-sm text-gray-400">Complete some assessments to get AI-powered insights</p>
                    </div>
                  )}

                  {!loading && aiRecommendations.length > 0 && (
                    <div className="space-y-6">
                      {aiRecommendations.map((rec, index) => (
                        <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-blue-900 mb-2">💡 {rec.recommendation}</h4>
                              <p className="text-blue-700 mb-3">{rec.reasoning}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-blue-600 font-medium">⏱️ {rec.timeToComplete}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h5 className="font-semibold text-blue-900 mb-2">📋 Action Items:</h5>
                              <ul className="space-y-1">
                                {rec.actionItems.map((item, itemIndex) => (
                                  <li key={itemIndex} className="text-sm text-blue-700 flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h5 className="font-semibold text-blue-900 mb-2">🎯 Expected Outcome:</h5>
                              <p className="text-sm text-blue-700">{rec.expectedOutcome}</p>
                            </div>
                          </div>

                          <div className="mt-4 flex justify-end">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                              Start Implementation
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Personalized Plan Tab */}
              {activeTab === 'personalized' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900">👤 Your Personalized Learning Plan</h3>
                  
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-3">📅 Weekly Study Schedule</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Monday - Wednesday:</span>
                            <span className="text-sm font-medium">Focus on weak areas</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Thursday - Friday:</span>
                            <span className="text-sm font-medium">Practice and review</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-green-700">Weekend:</span>
                            <span className="text-sm font-medium">Advanced topics</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-blue-200">
                        <h4 className="font-semibold text-blue-900 mb-3">🎯 Learning Goals</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-700">Weekly Target:</span>
                            <span className="text-sm font-medium">3-5 topics</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-700">Practice Tests:</span>
                            <span className="text-sm font-medium">2 per week</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-blue-700">Study Time:</span>
                            <span className="text-sm font-medium">2-3 hours daily</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <h4 className="font-semibold text-purple-900 mb-3">📊 Progress Tracking</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-purple-700">Completion Rate:</span>
                            <span className="text-sm font-medium">Track weekly progress</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-purple-700">Performance:</span>
                            <span className="text-sm font-medium">Monitor test scores</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-purple-700">Weak Areas:</span>
                            <span className="text-sm font-medium">Focus improvement</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg p-4 border border-orange-200">
                        <h4 className="font-semibold text-orange-900 mb-3">🚀 Next Steps</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-orange-700">This Week:</span>
                            <span className="text-sm font-medium">Start with recommendations</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-orange-700">Next Week:</span>
                            <span className="text-sm font-medium">Review and adjust</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-orange-700">Monthly:</span>
                            <span className="text-sm font-medium">Full assessment</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 text-center">
                      <button className="px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-lg hover:from-green-700 hover:to-blue-700 transition-colors">
                        📋 Download Learning Plan
                      </button>
                    </div>
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

