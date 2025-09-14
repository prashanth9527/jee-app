import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-8">
          <div className="text-6xl font-bold text-blue-600 mb-4">404</div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Blog Post Not Found
          </h1>
          <p className="text-gray-600 mb-8">
            The blog post you're looking for doesn't exist or may have been moved.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/blogs"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse All Blogs
          </Link>
          <div>
            <Link
              href="/"
              className="text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← Back to Home
            </Link>
          </div>
        </div>

        {/* Popular Topics */}
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Popular Topics
          </h3>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              'Study Tips',
              'JEE Preparation',
              'NEET Guide',
              'Career Guidance',
              'Technology',
            ].map((topic) => (
              <Link
                key={topic}
                href={`/blogs?search=${encodeURIComponent(topic)}`}
                className="bg-white text-gray-700 px-3 py-1 rounded-full text-sm border border-gray-300 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                {topic}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
