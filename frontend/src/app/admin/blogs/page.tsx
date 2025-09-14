'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import Swal from 'sweetalert2';

interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';
  publishedAt: string | null;
  featuredImage: string | null;
  viewCount: number;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    fullName: string;
    email: string;
  };
  category: {
    id: string;
    name: string;
    color: string | null;
  };
  stream: {
    id: string;
    name: string;
    code: string;
  } | null;
  subject: {
    id: string;
    name: string;
  } | null;
  tags: string[];
  _count: {
    comments: number;
    likes: number;
    bookmarks: number;
  };
}

interface BlogStats {
  totalBlogs: number;
  publishedBlogs: number;
  draftBlogs: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
  _count: {
    blogs: number;
  };
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

export default function AdminBlogsPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [stats, setStats] = useState<BlogStats>({
    totalBlogs: 0,
    publishedBlogs: 0,
    draftBlogs: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: '',
    categoryId: '',
    streamId: '',
    subjectId: '',
    search: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    loadData();
    loadCategories();
    loadStreams();
    loadStats();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.toString().trim() !== '') {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.get(`/admin/blogs?${queryParams.toString()}`);
      
      setBlogs(response.data.blogs || []);
      setPagination(response.data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
      });
    } catch (error) {
      console.error('Error loading blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get('/admin/blogs/categories');
      setCategories(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStreams = async () => {
    try {
      const response = await api.get('/admin/lms/streams');
      setStreams(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error loading streams:', error);
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

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/blogs/stats');
      setStats(response.data || {
        totalBlogs: 0,
        publishedBlogs: 0,
        draftBlogs: 0,
        totalViews: 0,
        totalLikes: 0,
        totalComments: 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFilterChange = (field: string, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [field]: value, page: 1 };
      
      // Reset dependent filters
      if (field === 'streamId') {
        newFilters.subjectId = '';
        if (value) {
          loadSubjects(value);
        } else {
          setSubjects([]);
        }
      }
      
      return newFilters;
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this blog?')) {
      return;
    }

    try {
      await api.delete(`/admin/blogs/${id}`);
      loadData();
      loadStats();
      Swal.fire({
        icon: 'success',
        title: 'Success!',
        text: 'Blog deleted successfully.',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error deleting blog:', error);
      Swal.fire({
        icon: 'error',
        title: 'Delete Failed',
        text: 'Failed to delete blog'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'PUBLISHED':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'DRAFT':
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case 'ARCHIVED':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'SCHEDULED':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
              <p className="text-gray-600 mt-1">Manage blog posts and articles</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/admin/blogs/categories')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Manage Categories
              </button>
              <button
                onClick={() => router.push('/admin/blogs/add')}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Add New Blog
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-blue-600">{stats.totalBlogs}</div>
              <div className="text-sm text-gray-600">Total Blogs</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-green-600">{stats.publishedBlogs}</div>
              <div className="text-sm text-gray-600">Published</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-gray-600">{stats.draftBlogs}</div>
              <div className="text-sm text-gray-600">Drafts</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-purple-600">{stats.totalViews}</div>
              <div className="text-sm text-gray-600">Total Views</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-red-600">{stats.totalLikes}</div>
              <div className="text-sm text-gray-600">Total Likes</div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="text-2xl font-bold text-orange-600">{stats.totalComments}</div>
              <div className="text-sm text-gray-600">Total Comments</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search blogs..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                  <option value="SCHEDULED">Scheduled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={filters.categoryId}
                  onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name} ({category._count.blogs})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stream</label>
                <select
                  value={filters.streamId}
                  onChange={(e) => handleFilterChange('streamId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="">All Streams</option>
                  {streams.map((stream) => (
                    <option key={stream.id} value={stream.id}>
                      {stream.code} - {stream.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={filters.subjectId}
                  onChange={(e) => handleFilterChange('subjectId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  disabled={!filters.streamId}
                >
                  <option value="">All Subjects</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Items per page</label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value={10}>10 per page</option>
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Blogs Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Stream
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Views
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Likes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                          <span className="ml-2">Loading blogs...</span>
                        </div>
                      </td>
                    </tr>
                  ) : blogs.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                        No blogs found. <button onClick={() => router.push('/admin/blogs/add')} className="text-blue-600 hover:underline">Create your first blog</button>
                      </td>
                    </tr>
                  ) : (
                    blogs.map((blog) => (
                      <tr key={blog.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 max-w-48">
                          <div>
                            <div 
                              className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600" 
                              title={blog.title}
                              onClick={() => router.push(`/admin/blogs/edit/${blog.id}`)}
                            >
                              {truncateText(blog.title, 50)}
                            </div>
                            {blog.excerpt && (
                              <div className="text-sm text-gray-500 truncate" title={blog.excerpt}>
                                {truncateText(blog.excerpt, 60)}
                              </div>
                            )}
                            {blog.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {blog.tags.slice(0, 2).map((tag) => (
                                  <span key={tag} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                    {tag}
                                  </span>
                                ))}
                                {blog.tags.length > 2 && (
                                  <span className="text-xs text-gray-500">+{blog.tags.length - 2} more</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-24">
                          <span className={getStatusBadge(blog.status)}>
                            {blog.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-32">
                          <div className="flex items-center">
                            {blog.category.color && (
                              <div 
                                className="w-3 h-3 rounded-full mr-2" 
                                style={{ backgroundColor: blog.category.color }}
                              ></div>
                            )}
                            <span className="text-sm text-gray-900 truncate" title={blog.category.name}>
                              {truncateText(blog.category.name, 20)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-24">
                          {blog.stream ? (
                            <span className="text-sm text-gray-900" title={blog.stream.name}>
                              {blog.stream.code}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 max-w-32">
                          <div className="text-sm text-gray-900 truncate" title={blog.author.fullName}>
                            {truncateText(blog.author.fullName, 20)}
                          </div>
                          <div className="text-sm text-gray-500 truncate" title={blog.author.email}>
                            {truncateText(blog.author.email, 25)}
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-20">
                          <span className="text-sm text-gray-900">{blog.viewCount}</span>
                        </td>
                        <td className="px-6 py-4 max-w-20">
                          <span className="text-sm text-gray-900">{blog.likeCount}</span>
                        </td>
                        <td className="px-6 py-4 max-w-24">
                          <span className="text-sm text-gray-900">
                            {formatDate(blog.createdAt)}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-32">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push(`/admin/blogs/edit/${blog.id}`)}
                              className="text-blue-600 hover:text-blue-900 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(blog.id)}
                              className="text-red-600 hover:text-red-900 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => handleFilterChange('page', Math.max(1, pagination.page - 1))}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handleFilterChange('page', Math.min(pagination.pages, pagination.page + 1))}
                    disabled={pagination.page >= pagination.pages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(pagination.page * pagination.limit, pagination.total)}
                      </span>{' '}
                      of <span className="font-medium">{pagination.total}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => handleFilterChange('page', Math.max(1, pagination.page - 1))}
                        disabled={pagination.page <= 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {[...Array(Math.min(pagination.pages, 10))].map((_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => handleFilterChange('page', page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === pagination.page
                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handleFilterChange('page', Math.min(pagination.pages, pagination.page + 1))}
                        disabled={pagination.page >= pagination.pages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

