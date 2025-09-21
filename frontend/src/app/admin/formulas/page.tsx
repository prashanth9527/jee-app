'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Calculator, Tag, BookOpen, Filter } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import RichTextEditor from '@/components/RichTextEditor';
import MathFormula from '@/components/MathFormula';
import Swal from 'sweetalert2';
import api from '@/lib/api';

interface Formula {
  id: string;
  title: string;
  formula: string;
  description?: string;
  subject?: string;
  tags: string[];
  lessonId?: string;
  topicId?: string;
  subtopicId?: string;
  targetRole?: string;
  createdAt: string;
  updatedAt: string;
}

interface Subject {
  id: string;
  name: string;
  stream?: {
    id: string;
    name: string;
    code: string;
  };
}

interface Lesson {
  id: string;
  name: string;
  subject: {
    id: string;
    name: string;
    stream?: {
      id: string;
      name: string;
      code: string;
    };
  };
}

interface Topic {
  id: string;
  name: string;
  lesson?: {
    id: string;
    name: string;
    subject: {
      id: string;
      name: string;
      stream?: {
        id: string;
        name: string;
        code: string;
      };
    };
  };
  subject: {
    id: string;
    name: string;
    stream?: {
      id: string;
      name: string;
      code: string;
    };
  };
}

interface Subtopic {
  id: string;
  name: string;
  topic?: {
    id: string;
    name: string;
    lesson?: {
      id: string;
      name: string;
      subject: {
        id: string;
        name: string;
        stream?: {
          id: string;
          name: string;
          code: string;
        };
      };
    };
    subject: {
      id: string;
      name: string;
      stream?: {
        id: string;
        name: string;
        code: string;
      };
    };
  };
}

export default function AdminFormulasPage() {
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedSubtopic, setSelectedSubtopic] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFormula, setEditingFormula] = useState<Formula | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    title: '',
    formula: '',
    description: '',
    subject: '',
    tags: [] as string[],
    lessonId: '',
    topicId: '',
    subtopicId: '',
    targetRole: 'STUDENT' as string,
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchFormulas();
    fetchSubjects();
    fetchLessons();
    fetchTopics();
    fetchSubtopics();
  }, []);

  useEffect(() => {
    if (formData.subject) {
      fetchSubtopics();
    } else {
      setSubtopics([]);
    }
  }, [formData.subject]);

  const fetchFormulas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedSubject) params.append('subject', selectedSubject);
      if (selectedLesson) params.append('lessonId', selectedLesson);
      if (selectedTopic) params.append('topicId', selectedTopic);
      if (selectedSubtopic) params.append('subtopicId', selectedSubtopic);

      const response = await api.get(`/formulas/admin?${params}`);
      setFormulas(response.data.formulas || []);
    } catch (error) {
      console.error('Error fetching formulas:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch formulas'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await api.get('/admin/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchLessons = async () => {
    try {
      const response = await api.get('/admin/lessons?limit=1000');
      setLessons(response.data.lessons || response.data);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await api.get('/admin/topics?limit=1000');
      setTopics(response.data.topics || response.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchSubtopics = async () => {
    try {
      const response = await api.get('/admin/subtopics?limit=1000');
      setSubtopics(response.data.subtopics || response.data);
    } catch (error) {
      console.error('Error fetching subtopics:', error);
    }
  };

  const handleCreate = () => {
    setFormData({
      title: '',
      formula: '',
      description: '',
      subject: '',
      tags: [],
      lessonId: '',
      topicId: '',
      subtopicId: '',
      targetRole: 'STUDENT',
    });
    setTagInput('');
    setShowCreateModal(true);
  };

  const handleEdit = (formula: Formula) => {
    setFormData({
      title: formula.title,
      formula: formula.formula,
      description: formula.description || '',
      subject: formula.subject || '',
      tags: formula.tags || [],
      lessonId: formula.lessonId || '',
      topicId: formula.topicId || '',
      subtopicId: formula.subtopicId || '',
      targetRole: formula.targetRole || 'STUDENT',
    });
    setTagInput('');
    setEditingFormula(formula);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'You won\'t be able to revert this!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/formulas/${id}`);
        await fetchFormulas();
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Formula has been deleted.',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error deleting formula:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to delete formula'
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Title',
        text: 'Please enter a formula title.'
      });
      return;
    }

    if (!formData.formula.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Formula',
        text: 'Please enter the formula.'
      });
      return;
    }

    try {
      setSubmitting(true);
      
      if (editingFormula) {
        await api.put(`/formulas/${editingFormula.id}`, formData);
      } else {
        await api.post('/formulas/admin', formData);
      }

      await fetchFormulas();
      
      if (editingFormula) {
        setShowEditModal(false);
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Formula updated successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        setShowCreateModal(false);
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Formula created successfully.',
          timer: 2000,
          showConfirmButton: false
        });
      }
      
      // Reset form
      setFormData({
        title: '',
        formula: '',
        description: '',
        subject: '',
        tags: [],
        lessonId: '',
        topicId: '',
        subtopicId: '',
        targetRole: 'STUDENT',
      });
      setTagInput('');
    } catch (error: any) {
      console.error('Error saving formula:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to save formula'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  // Filter data based on selections
  const filteredLessons = selectedSubject && Array.isArray(lessons)
    ? lessons.filter(lesson => lesson.subject.name === selectedSubject)
    : Array.isArray(lessons) ? lessons : [];

  const filteredTopics = selectedLesson && Array.isArray(topics)
    ? topics.filter(topic => topic.lesson?.id === selectedLesson)
    : selectedSubject && Array.isArray(topics)
    ? topics.filter(topic => topic.subject.name === selectedSubject)
    : Array.isArray(topics) ? topics : [];

  const filteredSubtopics = selectedTopic && Array.isArray(subtopics)
    ? subtopics.filter(subtopic => subtopic.topic?.id === selectedTopic)
    : Array.isArray(subtopics) ? subtopics : [];

  const filteredFormulas = formulas.filter(formula => {
    const matchesSearch = formula.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formula.formula.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         formula.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = !selectedSubject || formula.subject === selectedSubject;
    const matchesLesson = !selectedLesson || formula.lessonId === selectedLesson;
    const matchesTopic = !selectedTopic || formula.topicId === selectedTopic;
    const matchesSubtopic = !selectedSubtopic || formula.subtopicId === selectedSubtopic;
    return matchesSearch && matchesSubject && matchesLesson && matchesTopic && matchesSubtopic;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminLayout>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Calculator className="h-8 w-8 text-blue-600" />
                Formula Bank Management
              </h1>
              <p className="text-gray-600 mt-1">Manage and organize mathematical formulas for students</p>
            </div>
            <button
              onClick={handleCreate}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Add Formula
            </button>
          </div>

          {/* Search and Filter */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Search formulas by title, content, or tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setSelectedLesson('');
                  setSelectedTopic('');
                  setSelectedSubtopic('');
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Subjects</option>
                {Array.isArray(subjects) && subjects.map(subject => (
                  <option key={subject.id} value={subject.name}>
                    {subject.name} ({subject.stream?.code || 'N/A'})
                  </option>
                ))}
              </select>
              <select
                value={selectedLesson}
                onChange={(e) => {
                  setSelectedLesson(e.target.value);
                  setSelectedTopic('');
                  setSelectedSubtopic('');
                }}
                disabled={!selectedSubject}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Lessons</option>
                {Array.isArray(filteredLessons) && filteredLessons.map(lesson => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.name} ({lesson.subject?.stream?.code || 'N/A'})
                  </option>
                ))}
              </select>
              <select
                value={selectedTopic}
                onChange={(e) => {
                  setSelectedTopic(e.target.value);
                  setSelectedSubtopic('');
                }}
                disabled={!selectedLesson}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Topics</option>
                {Array.isArray(filteredTopics) && filteredTopics.map(topic => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name} ({topic.subject?.stream?.code || 'N/A'})
                  </option>
                ))}
              </select>
              <select
                value={selectedSubtopic}
                onChange={(e) => setSelectedSubtopic(e.target.value)}
                disabled={!selectedTopic}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">All Subtopics</option>
                {Array.isArray(filteredSubtopics) && filteredSubtopics.map(subtopic => (
                  <option key={subtopic.id} value={subtopic.id}>
                    {subtopic.name} ({subtopic.topic?.subject?.stream?.code || 'N/A'})
                  </option>
                ))}
              </select>
              <button
                onClick={fetchFormulas}
                className="bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 transition-colors"
              >
                <Filter className="h-5 w-5" />
                Filter
              </button>
            </div>
          </div>

          {/* Formulas Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Formula
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredFormulas.map((formula) => (
                    <tr key={formula.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formula.title}
                          </div>
                          <div className="mt-1">
                            <MathFormula formula={formula.formula} inline={true} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {formula.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {formula.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                          {formula.tags.length > 2 && (
                            <span className="text-xs text-gray-500">
                              +{formula.tags.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(formula.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(formula)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Edit Formula"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(formula.id)}
                            className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                            title="Delete Formula"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredFormulas.length === 0 && (
              <div className="text-center py-12">
                <Calculator className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No formulas found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchTerm || selectedSubject ? 'Try adjusting your search criteria.' : 'Get started by creating a new formula.'}
                </p>
                {!searchTerm && !selectedSubject && (
                  <div className="mt-6">
                    <button
                      onClick={handleCreate}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Formula
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingFormula ? 'Edit Formula' : 'Create New Formula'}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setShowEditModal(false);
                      setEditingFormula(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Formula Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="e.g., Newton's Second Law"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject *
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value, lessonId: '', topicId: '', subtopicId: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select Subject</option>
                        {Array.isArray(subjects) && subjects.map(subject => (
                          <option key={subject.id} value={subject.name}>
                            {subject.name} ({subject.stream?.code || 'N/A'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formula Expression *
                    </label>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.formula}
                        onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg"
                        placeholder="e.g., F = ma or use LaTeX: F = ma or E = mc^2"
                        required
                      />
                      {formData.formula && (
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">Preview:</p>
                          <MathFormula formula={formData.formula} />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports LaTeX syntax. Examples: x^2, sqrt(x), alpha, beta, etc.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <RichTextEditor
                      value={formData.description}
                      onChange={(content) => setFormData({ ...formData, description: content })}
                      placeholder="Explain the formula, its applications, and any important notes..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lesson
                      </label>
                      <select
                        value={formData.lessonId}
                        onChange={(e) => setFormData({ ...formData, lessonId: e.target.value, topicId: '', subtopicId: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!formData.subject}
                      >
                        <option value="">Select Lesson</option>
                        {Array.isArray(lessons) && lessons
                          .filter(lesson => lesson.subject.name === formData.subject)
                          .map(lesson => (
                            <option key={lesson.id} value={lesson.id}>
                              {lesson.name} ({lesson.subject?.stream?.code || 'N/A'})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Topic
                      </label>
                      <select
                        value={formData.topicId}
                        onChange={(e) => setFormData({ ...formData, topicId: e.target.value, subtopicId: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!formData.lessonId}
                      >
                        <option value="">Select Topic</option>
                        {Array.isArray(topics) && topics
                          .filter(topic => topic.lesson?.id === formData.lessonId)
                          .map(topic => (
                            <option key={topic.id} value={topic.id}>
                              {topic.name} ({topic.subject?.stream?.code || 'N/A'})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subtopic
                      </label>
                      <select
                        value={formData.subtopicId}
                        onChange={(e) => setFormData({ ...formData, subtopicId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={!formData.topicId}
                      >
                        <option value="">Select Subtopic</option>
                        {Array.isArray(subtopics) && subtopics
                          .filter(subtopic => subtopic.topic?.id === formData.topicId)
                          .map(subtopic => (
                            <option key={subtopic.id} value={subtopic.id}>
                              {subtopic.name} ({subtopic.topic?.subject?.stream?.code || 'N/A'})
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tags
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add a tag and press Enter"
                      />
                      <button
                        type="button"
                        onClick={addTag}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setShowEditModal(false);
                        setEditingFormula(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          {editingFormula ? 'Updating...' : 'Creating...'}
                        </>
                      ) : (
                        editingFormula ? 'Update Formula' : 'Create Formula'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </ProtectedRoute>
  );
}