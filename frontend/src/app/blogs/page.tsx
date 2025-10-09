'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, User, ArrowRight, BookOpen, TrendingUp, Clock } from 'lucide-react';
import HeaderHome from '@/components/HeaderHome';
import Footer from '@/components/Footer';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  publishedAt: string;
  readTime: string;
  category: string;
  image: string;
  views: number;
}

export default function BlogsPage() {
  const { systemSettings } = useSystemSettings();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data - in real app, fetch from API
    const mockBlogs: BlogPost[] = [
      {
        id: '1',
        title: 'JEE Main 2024: Complete Preparation Strategy',
        excerpt: 'Learn the most effective strategies to crack JEE Main 2024 with our comprehensive guide covering all subjects and time management tips.',
        author: 'Dr. Rajesh Kumar',
        publishedAt: '2024-01-15',
        readTime: '8 min read',
        category: 'Preparation',
        image: '/api/placeholder/400/200',
        views: 1250
      },
      {
        id: '2',
        title: 'Physics: Mastering Mechanics for JEE',
        excerpt: 'Essential concepts and problem-solving techniques for mechanics that every JEE aspirant must know.',
        author: 'Prof. Sunita Sharma',
        publishedAt: '2024-01-12',
        readTime: '6 min read',
        category: 'Physics',
        image: '/api/placeholder/400/200',
        views: 980
      },
      {
        id: '3',
        title: 'Chemistry: Organic Reactions Made Easy',
        excerpt: 'Simplify complex organic chemistry reactions with our step-by-step approach and memory techniques.',
        author: 'Dr. Amit Patel',
        publishedAt: '2024-01-10',
        readTime: '10 min read',
        category: 'Chemistry',
        image: '/api/placeholder/400/200',
        views: 1100
      },
      {
        id: '4',
        title: 'Mathematics: Calculus Shortcuts for JEE',
        excerpt: 'Time-saving techniques and shortcuts for calculus problems that frequently appear in JEE exams.',
        author: 'Prof. Vikram Singh',
        publishedAt: '2024-01-08',
        readTime: '7 min read',
        category: 'Mathematics',
        image: '/api/placeholder/400/200',
        views: 1350
      },
      {
        id: '5',
        title: 'Time Management During JEE Preparation',
        excerpt: 'Learn how to effectively manage your time and create a balanced study schedule for JEE preparation.',
        author: 'Dr. Priya Agarwal',
        publishedAt: '2024-01-05',
        readTime: '5 min read',
        category: 'Study Tips',
        image: '/api/placeholder/400/200',
        views: 890
      },
      {
        id: '6',
        title: 'JEE Advanced vs JEE Main: Key Differences',
        excerpt: 'Understanding the fundamental differences between JEE Main and JEE Advanced to plan your preparation accordingly.',
        author: 'Dr. Ravi Verma',
        publishedAt: '2024-01-03',
        readTime: '9 min read',
        category: 'Exam Info',
        image: '/api/placeholder/400/200',
        views: 1500
      }
    ];

    setTimeout(() => {
      setBlogs(mockBlogs);
      setLoading(false);
    }, 1000);
  }, []);

  const categories = ['All', 'Preparation', 'Physics', 'Chemistry', 'Mathematics', 'Study Tips', 'Exam Info'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredBlogs = selectedCategory === 'All' 
    ? blogs 
    : blogs.filter(blog => blog.category === selectedCategory);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
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
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Blog */}
          {filteredBlogs.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Featured Article</h2>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                <div className="md:flex">
                  <div className="md:w-1/2">
                    <div className="h-64 md:h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <BookOpen className="w-16 h-16 text-white" />
                    </div>
                  </div>
                  <div className="md:w-1/2 p-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">
                        {filteredBlogs[0].category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                      {filteredBlogs[0].title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      {filteredBlogs[0].excerpt}
                    </p>
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{filteredBlogs[0].author}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(filteredBlogs[0].publishedAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{filteredBlogs[0].readTime}</span>
                      </div>
                    </div>
                    <Link
                      href="/login"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBlogs.slice(1).map((blog) => (
                <div key={blog.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded">
                        {blog.category}
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
                        <span>{blog.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{blog.views} views</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(blog.publishedAt)}</span>
                      </div>
                      <Link
                        href="/login"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Read More →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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