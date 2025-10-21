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
  useAI: boolean; // Whether to use AI-generated questions
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

  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number | undefined>(undefined);

  const [config, setConfig] = useState<PYQPracticeTestConfig>({
    questionCount: 10,
    difficulty: 'MIXED',
    timeLimit: 60,
    useAI: false
  });

  useEffect(() => {
    fetchData();
  }, []);

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

  const createPYQPracticeTest = async () => {
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

      const response = await api.post('/student/exams/manual/generate-practice-test', testData);
      
      if (response.data.submissionId) {
        Swal.fire({
          title: 'Practice Test Created!',
          text: 'Your PYQ practice test has been generated successfully.',
          icon: 'success',
          confirmButtonText: 'Start Test'
        }).then(() => {
          router.push(`/student/exam/${response.data.submissionId}`);
        });
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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create PYQ Practice Test</h1>
              <p className="text-gray-600">Create a practice test using Previous Year Questions (PYQ)</p>
            </div>

            {/* Test Title Preview */}
            {selectedSubject && (
              <div className="bg-blue-50 rounded-lg border border-blue-200 p-4 mb-6">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">Generated Test Title:</h4>
                <p className="text-blue-800 font-medium">{generateTestTitle()}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Filters */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Test Configuration</h2>
                
                {/* Subject Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name} ({subject._count.questions} questions)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Year Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <select
                    value={selectedYear || ''}
                    onChange={(e) => setSelectedYear(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="">All Years</option>
                    {availableYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Lesson Selection */}
                {selectedSubject && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lesson
                    </label>
                    <select
                      value={selectedLesson}
                      onChange={(e) => handleLessonChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    >
                      <option value="">All Lessons</option>
                      {lessons.map((lesson) => (
                        <option key={lesson.id} value={lesson.id}>
                          {lesson.name} ({lesson._count.questions} questions)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Topic Selection */}
                {selectedLesson && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic
                    </label>
                    <select
                      value={selectedTopic}
                      onChange={(e) => handleTopicChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    >
                      <option value="">All Topics</option>
                      {topics.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name} ({topic._count.questions} questions)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Subtopic Selection */}
                {selectedTopic && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subtopic
                    </label>
                    <select
                      value={selectedSubtopic}
                      onChange={(e) => setSelectedSubtopic(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                    >
                      <option value="">All Subtopics</option>
                      {subtopics.map((subtopic) => (
                        <option key={subtopic.id} value={subtopic.id}>
                          {subtopic.name} ({subtopic._count.questions} questions)
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Right Column - Test Settings */}
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Test Settings</h2>
                
                {/* Number of Questions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <select
                    value={config.questionCount}
                    onChange={(e) => setConfig(prev => ({ ...prev, questionCount: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                    <option value={25}>25 Questions</option>
                    <option value={30}>30 Questions</option>
                  </select>
                </div>

                {/* Difficulty Level */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={config.difficulty}
                    onChange={(e) => setConfig(prev => ({ ...prev, difficulty: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value="MIXED">Mixed Difficulty</option>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                {/* Time Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Limit
                  </label>
                  <select
                    value={config.timeLimit}
                    onChange={(e) => setConfig(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex justify-between">
              <Link
                href="/student/pyq"
                className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back to PYQ
              </Link>
              
              <button
                onClick={createPYQPracticeTest}
                disabled={creating || !selectedSubject}
                className="px-8 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {creating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating Test...</span>
                  </>
                ) : (
                  <>
                    <span>Create Practice Test</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </button>
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
