'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import FilterSidebar from '@/components/FilterSidebar';
import FilterSidebarToggle from '@/components/FilterSidebarToggle';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import LatexContentDisplay, { LatexQuestionStem } from '@/components/LatexContentDisplay';

interface Question {
  id: string;
  stem: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  subject: { id: string; name: string } | null;
  lesson: { id: string; name: string } | null;
  topic: { id: string; name: string } | null;
  subtopic: { id: string; name: string } | null;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }>;
}

interface ExamPaper {
  id: string;
  title: string;
  description: string | null;
  timeLimitMin: number | null;
  questionIds: string[];
  subjectIds: string[];
  topicIds: string[];
  subtopicIds: string[];
  createdAt: string;
  updatedAt: string;
  _count: {
    submissions: number;
  };
}

export default function ExamPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.id as string;

  const [exam, setExam] = useState<ExamPaper | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // Filter states
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedSubtopic, setSelectedSubtopic] = useState<string | null>(null);
  
  // Tree structure data
  const [treeData, setTreeData] = useState<any>(null);
  
  // Sidebar toggle state
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  useEffect(() => {
    if (examId) {
      fetchExamDetails();
    }
  }, [examId]);

  const fetchExamDetails = async () => {
    try {
      const response = await api.get(`/admin/exam-papers/${examId}`);
      setExam(response.data);
      const questionsData = response.data.questions || [];
      setQuestions(questionsData);
      setFilteredQuestions(questionsData);
      generateTreeData(questionsData);
      setLoading(false);
    } catch (error: any) {
      console.error('Error fetching exam details:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
      setLoading(false);
    }
  };

  const generateTreeData = (questionsData: Question[]) => {
    const tree: any = {};
    
    questionsData.forEach((question, index) => {
      const subjectName = question.subject?.name || 'Uncategorized';
      const lessonName = question.lesson?.name || 'No Lesson';
      const topicName = question.topic?.name || 'No Topic';
      const subtopicName = question.subtopic?.name || 'No Subtopic';
      
      if (!tree[subjectName]) {
        tree[subjectName] = {
          name: subjectName,
          id: question.subject?.id,
          count: 0,
          lessons: {}
        };
      }
      
      if (!tree[subjectName].lessons[lessonName]) {
        tree[subjectName].lessons[lessonName] = {
          name: lessonName,
          id: question.lesson?.id,
          count: 0,
          topics: {}
        };
      }
      
      if (!tree[subjectName].lessons[lessonName].topics[topicName]) {
        tree[subjectName].lessons[lessonName].topics[topicName] = {
          name: topicName,
          id: question.topic?.id,
          count: 0,
          subtopics: {}
        };
      }
      
      if (!tree[subjectName].lessons[lessonName].topics[topicName].subtopics[subtopicName]) {
        tree[subjectName].lessons[lessonName].topics[topicName].subtopics[subtopicName] = {
          name: subtopicName,
          id: question.subtopic?.id,
          count: 0,
          questions: []
        };
      }
      
      // Add question to the appropriate subtopic
      tree[subjectName].lessons[lessonName].topics[topicName].subtopics[subtopicName].questions.push({
        ...question,
        originalIndex: index
      });
      
      // Update counts
      tree[subjectName].count++;
      tree[subjectName].lessons[lessonName].count++;
      tree[subjectName].lessons[lessonName].topics[topicName].count++;
      tree[subjectName].lessons[lessonName].topics[topicName].subtopics[subtopicName].count++;
    });
    
    setTreeData(tree);
  };

  const filterQuestions = () => {
    let filtered = questions;
    
    if (selectedSubject) {
      filtered = filtered.filter(q => q.subject?.id === selectedSubject);
    }
    if (selectedLesson) {
      filtered = filtered.filter(q => q.lesson?.id === selectedLesson);
    }
    if (selectedTopic) {
      filtered = filtered.filter(q => q.topic?.id === selectedTopic);
    }
    if (selectedSubtopic) {
      filtered = filtered.filter(q => q.subtopic?.id === selectedSubtopic);
    }
    
    setFilteredQuestions(filtered);
    setCurrentQuestionIndex(0);
  };

  useEffect(() => {
    filterQuestions();
  }, [selectedSubject, selectedLesson, selectedTopic, selectedSubtopic, questions]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-green-100 text-green-800';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800';
      case 'HARD':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOptionLabel = (index: number) => {
    return String.fromCharCode(65 + index); // A, B, C, D
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (!exam) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <AdminLayout>
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Exam Not Found</h1>
            <button
              onClick={() => router.push('/admin/exam-papers')}
              className="text-blue-600 hover:text-blue-800"
            >
              Back to Exam Papers
            </button>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  const clearFilters = () => {
    setSelectedSubject(null);
    setSelectedLesson(null);
    setSelectedTopic(null);
    setSelectedSubtopic(null);
  };

  const toggleFilterSidebar = () => {
    setIsFilterSidebarOpen(!isFilterSidebarOpen);
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="min-h-screen bg-gray-50">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => router.push('/admin/exam-papers')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{exam.title}</h1>
                    <p className="text-sm text-gray-600 mt-1">
                      {filteredQuestions.length} Questions
                      {filteredQuestions.length !== questions.length && ` (filtered from ${questions.length} total)`}
                      {exam.timeLimitMin && ` • ${exam.timeLimitMin} minutes`}
                      {exam._count.submissions > 0 && ` • ${exam._count.submissions} submissions`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => router.push(`/admin/exam-papers/edit/${examId}`)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Edit Exam
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Sidebar Toggle */}
          <FilterSidebarToggle 
            isOpen={isFilterSidebarOpen} 
            onToggle={toggleFilterSidebar}
          />

          {/* Filter Sidebar */}
          <FilterSidebar
            isOpen={isFilterSidebarOpen}
            onClose={() => setIsFilterSidebarOpen(false)}
            treeData={treeData}
            selectedSubject={selectedSubject}
            selectedLesson={selectedLesson}
            selectedTopic={selectedTopic}
            selectedSubtopic={selectedSubtopic}
            onSubjectSelect={(id) => {
              setSelectedSubject(id);
              setSelectedLesson(null);
              setSelectedTopic(null);
              setSelectedSubtopic(null);
            }}
            onLessonSelect={(id) => {
              setSelectedLesson(id);
              setSelectedTopic(null);
              setSelectedSubtopic(null);
            }}
            onTopicSelect={(id) => {
              setSelectedTopic(id);
              setSelectedSubtopic(null);
            }}
            onSubtopicSelect={setSelectedSubtopic}
            onClearFilters={clearFilters}
            filteredQuestions={filteredQuestions}
            currentQuestionIndex={currentQuestionIndex}
            onQuestionSelect={setCurrentQuestionIndex}
            className="lg:block"
          />

          {/* Main Content */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Question Display - Takes up more space now */}
              <div className="xl:col-span-8 lg:col-span-12">
                {currentQuestion ? (
                  <div className="bg-white rounded-lg shadow">
                    {/* Question Header */}
                    <div className="border-b border-gray-200 p-6">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h2 className="text-lg font-semibold text-gray-900">
                            Question {currentQuestionIndex + 1} of {filteredQuestions.length}
                            {filteredQuestions.length !== questions.length && (
                              <span className="text-sm text-gray-500 ml-2">
                                (filtered from {questions.length} total)
                              </span>
                            )}
                          </h2>
                          <div className="flex items-center flex-wrap gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(currentQuestion.difficulty)}`}>
                              {currentQuestion.difficulty}
                            </span>
                            {currentQuestion.subject && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                {currentQuestion.subject.name}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Metadata: Lesson, Topic, Subtopic */}
                        {(currentQuestion.lesson || currentQuestion.topic || currentQuestion.subtopic) && (
                          <div className="flex items-center flex-wrap gap-2 text-sm">
                            {currentQuestion.lesson && (
                              <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <span className="font-medium">Lesson:</span>
                                <span className="ml-1">{currentQuestion.lesson.name}</span>
                              </div>
                            )}
                            {currentQuestion.topic && (
                              <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                </svg>
                                <span className="font-medium">Topic:</span>
                                <span className="ml-1">{currentQuestion.topic.name}</span>
                              </div>
                            )}
                            {currentQuestion.subtopic && (
                              <div className="flex items-center text-gray-600">
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="font-medium">Subtopic:</span>
                                <span className="ml-1">{currentQuestion.subtopic.name}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Question Stem */}
                      <div className="prose max-w-none">
                        <LatexQuestionStem stem={currentQuestion.stem} />
                      </div>
                    </div>

                    {/* Options */}
                    <div className="p-6">
                      <h3 className="text-md font-semibold text-gray-900 mb-4">Options</h3>
                      <div className="space-y-3">
                        {currentQuestion.options
                          .sort((a, b) => a.order - b.order)
                          .map((option, index) => (
                            <div
                              key={option.id}
                              className={`p-4 rounded-lg border-2 transition-colors ${
                                option.isCorrect
                                  ? 'border-green-500 bg-green-50'
                                  : 'border-gray-200 bg-white'
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div
                                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                                    option.isCorrect
                                      ? 'bg-green-500 text-white'
                                      : 'bg-gray-200 text-gray-700'
                                  }`}
                                >
                                  {getOptionLabel(index)}
                                </div>
                                <div className="flex-1 pt-1">
                                  <LatexContentDisplay content={option.text} />
                                  {option.isCorrect && (
                                    <span className="inline-flex items-center mt-2 text-sm font-medium text-green-700">
                                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      Correct Answer
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Navigation */}
                    <div className="border-t border-gray-200 p-6">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                          disabled={currentQuestionIndex === 0}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                          <span>Previous</span>
                        </button>
                        <span className="text-sm text-gray-600">
                          {currentQuestionIndex + 1} / {filteredQuestions.length}
                        </span>
                        <button
                          onClick={() => setCurrentQuestionIndex(Math.min(filteredQuestions.length - 1, currentQuestionIndex + 1))}
                          disabled={currentQuestionIndex === filteredQuestions.length - 1}
                          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <span>Next</span>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-600">No questions available</p>
                  </div>
                )}
              </div>

              {/* Right Sidebar - Additional Information */}
              <div className="xl:col-span-4 lg:col-span-12">
                <div className="space-y-6">
                  {/* Exam Statistics */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Exam Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Questions:</span>
                        <span className="font-medium">{questions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Filtered Questions:</span>
                        <span className="font-medium">{filteredQuestions.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Limit:</span>
                        <span className="font-medium">{exam.timeLimitMin ? `${exam.timeLimitMin} min` : 'No limit'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Submissions:</span>
                        <span className="font-medium">{exam._count.submissions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{new Date(exam.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subject Breakdown */}
                  {treeData && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Breakdown</h3>
                      <div className="space-y-2">
                        {Object.values(treeData).map((subject: any) => (
                          <div key={subject.id} className="flex justify-between items-center">
                            <span className="text-gray-700">{subject.name}</span>
                            <span className="text-sm text-gray-500">({subject.count})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => setCurrentQuestionIndex(0)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                      >
                        Go to First Question
                      </button>
                      <button
                        onClick={() => setCurrentQuestionIndex(filteredQuestions.length - 1)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                      >
                        Go to Last Question
                      </button>
                      <button
                        onClick={clearFilters}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
