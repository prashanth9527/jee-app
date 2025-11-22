'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Stream {
  id: string;
  name: string;
  code: string;
}

export default function GenerateBlogPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatedTitles, setGeneratedTitles] = useState<string[]>([]);
  const [selectedTitle, setSelectedTitle] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    topic: '',
    streamId: '',
    categoryId: '',
    keywords: '',
    generationType: 'news', // 'news', 'topic', 'keywords'
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [categoriesRes, streamsRes] = await Promise.all([
        api.get('/admin/blogs/categories'),
        api.get('/admin/lms/streams'),
      ]);

      setCategories(categoriesRes.data || []);
      setStreams(streamsRes.data || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear errors
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.topic.trim()) {
      newErrors.topic = 'Topic is required';
    }

    if (formData.generationType === 'keywords' && !formData.keywords.trim()) {
      newErrors.keywords = 'Keywords are required for keyword-based generation';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateTitles = async () => {
    if (!formData.topic.trim()) {
      setErrors({ topic: 'Topic is required to generate titles' });
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/admin/blogs/generate/titles', {
        topic: formData.topic,
        streamId: formData.streamId || undefined,
      });

      setGeneratedTitles(response.data || []);
    } catch (error) {
      console.error('Error generating titles:', error);
      alert('Failed to generate titles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateBlog = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      let endpoint = '';
      let payload: any = {
        topic: formData.topic,
        streamId: formData.streamId || undefined,
        categoryId: formData.categoryId || undefined,
      };

      switch (formData.generationType) {
        case 'news':
          endpoint = '/admin/blogs/generate/from-news';
          break;
        case 'topic':
          endpoint = '/admin/blogs/generate/from-topic';
          break;
        case 'keywords':
          endpoint = '/admin/blogs/generate/from-keywords';
          payload.keywords = formData.keywords.split(',').map((k: string) => k.trim()).filter(Boolean);
          break;
        default:
          throw new Error('Invalid generation type');
      }

      const response = await api.post(endpoint, payload);
      const generatedBlog = response.data;

      // Redirect to edit the generated blog
      router.push(`/admin/blogs/edit/${generatedBlog.id}`);
    } catch (error) {
      console.error('Error generating blog:', error);
      alert('Failed to generate blog. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            AI Blog Generator
          </h1>
          <p className="text-gray-600">
            Generate high-quality educational blog content using AI based on current news, topics, or keywords.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Generation Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Blog Generation Settings
            </h2>

            <form className="space-y-6">
              {/* Topic */}
              <div>
                <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-2">
                  Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="topic"
                  name="topic"
                  value={formData.topic}
                  onChange={handleInputChange}
                  placeholder="e.g., JEE Main 2024 Preparation, NEET Physics Tips"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.topic ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.topic && (
                  <p className="mt-1 text-sm text-red-600">{errors.topic}</p>
                )}
              </div>

              {/* Generation Type */}
              <div>
                <label htmlFor="generationType" className="block text-sm font-medium text-gray-700 mb-2">
                  Generation Type
                </label>
                <select
                  id="generationType"
                  name="generationType"
                  value={formData.generationType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 relative z-10 bg-white"
                >
                  <option value="news">From Current News</option>
                  <option value="topic">From Topic</option>
                  <option value="keywords">From Keywords</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  {formData.generationType === 'news' && 'Generate content based on current news and trends'}
                  {formData.generationType === 'topic' && 'Generate comprehensive content about the topic'}
                  {formData.generationType === 'keywords' && 'Generate content optimized for specific keywords'}
                </p>
              </div>

              {/* Keywords (for keyword generation) */}
              {formData.generationType === 'keywords' && (
                <div>
                  <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
                    Keywords <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="keywords"
                    name="keywords"
                    value={formData.keywords}
                    onChange={handleInputChange}
                    placeholder="Enter keywords separated by commas (e.g., JEE Main, Mathematics, Algebra, Preparation)"
                    rows={3}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.keywords ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.keywords && (
                    <p className="mt-1 text-sm text-red-600">{errors.keywords}</p>
                  )}
                </div>
              )}

              {/* Stream */}
              <div>
                <label htmlFor="streamId" className="block text-sm font-medium text-gray-700 mb-2">
                  Stream
                </label>
                <select
                  id="streamId"
                  name="streamId"
                  value={formData.streamId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 relative z-10 bg-white"
                >
                  <option value="">Select Stream (Optional)</option>
                  {streams.map((stream) => (
                    <option key={stream.id} value={stream.id}>
                      {stream.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category */}
              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 relative z-10 bg-white"
                >
                  <option value="">Select Category (Optional)</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={generateTitles}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Generating...' : 'Generate Titles'}
                </button>
                <button
                  type="button"
                  onClick={generateBlog}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Generating...' : 'Generate Blog'}
                </button>
              </div>
            </form>
          </div>

          {/* Generated Titles */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Generated Titles
            </h2>

            {generatedTitles.length > 0 ? (
              <div className="space-y-3">
                {generatedTitles.map((title, index) => (
                  <div
                    key={index}
                    className={`p-3 border rounded-md cursor-pointer transition-colors ${
                      selectedTitle === title
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onClick={() => setSelectedTitle(title)}
                  >
                    <h3 className="font-medium text-gray-900">{title}</h3>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600">
                  Click "Generate Titles" to see AI-generated blog titles for your topic.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI Features Info */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            AI Blog Generation Features
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium text-blue-900">Current News</h4>
                <p className="text-sm text-blue-700">
                  Generate content based on the latest news and trends relevant to your topic.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium text-blue-900">Comprehensive Content</h4>
                <p className="text-sm text-blue-700">
                  Create detailed, well-structured educational content with practical tips and insights.
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium text-blue-900">SEO Optimized</h4>
                <p className="text-sm text-blue-700">
                  Automatically generate SEO-friendly titles, meta descriptions, and keyword-optimized content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}