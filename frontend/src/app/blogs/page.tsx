import { Metadata } from 'next';
import BlogFilters from '@/components/BlogFilters';
import BlogContentArea from '@/components/BlogContentArea';
import HeaderSecondary from '@/components/HeaderSecondary';
import Footer from '@/components/Footer';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Educational Blogs & Articles | JEE NEET Study Resources',
  description: 'Discover expert educational content, study tips, exam strategies, and career guidance for JEE, NEET, and other competitive exams. Stay updated with the latest insights.',
  keywords: 'educational blogs, JEE preparation, NEET study tips, exam strategies, career guidance, study resources',
  openGraph: {
    title: 'Educational Blogs & Articles | JEE NEET Study Resources',
    description: 'Discover expert educational content, study tips, exam strategies, and career guidance for JEE, NEET, and other competitive exams.',
    type: 'website',
    url: '/blogs',
    images: [
      {
        url: '/images/blog-og.jpg',
        width: 1200,
        height: 630,
        alt: 'Educational Blogs & Articles',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Educational Blogs & Articles | JEE NEET Study Resources',
    description: 'Discover expert educational content, study tips, exam strategies, and career guidance.',
  },
  alternates: {
    canonical: '/blogs',
  },
};

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

interface BlogsResponse {
  blogs: Blog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

async function getBlogs(searchParams: { [key: string]: string | string[] | undefined }): Promise<BlogsResponse> {
  const params = new URLSearchParams();
  
  if (searchParams.page) params.append('page', searchParams.page.toString());
  if (searchParams.category) params.append('category', searchParams.category.toString());
  if (searchParams.stream) params.append('stream', searchParams.stream.toString());
  if (searchParams.search) params.append('search', searchParams.search.toString());
  if (searchParams.featured) params.append('featured', searchParams.featured.toString());

  const response = await fetch(`${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/api/blogs?${params}`, {
    cache: 'no-store', // Ensure fresh data for SEO
  });

  if (!response.ok) {
    throw new Error('Failed to fetch blogs');
  }

  return response.json();
}

async function getCategories() {
  const response = await fetch(`${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/api/blogs/categories`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const [data, categories] = await Promise.all([
    getBlogs(resolvedSearchParams),
    getCategories()
  ]);

  // Generate structured data for SEO
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "name": "Educational Blogs & Articles",
    "description": "Expert educational content, study tips, exam strategies, and career guidance for JEE, NEET, and other competitive exams.",
    "url": "/blogs",
    "publisher": {
      "@type": "Organization",
      "name": "JEE App",
      "url": process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'
    },
    "blogPost": data.blogs.map(blog => ({
      "@type": "BlogPosting",
      "headline": blog.title,
      "description": blog.excerpt,
      "url": `/blogs/${blog.slug}`,
      "datePublished": blog.publishedAt,
      "author": {
        "@type": "Person",
        "name": blog.author.name
      },
      "publisher": {
        "@type": "Organization",
        "name": "JEE App"
      },
      "image": blog.featuredImage,
      "keywords": blog.tags.join(', '),
      "articleSection": blog.category?.name,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `/blogs/${blog.slug}`
      }
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="min-h-screen bg-white">
        <HeaderSecondary />
        
        <div className="pt-16">
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-6">
                  Educational Blogs & Articles
                </h1>
                <p className="text-xl md:text-2xl mb-8 text-orange-100">
                  Discover expert insights, study tips, and career guidance for your academic success
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <span className="bg-orange-500 bg-opacity-50 px-4 py-2 rounded-full">
                    📚 Study Tips
                  </span>
                  <span className="bg-orange-500 bg-opacity-50 px-4 py-2 rounded-full">
                    🎯 Exam Strategies
                  </span>
                  <span className="bg-orange-500 bg-opacity-50 px-4 py-2 rounded-full">
                    🚀 Career Guidance
                  </span>
                  <span className="bg-orange-500 bg-opacity-50 px-4 py-2 rounded-full">
                    💡 Latest Insights
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Sidebar */}
              <div className="lg:w-1/4">
                <Suspense fallback={<div className="animate-pulse bg-gray-200 h-64 rounded-lg"></div>}>
                  <BlogFilters categories={categories} />
                </Suspense>
              </div>

              {/* Main Content */}
              <BlogContentArea initialData={data} />
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
}
