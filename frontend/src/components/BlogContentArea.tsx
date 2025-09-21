'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import BlogCard from './BlogCard';

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  featuredImage?: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
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
    name: string;
  };
  tags: string[];
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BlogsResponse {
  blogs: Blog[];
  pagination: Pagination;
}

interface BlogContentAreaProps {
  initialData: BlogsResponse;
}

export default function BlogContentArea({ initialData }: BlogContentAreaProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<BlogsResponse>(initialData || { blogs: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleRouteChange = () => {
      setIsLoading(true);
    };

    // Listen for route changes
    const handleRouteChangeComplete = () => {
      setIsLoading(false);
    };

    // Fetch new data when search params change
    const fetchNewData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams();
        
        if (searchParams?.get('page')) params.append('page', searchParams.get('page')!);
        if (searchParams?.get('category')) params.append('category', searchParams.get('category')!);
        if (searchParams?.get('stream')) params.append('stream', searchParams.get('stream')!);
        if (searchParams?.get('search')) params.append('search', searchParams.get('search')!);
        if (searchParams?.get('featured')) params.append('featured', searchParams.get('featured')!);

        const response = await fetch(`/api/blogs?${params}`);
        if (response.ok) {
          const newData = await response.json();
          setData(newData);
        } else {
          setError('Failed to load blogs. Please try again.');
        }
      } catch (error) {
        console.error('Error fetching blogs:', error);
        setError('Failed to load blogs. Please check your connection and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNewData();

    return () => {
      // Cleanup if needed
    };
  }, [searchParams]);

  return (
    <div className="lg:w-3/4 relative">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-20 rounded-lg">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <span className="text-lg text-gray-600 font-medium">Loading articles...</span>
          </div>
        </div>
      )}

      {/* Results Info */}
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Latest Articles
        </h2>
        <p className="text-gray-600">
          Showing {data.blogs.length} of {data.pagination.total} articles
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Unable to load articles
          </h3>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Blog Grid */}
      {!error && data.blogs.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
          {data.blogs.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>
      )}

      {/* No Articles Found */}
      {!error && data.blogs.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No articles found
          </h3>
          <p className="text-gray-600">
            Try adjusting your filters or search terms.
          </p>
        </div>
      )}

      {/* Pagination */}
      {data.pagination.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-2">
            {/* Previous Button */}
            {data.pagination.page > 1 && (
              <a
                href={`/blogs?${new URLSearchParams({
                  ...Object.fromEntries(searchParams || []),
                  page: (data.pagination.page - 1).toString()
                }).toString()}`}
                className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              >
                Previous
              </a>
            )}

            {/* Page Numbers */}
            {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1).map((page) => {
              // Show first page, last page, current page, and pages around current page
              const shouldShow = 
                page === 1 || 
                page === data.pagination.totalPages || 
                (page >= data.pagination.page - 2 && page <= data.pagination.page + 2);

              if (!shouldShow) {
                // Show ellipsis for gaps
                if (page === 2 && data.pagination.page > 4) {
                  return (
                    <span key={page} className="px-3 py-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                if (page === data.pagination.totalPages - 1 && data.pagination.page < data.pagination.totalPages - 3) {
                  return (
                    <span key={page} className="px-3 py-2 text-gray-500">
                      ...
                    </span>
                  );
                }
                return null;
              }

              return (
                <a
                  key={page}
                  href={`/blogs?${new URLSearchParams({
                    ...Object.fromEntries(searchParams || []),
                    page: page.toString()
                  }).toString()}`}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    page === data.pagination.page
                      ? 'bg-orange-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                  }`}
                >
                  {page}
                </a>
              );
            })}

            {/* Next Button */}
            {data.pagination.page < data.pagination.totalPages && (
              <a
                href={`/blogs?${new URLSearchParams({
                  ...Object.fromEntries(searchParams || []),
                  page: (data.pagination.page + 1).toString()
                }).toString()}`}
                className="px-3 py-2 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 border border-gray-300"
              >
                Next
              </a>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
