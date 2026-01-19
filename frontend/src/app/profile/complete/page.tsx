'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import DynamicHead from '@/components/DynamicHead';

interface Stream {
  id: string;
  name: string;
  description: string;
  code: string;
  _count: {
    subjects: number;
    users: number;
  };
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, checkAuth } = useAuth();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [phone, setPhone] = useState('');
  const [streamId, setStreamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching streams data...');
        const streamsRes = await api.get('/streams');
        console.log('Streams data received:', streamsRes.data);
        setStreams(streamsRes.data);
        
        // Pre-fill phone number if user already has one
        if (user?.phone) {
          setPhone(user.phone);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        console.error('Error response:', err.response?.data);
        console.error('Error status:', err.response?.status);
        setError(`Failed to load profile completion form: ${err.response?.data?.message || err.message}. Please refresh the page.`);
      } finally {
        setPageLoading(false);
      }
    };

    fetchData();
  }, [user?.phone]); // Add user.phone as dependency to pre-fill phone

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Debug: Check if token exists
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token');
      
      // For admin users, only send phone number
      const profileData = user?.role === 'ADMIN' 
        ? { phone }
        : { phone, streamId };
      
      console.log('Submitting profile data:', profileData);
      console.log('User role:', user?.role);
      
      await api.post('/auth/complete-profile', profileData);

      // Refresh user data to get updated profile completion status
      await checkAuth();
      
      // Wait a moment for the state to update, then redirect
      setTimeout(() => {
        // Redirect to appropriate dashboard
        if (user?.role === 'ADMIN') {
          router.push('/admin');
        } else if (user?.role === 'EXPERT') {
          router.push('/expert');
        } else {
          router.push('/student');
        }
      }, 500);
    } catch (err: any) {
      console.error('Profile completion error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to complete profile';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DynamicHead 
        title="Complete Your Profile"
        description="Complete your profile to access all features of JEE Master"
      />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="flex justify-center items-center mb-6">
              <span className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                JEE Master
              </span>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Complete Your Profile
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Please provide the following information to continue
            </p>
          </div>

          {/* Profile Completion Form */}
          <div className="bg-white rounded-xl shadow-2xl p-8 border border-gray-200">
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-900 mb-2">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
                {user?.phone && (
                  <p className="mt-2 text-sm text-blue-600">
                    Current phone: {user.phone} - You can update it if needed
                  </p>
                )}
              </div>

              {/* Stream Selection - Only for non-admin users */}
              {user?.role !== 'ADMIN' && (
                <div>
                  <label htmlFor="stream" className="block text-sm font-semibold text-gray-900 mb-2">
                    Select Your Stream
                  </label>
                  <select
                    id="stream"
                    name="stream"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
                    value={streamId}
                    onChange={e => setStreamId(e.target.value)}
                  >
                    <option value="">Choose your stream</option>
                    {streams.map((stream) => (
                      <option key={stream.id} value={stream.id}>
                        {stream.name} ({stream.code})
                      </option>
                    ))}
                  </select>
                  {streamId && (
                    <p className="mt-2 text-sm text-gray-600">
                      {streams.find(s => s.id === streamId)?.description}
                    </p>
                  )}
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-300 rounded-lg">
                  <p className="text-red-900 text-sm font-semibold">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Completing Profile...
                  </>
                ) : (
                  'Complete Profile'
                )}
              </button>
            </form>
          </div>

          {/* Info */}
          <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
            <h3 className="text-sm font-semibold text-orange-900 mb-2">Why do we need this information?</h3>
            <ul className="text-sm text-white-800 space-y-1">
              <li>• Phone number for SMS notifications and OTP verification</li>
              {user?.role !== 'ADMIN' && (
                <li>• Stream selection to personalize your learning experience</li>
              )}
              <li>• This information helps us provide relevant content and features</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
