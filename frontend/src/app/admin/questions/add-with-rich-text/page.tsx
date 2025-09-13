'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, Calculator, BookOpen } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

interface Subject {
  id: string;
  name: string;
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

export default function AddQuestionWithRichTextPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form data
  const [stem, setStem] = useState('');
  const [explanation, setExplanation] = useState('');
  const [tipFormula, setTipFormula] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [subjectId, setSubjectId] = useState('');
  const [topicId, setTopicId] = useState('');
  const [subtopicId, setSubtopicId] = useState('');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [tags, setTags] = useState('');

  // Data
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (subjectId) {
      fetchTopics(subjectId);
    } else {
      setTopics([]);
      setSubtopics([]);
    }
  }, [subjectId]);

  useEffect(() => {
    if (topicId) {
      fetchSubtopics(topicId);
    } else {
      setSubtopics([]);
    }
  }, [topicId]);

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/subjects');
      const data = await response.json();
      setSubjects(data.subjects || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchTopics = async (subjectId: string) => {
    try {
      const response = await fetch(`/api/admin/topics?subjectId=${subjectId}`);
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchSubtopics = async (topicId: string) => {
    try {
      const response = await fetch(`/api/admin/subtopics?topicId=${topicId}`);
      const data = await response.json();
      setSubtopics(data.subtopics || []);
    } catch (error) {
      console.error('Error fetching subtopics:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!stem.trim()) {
      newErrors.stem = 'Question stem is required';
    }

    if (!explanation.trim()) {
      newErrors.explanation = 'Explanation is required';
    }

    if (options.some(opt => !opt.trim())) {
      newErrors.options = 'All options must be filled';
    }

    if (!subjectId) {
      newErrors.subject = 'Subject is required';
    }

    if (!topicId) {
      newErrors.topic = 'Topic is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stem,
          explanation,
          tipFormula,
          options,
          correctAnswer,
          subjectId,
          topicId,
          subtopicId: subtopicId || null,
          difficulty,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        }),
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        router.push('/admin/questions');
      } else {
        const errorData = await response.json();
        console.error('Error creating question:', errorData);
      }
    } catch (error) {
      console.error('Error creating question:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    setHasUnsavedChanges(true);
  };

  const insertMathExample = (latex: string) => {
    const mathBlock = `$$${latex}$$`;
    setStem(prev => prev + mathBlock + '\n\n');
    setHasUnsavedChanges(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Calculator className="h-6 w-6" />
                  Add Question with Rich Text Editor
                </h1>
                <p className="text-gray-600 mt-1">
                  Create JEE questions with advanced math equation support
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Question'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      value={subjectId}
                      onChange={(e) => {
                        setSubjectId(e.target.value);
                        setTopicId('');
                        setSubtopicId('');
                        setHasUnsavedChanges(true);
                      }}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.subject ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                    {errors.subject && (
                      <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Topic *
                    </label>
                    <select
                      value={topicId}
                      onChange={(e) => {
                        setTopicId(e.target.value);
                        setSubtopicId('');
                        setHasUnsavedChanges(true);
                      }}
                      disabled={!subjectId}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.topic ? 'border-red-300' : 'border-gray-300'
                      } ${!subjectId ? 'bg-gray-100' : ''}`}
                    >
                      <option value="">Select Topic</option>
                      {topics.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                        </option>
                      ))}
                    </select>
                    {errors.topic && (
                      <p className="mt-1 text-sm text-red-600">{errors.topic}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subtopic
                    </label>
                    <select
                      value={subtopicId}
                      onChange={(e) => {
                        setSubtopicId(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      disabled={!topicId}
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300 ${
                        !topicId ? 'bg-gray-100' : ''
                      }`}
                    >
                      <option value="">Select Subtopic (Optional)</option>
                      {subtopics.map((subtopic) => (
                        <option key={subtopic.id} value={subtopic.id}>
                          {subtopic.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => {
                        setDifficulty(e.target.value);
                        setHasUnsavedChanges(true);
                      }}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => {
                      setTags(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="calculus, derivatives, limits"
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Question Stem */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Question Stem *</h2>
                <RichTextEditor
                  value={stem}
                  onChange={(content) => {
                    setStem(content);
                    setHasUnsavedChanges(true);
                    if (errors.stem) {
                      setErrors(prev => ({ ...prev, stem: '' }));
                    }
                  }}
                  placeholder="Enter the question text with math equations..."
                  height={300}
                />
                {errors.stem && (
                  <p className="mt-2 text-sm text-red-600">{errors.stem}</p>
                )}
              </div>

              {/* Options */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Answer Options *</h2>
                <div className="space-y-4">
                  {options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="correctAnswer"
                          checked={correctAnswer === index}
                          onChange={() => {
                            setCorrectAnswer(index);
                            setHasUnsavedChanges(true);
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Option {String.fromCharCode(65 + index)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <RichTextEditor
                          value={option}
                          onChange={(content) => handleOptionChange(index, content)}
                          placeholder={`Enter option ${String.fromCharCode(65 + index)}...`}
                          height={120}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {errors.options && (
                  <p className="mt-2 text-sm text-red-600">{errors.options}</p>
                )}
              </div>

              {/* Explanation */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Explanation *</h2>
                <RichTextEditor
                  value={explanation}
                  onChange={(content) => {
                    setExplanation(content);
                    setHasUnsavedChanges(true);
                    if (errors.explanation) {
                      setErrors(prev => ({ ...prev, explanation: '' }));
                    }
                  }}
                  placeholder="Provide a detailed explanation with step-by-step solution..."
                  height={300}
                />
                {errors.explanation && (
                  <p className="mt-2 text-sm text-red-600">{errors.explanation}</p>
                )}
              </div>

              {/* Tips & Formulas */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tips & Formulas</h2>
                <RichTextEditor
                  value={tipFormula}
                  onChange={(content) => {
                    setTipFormula(content);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="Add helpful tips, formulas, or concepts related to this question..."
                  height={200}
                />
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Math Insert */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Quick Math Insert
              </h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Common Equations</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => insertMathExample('\\frac{d}{dx}(x^n) = nx^{n-1}')}
                      className="w-full text-left p-2 border border-gray-200 rounded hover:bg-gray-50 text-sm"
                    >
                      Power Rule: {"$\\frac{d}{dx}(x^n) = nx^{n-1}$"}
                    </button>
                    <button
                      onClick={() => insertMathExample('\\int x^n dx = \\frac{x^{n+1}}{n+1} + C')}
                      className="w-full text-left p-2 border border-gray-200 rounded hover:bg-gray-50 text-sm"
                    >
                      Integration: {"$\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$"}
                    </button>
                    <button
                      onClick={() => insertMathExample('x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}')}
                      className="w-full text-left p-2 border border-gray-200 rounded hover:bg-gray-50 text-sm"
                    >
                      Quadratic Formula: {"$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$"}
                    </button>
                    <button
                      onClick={() => insertMathExample('\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1')}
                      className="w-full text-left p-2 border border-gray-200 rounded hover:bg-gray-50 text-sm"
                    >
                      Limit: {"$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Question</h4>
                    <div 
                      className="prose max-w-none text-sm border border-gray-200 rounded p-3"
                      dangerouslySetInnerHTML={{ __html: stem }}
                    />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Explanation</h4>
                    <div 
                      className="prose max-w-none text-sm border border-gray-200 rounded p-3"
                      dangerouslySetInnerHTML={{ __html: explanation }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Form Status */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Form Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Question Stem:</span>
                  <span className={stem.trim() ? 'text-green-600' : 'text-red-600'}>
                    {stem.trim() ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Explanation:</span>
                  <span className={explanation.trim() ? 'text-green-600' : 'text-red-600'}>
                    {explanation.trim() ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Options:</span>
                  <span className={options.every(opt => opt.trim()) ? 'text-green-600' : 'text-red-600'}>
                    {options.every(opt => opt.trim()) ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Subject & Topic:</span>
                  <span className={subjectId && topicId ? 'text-green-600' : 'text-red-600'}>
                    {subjectId && topicId ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Unsaved Changes:</span>
                  <span className={hasUnsavedChanges ? 'text-orange-600' : 'text-green-600'}>
                    {hasUnsavedChanges ? '⚠' : '✓'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
