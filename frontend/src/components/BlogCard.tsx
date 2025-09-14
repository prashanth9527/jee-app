'use client';

import Link from 'next/link';
import Image from 'next/image';

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

interface BlogCardProps {
  blog: Blog;
}

export default function BlogCard({ blog }: BlogCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const readingTime = Math.ceil(blog.excerpt.split(' ').length / 200);

  return (
    <article className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Featured Image */}
      {blog.featuredImage && (
        <div className="relative h-48 w-full">
          <Image
            src={blog.featuredImage}
            alt={blog.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-4 left-4">
            {blog.category && (
              <Link
                href={`/blogs?category=${blog.category.slug}`}
                className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium hover:bg-orange-700 transition-colors"
              >
                {blog.category.name}
              </Link>
            )}
          </div>
          {blog.stream && (
            <div className="absolute top-4 right-4">
              <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {blog.stream.name}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="p-6">
        {/* Title */}
        <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-orange-600 transition-colors">
          <Link href={`/blogs/${blog.slug}`}>
            {blog.title}
          </Link>
        </h2>

        {/* Excerpt */}
        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
          {blog.excerpt}
        </p>

        {/* Tags */}
        {blog.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {blog.tags.slice(0, 3).map((tag) => (
              <Link
                key={tag}
                href={`/blogs?search=${encodeURIComponent(tag)}`}
                className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs hover:bg-gray-200 transition-colors"
              >
                #{tag}
              </Link>
            ))}
            {blog.tags.length > 3 && (
              <span className="text-gray-500 text-xs px-2 py-1">
                +{blog.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Meta Information */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-4">
            <span>By {blog.author.name}</span>
            <span>•</span>
            <time dateTime={blog.publishedAt}>
              {formatDate(blog.publishedAt)}
            </time>
            <span>•</span>
            <span>{readingTime} min read</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {blog.viewCount.toLocaleString()}
            </span>
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {blog.likeCount}
            </span>
          </div>
        </div>

        {/* Read More Button */}
        <div className="mt-4">
          <Link
            href={`/blogs/${blog.slug}`}
            className="inline-flex items-center text-orange-600 hover:text-orange-800 font-medium transition-colors"
          >
            Read More
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </article>
  );
}
