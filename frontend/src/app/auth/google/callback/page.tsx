'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { googleAuth, GoogleUser } from '@/lib/google-auth';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

function GoogleCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent multiple processing of the same callback
      if (processedRef.current) {
        console.log('Callback already processed, skipping...');
        return;
      }
      processedRef.current = true;
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        if (error) {
          throw new Error(`Google OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('Missing authorization code');
        }

        if (!state) {
          throw new Error('Missing state parameter');
        }

        console.log('Google OAuth callback received:', { code: code.substring(0, 10) + '...', state });

        // Handle the Google OAuth callback
        const googleUser: GoogleUser = await googleAuth.handleCallback(code, state);
        
        console.log('Google user received:', googleUser);
        
        // Send user data to backend for authentication
        const response = await api.post('/auth/google/login', {
          googleId: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture
        });

        const { data } = response;
        if (data.access_token && data.user) {
          login(data.access_token, data.user);
          setStatus('success');
          
          // Redirect based on user needs
          setTimeout(() => {
            if (data.user.needsProfileCompletion) {
              // User needs to complete profile first
              router.push('/profile/complete');
            } else if (data.user.role === 'ADMIN') {
              router.push('/admin');
            } else if (data.user.role === 'EXPERT') {
              router.push('/expert');
            } else {
              router.push('/student');
            }
          }, 1000);
        } else {
          throw new Error('Invalid response from server');
        }
      } catch (err: any) {
        console.error('Google callback error:', err);
        console.error('Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        
        let errorMessage = 'Authentication failed';
        if (err.message) {
          errorMessage = err.message;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        
        setError(errorMessage);
        setStatus('error');
        
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleCallback();
  }, [searchParams, login, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-900 font-medium">Authenticating with Google...</p>
          <p className="mt-2 text-gray-600 text-sm">Please wait while we complete your sign-in.</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Successful!</h2>
          <p className="text-gray-600 mb-4">You have been successfully signed in with Google.</p>
          <p className="text-sm text-gray-500">Redirecting you to your dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-6">You will be redirected to the login page shortly.</p>
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing Google authentication...</p>
        </div>
      </div>
    }>
      <GoogleCallbackContent />
    </Suspense>
  );
}

