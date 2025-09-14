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
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  author: {
    id: string;
    name: string;
  };
}

interface RelatedBlogsProps {
  blogs: Blog[];
}

export default function RelatedBlogs({ blogs }: RelatedBlogsProps) {
  if (blogs.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {blogs.map((blog) => (
        <article key={blog.id} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
          {/* Featured Image */}
          {blog.featuredImage && (
            <div className="relative h-40 w-full">
              <Link href={`/blogs/${blog.slug}`}>
                <Image
                  src={blog.featuredImage}
                  alt={blog.title}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </Link>
              {blog.category && (
                <div className="absolute top-3 left-3">
                  <Link
                    href={`/blogs?category=${blog.category.slug}`}
                    className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium hover:bg-blue-700 transition-colors"
                  >
                    {blog.category.name}
                  </Link>
                </div>
              )}
            </div>
          )}

          <div className="p-4">
            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
              <Link href={`/blogs/${blog.slug}`}>
                {blog.title}
              </Link>
            </h3>

            {/* Excerpt */}
            <p className="text-gray-600 text-sm mb-3 line-clamp-3 leading-relaxed">
              {blog.excerpt}
            </p>

            {/* Meta Information */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>By {blog.author.name}</span>
              <time dateTime={blog.publishedAt}>
                {new Date(blog.publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </time>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
