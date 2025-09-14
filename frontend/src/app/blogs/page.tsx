import { Metadata } from 'next';
import BlogFilters from '@/components/BlogFilters';
import BlogContentArea from '@/components/BlogContentArea';
import HeaderSecondary from '@/components/HeaderSecondary';
import Footer from '@/components/Footer';
import ErrorBoundary from '@/components/ErrorBoundary';
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
  try {
    const params = new URLSearchParams();
    
    if (searchParams.page) params.append('page', searchParams.page.toString());
    if (searchParams.category) params.append('category', searchParams.category.toString());
    if (searchParams.stream) params.append('stream', searchParams.stream.toString());
    if (searchParams.search) params.append('search', searchParams.search.toString());
    if (searchParams.featured) params.append('featured', searchParams.featured.toString());

    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 
                    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/blogs?${params}`, {
      cache: 'no-store', // Ensure fresh data for SEO
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch blogs:', response.status, response.statusText);
      // Return empty data instead of throwing
      return {
        blogs: [],
        pagination: {
          page: 1,
          limit: 10,
          total: 0,
          totalPages: 0,
        },
      };
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching blogs:', error);
    // Return empty data instead of throwing
    return {
      blogs: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      },
    };
  }
}

async function getCategories() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 
                    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/blogs/categories`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch categories:', response.status, response.statusText);
      return [];
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default async function BlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  try {
    const resolvedSearchParams = await searchParams;
    const [data, categories] = await Promise.all([
      getBlogs(resolvedSearchParams),
      getCategories()
    ]);

    // Generate structured data for SEO
    const baseUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 
                    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "Blog",
      "name": "Educational Blogs & Articles",
      "description": "Expert educational content, study tips, exam strategies, and career guidance for JEE, NEET, and other competitive exams.",
      "url": "/blogs",
      "publisher": {
        "@type": "Organization",
        "name": "JEE App",
        "url": baseUrl
      },
      "blogPost": (data.blogs || []).map(blog => ({
        "@type": "BlogPosting",
        "headline": blog.title,
        "description": blog.excerpt,
        "url": `/blogs/${blog.slug}`,
        "datePublished": blog.publishedAt,
        "author": {
          "@type": "Person",
          "name": blog.author?.name || 'Unknown Author'
        },
        "publisher": {
          "@type": "Organization",
          "name": "JEE App"
        },
        "image": blog.featuredImage,
        "keywords": (blog.tags || []).join(', '),
        "articleSection": blog.category?.name,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": `/blogs/${blog.slug}`
        }
      }))
    };

    return (
      <ErrorBoundary>
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
      </ErrorBoundary>
    );
  } catch (error) {
    console.error('Error rendering blogs page:', error);
    
    // Return a fallback page instead of crashing
    return (
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
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center py-16">
              <div className="text-gray-500 text-lg">
                <p>Unable to load blogs at the moment. Please try again later.</p>
                <p className="text-sm mt-2">If this problem persists, please contact support.</p>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    );
  }
}
