'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import Swal from 'sweetalert2';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import RichTextEditor from '@/components/RichTextEditor';

interface Subject {
  id: string;
  name: string;
  stream?: { code: string };
}

interface Topic {
  id: string;
  name: string;
  subjectId: string;
}

interface Subtopic {
  id: string;
  name: string;
  topicId: string;
}

interface Tag {
  id: string;
  name: string;
}

export default function AddPYQQuestionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Data for dropdowns
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  // Form data
  const [formData, setFormData] = useState({
    stem: '',
    explanation: '',
    tip_formula: '',
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

  // Form validation
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.subjectId) {
      loadTopics(formData.subjectId);
    }
  }, [formData.subjectId]);

  useEffect(() => {
    if (formData.topicId) {
      loadSubtopics(formData.topicId);
    }
  }, [formData.topicId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [subjectsRes, tagsRes] = await Promise.all([
        api.get('/admin/subjects'),
        api.get('/admin/tags')
      ]);
      
      setSubjects(subjectsRes.data);
      setTags(tagsRes.data.tags || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load subjects and tags. Please refresh the page.'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async (subjectId: string) => {
    try {
      const response = await api.get(`/admin/topics?subjectId=${subjectId}`);
      setTopics(response.data.topics || []);
      // Reset topic and subtopic selection
      setFormData(prev => ({ ...prev, topicId: '', subtopicId: '' }));
      setSubtopics([]);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const loadSubtopics = async (topicId: string) => {
    try {
      const response = await api.get(`/admin/subtopics?topicId=${topicId}`);
      setSubtopics(response.data.subtopics || []);
      // Reset subtopic selection
      setFormData(prev => ({ ...prev, subtopicId: '' }));
    } catch (error) {
      console.error('Error loading subtopics:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.stem.trim()) {
      newErrors.stem = 'Question text is required';
    }

    if (!formData.subjectId) {
      newErrors.subjectId = 'Subject is required';
    }

    if (!formData.yearAppeared) {
      newErrors.yearAppeared = 'Please select a year';
    }

    // Check if at least one option is correct
    const hasCorrectOption = formData.options.some(option => option.isCorrect);
    if (!hasCorrectOption) {
      newErrors.options = 'At least one option must be marked as correct';
    }

    // Check if all options have text
    const hasEmptyOptions = formData.options.some(option => !option.text.trim());
    if (hasEmptyOptions) {
      newErrors.options = 'All options must have text';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      const questionData = {
        ...formData,
        isPreviousYear: true,
        options: formData.options.map((option, index) => ({
          ...option,
          order: index
        }))
      };

      await api.post('/admin/pyq/questions', questionData);
      
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'PYQ question created successfully',
        showConfirmButton: false,
        timer: 2000
      });

      // Redirect back to PYQ list
      router.push('/admin/pyq');
    } catch (error: any) {
      console.error('Error creating PYQ question:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error?.response?.data?.message || 'Failed to create PYQ question'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOptionChange = (index: number, field: 'text' | 'isCorrect', value: string | boolean) => {
    const newOptions = [...formData.options];
    if (field === 'text') {
      newOptions[index].text = value as string;
    } else {
      // If setting this option as correct, uncheck others
      newOptions.forEach((opt, i) => {
        opt.isCorrect = i === index ? (value as boolean) : false;
      });
    }
    setFormData(prev => ({ ...prev, options: newOptions }));
    
    // Clear option errors when user starts typing
    if (errors.options) {
      setErrors(prev => ({ ...prev, options: '' }));
    }
  };

  const addTag = (tagName: string) => {
    if (tagName.trim() && !formData.tagNames.includes(tagName.trim())) {
      setFormData(prev => ({
        ...prev,
        tagNames: [...prev.tagNames, tagName.trim()]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tagNames: prev.tagNames.filter(tag => tag !== tagToRemove)
    }));
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <AdminLayout>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading form...</p>
            </div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Add PYQ Question</h1>
                  <p className="mt-2 text-gray-600">Create a new Previous Year Question for JEE preparation</p>
                </div>
                <button
                  onClick={() => router.push('/admin/pyq')}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  ← Back to PYQ List
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
              <div className="space-y-8">
                {/* Question Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Question Details</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question Text <span className="text-red-500">*</span>
                      </label>
                      <div className={`${errors.stem ? 'border border-red-500 rounded-md' : ''}`}>
                        <RichTextEditor
                          value={formData.stem}
                          onChange={(content) => {
                            setFormData(prev => ({ ...prev, stem: content }));
                            if (errors.stem) setErrors(prev => ({ ...prev, stem: '' }));
                          }}
                          placeholder="Enter the complete question text... (Supports rich text formatting and math equations)"
                          height={200}
                        />
                      </div>
                      {errors.stem && <p className="mt-1 text-sm text-red-600">{errors.stem}</p>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Year Appeared <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.yearAppeared}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, yearAppeared: parseInt(e.target.value) }));
                            if (errors.yearAppeared) setErrors(prev => ({ ...prev, yearAppeared: '' }));
                          }}
                          className={`w-full border rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                            errors.yearAppeared ? 'border-red-500' : 'border-gray-300'
                          }`}
                        >
                          <option value="">Select Year</option>
                          {Array.from({ length: new Date().getFullYear() - 1949 }, (_, i) => {
                            const year = new Date().getFullYear() - i;
                            return (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            );
                          })}
                        </select>
                        {errors.yearAppeared && <p className="mt-1 text-sm text-red-600">{errors.yearAppeared}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Difficulty Level <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={formData.difficulty}
                          onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value as 'EASY' | 'MEDIUM' | 'HARD' }))}
                          className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        >
                          <option value="EASY">Easy</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HARD">Hard</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subject & Topic Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Subject & Topic</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.subjectId}
                        onChange={(e) => {
                          setFormData(prev => ({ ...prev, subjectId: e.target.value }));
                          if (errors.subjectId) setErrors(prev => ({ ...prev, subjectId: '' }));
                        }}
                        className={`w-full border rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 ${
                          errors.subjectId ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select Subject</option>
                        {subjects.map(subject => (
                          <option key={subject.id} value={subject.id}>
                            {subject.name} {subject.stream?.code && `(${subject.stream.code})`}
                          </option>
                        ))}
                      </select>
                      {errors.subjectId && <p className="mt-1 text-sm text-red-600">{errors.subjectId}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Topic</label>
                      <select
                        value={formData.topicId}
                        onChange={(e) => setFormData(prev => ({ ...prev, topicId: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        disabled={!formData.subjectId}
                      >
                        <option value="">Select Topic</option>
                        {topics.map(topic => (
                          <option key={topic.id} value={topic.id}>{topic.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subtopic</label>
                      <select
                        value={formData.subtopicId}
                        onChange={(e) => setFormData(prev => ({ ...prev, subtopicId: e.target.value }))}
                        className="w-full border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        disabled={!formData.topicId}
                      >
                        <option value="">Select Subtopic</option>
                        {subtopics.map(subtopic => (
                          <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Explanation & Tips Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Explanation & Tips</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Explanation</label>
                      <RichTextEditor
                        value={formData.explanation}
                        onChange={(content) => setFormData(prev => ({ ...prev, explanation: content }))}
                        placeholder="Provide a detailed explanation of the solution... (Supports rich text formatting and math equations)"
                        height={200}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tips & Formulas</label>
                      <RichTextEditor
                        value={formData.tip_formula}
                        onChange={(content) => setFormData(prev => ({ ...prev, tip_formula: content }))}
                        placeholder="Enter helpful tips, formulas, or hints to solve this question... (Supports rich text formatting and math equations)"
                        height={150}
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        💡 Include key formulas, concepts, or solving strategies. Use the Math button (∑) for mathematical expressions
                      </p>
                    </div>
                  </div>
                </div>

                {/* Options Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Answer Options</h2>
                  <div className="space-y-4">
                    {formData.options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                        <div className="flex-shrink-0">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-medium text-sm">
                            {String.fromCharCode(65 + index)}
                          </span>
                        </div>
                        <div className="flex-1">
                          <RichTextEditor
                            value={option.text}
                            onChange={(content) => handleOptionChange(index, 'text', content)}
                            placeholder={`Option ${String.fromCharCode(65 + index)}... (Supports rich text formatting and math equations)`}
                            height={150}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="correctOption"
                            checked={option.isCorrect}
                            onChange={() => handleOptionChange(index, 'isCorrect', true)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium text-gray-700">Correct</span>
                        </div>
                      </div>
                    ))}
                    {errors.options && <p className="mt-2 text-sm text-red-600">{errors.options}</p>}
                  </div>
                </div>

                {/* Tags Section */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Tags</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Add Tags</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          placeholder="Enter tag name and press Enter"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const target = e.target as HTMLInputElement;
                              addTag(target.value);
                              target.value = '';
                            }
                          }}
                          className="flex-1 border border-gray-300 rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.querySelector('input[placeholder="Enter tag name and press Enter"]') as HTMLInputElement;
                            if (input) {
                              addTag(input.value);
                              input.value = '';
                            }
                          }}
                          className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Display Tags */}
                    {formData.tagNames.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.tagNames.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                            <button
                              type="button"
                              onClick={() => removeTag(tag)}
                              className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-400 hover:bg-blue-200 hover:text-blue-500"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Suggested Tags */}
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Suggested tags:</p>
                      <div className="flex flex-wrap gap-2">
                        {['Previous Year', 'JEE Mains', 'JEE Advanced', 'Formula Based', 'Conceptual'].map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => router.push('/admin/pyq')}
                    className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Creating...' : 'Create PYQ Question'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
} 