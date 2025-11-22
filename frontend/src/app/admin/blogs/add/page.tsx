'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import RichTextEditor from '@/components/RichTextEditor';
import api from '@/lib/api';
import Swal from 'sweetalert2';

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface Stream {
  id: string;
  name: string;
  code: string;
}

interface Subject {
  id: string;
  name: string;
}

interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  categoryId: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string[];
  featuredImage: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
  streamId: string;
  subjectId: string;
}

export default function AddBlogPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    excerpt: '',
    content: '',
    categoryId: '',
    tags: [],
    metaTitle: '',
    metaDescription: '',
    metaKeywords: [],
    featuredImage: '',
    status: 'DRAFT',
    streamId: '',
    subjectId: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [categoriesResponse, streamsResponse] = await Promise.all([
        api.get('/admin/blogs/categories'),
        api.get('/admin/lms/streams'),
      ]);

      setCategories(Array.isArray(categoriesResponse.data) ? categoriesResponse.data : []);
      setStreams(Array.isArray(streamsResponse.data) ? streamsResponse.data : []);
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Set empty arrays to prevent loading state
      setCategories([]);
      setStreams([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async (streamId: string) => {
    if (!streamId) {
      setSubjects([]);
      return;
    }
    
    try {
      const response = await api.get('/admin/lms/subjects');
      const allSubjects = Array.isArray(response.data) ? response.data : [];
      const filteredSubjects = allSubjects.filter((subject: any) => subject.streamId === streamId);
      setSubjects(filteredSubjects);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Load related data
    if (field === 'streamId') {
      loadSubjects(value);
      setFormData(prev => ({ ...prev, subjectId: '' }));
    }
  };

  const handleTagAdd = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeywordAdd = () => {
    const keyword = tagInput.trim();
    if (keyword && !formData.metaKeywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        metaKeywords: [...prev.metaKeywords, keyword]
      }));
      setTagInput('');
    }
  };

  const handleKeywordRemove = (keywordToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      metaKeywords: prev.metaKeywords.filter(keyword => keyword !== keywordToRemove)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please upload a JPEG, PNG, GIF, or WebP image.'
      });
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Image size must be less than 5MB.'
      });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload image
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/admin/blogs/upload-image', formData);

      if (response.data.url) {
        handleInputChange('featuredImage', response.data.url);
        Swal.fire({
          icon: 'success',
          title: 'Image Uploaded',
          text: 'Image uploaded successfully!',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: error.response?.data?.message || 'Failed to upload image. Please try again.'
      });
      setImagePreview('');
    } finally {
      setUploadingImage(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleImageUrlChange = (url: string) => {
    handleInputChange('featuredImage', url);
    setImagePreview(url);
  };

  const removeImage = () => {
    handleInputChange('featuredImage', '');
    setImagePreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Title',
        text: 'Please enter a title for the blog post.'
      });
      return;
    }

    if (!formData.categoryId) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Category',
        text: 'Please select a category for the blog post.'
      });
      return;
    }

    if (!formData.content.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Content',
        text: 'Please enter content for the blog post.'
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await api.post('/admin/blogs', formData);
      
      if (response.data) {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Blog post created successfully.',
          timer: 2000,
          showConfirmButton: false
        }).then(() => {
          router.push('/admin/blogs');
        });
      }
    } catch (error: any) {
      console.error('Error creating blog:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error creating blog';
      Swal.fire({
        icon: 'error',
        title: 'Creation Failed',
        text: errorMessage
      });
    } finally {
      setSubmitting(false);
    }
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

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Add New Blog Post</h1>
              <p className="text-gray-600 mt-1">Create a new blog post or article</p>
            </div>
            <button
              onClick={() => router.back()}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Back
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter blog title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Excerpt
                    </label>
                    <textarea
                      value={formData.excerpt}
                      onChange={(e) => handleInputChange('excerpt', e.target.value)}
                      placeholder="Brief description of the blog post"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content *
                    </label>
                    <RichTextEditor
                      value={formData.content}
                      onChange={(content) => handleInputChange('content', content)}
                      placeholder="Write your blog content here..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Featured Image
                    </label>
                    
                    {/* Image Preview */}
                    {imagePreview && (
                      <div className="mb-3 relative">
                        <img
                          src={imagePreview}
                          alt="Featured image preview"
                          className="w-full h-48 object-cover rounded-md border border-gray-300 dark:border-gray-600"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded-md hover:bg-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {/* Upload Image Button */}
                    <div className="mb-3">
                      <label className="block">
                        <span className="sr-only">Choose image file</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleImageUpload}
                          disabled={uploadingImage}
                          className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 dark:file:bg-blue-900/20 file:text-blue-700 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      </label>
                      {uploadingImage && (
                        <p className="mt-1 text-sm text-blue-600 dark:text-blue-400">Uploading image...</p>
                      )}
                    </div>

                    {/* Or use URL */}
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or enter URL</span>
                      </div>
                    </div>

                    <input
                      type="url"
                      value={formData.featuredImage}
                      onChange={(e) => handleImageUrlChange(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                      className="mt-3 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                  {/* Publishing */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Publishing</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status *
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="PUBLISHED">Published</option>
                          <option value="ARCHIVED">Archived</option>
                          <option value="SCHEDULED">Scheduled</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Category *
                        </label>
                        <select
                          value={formData.categoryId}
                          onChange={(e) => handleInputChange('categoryId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Organization */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Organization</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Stream
                        </label>
                        <select
                          value={formData.streamId}
                          onChange={(e) => handleInputChange('streamId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Select a stream</option>
                          {streams.map((stream) => (
                            <option key={stream.id} value={stream.id}>
                              {stream.code} - {stream.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subject
                        </label>
                        <select
                          value={formData.subjectId}
                          onChange={(e) => handleInputChange('subjectId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          disabled={!formData.streamId}
                        >
                          <option value="">Select a subject</option>
                          {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                    
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                          placeholder="Enter tag"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <button
                          type="button"
                          onClick={handleTagAdd}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          Add
                        </button>
                      </div>
                      
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {formData.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => handleTagRemove(tag)}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SEO */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">SEO Settings</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Meta Title
                        </label>
                        <input
                          type="text"
                          value={formData.metaTitle}
                          onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                          placeholder="SEO title (optional)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Meta Description
                        </label>
                        <textarea
                          value={formData.metaDescription}
                          onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                          placeholder="SEO description (optional)"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Meta Keywords
                        </label>
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleKeywordAdd())}
                            placeholder="Enter keyword"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                          <button
                            type="button"
                            onClick={handleKeywordAdd}
                            className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                          >
                            Add
                          </button>
                        </div>
                        
                        {formData.metaKeywords.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.metaKeywords.map((keyword) => (
                              <span
                                key={keyword}
                                className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md"
                              >
                                {keyword}
                                <button
                                  type="button"
                                  onClick={() => handleKeywordRemove(keyword)}
                                  className="ml-1 text-green-600 hover:text-green-800"
                                >
                                  ×
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Blog Post'}
              </button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
