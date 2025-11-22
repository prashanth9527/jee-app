'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Calendar, User, ArrowRight, BookOpen, TrendingUp, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import HeaderHome from '@/components/HeaderHome';
import Footer from '@/components/Footer';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import api from '@/lib/api';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImage?: string;
  publishedAt: string;
  content: string;
  author: {
    id: string;
    fullName: string;
    email: string;
    profilePicture?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  _count: {
    comments: number;
    likes: number;
    bookmarks: number;
  };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function BlogsPageContent() {
  const { systemSettings } = useSystemSettings();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
  });
  
  const limit = 9; // Fixed limit for pagination

  // Calculate read time from content (average reading speed: 200 words per minute)
  const calculateReadTime = (content: string): string => {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/blogs/categories');
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch blogs
  const fetchBlogs = async (page: number = 1, categoryId?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      if (categoryId && categoryId !== 'All') {
        params.append('categoryId', categoryId);
      }

      const response = await api.get(`/blogs?${params.toString()}`);
      const data = response.data;
      
      setBlogs(data.blogs || []);
      setPagination(data.pagination || {
        page: 1,
        limit: limit,
        total: 0,
        totalPages: 0,
      });
    } catch (error) {
      console.error('Error fetching blogs:', error);
      setBlogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    
    // Initialize selected category and page from URL
    const categoryParam = searchParams?.get('categoryId');
    const pageParam = parseInt(searchParams?.get('page') || '1');
    
    if (categoryParam) {
      setSelectedCategory(categoryParam);
      fetchBlogs(pageParam, categoryParam);
    } else {
      fetchBlogs(pageParam);
    }
  }, []);

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    // Reset to page 1 when category changes
    const params = new URLSearchParams();
    if (categoryId !== 'All') {
      params.append('categoryId', categoryId);
    }
    params.append('page', '1');
    router.push(`/blogs?${params.toString()}`);
    fetchBlogs(1, categoryId === 'All' ? undefined : categoryId);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'All') {
      params.append('categoryId', selectedCategory);
    }
    params.append('page', newPage.toString());
    router.push(`/blogs?${params.toString()}`);
    fetchBlogs(newPage, selectedCategory === 'All' ? undefined : selectedCategory);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <HeaderHome systemSettings={systemSettings || undefined} />
        <main className="pt-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading blogs...</p>
            </div>
          </div>
        </main>
        <Footer systemSettings={systemSettings || undefined} />
      </div>
    );
  }

  const featuredBlog = blogs.length > 0 ? blogs[0] : null;
  const otherBlogs = blogs.slice(1);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HeaderHome systemSettings={systemSettings || undefined} />
      <main className="pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">JEE Preparation Blog</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Expert insights, study tips, and strategies to help you excel in your JEE preparation journey.
            </p>
          </div>

          {/* Login Prompt */}
          <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">Want to Read Full Articles?</h3>
                <p className="text-blue-800 dark:text-blue-200">
                  Sign in to access complete articles, save your favorites, and get personalized recommendations.
                </p>
              </div>
              <Link
                href="/login"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange('All')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === 'All'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                }`}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryChange(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Blog */}
          {featuredBlog && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Featured Article</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    {featuredBlog.featuredImage ? (
                      <img 
                        src={featuredBlog.featuredImage} 
                        alt={featuredBlog.title}
                        className="w-full h-64 md:h-full object-cover"
                      />
                    ) : (
                      <div className="h-64 md:h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="md:w-1/2 p-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">
                        {featuredBlog.category.name}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      {featuredBlog.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {featuredBlog.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{featuredBlog.author.fullName}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(featuredBlog.publishedAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{calculateReadTime(featuredBlog.content)}</span>
                      </div>
                    </div>
                    <Link
                      href={`/blogs/${featuredBlog.slug}`}
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Read More
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Blog Grid */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Latest Articles</h2>
            {otherBlogs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {otherBlogs.map((blog) => (
                    <div key={blog.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                      {blog.featuredImage ? (
                        <img 
                          src={blog.featuredImage} 
                          alt={blog.title}
                          className="w-full h-48 object-cover"
                        />
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                          <BookOpen className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">
                            {blog.category.name}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                          {blog.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                          {blog.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                          <div className="flex items-center space-x-1">
                            <User className="w-3 h-3" />
                            <span>{blog.author.fullName}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{blog._count.likes} likes</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>{formatDate(blog.publishedAt)}</span>
                          </div>
                          <Link
                            href={`/blogs/${blog.slug}`}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Read More →
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`px-4 py-2 rounded-lg border ${
                        pagination.page === 1
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => {
                      // Show first page, last page, current page, and pages around current
                      if (
                        pageNum === 1 ||
                        pageNum === pagination.totalPages ||
                        (pageNum >= pagination.page - 1 && pageNum <= pagination.page + 1)
                      ) {
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-4 py-2 rounded-lg border ${
                              pagination.page === pageNum
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      } else if (
                        pageNum === pagination.page - 2 ||
                        pageNum === pagination.page + 2
                      ) {
                        return (
                          <span key={pageNum} className="px-2 text-gray-500 dark:text-gray-400">
                            ...
                          </span>
                        );
                      }
                      return null;
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                      className={`px-4 py-2 rounded-lg border ${
                        pagination.page === pagination.totalPages
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 border-gray-200 dark:border-gray-700 cursor-not-allowed'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">No blogs found in this category.</p>
              </div>
            )}
          </div>

          {/* Newsletter Signup */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Stay Updated</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Get the latest JEE preparation tips and strategies delivered to your inbox.
            </p>
            <div className="max-w-md mx-auto flex space-x-2">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer systemSettings={systemSettings || undefined} />
    </div>
  );
}

function BlogsPageLoading() {
  const { systemSettings } = useSystemSettings();
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HeaderHome systemSettings={systemSettings || undefined} />
      <main className="pt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading blogs...</p>
          </div>
        </div>
      </main>
      <Footer systemSettings={systemSettings || undefined} />
    </div>
  );
}

export default function BlogsPage() {
  return (
    <Suspense fallback={<BlogsPageLoading />}>
      <BlogsPageContent />
    </Suspense>
  );
}