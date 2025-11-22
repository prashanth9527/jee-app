import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BlogContent from '@/components/BlogContent';
import RelatedBlogs from '@/components/RelatedBlogs';
import ShareButtons from '@/components/ShareButtons';
import HeaderHome from '@/components/HeaderHome';
import Footer from '@/components/Footer';
import BlogDetailContent from './BlogDetailContent';

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
    authors: [{ name: blog.author.fullName || blog.author.name || 'Unknown' }],
    openGraph: {
      title: blog.title,
      description: blog.excerpt,
      type: 'article',
      url: blogUrl,
      publishedTime: blog.publishedAt,
      modifiedTime: blog.updatedAt,
      authors: [blog.author.fullName || blog.author.name || 'Unknown'],
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
      'article:author': blog.author.fullName || blog.author.name || 'Unknown',
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
      "name": blog.author.fullName || blog.author.name || 'Unknown',
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

      <BlogDetailContent blog={blog} relatedBlogs={relatedBlogs} siteUrl={siteUrl} />
    </>
  );
}
