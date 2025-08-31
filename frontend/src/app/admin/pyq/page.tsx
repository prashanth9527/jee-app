'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Swal from 'sweetalert2';

interface Question {
  id: string;
  stem: string;
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  yearAppeared?: number;
  subject?: { id: string; name: string };
  topic?: { id: string; name: string };
  subtopic?: { id: string; name: string };
  options: { id: string; text: string; isCorrect: boolean; order: number }[];
  tags: { tag: { name: string } }[];
}

interface Subject {
  id: string;
  name: string;
  _count: { questions: number };
}

interface Stats {
  totalPYQ: number;
  byYear: { year: number; count: number }[];
  bySubject: { name: string; count: number }[];
}

export default function AdminPYQPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false
  });

  // Filters
  const [filters, setFilters] = useState({
    year: '',
    subjectId: '',
    topicId: '',
    search: ''
  });

  // Form for creating/editing
  const [showForm, setShowForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState({
    stem: '',
    explanation: '',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    yearAppeared: new Date().getFullYear(),
    subjectId: '',
    topicId: '',
    subtopicId: '',
    options: [
      { text: '', isCorrect: false, order: 0 },
      { text: '', isCorrect: false, order: 1 },
      { text: '', isCorrect: false, order: 2 },
      { text: '', isCorrect: false, order: 3 }
    ],
    tagNames: [] as string[]
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadQuestions();
  }, [filters, pagination.currentPage]);

  const loadInitialData = async () => {
    try {
      const [statsRes, subjectsRes] = await Promise.all([
        api.get('/admin/pyq/stats'),
        api.get('/admin/subjects')
      ]);

      setStats(statsRes.data);
      setSubjects(subjectsRes.data);
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Swal.fire('Error', 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: pagination.itemsPerPage.toString(),
        ...filters
      });

      const response = await api.get(`/admin/pyq/questions?${params}`);
      setQuestions(response.data.questions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load questions:', error);
      Swal.fire('Error', 'Failed to load questions', 'error');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSearch = (searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedQuestions(questions.map(q => q.id));
    } else {
      setSelectedQuestions([]);
    }
  };

  const handleSelectQuestion = (questionId: string, checked: boolean) => {
    if (checked) {
      setSelectedQuestions(prev => [...prev, questionId]);
    } else {
      setSelectedQuestions(prev => prev.filter(id => id !== questionId));
    }
  };

  const handleMarkAsPYQ = async () => {
    if (selectedQuestions.length === 0) {
      Swal.fire('Warning', 'Please select questions to mark as PYQ', 'warning');
      return;
    }

    const { value: year } = await Swal.fire({
      title: 'Enter Year',
      input: 'number',
      inputValue: new Date().getFullYear(),
      inputValidator: (value) => {
        if (!value || parseInt(value) < 1990 || parseInt(value) > new Date().getFullYear()) {
          return 'Please enter a valid year between 1990 and current year';
        }
      }
    });

    if (year) {
      try {
        await api.post('/admin/pyq/mark-as-pyq', {
          questionIds: selectedQuestions,
          yearAppeared: parseInt(year)
        });
        
        Swal.fire('Success', `Marked ${selectedQuestions.length} questions as PYQ`, 'success');
        setSelectedQuestions([]);
        loadQuestions();
      } catch (error) {
        console.error('Failed to mark questions as PYQ:', error);
        Swal.fire('Error', 'Failed to mark questions as PYQ', 'error');
      }
    }
  };

  const handleRemovePYQStatus = async () => {
    if (selectedQuestions.length === 0) {
      Swal.fire('Warning', 'Please select questions to remove PYQ status', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'Remove PYQ Status',
      text: `Are you sure you want to remove PYQ status from ${selectedQuestions.length} questions?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await api.post('/admin/pyq/remove-pyq-status', {
          questionIds: selectedQuestions
        });
        
        Swal.fire('Success', `Removed PYQ status from ${selectedQuestions.length} questions`, 'success');
        setSelectedQuestions([]);
        loadQuestions();
      } catch (error) {
        console.error('Failed to remove PYQ status:', error);
        Swal.fire('Error', 'Failed to remove PYQ status', 'error');
      }
    }
  };

  const handleDeleteQuestions = async () => {
    if (selectedQuestions.length === 0) {
      Swal.fire('Warning', 'Please select questions to delete', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'Delete Questions',
      text: `Are you sure you want to delete ${selectedQuestions.length} questions? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#dc2626'
    });

    if (result.isConfirmed) {
      try {
        await api.post('/admin/questions/bulk-delete', {
          ids: selectedQuestions
        });
        
        Swal.fire('Success', `Deleted ${selectedQuestions.length} questions`, 'success');
        setSelectedQuestions([]);
        loadQuestions();
      } catch (error) {
        console.error('Failed to delete questions:', error);
        Swal.fire('Error', 'Failed to delete questions', 'error');
      }
    }
  };

  const openCreateForm = () => {
    setEditingQuestion(null);
    setFormData({
      stem: '',
      explanation: '',
      difficulty: 'MEDIUM',
      yearAppeared: new Date().getFullYear(),
      subjectId: '',
      topicId: '',
      subtopicId: '',
      options: [
        { text: '', isCorrect: false, order: 0 },
        { text: '', isCorrect: false, order: 1 },
        { text: '', isCorrect: false, order: 2 },
        { text: '', isCorrect: false, order: 3 }
      ],
      tagNames: []
    });
    setShowForm(true);
  };

  const openEditForm = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      stem: question.stem,
      explanation: question.explanation || '',
      difficulty: question.difficulty,
      yearAppeared: question.yearAppeared || new Date().getFullYear(),
      subjectId: question.subject?.id || '',
      topicId: question.topic?.id || '',
      subtopicId: question.subtopic?.id || '',
      options: question.options.map(opt => ({
        text: opt.text,
        isCorrect: opt.isCorrect,
        order: opt.order
      })),
      tagNames: question.tags.map(tag => tag.tag.name)
    });
    setShowForm(true);
  };

  const handleSubmitForm = async () => {
    try {
      if (editingQuestion) {
        await api.put(`/admin/pyq/questions/${editingQuestion.id}`, formData);
        Swal.fire('Success', 'Question updated successfully', 'success');
      } else {
        await api.post('/admin/pyq/questions', formData);
        Swal.fire('Success', 'Question created successfully', 'success');
      }
      
      setShowForm(false);
      loadQuestions();
    } catch (error) {
      console.error('Failed to save question:', error);
      Swal.fire('Error', 'Failed to save question', 'error');
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'text-green-600 bg-green-100';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100';
      case 'HARD': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Previous Year Questions Management</h1>
          <p className="text-gray-600">Manage and organize previous year JEE questions</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total PYQs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPYQ}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Years Covered</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.byYear.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Subjects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.bySubject.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={openCreateForm}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add New PYQ
            </button>
            
            {selectedQuestions.length > 0 && (
              <>
                <button
                  onClick={handleMarkAsPYQ}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Mark as PYQ ({selectedQuestions.length})
                </button>
                
                <button
                  onClick={handleRemovePYQStatus}
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                >
                  Remove PYQ Status ({selectedQuestions.length})
                </button>
                
                <button
                  onClick={handleDeleteQuestions}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Delete ({selectedQuestions.length})
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                placeholder="Enter year"
                value={filters.year}
                onChange={(e) => handleFilterChange('year', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Subject Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                value={filters.subjectId}
                onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject._count.questions})
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search questions..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Questions Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Questions ({pagination.totalItems})
              </h2>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedQuestions.length === questions.length && questions.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Select All</span>
                </label>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Select
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Year
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Difficulty
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.map((question) => (
                  <tr key={question.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedQuestions.includes(question.id)}
                        onChange={(e) => handleSelectQuestion(question.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-md truncate">
                        {question.stem}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {question.yearAppeared || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {question.subject?.name || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => openEditForm(question)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          Swal.fire({
                            title: 'Delete Question',
                            text: 'Are you sure you want to delete this question?',
                            icon: 'warning',
                            showCancelButton: true,
                            confirmButtonText: 'Yes, delete',
                            cancelButtonText: 'Cancel'
                          }).then((result) => {
                            if (result.isConfirmed) {
                              api.delete(`/admin/pyq/questions/${question.id}`)
                                .then(() => {
                                  Swal.fire('Success', 'Question deleted successfully', 'success');
                                  loadQuestions();
                                })
                                .catch(() => {
                                  Swal.fire('Error', 'Failed to delete question', 'error');
                                });
                            }
                          });
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                  {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                  {pagination.totalItems} results
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                    disabled={!pagination.hasPreviousPage}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                    disabled={!pagination.hasNextPage}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingQuestion ? 'Edit PYQ Question' : 'Create New PYQ Question'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                    <textarea
                      value={formData.stem}
                      onChange={(e) => setFormData(prev => ({ ...prev, stem: e.target.value }))}
                      rows={4}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter the question text..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Year Appeared</label>
                      <input
                        type="number"
                        value={formData.yearAppeared}
                        onChange={(e) => setFormData(prev => ({ ...prev, yearAppeared: parseInt(e.target.value) }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                      <select
                        value={formData.difficulty}
                        onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' }))}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Explanation</label>
                    <textarea
                      value={formData.explanation}
                      onChange={(e) => setFormData(prev => ({ ...prev, explanation: e.target.value }))}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter explanation (optional)..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                    <div className="space-y-2">
                      {formData.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => {
                              const newOptions = [...formData.options];
                              newOptions[index].text = e.target.value;
                              setFormData(prev => ({ ...prev, options: newOptions }));
                            }}
                            className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Option ${String.fromCharCode(65 + index)}`}
                          />
                          <input
                            type="radio"
                            name="correctOption"
                            checked={option.isCorrect}
                            onChange={() => {
                              const newOptions = formData.options.map((opt, i) => ({
                                ...opt,
                                isCorrect: i === index
                              }));
                              setFormData(prev => ({ ...prev, options: newOptions }));
                            }}
                            className="text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600">Correct</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => setShowForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitForm}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingQuestion ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 