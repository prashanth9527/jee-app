'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Brain, Calendar, Tag, Search, Filter, BookOpen, FileText, BarChart3, Map, Lightbulb } from 'lucide-react';
import { useToastContext } from '@/contexts/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import StudentLayout from '@/components/StudentLayout';
import api from '@/lib/api';

interface AIResult {
  id: string;
  resultData: any;
  version: number;
  createdAt: string;
}

interface GroupedAIResult {
  contentId: string;
  contentTitle: string;
  subject: string;
  topic: string;
  subtopic: string;
  featureType: string;
  results: AIResult[];
}

interface AIQuestionGroup {
  subjectId: string;
  topicId: string;
  subtopicId: string;
  subject: string;
  topic: string;
  subtopic: string;
  questions: Array<{
    id: string;
    stem: string;
    explanation: string;
    difficulty: string;
    options: Array<{
      text: string;
      isCorrect: boolean;
      order: number;
    }>;
    aiPrompt: string;
    createdAt: string;
  }>;
}

function AIResultsPageContent() {
  const [results, setResults] = useState<GroupedAIResult[]>([]);
  const [aiQuestions, setAiQuestions] = useState<AIQuestionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterFeatureType, setFilterFeatureType] = useState('');
  const [subjects, setSubjects] = useState<string[]>([]);
  const { showError } = useToastContext();

  useEffect(() => {
    loadAIResults();
  }, []);

  const loadAIResults = async () => {
    setLoading(true);
    try {
      // Load AI results (excluding questions)
      const resultsResponse = await api.get('/student/content-learning/ai-results');
      setResults(resultsResponse.data || []);
      
      // Load AI-generated questions separately
      const questionsResponse = await api.get('/student/content-learning/ai-questions');
      setAiQuestions(questionsResponse.data || []);
      
      // Extract unique subjects from both sources
      const allSubjects = [
        ...(resultsResponse.data?.map((result: GroupedAIResult) => result.subject) || []),
        ...(questionsResponse.data?.map((group: AIQuestionGroup) => group.subject) || [])
      ];
      const uniqueSubjects = [...new Set(allSubjects)];
      setSubjects(uniqueSubjects);
    } catch (error) {
      console.error('Failed to load AI results:', error);
      showError('Failed to load AI results', 'Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(result => {
    const matchesSearch = result.contentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.subtopic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.featureType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = !filterSubject || result.subject === filterSubject;
    const matchesFeatureType = !filterFeatureType || result.featureType === filterFeatureType;
    
    return matchesSearch && matchesSubject && matchesFeatureType;
  });

  const filteredAIQuestions = aiQuestions.filter(group => {
    const matchesSearch = group.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.subtopic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.questions.some(q => q.stem.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSubject = !filterSubject || group.subject === filterSubject;
    const matchesFeatureType = !filterFeatureType || filterFeatureType === 'AI_QUESTIONS';
    
    return matchesSearch && matchesSubject && matchesFeatureType;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFeatureIcon = (featureType: string) => {
    switch (featureType) {
      case 'AI_QUESTIONS':
        return <FileText className="w-5 h-5" />;
      case 'PERFORMANCE_ANALYSIS':
        return <BarChart3 className="w-5 h-5" />;
      case 'SUMMARY':
        return <BookOpen className="w-5 h-5" />;
      case 'MINDMAP':
        return <Map className="w-5 h-5" />;
      default:
        return <Brain className="w-5 h-5" />;
    }
  };

  const getFeatureName = (featureType: string) => {
    switch (featureType) {
      case 'AI_QUESTIONS':
        return 'AI Questions';
      case 'PERFORMANCE_ANALYSIS':
        return 'Performance Analysis';
      case 'SUMMARY':
        return 'Content Summary';
      case 'MINDMAP':
        return 'Mind Map';
      default:
        return featureType;
    }
  };

  const getFeatureColor = (featureType: string) => {
    switch (featureType) {
      case 'AI_QUESTIONS':
        return 'bg-blue-100 text-blue-800';
      case 'PERFORMANCE_ANALYSIS':
        return 'bg-green-100 text-green-800';
      case 'SUMMARY':
        return 'bg-purple-100 text-purple-800';
      case 'MINDMAP':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderResultContent = (result: AIResult, featureType: string) => {
    const data = result.resultData;
    
    switch (featureType) {
      case 'AI_QUESTIONS':
        return (
          <div className="space-y-3">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Questions Generated:</span> {data.questionCount || 0}
            </div>
            {data.questions && data.questions.slice(0, 2).map((question: any, index: number) => (
              <div key={index} className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-700 line-clamp-2">
                  {question.stem}
                </p>
                <div className="mt-2 flex items-center space-x-2 text-xs text-gray-500">
                  <span>Difficulty: {question.difficulty}</span>
                  <span>•</span>
                  <span>{question.options?.length || 0} options</span>
                </div>
              </div>
            ))}
            {data.questions && data.questions.length > 2 && (
              <p className="text-xs text-gray-500">
                +{data.questions.length - 2} more questions...
              </p>
            )}
          </div>
        );
      
      case 'PERFORMANCE_ANALYSIS':
        return (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Analysis Generated:</span> {data.analysisType || 'Performance Review'}
            </div>
            {data.summary && (
              <p className="text-sm text-gray-700 line-clamp-3">
                {data.summary}
              </p>
            )}
            {data.recommendations && data.recommendations.length > 0 && (
              <div className="text-xs text-gray-500">
                {data.recommendations.length} recommendations provided
              </div>
            )}
          </div>
        );
      
      case 'SUMMARY':
        return (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Summary Length:</span> {data.summary?.length || 0} characters
            </div>
            {data.summary && (
              <p className="text-sm text-gray-700 line-clamp-4">
                {data.summary}
              </p>
            )}
          </div>
        );
      
      case 'MINDMAP':
        return (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Mind Map Generated:</span> {data.nodes?.length || 0} nodes
            </div>
            {data.description && (
              <p className="text-sm text-gray-700 line-clamp-3">
                {data.description}
              </p>
            )}
          </div>
        );
      
      default:
        return (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Generated:</span> {formatDate(result.createdAt)}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Generated Results</h1>
              <p className="text-gray-600 mt-2">
                All your AI-generated content from learning materials
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Brain className="w-4 h-4" />
              <span>{results.length} result groups</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search content, subjects, features..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Feature Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={filterFeatureType}
                onChange={(e) => setFilterFeatureType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 appearance-none bg-white"
              >
                <option value="">All Features</option>
                <option value="AI_QUESTIONS">AI Questions</option>
                <option value="PERFORMANCE_ANALYSIS">Performance Analysis</option>
                <option value="SUMMARY">Summary</option>
                <option value="MINDMAP">Mind Map</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results List */}
        {(filteredResults.length === 0 && filteredAIQuestions.length === 0) ? (
          <div className="text-center py-12">
            <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterSubject || filterFeatureType ? 'No results found' : 'No AI results yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm || filterSubject || filterFeatureType 
                ? 'Try adjusting your search or filter criteria.'
                : 'Generate AI content from your learning materials to see results here.'
              }
            </p>
            {!searchTerm && !filterSubject && !filterFeatureType && (
              <Link
                href="/student/lms"
                className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Start Learning
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* AI Questions Section */}
            {filteredAIQuestions.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  AI Generated Questions
                </h2>
                {filteredAIQuestions.map((group) => (
                  <div key={`${group.subjectId}_${group.topicId}_${group.subtopicId}`} className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="p-6">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-800">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                AI Generated Questions
                              </h3>
                              <p className="text-sm text-gray-600">{group.questions.length} questions generated</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Tag className="w-4 h-4 mr-1" />
                              <span>{group.subject}</span>
                            </div>
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span>{group.questions.length} questions</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            AI Questions
                          </span>
                        </div>
                      </div>

                      {/* Content Path */}
                      <div className="mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium">{group.subject}</span>
                          <span className="mx-2">›</span>
                          <span>{group.topic}</span>
                          <span className="mx-2">›</span>
                          <span>{group.subtopic}</span>
                        </div>
                      </div>

                      {/* Questions Preview */}
                      <div className="space-y-3">
                        {group.questions.slice(0, 3).map((question, index) => (
                          <div key={question.id} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                Question {index + 1}
                              </span>
                              <span className="text-xs text-gray-500">
                                {formatDate(question.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                              {question.stem}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span>Difficulty: {question.difficulty}</span>
                              <span>•</span>
                              <span>{question.options.length} options</span>
                            </div>
                          </div>
                        ))}
                        {group.questions.length > 3 && (
                          <p className="text-xs text-gray-500 text-center">
                            +{group.questions.length - 3} more questions...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Other AI Results Section */}
            {filteredResults.length > 0 && (
              <div className="space-y-4">
                {filteredAIQuestions.length > 0 && (
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Brain className="w-5 h-5 mr-2" />
                    Other AI Generated Content
                  </h2>
                )}
                {filteredResults.map((result) => (
                  <div key={`${result.contentId}_${result.featureType}`} className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`p-2 rounded-lg ${getFeatureColor(result.featureType)}`}>
                          {getFeatureIcon(result.featureType)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {getFeatureName(result.featureType)}
                          </h3>
                          <p className="text-sm text-gray-600">{result.contentTitle}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Tag className="w-4 h-4 mr-1" />
                          <span>{result.subject}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{result.results.length} versions</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFeatureColor(result.featureType)}`}>
                        {getFeatureName(result.featureType)}
                      </span>
                    </div>
                  </div>

                  {/* Content Path */}
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">{result.subject}</span>
                      <span className="mx-2">›</span>
                      <span>{result.topic}</span>
                      <span className="mx-2">›</span>
                      <span>{result.subtopic}</span>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="space-y-4">
                    {result.results.map((resultItem, index) => (
                      <div key={resultItem.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">
                              Version {resultItem.version}
                            </span>
                            <span className="text-xs text-gray-500">
                              Generated: {formatDate(resultItem.createdAt)}
                            </span>
                          </div>
                          {index === 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                              Latest
                            </span>
                          )}
                        </div>
                        
                        {renderResultContent(resultItem, result.featureType)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIResultsPage() {
  return (
    <ProtectedRoute>
      <StudentLayout>
        <AIResultsPageContent />
      </StudentLayout>
    </ProtectedRoute>
  );
}
