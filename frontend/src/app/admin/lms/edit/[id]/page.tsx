'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';
import LatexRichTextEditor from '@/components/LatexRichTextEditor';

interface Subject {
  id: string;
  name: string;
  stream: {
    id: string;
    name: string;
    code: string;
  };
}

interface Topic {
  id: string;
  name: string;
  description: string;
}

interface Subtopic {
  id: string;
  name: string;
  description: string;
}

interface ContentFormData {
  title: string;
  description: string;
  contentType: string;
  status: string;
  accessType: string;
  streamId: string;
  subjectId: string;
  topicId: string;
  subtopicId: string;
  difficulty: string;
  duration: number;
  tags: string[];
  isDripContent: boolean;
  dripDelay: number;
  dripDate: string;
  
  // Content-specific fields
  contentData: any;
  fileUrl: string;
  externalUrl: string;
  iframeCode: string;
  youtubeId: string;
  youtubeUrl: string;
  h5pContent: any;
  scormData: any;
  parentId: string;
  order: number;
}

export default function LMSEditPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params?.id as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [streams, setStreams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [parentContent, setParentContent] = useState<any[]>([]);
  
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    contentType: 'TEXT',
    status: 'DRAFT',
    accessType: 'FREE',
    streamId: '',
    subjectId: '',
    topicId: '',
    subtopicId: '',
    difficulty: 'MEDIUM',
    duration: 0,
    tags: [],
    isDripContent: false,
    dripDelay: 0,
    dripDate: '',
    contentData: null,
    fileUrl: '',
    externalUrl: '',
    iframeCode: '',
    youtubeId: '',
    youtubeUrl: '',
    h5pContent: null,
    scormData: null,
    parentId: '',
    order: 0
  });

  const [tagInput, setTagInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (contentId) {
      loadContentData();
    }
  }, [contentId]);

  const loadContentData = async () => {
    try {
      setLoading(true);
      
      // Load content details
      const contentResponse = await api.get(`/admin/lms/content/${contentId}`);
      const contentData = contentResponse.data;
      
      if (contentData) {
        setFormData({
          title: contentData.title || '',
          description: contentData.description || '',
          contentType: contentData.contentType || 'TEXT',
          status: contentData.status || 'DRAFT',
          accessType: contentData.accessType || 'FREE',
          streamId: contentData.streamId || '',
          subjectId: contentData.subjectId || '',
          topicId: contentData.topicId || '',
          subtopicId: contentData.subtopicId || '',
          difficulty: contentData.difficulty || 'MEDIUM',
          duration: contentData.duration || 0,
          tags: contentData.tags || [],
          isDripContent: contentData.isDripContent || false,
          dripDelay: contentData.dripDelay || 0,
          dripDate: contentData.dripDate ? new Date(contentData.dripDate).toISOString().slice(0, 16) : '',
          contentData: contentData.contentData,
          fileUrl: contentData.fileUrl || '',
          externalUrl: contentData.externalUrl || '',
          iframeCode: contentData.iframeCode || '',
          youtubeId: contentData.youtubeId || '',
          youtubeUrl: contentData.youtubeUrl || '',
          h5pContent: contentData.h5pContent,
          scormData: contentData.scormData,
          parentId: contentData.parentId || '',
          order: contentData.order || 0
        });
        
        // Load related data based on content
        if (contentData.subjectId) {
          await loadTopics(contentData.subjectId);
        }
        if (contentData.topicId) {
          await loadSubtopics(contentData.topicId);
        }
      }
      
      // Load streams
      const streamsResponse = await api.get('/admin/lms/streams');
      const streamsData = streamsResponse.data;
      setStreams(Array.isArray(streamsData) ? streamsData : []);
      
      // Load subjects
      const subjectsResponse = await api.get('/admin/lms/subjects');
      const subjectsData = subjectsResponse.data;
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      
      // Load parent content for hierarchy
      const parentResponse = await api.get('/admin/lms/content?limit=100');
      const parentData = parentResponse.data;
      setParentContent(parentData.content?.filter((c: any) => c.id !== contentId) || []);
      
    } catch (error) {
      console.error('Error loading content data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTopics = async (subjectId: string) => {
    if (!subjectId) {
      setTopics([]);
      setSubtopics([]);
      return;
    }
    
    try {
      const response = await api.get(`/admin/lms/subjects/${subjectId}/topics`);
      const data = response.data;
      setTopics(Array.isArray(data) ? data : []);
      setSubtopics([]);
    } catch (error) {
      console.error('Error loading topics:', error);
    }
  };

  const loadSubtopics = async (topicId: string) => {
    if (!topicId) {
      setSubtopics([]);
      return;
    }
    
    try {
      const response = await api.get(`/admin/lms/topics/${topicId}/subtopics`);
      const data = response.data;
      setSubtopics(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading subtopics:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Load related data
    if (field === 'streamId') {
      // Reset subject, topic, and subtopic when stream changes
      setFormData(prev => ({ ...prev, subjectId: '', topicId: '', subtopicId: '' }));
      setTopics([]);
      setSubtopics([]);
    } else if (field === 'subjectId') {
      loadTopics(value);
      setFormData(prev => ({ ...prev, topicId: '', subtopicId: '' }));
    } else if (field === 'topicId') {
      loadSubtopics(value);
      setFormData(prev => ({ ...prev, subtopicId: '' }));
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

  const handleFileUpload = async (file: File) => {
    try {
      setUploadProgress(0);
      
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      const response = await api.post('/admin/lms/upload', uploadFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data) {
        setFormData(prev => ({
          ...prev,
          fileUrl: response.data.url
        }));
        setUploadedFile(file);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await api.put(`/admin/lms/content/${contentId}`, formData);
      
      if (response.data) {
        router.push('/admin/lms');
      }
    } catch (error: any) {
      console.error('Error updating content:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error updating content';
      alert(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const renderContentTypeFields = () => {
    switch (formData.contentType) {
      case 'TEXT':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <LatexRichTextEditor
                value={formData.contentData || ''}
                onChange={(content) => handleInputChange('contentData', content)}
                placeholder="Enter your content here..."
                height={300}
                className="border border-gray-300 rounded-md"
              />
            </div>
          </div>
        );
        
      case 'FILE':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload File
              </label>
              {formData.fileUrl && (
                <div className="mb-2 text-sm text-green-600">
                  ✅ Current file: {formData.fileUrl.split('/').pop()}
                </div>
              )}
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.html,.jpg,.jpeg,.png,.gif,.webp,.mp4,.avi,.mov,.wmv,.mp3,.wav,.zip"
              />
              {uploadedFile && (
                <div className="mt-2 text-sm text-green-600">
                  ✅ New file uploaded: {uploadedFile.name}
                </div>
              )}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">{uploadProgress}% uploaded</div>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'URL':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                External URL
              </label>
              <input
                type="url"
                value={formData.externalUrl}
                onChange={(e) => handleInputChange('externalUrl', e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
        
      case 'IFRAME':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Iframe Embed Code
              </label>
              <textarea
                value={formData.iframeCode}
                onChange={(e) => handleInputChange('iframeCode', e.target.value)}
                placeholder="<iframe src='...' width='100%' height='400'></iframe>"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );
        
      case 'YOUTUBE':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube URL
              </label>
              <input
                type="url"
                value={formData.youtubeUrl}
                onChange={(e) => {
                  const url = e.target.value;
                  handleInputChange('youtubeUrl', url);
                  
                  // Extract YouTube video ID
                  const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
                  if (videoIdMatch) {
                    handleInputChange('youtubeId', videoIdMatch[1]);
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=VIDEO_ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {formData.youtubeId && (
              <div className="mt-2">
                <div className="text-sm text-gray-600 mb-2">Preview:</div>
                <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${formData.youtubeId}`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="rounded-lg"
                  ></iframe>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'QUIZ':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Questions (JSON Format)
              </label>
              <textarea
                value={formData.contentData ? JSON.stringify(formData.contentData, null, 2) : ''}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    handleInputChange('contentData', parsed);
                  } catch (error) {
                    // Invalid JSON, store as string for now
                    handleInputChange('contentData', e.target.value);
                  }
                }}
                placeholder='[{"question": "What is...?", "options": ["A", "B", "C", "D"], "correct": 0}]'
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </div>
        );
        
      case 'ASSIGNMENT':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assignment Instructions
              </label>
              <LatexRichTextEditor
                value={formData.contentData || ''}
                onChange={(content) => handleInputChange('contentData', content)}
                placeholder="Enter assignment instructions..."
                height={300}
                className="border border-gray-300 rounded-md"
              />
            </div>
          </div>
        );
        
      default:
        return (
          <div className="text-gray-500 text-center py-8">
            Select a content type to configure specific options.
          </div>
        );
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
              <h1 className="text-2xl font-bold text-gray-900">Edit LMS Content</h1>
              <p className="text-gray-600 mt-1">Update learning content</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter content title"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Enter content description"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content Type *
                    </label>
                    <select
                      value={formData.contentType}
                      onChange={(e) => handleInputChange('contentType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="TEXT">Text Content</option>
                      <option value="VIDEO">Video File</option>
                      <option value="AUDIO">Audio File</option>
                      <option value="IMAGE">Image File</option>
                      <option value="FILE">Document/File</option>
                      <option value="URL">External URL</option>
                      <option value="YOUTUBE">YouTube Video</option>
                      <option value="IFRAME">Iframe Embed</option>
                      <option value="QUIZ">Interactive Quiz</option>
                      <option value="ASSIGNMENT">Assignment</option>
                      <option value="H5P">H5P Content</option>
                      <option value="SCORM">SCORM Package</option>
                    </select>
                  </div>
                  
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
                      Access Type *
                    </label>
                    <select
                      value={formData.accessType}
                      onChange={(e) => handleInputChange('accessType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="FREE">Free</option>
                      <option value="SUBSCRIPTION">Subscription Required</option>
                      <option value="PREMIUM">Premium Only</option>
                      <option value="TRIAL">Trial Access</option>
                    </select>
                  </div>
                </div>
                
                {/* Organization & Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Organization & Settings</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stream
                    </label>
                    <select
                      value={formData.streamId}
                      onChange={(e) => handleInputChange('streamId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Stream</option>
                      {streams.map(stream => (
                        <option key={stream.id} value={stream.id}>
                          {stream.name} ({stream.code})
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Topic
                    </label>
                    <select
                      value={formData.topicId}
                      onChange={(e) => handleInputChange('topicId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!formData.subjectId}
                    >
                      <option value="">Select Topic</option>
                      {topics.map(topic => (
                        <option key={topic.id} value={topic.id}>{topic.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subtopic
                    </label>
                    <select
                      value={formData.subtopicId}
                      onChange={(e) => handleInputChange('subtopicId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={!formData.topicId}
                    >
                      <option value="">Select Subtopic</option>
                      {subtopics.map(subtopic => (
                        <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Difficulty
                    </label>
                    <select
                      value={formData.difficulty}
                      onChange={(e) => handleInputChange('difficulty', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="EASY">Easy</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HARD">Hard</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parent Content
                    </label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => handleInputChange('parentId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No Parent (Root Level)</option>
                      {parentContent.map(content => (
                        <option key={content.id} value={content.id}>{content.title}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order
                    </label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => handleInputChange('order', parseInt(e.target.value) || 0)}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Tags */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleTagRemove(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Enter tag"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleTagAdd();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleTagAdd}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add Tag
                  </button>
                </div>
              </div>
              
              {/* Drip Content Settings */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Drip Content Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isDripContent"
                      checked={formData.isDripContent}
                      onChange={(e) => handleInputChange('isDripContent', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="isDripContent" className="ml-2 block text-sm text-gray-900">
                      Enable drip content (gradual release)
                    </label>
                  </div>
                  
                  {formData.isDripContent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Drip Delay (days)
                        </label>
                        <input
                          type="number"
                          value={formData.dripDelay}
                          onChange={(e) => handleInputChange('dripDelay', parseInt(e.target.value) || 0)}
                          min="0"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Drip Date
                        </label>
                        <input
                          type="datetime-local"
                          value={formData.dripDate}
                          onChange={(e) => handleInputChange('dripDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Content Type Specific Fields */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Content Configuration</h3>
              {renderContentTypeFields()}
            </div>
            
            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-4">
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
                {submitting ? 'Updating...' : 'Update Content'}
              </button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
