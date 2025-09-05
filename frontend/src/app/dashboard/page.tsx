'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
// Using standard HTML elements with Tailwind CSS
// Using emojis instead of lucide-react icons
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  emailVerified: boolean;
  stream?: {
    id: string;
    name: string;
  };
  needsProfileCompletion?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem('token');
          router.push('/login');
          return;
        }

        const userData = await response.json();
        setUser(userData);

        // Redirect to profile completion if needed
        if (userData.needsProfileCompletion) {
          router.push('/profile/complete');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.fullName}</span>
              <button 
                className="border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to your JEE preparation journey!
            </h2>
            <p className="text-gray-600">
              You're all set to start your exam preparation. Here's what you can do next.
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-600">Stream</h3>
                <span className="text-lg">📚</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {user.stream?.name || 'Not Selected'}
              </div>
              <p className="text-xs text-gray-500">
                {user.stream ? 'Your chosen stream' : 'Complete your profile'}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-600">Email Status</h3>
                <span className="text-lg">👤</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {user.emailVerified ? 'Verified' : 'Pending'}
              </div>
              <p className="text-xs text-gray-500">
                {user.emailVerified ? 'Email confirmed' : 'Check your email'}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                <h3 className="text-sm font-medium text-gray-600">Progress</h3>
                <span className="text-lg">🏆</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">0%</div>
              <p className="text-xs text-gray-500">
                Start your first practice test
              </p>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2">
                  <span className="mr-2">📝</span>
                  Practice Tests
                </h3>
                <p className="text-gray-600 text-sm">
                  Take practice tests to assess your knowledge
                </p>
              </div>
              <button className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed" disabled>
                Coming Soon
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2">
                  <span className="mr-2">🏆</span>
                  Leaderboard
                </h3>
                <p className="text-gray-600 text-sm">
                  See how you rank among other students
                </p>
              </div>
              <button className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed" disabled>
                Coming Soon
              </button>
            </div>

            <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center mb-2">
                  <span className="mr-2">⚙️</span>
                  Profile Settings
                </h3>
                <p className="text-gray-600 text-sm">
                  Update your profile and preferences
                </p>
              </div>
              <Link href="/profile/complete">
                <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors">
                  Update Profile
                </button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
