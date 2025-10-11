'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import api from '@/lib/api';

interface LMSContent {
  id: string;
  title: string;
  description?: string;
  contentType: string;
  status: string;
  accessType: string;
  stream?: { name: string; code: string };
  subject?: { name: string };
  topic?: { name: string };
  subtopic?: { name: string };
  difficulty?: string;
  duration?: number;
  tags: string[];
  views: number;
  completions: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    progress: number;
    children: number;
  };
}

interface LMSStats {
  totalContent: number;
  byType: { type: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byAccess: { access: string; count: number }[];
  totalViews: number;
  totalCompletions: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export default function LMSPage() {
  const router = useRouter();
  
  // Data states
  const [content, setContent] = useState<LMSContent[]>([]);
  const [stats, setStats] = useState<LMSStats>({
    totalContent: 0,
    byType: [],
    byStatus: [],
    byAccess: [],
    totalViews: 0,
    totalCompletions: 0
  });
  const [streams, setStreams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [subtopics, setSubtopics] = useState<any[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    contentType: '',
    status: '',
    accessType: '',
    streamId: '',
    subjectId: '',
    topicId: '',
    subtopicId: '',
    difficulty: '',
    page: 1,
    limit: 10
  });
  
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPreviousPage: false
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load content list
      const contentResponse = await api.get(`/admin/lms/content?${new URLSearchParams({
        ...filters,
        page: filters.page.toString(),
        limit: filters.limit.toString()
      })}`);
      const contentData = contentResponse.data;
      setContent(contentData.content || []);
      setPagination(contentData.pagination || pagination);
      
      // Load stats
      const statsResponse = await api.get('/admin/lms/stats');
      const statsData = statsResponse.data;
      setStats(statsData || {
        totalContent: 0,
        byType: [],
        byStatus: [],
        byAccess: [],
        totalViews: 0,
        totalCompletions: 0
      });
      
      // Load streams
      const streamsResponse = await api.get('/admin/lms/streams');
      const streamsData = streamsResponse.data;
      setStreams(Array.isArray(streamsData) ? streamsData : []);
      
      // Load subjects
      const subjectsResponse = await api.get('/admin/lms/subjects');
      const subjectsData = subjectsResponse.data;
      setSubjects(Array.isArray(subjectsData) ? subjectsData : []);
      
    } catch (error) {
      console.error('Error loading data:', error);
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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
    
    // Load related data
    if (key === 'streamId') {
      // Reset subject, topic, and subtopic when stream changes
      setFilters(prev => ({ ...prev, subjectId: '', topicId: '', subtopicId: '' }));
      setTopics([]);
      setSubtopics([]);
    } else if (key === 'subjectId') {
      loadTopics(value);
      setFilters(prev => ({ ...prev, topicId: '', subtopicId: '' }));
    } else if (key === 'topicId') {
      loadSubtopics(value);
      setFilters(prev => ({ ...prev, subtopicId: '' }));
    }
  };

  const handleBulkAction = async () => {
    if (selectedContent.length === 0 || !bulkAction) return;
    
    try {
      if (bulkAction === 'delete') {
        const response = await fetch('/api/admin/lms/content/bulk', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentIds: selectedContent })
        });
        
        if (response.ok) {
          setSelectedContent([]);
          setBulkAction('');
          loadData();
        }
      } else if (['DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED'].includes(bulkAction)) {
        const response = await fetch('/api/admin/lms/content/bulk/status', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contentIds: selectedContent, status: bulkAction })
        });
        
        if (response.ok) {
          setSelectedContent([]);
          setBulkAction('');
          loadData();
        }
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    
    try {
      const response = await fetch(`/api/admin/lms/content/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error deleting content:', error);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/lms/content/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error duplicating content:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/lms/content/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAccessTypeColor = (accessType: string) => {
    switch (accessType) {
      case 'FREE': return 'bg-green-100 text-green-800';
      case 'SUBSCRIPTION': return 'bg-blue-100 text-blue-800';
      case 'PREMIUM': return 'bg-purple-100 text-purple-800';
      case 'TRIAL': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HARD': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
              <h1 className="text-2xl font-bold text-gray-900">LMS Content Management</h1>
              <p className="text-gray-600 mt-1">Manage learning content and materials</p>
            </div>
            <button
              onClick={() => router.push('/admin/lms/add')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add Content
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Content</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalContent || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-green-100 text-green-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalViews || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completions</p>
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalCompletions || 0}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Published</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats?.byStatus?.find(s => s.status === 'PUBLISHED')?.count || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search content..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content Type</label>
                <select
                  value={filters.contentType}
                  onChange={(e) => handleFilterChange('contentType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  <option value="TEXT">Text</option>
                  <option value="VIDEO">Video</option>
                  <option value="AUDIO">Audio</option>
                  <option value="IMAGE">Image</option>
                  <option value="FILE">File</option>
                  <option value="URL">URL</option>
                  <option value="YOUTUBE">YouTube</option>
                  <option value="QUIZ">Quiz</option>
                  <option value="ASSIGNMENT">Assignment</option>
                  <option value="H5P">H5P</option>
                  <option value="SCORM">SCORM</option>
                  <option value="IFRAME">Iframe</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="SCHEDULED">Scheduled</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Type</label>
                <select
                  value={filters.accessType}
                  onChange={(e) => handleFilterChange('accessType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Access</option>
                  <option value="FREE">Free</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                  <option value="PREMIUM">Premium</option>
                  <option value="TRIAL">Trial</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
                <select
                  value={filters.streamId}
                  onChange={(e) => handleFilterChange('streamId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Streams</option>
                  {streams.map(stream => (
                    <option key={stream.id} value={stream.id}>
                      {stream.name} ({stream.code})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={filters.subjectId}
                  onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(subject => (
                    <option key={subject.id} value={subject.id}>{subject.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
                <select
                  value={filters.topicId}
                  onChange={(e) => handleFilterChange('topicId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!filters.subjectId}
                >
                  <option value="">All Topics</option>
                  {topics.map(topic => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtopic</label>
                <select
                  value={filters.subtopicId}
                  onChange={(e) => handleFilterChange('subtopicId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!filters.topicId}
                >
                  <option value="">All Subtopics</option>
                  {subtopics.map(subtopic => (
                    <option key={subtopic.id} value={subtopic.id}>{subtopic.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={filters.difficulty}
                  onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Difficulty</option>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedContent.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  {selectedContent.length} item(s) selected
                </span>
                <div className="flex items-center space-x-3">
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                    className="px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Action</option>
                    <option value="PUBLISHED">Publish</option>
                    <option value="DRAFT">Move to Draft</option>
                    <option value="ARCHIVED">Archive</option>
                    <option value="delete">Delete</option>
                  </select>
                  <button
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => setSelectedContent([])}
                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Content Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedContent.length === content.length && content.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContent(content.map(item => item.id));
                          } else {
                            setSelectedContent([]);
                          }
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Access
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Stream
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {content.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedContent.includes(item.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedContent(prev => [...prev, item.id]);
                            } else {
                              setSelectedContent(prev => prev.filter(id => id !== item.id));
                            }
                          }}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-48">
                          <div className="text-sm font-medium text-gray-900 truncate" title={item.title}>{item.title}</div>
                          {item.description && (
                            <div className="text-sm text-gray-500 truncate" title={item.description}>
                              {item.description}
                            </div>
                          )}
                          {item.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.tags.slice(0, 3).map((tag, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                  {tag}
                                </span>
                              ))}
                              {item.tags.length > 3 && (
                                <span className="text-xs text-gray-500">+{item.tags.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.contentType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.id, e.target.value)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border-0 ${getStatusColor(item.status)}`}
                        >
                          <option value="DRAFT">DRAFT</option>
                          <option value="PUBLISHED">PUBLISHED</option>
                          <option value="ARCHIVED">ARCHIVED</option>
                          <option value="SCHEDULED">SCHEDULED</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAccessTypeColor(item.accessType)}`}>
                          {item.accessType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.stream && (
                          <div className="max-w-24">
                            <div className="font-medium truncate" title={item.stream.name}>
                              {item.stream.code}
                            </div>
                            <div className="text-xs text-gray-500 truncate" title={item.stream.name}>
                              {item.stream.name.length > 15 ? item.stream.name.substring(0, 15) + '...' : item.stream.name}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="max-w-32">
                          {item.subject && <div className="truncate" title={item.subject.name}>{item.subject.name}</div>}
                          {item.topic && <div className="text-xs text-gray-500 truncate" title={item.topic.name}>{item.topic.name}</div>}
                          {item.subtopic && <div className="text-xs text-gray-500 truncate" title={item.subtopic.name}>{item.subtopic.name}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.difficulty && (
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(item.difficulty)}`}>
                            {item.difficulty}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>👁️ {item.views}</div>
                          <div>✅ {item.completions}</div>
                          <div>📊 {item._count.progress}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => router.push(`/admin/lms/edit/${item.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => router.push(`/admin/lms/analytics/${item.id}`)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Analytics
                          </button>
                          <button
                            onClick={() => handleDuplicate(item.id)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                {pagination.totalItems} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={!pagination.hasPreviousPage}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm font-medium text-gray-700">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={!pagination.hasNextPage}
                  className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
