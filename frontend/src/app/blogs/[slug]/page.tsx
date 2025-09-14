import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BlogContent from '@/components/BlogContent';
import RelatedBlogs from '@/components/RelatedBlogs';
import ShareButtons from '@/components/ShareButtons';
import HeaderSecondary from '@/components/HeaderSecondary';
import Footer from '@/components/Footer';

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
    name: string;
    email: string;
  };
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
}

interface BlogResponse {
  blog: Blog;
  relatedBlogs: Blog[];
}

async function getBlog(slug: string): Promise<BlogResponse | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/api/blogs/${slug}`, {
      cache: 'no-store', // Ensure fresh data for SEO
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error('Failed to fetch blog');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching blog:', error);
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getBlog(slug);

  if (!data) {
    return {
      title: 'Blog Not Found',
    };
  }

  const { blog } = data;
  const siteUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  const blogUrl = `${siteUrl}/blogs/${blog.slug}`;

  return {
    title: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.excerpt,
    keywords: blog.metaKeywords || blog.tags.join(', '),
    authors: [{ name: blog.author.name }],
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      type: 'article',
      url: blogUrl,
      publishedTime: blog.publishedAt,
      modifiedTime: blog.updatedAt,
      authors: [blog.author.name],
      tags: blog.tags,
      images: blog.featuredImage ? [
        {
          url: blog.featuredImage,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: blog.title,
      description: blog.excerpt,
      images: blog.featuredImage ? [blog.featuredImage] : [],
    },
    alternates: {
      canonical: blogUrl,
    },
    other: {
      'article:published_time': blog.publishedAt,
      'article:modified_time': blog.updatedAt,
      'article:author': blog.author.name,
      'article:section': blog.category?.name || 'General',
      'article:tag': blog.tags.join(','),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getBlog(slug);

  if (!data) {
    notFound();
  }

  const { blog, relatedBlogs } = data;
  const siteUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": blog.title,
    "description": blog.excerpt,
    "image": blog.featuredImage,
    "author": {
      "@type": "Person",
      "name": blog.author.name,
      "email": blog.author.email
    },
    "publisher": {
      "@type": "Organization",
      "name": "JEE App",
      "url": siteUrl,
      "logo": {
        "@type": "ImageObject",
        "url": `${siteUrl}/logo.png`
      }
    },
    "datePublished": blog.publishedAt,
    "dateModified": blog.updatedAt,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${siteUrl}/blogs/${blog.slug}`
    },
    "articleSection": blog.category?.name,
    "keywords": blog.tags.join(', '),
    "wordCount": blog.content.split(' ').length,
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ReadAction",
        "userInteractionCount": blog.viewCount
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/LikeAction",
        "userInteractionCount": blog.likeCount
      }
    ],
    "about": blog.stream ? {
      "@type": "EducationalOrganization",
      "name": blog.stream.name
    } : undefined,
    "isPartOf": {
      "@type": "Blog",
      "name": "Educational Blogs & Articles",
      "url": `${siteUrl}/blogs`
    }
  };

  // Breadcrumb structured data
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": siteUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Blogs",
        "item": `${siteUrl}/blogs`
      },
      ...(blog.category ? [{
        "@type": "ListItem",
        "position": 3,
        "name": blog.category.name,
        "item": `${siteUrl}/blogs?category=${blog.category.slug}`
      }] : []),
      {
        "@type": "ListItem",
        "position": blog.category ? 4 : 3,
        "name": blog.title,
        "item": `${siteUrl}/blogs/${blog.slug}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />

      <div className="min-h-screen bg-white">
        <HeaderSecondary />
        
        <div className="pt-16">
          {/* Breadcrumb */}
          <nav className="bg-gray-50 border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <ol className="flex items-center space-x-2 text-sm">
                <li>
                  <Link href="/" className="text-orange-600 hover:text-orange-800">
                    Home
                  </Link>
                </li>
                <li className="text-gray-400">/</li>
                <li>
                  <Link href="/blogs" className="text-orange-600 hover:text-orange-800">
                    Blogs
                  </Link>
                </li>
                {blog.category && (
                  <>
                    <li className="text-gray-400">/</li>
                    <li>
                      <a 
                        href={`/blogs?category=${blog.category.slug}`}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        {blog.category.name}
                      </a>
                    </li>
                  </>
                )}
                <li className="text-gray-400">/</li>
                <li className="text-gray-600 truncate">
                  {blog.title}
                </li>
              </ol>
            </div>
          </nav>

          {/* Article Content */}
          <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
              {/* Article Header */}
              <header className="mb-8">
                <div className="mb-4">
                  {blog.category && (
                    <a
                      href={`/blogs?category=${blog.category.slug}`}
                      className="inline-block bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium hover:bg-orange-200 transition-colors"
                    >
                      {blog.category.name}
                    </a>
                  )}
                  {blog.stream && (
                    <span className="ml-2 inline-block bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                      {blog.stream.name}
                    </span>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {blog.title}
                </h1>

                <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                  {blog.excerpt}
                </p>

                {/* Article Meta */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">By</span>
                    <span className="ml-1">{blog.author.name}</span>
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
              <div className="prose prose-lg max-w-none mb-12">
                <BlogContent content={blog.content} />
              </div>

              {/* Tags */}
              {blog.tags.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {blog.tags.map((tag) => (
                      <a
                        key={tag}
                        href={`/blogs?search=${encodeURIComponent(tag)}`}
                        className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                      >
                        #{tag}
                      </a>
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
            </div>
          </article>

          {/* Related Articles */}
          {relatedBlogs.length > 0 && (
            <section className="bg-gray-50 py-12">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
                    Related Articles
                  </h2>
                  <RelatedBlogs blogs={relatedBlogs} />
                </div>
              </div>
            </section>
          )}
        </div>
        
        <Footer />
      </div>
    </>
  );
}
