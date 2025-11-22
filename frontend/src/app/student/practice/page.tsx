'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
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
  questionType: 'ALL' | 'PYQ' | 'LMS'; // Question type filter
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
    useAI: false,
    questionType: 'ALL'
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

  const fetchLessons = useCallback(async (subjectId: string) => {
    try {
      const response = await api.get(`/student/lessons?subjectId=${subjectId}`);
      setLessons(response.data);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setLessons([]);
    }
  }, []);

  const fetchTopics = useCallback(async (subjectId: string, lessonId?: string) => {
    try {
      let url = `/student/topics?subjectId=${subjectId}`;
      if (lessonId) {
        url += `&lessonId=${lessonId}`;
      }
      const response = await api.get(url);
      setTopics(response.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
      setTopics([]);
    }
  }, []);

  const fetchSubtopics = useCallback(async (topicId: string) => {
    try {
      const response = await api.get(`/student/subtopics?topicId=${topicId}`);
      setSubtopics(response.data);
    } catch (error) {
      console.error('Error fetching subtopics:', error);
      setSubtopics([]);
    }
  }, []);

  // Fetch lessons when subject changes
  useEffect(() => {
    if (selectedSubject) {
      fetchLessons(selectedSubject);
    } else {
      setLessons([]);
      setTopics([]);
      setSubtopics([]);
    }
  }, [selectedSubject, fetchLessons]);

  // Fetch topics when subject or lesson changes
  useEffect(() => {
    if (selectedSubject) {
      fetchTopics(selectedSubject, selectedLesson || undefined);
    } else {
      setTopics([]);
      setSubtopics([]);
    }
  }, [selectedSubject, selectedLesson, fetchTopics]);

  // Fetch subtopics when topic changes
  useEffect(() => {
    if (selectedTopic) {
      fetchSubtopics(selectedTopic);
    } else {
      setSubtopics([]);
    }
  }, [selectedTopic, fetchSubtopics]);

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
    setConfig(prev => ({ ...prev, lessonId, topicId: undefined, subtopicId: undefined }));
  };

  const handleSubtopicChange = (subtopicId: string) => {
    setSelectedSubtopic(subtopicId);
    setConfig(prev => ({ ...prev, subtopicId }));
  };

  const handleConfigChange = (field: keyof PracticeTestConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const generateTestTitle = () => {
    const currentDate = new Date().toLocaleDateString();
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name || 'Unknown Subject';
    const lessonName = lessons.find(l => l.id === selectedLesson)?.name || '';
    const topicName = topics.find(t => t.id === selectedTopic)?.name || '';
    const subtopicName = subtopics.find(st => st.id === selectedSubtopic)?.name || '';
    const difficultyText = config.difficulty === 'MIXED' ? 'Mixed' : config.difficulty;
    const timeText = config.timeLimit === 60 ? '1 hour' : 
                     config.timeLimit === 90 ? '1.5 hours' :
                     config.timeLimit === 120 ? '2 hours' :
                     `${config.timeLimit} minutes`;

    // Build the title parts
    const titleParts = [subjectName];
    
    if (lessonName) titleParts.push(lessonName);
    if (topicName) titleParts.push(topicName);
    if (subtopicName) titleParts.push(subtopicName);
    
    titleParts.push(difficultyText);
    titleParts.push(timeText);
    
    return `${titleParts.join(' -> ')} - ${currentDate}`;
  };

  const createPracticeTest = async (isPractice: boolean = true) => {
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
          timeLimitMin: config.timeLimit,
          title: generateTestTitle(),
          questionType: config.questionType !== 'ALL' ? config.questionType : undefined
        };

        const aiResponse = await api.post('/student/exams/ai/generate-practice-test', aiTestData);
        const paperId = aiResponse.data.examPaper.id;

        if (isPractice) {
          // Redirect to practice mode
          router.push(`/student/practice-exam/${paperId}`);
        } else {
          // Start the exam
          const startResponse = await api.post(`/student/exams/papers/${paperId}/start`);
          const { submissionId } = startResponse.data;
          router.push(`/student/exam/${submissionId}`);
        }
      } else {
        // Generate manual practice test using existing database questions
        const manualTestData = {
          subjectId: selectedSubject,
          lessonId: selectedLesson || undefined,
          topicId: selectedTopic || undefined,
          subtopicId: selectedSubtopic || undefined,
          questionCount: config.questionCount,
          difficulty: config.difficulty,
          timeLimitMin: config.timeLimit,
          title: generateTestTitle(),
          questionType: config.questionType !== 'ALL' ? config.questionType : undefined
        };

        const manualResponse = await api.post('/student/exams/manual/generate-practice-test', manualTestData);
        const paperId = manualResponse.data.examPaper.id;

        if (isPractice) {
          // Redirect to practice mode
          router.push(`/student/practice-exam/${paperId}`);
        } else {
          // Start the exam
          const startResponse = await api.post(`/student/exams/papers/${paperId}/start`);
          const { submissionId } = startResponse.data;
          router.push(`/student/exam/${submissionId}`);
        }
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

  const handleStartPractice = async () => {
    const result = await Swal.fire({
      title: 'Start Practice Session',
      text: 'This will start an untimed practice session where you can check answers and learn.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Start Practice',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      await createPracticeTest(true);
    }
  };

  const handleStartExam = async () => {
    const result = await Swal.fire({
      title: 'Start Exam',
      text: 'This will start a timed exam session. Are you ready to begin?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Start Exam',
      cancelButtonText: 'Cancel',
    });

    if (result.isConfirmed) {
      await createPracticeTest(false);
    }
  };

  const generateQuickPracticeTitle = (questionType: 'ALL' | 'PYQ' | 'LMS') => {
    const currentDate = new Date().toLocaleDateString();
    const subjectName = subjects.find(s => s.id === selectedSubject)?.name || 'Unknown Subject';
    const lessonName = lessons.find(l => l.id === selectedLesson)?.name || '';
    const topicName = topics.find(t => t.id === selectedTopic)?.name || '';
    const subtopicName = subtopics.find(st => st.id === selectedSubtopic)?.name || '';

    // Build the title parts
    const titleParts = [subjectName];
    
    if (lessonName) titleParts.push(lessonName);
    if (topicName) titleParts.push(topicName);
    if (subtopicName) titleParts.push(subtopicName);
    
    // Add question type to title
    if (questionType === 'PYQ') {
      titleParts.push('PYQ');
    } else if (questionType === 'LMS') {
      titleParts.push('LMS');
    }
    
    titleParts.push('Practice');
    
    return `${titleParts.join(' -> ')} - ${currentDate}`;
  };

  const handleQuickPractice = async (questionType: 'ALL' | 'PYQ' | 'LMS') => {
    if (!selectedSubject) {
      Swal.fire({
        title: 'Subject Required',
        text: 'Please select a subject to start practice',
        icon: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Get available questions count for the selected filters
      const params = new URLSearchParams({
        subjectId: selectedSubject,
        ...(selectedLesson && { lessonId: selectedLesson }),
        ...(selectedTopic && { topicId: selectedTopic }),
        ...(selectedSubtopic && { subtopicId: selectedSubtopic }),
        ...(questionType !== 'ALL' && { questionType })
      });
      
      const availabilityResponse = await api.get(`/student/question-availability?${params}`);
      const availableCount = availabilityResponse.data.totalQuestions;

      if (availableCount === 0) {
        Swal.fire({
          title: 'No Questions Available',
          text: `No questions found for the selected ${questionType === 'ALL' ? 'filters' : questionType === 'PYQ' ? 'PYQ' : 'LMS'} questions.`,
          icon: 'warning',
        });
        setLoading(false);
        return;
      }

      // Build query params for direct practice (no exam paper creation)
      const subjectName = subjects.find(s => s.id === selectedSubject)?.name || '';
      const lessonName = selectedLesson ? lessons.find(l => l.id === selectedLesson)?.name : '';
      const topicName = selectedTopic ? topics.find(t => t.id === selectedTopic)?.name : '';
      const subtopicName = selectedSubtopic ? subtopics.find(st => st.id === selectedSubtopic)?.name : '';

      const queryParams = new URLSearchParams({
        subjectId: selectedSubject,
        subjectName: subjectName,
        ...(selectedLesson && { lessonId: selectedLesson, lessonName: lessonName }),
        ...(selectedTopic && { topicId: selectedTopic, topicName: topicName }),
        ...(selectedSubtopic && { subtopicId: selectedSubtopic, subtopicName: subtopicName }),
        ...(questionType !== 'ALL' && { questionType })
      });

      // Redirect to practice mode with query params (no exam paper creation)
      router.push(`/student/practice-exam/direct-practice?${queryParams.toString()}`);
    } catch (error: any) {
      console.error('Error starting quick practice:', error);
      Swal.fire({
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to start practice',
        icon: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const [questionAvailability, setQuestionAvailability] = useState<any>(null);
  const [subjectCounts, setSubjectCounts] = useState<{
    all: number;
    pyq: number;
    lms: number;
  }>({ all: 0, pyq: 0, lms: 0 });
  const [lessonCounts, setLessonCounts] = useState<{
    all: number;
    pyq: number;
    lms: number;
  }>({ all: 0, pyq: 0, lms: 0 });
  const [topicCounts, setTopicCounts] = useState<{
    all: number;
    pyq: number;
    lms: number;
  }>({ all: 0, pyq: 0, lms: 0 });
  const [subtopicCounts, setSubtopicCounts] = useState<{
    all: number;
    pyq: number;
    lms: number;
  }>({ all: 0, pyq: 0, lms: 0 });

  const getAvailableQuestions = async () => {
    if (!selectedSubject) return 0;
    
    try {
      const params = new URLSearchParams({
        subjectId: selectedSubject,
        ...(selectedLesson && { lessonId: selectedLesson }),
        ...(selectedTopic && { topicId: selectedTopic }),
        ...(selectedSubtopic && { subtopicId: selectedSubtopic }),
        ...(config.difficulty !== 'MIXED' && { difficulty: config.difficulty }),
        ...(config.questionType !== 'ALL' && { questionType: config.questionType })
      });
      
      const response = await api.get(`/student/question-availability?${params}`);
      setQuestionAvailability(response.data);
      return response.data.totalQuestions;
    } catch (error) {
      console.error('Error fetching question availability:', error);
      return 0;
    }
  };

  const getQuestionCounts = async () => {
    if (!selectedSubject) {
      setSubjectCounts({ all: 0, pyq: 0, lms: 0 });
      setLessonCounts({ all: 0, pyq: 0, lms: 0 });
      setTopicCounts({ all: 0, pyq: 0, lms: 0 });
      setSubtopicCounts({ all: 0, pyq: 0, lms: 0 });
      return;
    }
    
    try {
      // Subject-level counts (subject only)
      const subjectParams = { subjectId: selectedSubject };
      const [subjectAllRes, subjectPyqRes, subjectLmsRes] = await Promise.all([
        api.get(`/student/question-availability?${new URLSearchParams(subjectParams)}`),
        api.get(`/student/question-availability?${new URLSearchParams({ ...subjectParams, questionType: 'PYQ' })}`),
        api.get(`/student/question-availability?${new URLSearchParams({ ...subjectParams, questionType: 'LMS' })}`)
      ]);

      setSubjectCounts({
        all: subjectAllRes.data.totalQuestions || 0,
        pyq: subjectPyqRes.data.totalQuestions || 0,
        lms: subjectLmsRes.data.totalQuestions || 0
      });

      // Lesson-level counts (subject + lesson)
      if (selectedLesson) {
        const lessonParams = { subjectId: selectedSubject, lessonId: selectedLesson };
        const [lessonAllRes, lessonPyqRes, lessonLmsRes] = await Promise.all([
          api.get(`/student/question-availability?${new URLSearchParams(lessonParams)}`),
          api.get(`/student/question-availability?${new URLSearchParams({ ...lessonParams, questionType: 'PYQ' })}`),
          api.get(`/student/question-availability?${new URLSearchParams({ ...lessonParams, questionType: 'LMS' })}`)
        ]);

        setLessonCounts({
          all: lessonAllRes.data.totalQuestions || 0,
          pyq: lessonPyqRes.data.totalQuestions || 0,
          lms: lessonLmsRes.data.totalQuestions || 0
        });
      } else {
        setLessonCounts({ all: 0, pyq: 0, lms: 0 });
      }

      // Topic-level counts (subject + lesson + topic)
      if (selectedTopic) {
        const topicParams = {
          subjectId: selectedSubject,
          ...(selectedLesson && { lessonId: selectedLesson }),
          topicId: selectedTopic
        };
        const [topicAllRes, topicPyqRes, topicLmsRes] = await Promise.all([
          api.get(`/student/question-availability?${new URLSearchParams(topicParams)}`),
          api.get(`/student/question-availability?${new URLSearchParams({ ...topicParams, questionType: 'PYQ' })}`),
          api.get(`/student/question-availability?${new URLSearchParams({ ...topicParams, questionType: 'LMS' })}`)
        ]);

        setTopicCounts({
          all: topicAllRes.data.totalQuestions || 0,
          pyq: topicPyqRes.data.totalQuestions || 0,
          lms: topicLmsRes.data.totalQuestions || 0
        });
      } else {
        setTopicCounts({ all: 0, pyq: 0, lms: 0 });
      }

      // Subtopic-level counts (subject + lesson + topic + subtopic)
      if (selectedSubtopic) {
        const subtopicParams = {
          subjectId: selectedSubject,
          ...(selectedLesson && { lessonId: selectedLesson }),
          topicId: selectedTopic,
          subtopicId: selectedSubtopic
        };
        const [subtopicAllRes, subtopicPyqRes, subtopicLmsRes] = await Promise.all([
          api.get(`/student/question-availability?${new URLSearchParams(subtopicParams)}`),
          api.get(`/student/question-availability?${new URLSearchParams({ ...subtopicParams, questionType: 'PYQ' })}`),
          api.get(`/student/question-availability?${new URLSearchParams({ ...subtopicParams, questionType: 'LMS' })}`)
        ]);

        setSubtopicCounts({
          all: subtopicAllRes.data.totalQuestions || 0,
          pyq: subtopicPyqRes.data.totalQuestions || 0,
          lms: subtopicLmsRes.data.totalQuestions || 0
        });
      } else {
        setSubtopicCounts({ all: 0, pyq: 0, lms: 0 });
      }
    } catch (error) {
      console.error('Error fetching question counts:', error);
      setSubjectCounts({ all: 0, pyq: 0, lms: 0 });
      setLessonCounts({ all: 0, pyq: 0, lms: 0 });
      setTopicCounts({ all: 0, pyq: 0, lms: 0 });
      setSubtopicCounts({ all: 0, pyq: 0, lms: 0 });
    }
  };

  useEffect(() => {
    if (selectedSubject) {
      getAvailableQuestions();
      getQuestionCounts();
    } else {
      setSubjectCounts({ all: 0, pyq: 0, lms: 0 });
      setLessonCounts({ all: 0, pyq: 0, lms: 0 });
      setTopicCounts({ all: 0, pyq: 0, lms: 0 });
      setSubtopicCounts({ all: 0, pyq: 0, lms: 0 });
    }
  }, [selectedSubject, selectedLesson, selectedTopic, selectedSubtopic, config.difficulty, config.questionType]);

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
                  
                  {/* Subject & Lesson Row */}
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
                      
                      {/* Quick Practice Buttons */}
                      {selectedSubject && (
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <label className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Practice:</label>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            <button
                              onClick={() => handleQuickPractice('ALL')}
                              disabled={loading || subjectCounts.all === 0}
                              className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5"
                            >
                              <span>All</span>
                              <span className="bg-blue-700 px-1 py-0.5 sm:px-1.5 rounded text-[10px] sm:text-xs font-semibold">
                                {subjectCounts.all}
                              </span>
                            </button>
                            <button
                              onClick={() => handleQuickPractice('PYQ')}
                              disabled={loading || subjectCounts.pyq === 0}
                              className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5"
                            >
                              <span>PYQ</span>
                              <span className="bg-purple-700 px-1 py-0.5 sm:px-1.5 rounded text-[10px] sm:text-xs font-semibold">
                                {subjectCounts.pyq}
                              </span>
                            </button>
                            <button
                              onClick={() => handleQuickPractice('LMS')}
                              disabled={loading || subjectCounts.lms === 0}
                              className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5"
                            >
                              <span>LMS Q</span>
                              <span className="bg-green-700 px-1 py-0.5 sm:px-1.5 rounded text-[10px] sm:text-xs font-semibold">
                                {subjectCounts.lms}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lesson */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Lesson (Optional)</label>
                      <select
                        value={selectedLesson}
                        onChange={(e) => handleLessonChange(e.target.value)}
                        disabled={!selectedSubject}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">All lessons</option>
                        {lessons.map((lesson) => (
                          <option key={lesson.id} value={lesson.id}>
                            {lesson.name} ({lesson._count?.questions || 0})
                          </option>
                        ))}
                      </select>
                      {!selectedSubject && (
                        <p className="text-xs text-gray-500 mt-1">Select a subject first</p>
                      )}
                      
                      {/* Quick Practice Buttons for Lesson */}
                      {selectedLesson && (
                        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <label className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Practice:</label>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2">
                            <button
                              onClick={() => handleQuickPractice('ALL')}
                              disabled={loading || lessonCounts.all === 0}
                              className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5"
                            >
                              <span>All</span>
                              <span className="bg-blue-700 px-1 py-0.5 sm:px-1.5 rounded text-[10px] sm:text-xs font-semibold">
                                {lessonCounts.all}
                              </span>
                            </button>
                            <button
                              onClick={() => handleQuickPractice('PYQ')}
                              disabled={loading || lessonCounts.pyq === 0}
                              className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5"
                            >
                              <span>PYQ</span>
                              <span className="bg-purple-700 px-1 py-0.5 sm:px-1.5 rounded text-[10px] sm:text-xs font-semibold">
                                {lessonCounts.pyq}
                              </span>
                            </button>
                            <button
                              onClick={() => handleQuickPractice('LMS')}
                              disabled={loading || lessonCounts.lms === 0}
                              className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5"
                            >
                              <span>LMS Q</span>
                              <span className="bg-green-700 px-1 py-0.5 sm:px-1.5 rounded text-[10px] sm:text-xs font-semibold">
                                {lessonCounts.lms}
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Topic & Subtopic Row */}
                  {selectedSubject && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Topic */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Topic (Optional)</label>
                        <select
                          value={selectedTopic}
                          onChange={(e) => handleTopicChange(e.target.value)}
                          disabled={!selectedSubject}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">All topics</option>
                          {topics.map((topic) => (
                            <option key={topic.id} value={topic.id}>
                              {topic.name} ({topic._count?.questions || 0})
                            </option>
                          ))}
                        </select>
                        {!selectedSubject && (
                          <p className="text-xs text-gray-500 mt-1">Select a subject first</p>
                        )}
                        
                        {/* Quick Practice Buttons for Topic */}
                        {selectedTopic && (
                          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Practice:</label>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              <button
                                onClick={() => handleQuickPractice('ALL')}
                                disabled={loading || topicCounts.all === 0}
                                className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5"
                              >
                                <span>All</span>
                                <span className="bg-blue-700 px-1 py-0.5 sm:px-1.5 rounded text-[10px] sm:text-xs font-semibold">
                                  {topicCounts.all}
                                </span>
                              </button>
                              <button
                                onClick={() => handleQuickPractice('PYQ')}
                                disabled={loading || topicCounts.pyq === 0}
                                className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5"
                              >
                                <span>PYQ</span>
                                <span className="bg-purple-700 px-1 py-0.5 sm:px-1.5 rounded text-[10px] sm:text-xs font-semibold">
                                  {topicCounts.pyq}
                                </span>
                              </button>
                              <button
                                onClick={() => handleQuickPractice('LMS')}
                                disabled={loading || topicCounts.lms === 0}
                                className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5"
                              >
                                <span>LMS Q</span>
                                <span className="bg-green-700 px-1 py-0.5 sm:px-1.5 rounded text-[10px] sm:text-xs font-semibold">
                                  {topicCounts.lms}
                                </span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Subtopic */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">Subtopic (Optional)</label>
                        <select
                          value={selectedSubtopic}
                          onChange={(e) => handleSubtopicChange(e.target.value)}
                          disabled={!selectedTopic}
                          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">All subtopics</option>
                          {subtopics.map((subtopic) => (
                            <option key={subtopic.id} value={subtopic.id}>
                              {subtopic.name} ({subtopic._count?.questions || 0})
                            </option>
                          ))}
                        </select>
                        {!selectedSubject && (
                          <p className="text-xs text-gray-500 mt-1">Select a subject first</p>
                        )}
                        {selectedSubject && !selectedTopic && (
                          <p className="text-xs text-gray-500 mt-1">Select a topic first</p>
                        )}
                        
                        {/* Quick Practice Buttons for Subtopic */}
                        {selectedSubtopic && (
                          <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <label className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">Practice:</label>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                              <button
                                onClick={() => handleQuickPractice('ALL')}
                                disabled={loading || subtopicCounts.all === 0}
                                className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5"
                              >
                                <span>All</span>
                                <span className="bg-blue-700 px-1 py-0.5 sm:px-1.5 rounded text-[10px] sm:text-xs font-semibold">
                                  {subtopicCounts.all}
                                </span>
                              </button>
                              <button
                                onClick={() => handleQuickPractice('PYQ')}
                                disabled={loading || subtopicCounts.pyq === 0}
                                className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5"
                              >
                                <span>PYQ</span>
                                <span className="bg-purple-700 px-1 py-0.5 sm:px-1.5 rounded text-[10px] sm:text-xs font-semibold">
                                  {subtopicCounts.pyq}
                                </span>
                              </button>
                              <button
                                onClick={() => handleQuickPractice('LMS')}
                                disabled={loading || subtopicCounts.lms === 0}
                                className="px-2 py-1 sm:px-3 sm:py-1.5 text-[10px] sm:text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 sm:gap-1.5"
                              >
                                <span>LMS Q</span>
                                <span className="bg-green-700 px-1 py-0.5 sm:px-1.5 rounded text-[10px] sm:text-xs font-semibold">
                                  {subtopicCounts.lms}
                                </span>
                              </button>
                            </div>
                          </div>
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

                    {/* Question Type */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Question Type</label>
                      <select
                        value={config.questionType}
                        onChange={(e) => handleConfigChange('questionType', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-gray-900 bg-white"
                      >
                        <option value="ALL">All</option>
                        <option value="PYQ">PYQ</option>
                        <option value="LMS">LMS</option>
                      </select>
                    </div>
                  </div>

                  {/* Question Source - Moved to separate row */}
                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Question Source</label>
                    <div className="flex gap-6">
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
                      onClick={handleStartPractice}
                      disabled={!selectedSubject || loading || (!config.useAI && config.questionCount > availableQuestions)}
                      className="flex-1 bg-pink-600 text-white py-2.5 px-4 rounded-lg hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Creating...
                        </div>
                      ) : (
                        'Start Practice'
                      )}
                    </button>
                    <button
                      onClick={handleStartExam}
                      disabled={!selectedSubject || loading || (!config.useAI && config.questionCount > availableQuestions)}
                      className="flex-1 bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Creating...
                        </div>
                      ) : (
                        'Start Exam'
                      )}
                    </button>
                  </div>
                  
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