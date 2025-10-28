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

interface Lesson {
  id: string;
  name: string;
  subject: {
    name: string;
  };
  _count: {
    questions: number;
  };
}

interface PYQPracticeTestConfig {
  subjectId?: string;
  lessonId?: string;
  topicId?: string;
  subtopicId?: string;
  questionCount: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'MIXED';
  timeLimit: number; // in minutes
  year?: number;
}

function PYQPracticeTestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [questionAvailability, setQuestionAvailability] = useState<any>(null);

  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  const [config, setConfig] = useState<PYQPracticeTestConfig>({
    questionCount: 10,
    difficulty: 'MIXED',
    timeLimit: 60
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      getAvailableQuestions();
    }
  }, [selectedSubject, selectedLesson, selectedTopic, selectedSubtopic, selectedYear, config.difficulty]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch subjects
      const subjectsResponse = await api.get('/student/subjects');
      setSubjects(subjectsResponse.data);

      // Fetch available years
      const yearsResponse = await api.get('/student/pyq/years');
      setAvailableYears(yearsResponse.data);

      // Check for pre-selected values from URL
      const subjectId = searchParams?.get('subjectId');
      const lessonId = searchParams?.get('lessonId');
      const topicId = searchParams?.get('topicId');
      const subtopicId = searchParams?.get('subtopicId');
      const year = searchParams?.get('year');
      const questionCount = searchParams?.get('questionCount');
      const difficulty = searchParams?.get('difficulty');
      const timeLimit = searchParams?.get('timeLimit');

      if (subjectId) {
        setSelectedSubject(subjectId);
        await fetchLessons(subjectId);
      }
      if (lessonId) setSelectedLesson(lessonId);
      if (topicId) {
        setSelectedTopic(topicId);
        await fetchSubtopics(topicId);
      }
      if (subtopicId) setSelectedSubtopic(subtopicId);
      if (year) setSelectedYear(parseInt(year));
      if (questionCount) setConfig(prev => ({ ...prev, questionCount: parseInt(questionCount) }));
      if (difficulty) setConfig(prev => ({ ...prev, difficulty: difficulty as any }));
      if (timeLimit) setConfig(prev => ({ ...prev, timeLimit: parseInt(timeLimit) }));

    } catch (error) {
      console.error('Error fetching data:', error);
      Swal.fire('Error', 'Failed to load data. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async (subjectId: string) => {
    try {
      const response = await api.get(`/student/lessons?subjectId=${subjectId}`);
      setLessons(response.data);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const fetchTopics = async (lessonId: string) => {
    try {
      const response = await api.get(`/student/topics?lessonId=${lessonId}`);
      setTopics(response.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchSubtopics = async (topicId: string) => {
    try {
      const response = await api.get(`/student/subtopics?topicId=${topicId}`);
      setSubtopics(response.data);
    } catch (error) {
      console.error('Error fetching subtopics:', error);
    }
  };

  const getAvailableQuestions = async () => {
    if (!selectedSubject) return 0;
    
    try {
      const params = new URLSearchParams({
        subjectId: selectedSubject,
        ...(selectedLesson && { lessonId: selectedLesson }),
        ...(selectedTopic && { topicId: selectedTopic }),
        ...(selectedSubtopic && { subtopicId: selectedSubtopic }),
        ...(selectedYear && { year: selectedYear.toString() }),
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

  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedLesson('');
    setSelectedTopic('');
    setSelectedSubtopic('');
    setLessons([]);
    setTopics([]);
    setSubtopics([]);
    
    if (subjectId) {
      fetchLessons(subjectId);
    }
  };

  const handleLessonChange = (lessonId: string) => {
    setSelectedLesson(lessonId);
    setSelectedTopic('');
    setSelectedSubtopic('');
    setTopics([]);
    setSubtopics([]);
    
    if (lessonId) {
      fetchTopics(lessonId);
    }
  };

  const handleTopicChange = (topicId: string) => {
    setSelectedTopic(topicId);
    setSelectedSubtopic('');
    setSubtopics([]);
    
    if (topicId) {
      fetchSubtopics(topicId);
    }
  };

  const generateTestTitle = () => {
    const currentDate = new Date().toLocaleDateString();
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name || 'Unknown Subject';
    const lessonName = lessons.find(l => l.id === selectedLesson)?.name || '';
    const topicName = topics.find(t => t.id === selectedTopic)?.name || '';
    const subtopicName = subtopics.find(st => st.id === selectedSubtopic)?.name || '';
    const difficultyText = config.difficulty === 'MIXED' ? 'PYQ_PRACTICE' : config.difficulty;
    const timeText = config.timeLimit === 60 ? '1 hour' : 
                     config.timeLimit === 90 ? '1.5 hours' :
                     config.timeLimit === 120 ? '2 hours' :
                     `${config.timeLimit} minutes`;
    const yearText = selectedYear ? ` (${selectedYear})` : '';

    const titleParts = [subjectName];
    if (lessonName) titleParts.push(lessonName);
    if (topicName) titleParts.push(topicName);
    if (subtopicName) titleParts.push(subtopicName);
    titleParts.push(difficultyText);
    titleParts.push(timeText);
    
    return `${titleParts.join(' -> ')}${yearText} - ${currentDate}`;
  };

  const createPYQPracticeTest = async (isPractice: boolean = true) => {
    if (!selectedSubject) {
      Swal.fire('Error', 'Please select a subject', 'error');
      return;
    }

    try {
      setCreating(true);

      const testData = {
        subjectId: selectedSubject,
        lessonId: selectedLesson || undefined,
        topicId: selectedTopic || undefined,
        subtopicId: selectedSubtopic || undefined,
        year: selectedYear || undefined,
        questionCount: config.questionCount,
        difficulty: config.difficulty,
        timeLimitMin: config.timeLimit,
        title: generateTestTitle()
      };

      // Generate practice test using PYQ database
      const response = await api.post('/student/exams/manual/generate-practice-test', testData);
      
      if (response.data.submissionId) {
        if (isPractice) {
          // For practice mode, we need to get the paper ID and redirect to practice-exam
          // This might need to be adjusted based on your API response structure
          Swal.fire({
            title: 'Practice Test Created!',
            text: 'Your PYQ practice test has been generated successfully.',
            icon: 'success',
            confirmButtonText: 'Start Practice'
          }).then(() => {
            // For now, redirect to exam mode - you may need to adjust this
            router.push(`/student/exam/${response.data.submissionId}`);
          });
        } else {
          // Start the exam
          Swal.fire({
            title: 'Practice Test Created!',
            text: 'Your PYQ practice test has been generated successfully.',
            icon: 'success',
            confirmButtonText: 'Start Exam'
          }).then(() => {
            router.push(`/student/exam/${response.data.submissionId}`);
          });
        }
      } else {
        Swal.fire('Error', 'Failed to create practice test', 'error');
      }
    } catch (error: any) {
      console.error('Error creating practice test:', error);
      Swal.fire('Error', error.response?.data?.message || 'Failed to create practice test', 'error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PYQ Practice Tests</h1>
          <p className="text-lg text-gray-600">Create custom practice tests using Previous Year Questions (PYQ)</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Subject Selection */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Content</h2>
              
              {/* Subject and Year Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Subject */}
                <div>
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

                {/* Year */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Previous Year</label>
                  <select
                    value={selectedYear || ''}
                    onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                  >
                    <option value="">All years</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
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
                      onChange={(e) => setSelectedSubtopic(e.target.value)}
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
                    onChange={(e) => setConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
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
                    onChange={(e) => setConfig(prev => ({ ...prev, difficulty: e.target.value as any }))}
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
                    onChange={(e) => setConfig(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>

                {/* Question Source */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Question Source</label>
                  <div className="px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg">
                    <span className="text-sm text-gray-700 font-medium">PYQ Database</span>
                    <p className="text-xs text-gray-500 mt-1">Previous Year Questions from official sources</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Title Preview */}
            {selectedSubject && (
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Generated Test Title:</h4>
                <p className="text-blue-800 font-medium">{generateTestTitle()}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex gap-3">
                <button
                  onClick={() => createPYQPracticeTest(true)}
                  disabled={creating || !selectedSubject || config.questionCount > (questionAvailability?.totalQuestions || 0)}
                  className="flex-1 bg-pink-600 text-white py-2.5 px-4 rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    'Start Practice'
                  )}
                </button>
                <button
                  onClick={() => createPYQPracticeTest(false)}
                  disabled={creating || !selectedSubject || config.questionCount > (questionAvailability?.totalQuestions || 0)}
                  className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    'Start Exam'
                  )}
                </button>
              </div>
              
              {config.questionCount > (questionAvailability?.totalQuestions || 0) && (
                <p className="mt-3 text-sm text-red-600 text-center">
                  Only {questionAvailability?.totalQuestions || 0} questions available. Please reduce the question count.
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
                  <span className="font-semibold text-gray-900">
                    {questionAvailability?.totalQuestions || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Selected Questions:</span>
                  <span className={`font-semibold ${config.questionCount > (questionAvailability?.totalQuestions || 0) ? 'text-red-600' : 'text-green-600'}`}>
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
                    <div className="text-sm text-gray-600">{subject._count.questions} PYQ questions</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/student/pyq"
                  className="flex items-center w-full p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <svg className="w-5 h-5 mr-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">PYQ History</div>
                    <div className="text-sm text-gray-600">View past PYQ tests</div>
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

            {/* Tips */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">💡 PYQ Practice Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Practice with actual previous year questions</li>
                <li>• Focus on recent years for current patterns</li>
                <li>• Review explanations to understand concepts</li>
                <li>• Track your progress over time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

export default function PYQPracticeTestPage() {
  return (
    <ProtectedRoute>
      <SubscriptionGuard>
        <Suspense fallback={
          <StudentLayout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            </div>
          </StudentLayout>
        }>
          <PYQPracticeTestContent />
        </Suspense>
      </SubscriptionGuard>
    </ProtectedRoute>
  );
}
