'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BlogContent from '@/components/BlogContent';
import RelatedBlogs from '@/components/RelatedBlogs';
import ShareButtons from '@/components/ShareButtons';
import HeaderHome from '@/components/HeaderHome';
import Footer from '@/components/Footer';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import api from '@/lib/api';
import { Tag, FolderOpen, TrendingUp } from 'lucide-react';

interface Blog {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  slug: string;
  featuredImage?: string;
  publishedAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  stream?: {
    id: string;
    name: string;
    code: string;
  };
  author: {
    id: string;
    fullName: string;
    name?: string;
    email: string;
  };
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BlogDetailContentProps {
  blog: Blog;
  relatedBlogs: Blog[];
  siteUrl: string;
}

export default function BlogDetailContent({ blog, relatedBlogs, siteUrl }: BlogDetailContentProps) {
  const { systemSettings } = useSystemSettings();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSidebarData();
  }, []);

  const fetchSidebarData = async () => {
    try {
      const [categoriesRes, blogsRes] = await Promise.all([
        api.get('/blogs/categories'),
        api.get('/blogs?limit=50'), // Get more blogs to extract popular tags
      ]);

      setCategories(categoriesRes.data || []);

      // Extract popular tags from blogs
      const allTags: { [key: string]: number } = {};
      if (blogsRes.data?.blogs) {
        blogsRes.data.blogs.forEach((b: any) => {
          if (b.tags) {
            // Handle both array and string formats
            const tagsArray = Array.isArray(b.tags) 
              ? b.tags 
              : typeof b.tags === 'string' 
                ? b.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
                : [];
            
            tagsArray.forEach((tag: string) => {
              if (tag) {
                allTags[tag] = (allTags[tag] || 0) + 1;
              }
            });
          }
        });
      }

      // Get top 15 most popular tags
      const sortedTags = Object.entries(allTags)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([tag]) => tag);

      setPopularTags(sortedTags);
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/blogs?categoryId=${categoryId}`);
  };

  const handleTagClick = (tag: string) => {
    router.push(`/blogs?search=${encodeURIComponent(tag)}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <HeaderHome systemSettings={systemSettings || undefined} />
      
      <div className="pt-20">
        {/* Breadcrumb */}
        <nav className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <ol className="flex items-center space-x-2 text-sm">
              <li>
                <Link href="/" className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300">
                  Home
                </Link>
              </li>
              <li className="text-gray-400 dark:text-gray-500">/</li>
              <li>
                <Link href="/blogs" className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300">
                  Blogs
                </Link>
              </li>
              {blog.category && (
                <>
                  <li className="text-gray-400 dark:text-gray-500">/</li>
                  <li>
                    <button
                      onClick={() => handleCategoryClick(blog.category!.id)}
                      className="text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300"
                    >
                      {blog.category.name}
                    </button>
                  </li>
                </>
              )}
              <li className="text-gray-400 dark:text-gray-500">/</li>
              <li className="text-gray-600 dark:text-gray-300 truncate">
                {blog.title}
              </li>
            </ol>
          </div>
        </nav>

        {/* Main Content with Sidebar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-6">
                {/* Categories */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 mb-4">
                    <FolderOpen className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Categories</h3>
                  </div>
                  {loading ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      <li>
                        <button
                          onClick={() => router.push('/blogs')}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-orange-50 dark:hover:bg-gray-700 rounded-md transition-colors"
                        >
                          All Categories
                        </button>
                      </li>
                      {categories.map((category) => (
                        <li key={category.id}>
                          <button
                            onClick={() => handleCategoryClick(category.id)}
                            className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                              blog.category?.id === category.id
                                ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 font-medium'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                          >
                            {category.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Popular Tags */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2 mb-4">
                    <Tag className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Popular Tags</h3>
                  </div>
                  {loading ? (
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {popularTags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleTagClick(tag)}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            blog.tags && Array.isArray(blog.tags) && blog.tags.includes(tag)
                              ? 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 font-medium'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current Blog Tags */}
                {blog.tags && Array.isArray(blog.tags) && blog.tags.length > 0 && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">This Article Tags</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {blog.tags.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => handleTagClick(tag)}
                          className="px-3 py-1 text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>

            {/* Main Article Content */}
            <article className="flex-1 min-w-0">
              {/* Article Header */}
              <header className="mb-8">
                <div className="mb-4">
                  {blog.category && (
                    <button
                      onClick={() => handleCategoryClick(blog.category!.id)}
                      className="inline-block bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 px-3 py-1 rounded-full text-sm font-medium hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors"
                    >
                      {blog.category.name}
                    </button>
                  )}
                  {blog.stream && (
                    <span className="ml-2 inline-block bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm font-medium">
                      {blog.stream.name}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4 leading-tight">
                  {blog.title}
                </h1>

                <p className="text-xl text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  {blog.excerpt}
                </p>

                {/* Article Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900 dark:text-gray-100">By</span>
                    <span className="ml-1">{blog.author.fullName || blog.author.name}</span>
                  </div>
                  <span>•</span>
                  <time dateTime={blog.publishedAt}>
                    {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                  <span>•</span>
                  <span>{blog.viewCount.toLocaleString()} views</span>
                  <span>•</span>
                  <span>{blog.likeCount} likes</span>
                  <span>•</span>
                  <span>{Math.ceil(blog.content.split(' ').length / 200)} min read</span>
                </div>

                {/* Featured Image */}
                {blog.featuredImage && (
                  <div className="mb-8">
                    <img
                      src={blog.featuredImage}
                      alt={blog.title}
                      className="w-full h-64 md:h-96 object-cover rounded-lg shadow-lg"
                    />
                  </div>
                )}

                {/* Share Buttons */}
                <div className="mb-8">
                  <ShareButtons
                    title={blog.title}
                    url={`${siteUrl}/blogs/${blog.slug}`}
                    description={blog.excerpt}
                  />
                </div>
              </header>

              {/* Article Content */}
              <div className="prose prose-lg dark:prose-invert max-w-none mb-12">
                <BlogContent content={blog.content} />
              </div>

              {/* Tags */}
              {blog.tags && Array.isArray(blog.tags) && blog.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => handleTagClick(tag)}
                        className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Share Buttons (Bottom) */}
              <div className="mb-12">
                <ShareButtons
                  title={blog.title}
                  url={`${siteUrl}/blogs/${blog.slug}`}
                  description={blog.excerpt}
                />
              </div>
            </article>
          </div>
        </div>

        {/* Related Articles */}
        {relatedBlogs.length > 0 && (
          <section className="bg-gray-50 dark:bg-gray-800 py-12 border-t border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-6xl mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 text-center">
                  Related Articles
                </h2>
                <RelatedBlogs blogs={relatedBlogs} />
              </div>
            </div>
          </section>
        )}
      </div>
      
      <Footer systemSettings={systemSettings || undefined} />
    </div>
  );
}

