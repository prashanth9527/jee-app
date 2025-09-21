'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  _count?: {
    blogs: number;
  };
}

interface Stream {
  id: string;
  name: string;
  code: string;
}

interface BlogFiltersProps {
  categories?: Category[];
  streams?: Stream[];
}

export default function BlogFilters({ categories = [], streams = [] }: BlogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams?.get('search') || '',
    category: searchParams?.get('category') || '',
    stream: searchParams?.get('stream') || '',
    featured: searchParams?.get('featured') === 'true',
  });

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);

    // Build URL with new filters
    const params = new URLSearchParams();
    if (updatedFilters.search) params.set('search', updatedFilters.search);
    if (updatedFilters.category) params.set('category', updatedFilters.category);
    if (updatedFilters.stream) params.set('stream', updatedFilters.stream);
    if (updatedFilters.featured) params.set('featured', 'true');

    const queryString = params.toString();
    router.push(`/blogs${queryString ? `?${queryString}` : ''}`);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      stream: '',
      featured: false,
    });
    router.push('/blogs');
  };

  const hasActiveFilters = filters.search || filters.category || filters.stream || filters.featured;

  return (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
          Search Articles
        </label>
        <input
          type="text"
          id="search"
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          placeholder="Search for articles..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => updateFilters({ category: filters.category === category.slug ? '' : category.slug })}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  filters.category === category.slug
                    ? 'bg-orange-100 text-orange-800 border border-orange-300'
                    : 'text-gray-700 hover:bg-gray-100 border border-transparent'
                }`}
              >
                <span className="font-medium">{category.name}</span>
                <span className="text-gray-500 ml-1">({category._count?.blogs || 0})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Streams */}
      {streams.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Streams</h3>
          <div className="space-y-2">
            {streams.map((stream) => (
              <label key={stream.id} className="flex items-center">
                <input
                  type="radio"
                  name="stream"
                  value={stream.code}
                  checked={filters.stream === stream.code}
                  onChange={(e) => updateFilters({ stream: e.target.value })}
                  className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {stream.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Featured */}
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={filters.featured}
            onChange={(e) => updateFilters({ featured: e.target.checked })}
            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
          />
          <span className="ml-2 text-sm text-gray-700">Featured Articles Only</span>
        </label>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div>
          <button
            onClick={clearFilters}
            className="w-full px-4 py-2 text-sm text-orange-600 hover:text-orange-800 border border-orange-300 rounded-md hover:bg-orange-50 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Popular Tags */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Tags</h3>
        <div className="flex flex-wrap gap-2">
          {[
            'Study Tips',
            'Exam Preparation',
            'Career Guidance',
            'JEE Main',
            'NEET',
            'Mathematics',
            'Physics',
            'Chemistry',
            'Biology',
            'Engineering',
            'Medical',
            'Technology',
          ].map((tag) => (
            <button
              key={tag}
              onClick={() => updateFilters({ search: tag })}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-blue-100 hover:text-blue-800 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>      
      
    </div>
  );
}
