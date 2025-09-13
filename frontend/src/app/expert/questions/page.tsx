'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import ExpertLayout from '@/components/ExpertLayout';
import Swal from 'sweetalert2';
import RichTextEditor from '@/components/RichTextEditor';

interface Question {
  id: string;
  stem: string;
  explanation?: string;
  tip_formula?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  yearAppeared?: number;
  isPreviousYear: boolean;
  isAIGenerated: boolean;
  subject?: {
    id: string;
    name: string;
    stream: {
      id: string;
      name: string;
      code: string;
    };
  };
  topic?: {
    id: string;
    name: string;
  };
  subtopic?: {
    id: string;
    name: string;
  };
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    order: number;
  }[];
  tags: {
    tag: {
      id: string;
      name: string;
    };
  }[];
  _count: {
    answers: number;
  };
}

interface Subject {
  id: string;
  name: string;
  stream: {
    id: string;
    name: string;
    code: string;
  };
  _count: {
    questions: number;
  };
}

interface Topic {
  id: string;
  name: string;
  subject: {
    id: string;
    name: string;
    stream: {
      id: string;
      name: string;
      code: string;
    };
  };
  _count: {
    questions: number;
  };
}

interface Subtopic {
  id: string;
  name: string;
  topic: {
    id: string;
    name: string;
    subject: {
      id: string;
      name: string;
      stream: {
        id: string;
        name: string;
        code: string;
      };
    };
  };
  _count: {
    questions: number;
  };
}

interface Tag {
  id: string;
  name: string;
}

export default function ExpertQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    stem: '',
    explanation: '',
    tip_formula: '',
    difficulty: 'MEDIUM' as 'EASY' | 'MEDIUM' | 'HARD',
    yearAppeared: '',
    isPreviousYear: false,
    subjectId: '',
    topicId: '',
    subtopicId: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    tagIds: [] as string[]
  });

  useEffect(() => {
    fetchQuestions();
    fetchSubjects();
    fetchTopics();
    fetchSubtopics();
    fetchTags();
  }, [currentPage, searchTerm, selectedSubject, selectedTopic, selectedSubtopic, selectedDifficulty]);

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedSubject) params.append('subjectId', selectedSubject);
      if (selectedTopic) params.append('topicId', selectedTopic);
      if (selectedSubtopic) params.append('subtopicId', selectedSubtopic);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);

      const response = await api.get(`/expert/questions?${params}`);
      setQuestions(response.data.questions);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching questions:', error);
      Swal.fire('Error', 'Failed to fetch questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/expert/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const params = selectedSubject ? `?subjectId=${selectedSubject}` : '';
      const response = await api.get(`/expert/topics${params}`);
      setTopics(response.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchSubtopics = async () => {
    try {
      const params = selectedTopic ? `?topicId=${selectedTopic}` : '';
      const response = await api.get(`/expert/subtopics${params}`);
      setSubtopics(response.data);
    } catch (error) {
      console.error('Error fetching subtopics:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const response = await api.get('/expert/tags');
      setTags(response.data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const questionData = {
        ...formData,
        yearAppeared: formData.yearAppeared ? parseInt(formData.yearAppeared) : null,
        options: formData.options.filter(option => option.text.trim() !== ''),
        tags: formData.tagIds
      };

      if (editingQuestion) {
        await api.put(`/expert/questions/${editingQuestion.id}`, questionData);
        Swal.fire('Success', 'Question updated successfully', 'success');
      } else {
        await api.post('/expert/questions', questionData);
        Swal.fire('Success', 'Question created successfully', 'success');
      }

      setShowAddModal(false);
      setEditingQuestion(null);
      resetForm();
      fetchQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      Swal.fire('Error', 'Failed to save question', 'error');
    }
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      stem: question.stem,
      explanation: question.explanation || '',
      tip_formula: question.tip_formula || '',
      difficulty: question.difficulty,
      yearAppeared: question.yearAppeared?.toString() || '',
      isPreviousYear: question.isPreviousYear,
      subjectId: question.subject?.id || '',
      topicId: question.topic?.id || '',
      subtopicId: question.subtopic?.id || '',
      options: question.options.map(opt => ({
        text: opt.text,
        isCorrect: opt.isCorrect
      })),
      tagIds: question.tags.map(tag => tag.tag.id)
    });
    setShowAddModal(true);
  };

  const handleDelete = async (questionId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/expert/questions/${questionId}`);
        Swal.fire('Deleted!', 'Question has been deleted.', 'success');
        fetchQuestions();
      } catch (error) {
        console.error('Error deleting question:', error);
        Swal.fire('Error', 'Failed to delete question', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      stem: '',
      explanation: '',
      tip_formula: '',
      difficulty: 'MEDIUM',
      yearAppeared: '',
      isPreviousYear: false,
      subjectId: '',
      topicId: '',
      subtopicId: '',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      tagIds: []
    });
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }]
    }));
  };

  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="EXPERT">
        <ExpertLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </ExpertLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="EXPERT">
      <ExpertLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Questions Management</h1>
              <p className="text-gray-600">Add, edit, and manage questions</p>
            </div>
            <button
              onClick={() => {
                setEditingQuestion(null);
                resetForm();
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Question
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
              
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedTopic('');
                  setSelectedSubtopic('');
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.stream.code})
                  </option>
                ))}
              </select>

              <select
                value={selectedTopic}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  setSelectedSubtopic('');
                }}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="">All Topics</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedSubtopic}
                onChange={(e) => setSelectedSubtopic(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="">All Subtopics</option>
                {subtopics.map(subtopic => (
                  <option key={subtopic.id} value={subtopic.id}>
                    {subtopic.name}
                  </option>
                ))}
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              >
                <option value="">All Difficulties</option>
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
          </div>

          {/* Questions Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Options
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {questions.map((question) => (
                    <tr key={question.id}>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-900 truncate">{question.stem}</div>
                          {question.explanation && (
                            <div className="text-xs text-gray-500 truncate">{question.explanation}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {question.subject?.name || 'No Subject'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {question.subject?.stream?.code || 'No Stream'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          question.difficulty === 'EASY' ? 'bg-green-100 text-green-800' :
                          question.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {question.difficulty}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {question.options.length} options
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          onClick={() => handleEdit(question)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(question.id)}
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
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Add/Edit Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingQuestion ? 'Edit Question' : 'Add Question'}
                  </h2>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                  {/* Question Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Question Stem *
                      </label>
                      <RichTextEditor
                        value={formData.stem}
                        onChange={(content) => setFormData(prev => ({ ...prev, stem: content }))}
                        placeholder="Enter the question... (Supports rich text formatting and math equations)"
                        height={200}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Explanation
                      </label>
                      <RichTextEditor
                        value={formData.explanation}
                        onChange={(content) => setFormData(prev => ({ ...prev, explanation: content }))}
                        placeholder="Enter explanation... (Supports rich text formatting and math equations)"
                        height={200}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Tips & Formulas
                      </label>
                      <RichTextEditor
                        value={formData.tip_formula}
                        onChange={(content) => setFormData(prev => ({ ...prev, tip_formula: content }))}
                        placeholder="Enter helpful tips, formulas, or hints... (Supports rich text formatting and math equations)"
                        height={150}
                      />
                    </div>
                  </div>

                  {/* Subject, Topic, Subtopic */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Subject *
                      </label>
                      <select
                        required
                        value={formData.subjectId}
                        onChange={(e) => setFormData(prev => ({ ...prev, subjectId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(subject => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name} ({subject.stream.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Topic
                      </label>
                      <select
                        value={formData.topicId}
                        onChange={(e) => setFormData(prev => ({ ...prev, topicId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      >
                        <option value="">Select Topic</option>
                        {topics.map(topic => (
                          <option key={topic.id} value={topic.id}>
                            {topic.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Subtopic
                      </label>
                      <select
                        value={formData.subtopicId}
                        onChange={(e) => setFormData(prev => ({ ...prev, subtopicId: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      >
                        <option value="">Select Subtopic</option>
                        {subtopics.map(subtopic => (
                          <option key={subtopic.id} value={subtopic.id}>
                            {subtopic.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Difficulty *
                      </label>
                      <select
                        required
                        value={formData.difficulty}
                        onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>
                  </div>

                  {/* Options */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="block text-sm font-medium text-gray-900">
                        Options *
                      </label>
                      <button
                        type="button"
                        onClick={addOption}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        + Add Option
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formData.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <input
                            type="radio"
                            name="correctOption"
                            checked={option.isCorrect}
                            onChange={() => {
                              setFormData(prev => ({
                                ...prev,
                                options: prev.options.map((opt, i) => ({
                                  ...opt,
                                  isCorrect: i === index
                                }))
                              }));
                            }}
                            className="text-blue-600"
                          />
                          <div className="flex-1">
                            <RichTextEditor
                              value={option.text}
                              onChange={(content) => updateOption(index, 'text', content)}
                              placeholder={`Option ${index + 1}... (Supports rich text formatting and math equations)`}
                              height={150}
                            />
                          </div>
                          {formData.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => removeOption(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Tags
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {tags.map(tag => (
                        <label key={tag.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.tagIds.includes(tag.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  tagIds: [...prev.tagIds, tag.id]
                                }));
                              } else {
                                setFormData(prev => ({
                                  ...prev,
                                  tagIds: prev.tagIds.filter(id => id !== tag.id)
                                }));
                              }
                            }}
                            className="mr-2 text-blue-600"
                          />
                          <span className="text-sm text-gray-900">{tag.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Modal Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingQuestion(null);
                        resetForm();
                      }}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      {editingQuestion ? 'Update Question' : 'Create Question'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </ExpertLayout>
    </ProtectedRoute>
  );
} 