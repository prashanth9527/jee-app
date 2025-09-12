'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'STUDENT' | 'EXPERT';
  phone?: string;
  profilePicture?: string;
  needsProfileCompletion?: boolean;
  stream?: {
    id: string;
    name: string;
    code: string;
  };
  subscriptionStatus?: {
    hasValidSubscription: boolean;
    isOnTrial: boolean;
    trialEndsAt?: string;
    subscriptionEndsAt?: string;
    daysRemaining: number;
    needsSubscription: boolean;
    message: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  handleTokenExpiration: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authCheckInProgress, setAuthCheckInProgress] = useState(false);

  const login = (token: string, userData: User) => {
    console.log('AuthContext login called with:', { token: token.substring(0, 20) + '...', userData }); // Debug log
    console.log('Storing token in localStorage...');
    localStorage.setItem('token', token);
    console.log('Token stored, setting user data...');
    setUser(userData);
    console.log('Login function completed successfully');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  const handleTokenExpiration = () => {
    console.log('Handling token expiration...');
    localStorage.removeItem('token');
    setUser(null);
    
    // Show user-friendly message
    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/admin') || currentPath.startsWith('/student')) {
        // Use SweetAlert if available, otherwise use alert
        if (typeof window !== 'undefined' && (window as unknown as { Swal: any }).Swal) {
          (window as unknown as { Swal: any }).Swal.fire({
            title: 'Session Expired',
            text: 'Your session has expired. Please log in again to continue.',
            icon: 'warning',
            confirmButtonText: 'OK',
            allowOutsideClick: false
          }).then(() => {
            window.location.href = '/login';
          });
        } else {
          alert('Your session has expired. Please log in again.');
          window.location.href = '/login';
        }
      }
    }
  };

  const checkAuth = async () => {
    // Prevent multiple simultaneous auth checks
    if (authCheckInProgress) {
      console.log('Auth check already in progress, skipping...');
      return;
    }
    
    setAuthCheckInProgress(true);
    
    const token = localStorage.getItem('token');
    console.log('Auth check - Token exists:', !!token);
    console.log('Auth check - Token (first 20 chars):', token ? token.substring(0, 20) + '...' : 'No token');
    
    if (!token) {
      console.log('Auth check - No token found, redirecting to login');
      setLoading(false);
      setAuthCheckInProgress(false);
      // Redirect to login if on protected route and no token
      if (typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        if (pathname.startsWith('/admin') || pathname.startsWith('/student')) {
          window.location.href = '/login';
        }
      }
      return;
    }

    try {
      console.log('Auth check - Making API call to /user/me');
      const { data } = await api.get('/user/me');
      console.log('Auth check successful:', data); // Debug log
      setUser(data);
      
      // Check if user needs profile completion
      if (data.needsProfileCompletion && typeof window !== 'undefined') {
        const pathname = window.location.pathname;
        // Only redirect if not already on profile completion page
        if (pathname !== '/profile/complete') {
          console.log('User needs profile completion, redirecting to profile completion page');
          window.location.href = '/profile/complete';
          return;
        }
      }

      // Check subscription status for students (only if profile is complete)
      if (data.role === 'STUDENT' && !data.needsProfileCompletion && typeof window !== 'undefined') {
        try {
          const subscriptionResponse = await api.get('/student/subscription-status');
          const subscriptionData = subscriptionResponse.data;
          
          // Update user with subscription status
          setUser(prev => prev ? { ...prev, subscriptionStatus: subscriptionData.subscriptionStatus } : null);
          
          // Check if trial is expired and user needs subscription
          if (subscriptionData.subscriptionStatus.needsSubscription) {
            const pathname = window.location.pathname;
            // Allow access to subscription page and logout, but don't redirect if already on subscription page
            if (pathname !== '/student/subscriptions' && pathname !== '/login' && pathname !== '/profile/complete') {
              console.log('Trial expired, redirecting to subscription page');
              window.location.href = '/student/subscriptions';
              return;
            }
          }
        } catch (subscriptionError) {
          console.error('Failed to check subscription status:', subscriptionError);
          // Don't block access if subscription check fails
        }
      }
    } catch (error: any) {
      console.error('Auth check failed:', error);
      console.error('Auth check error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Check if it's a 401 error (token expired)
      if (error.response?.status === 401) {
        console.log('Token expired (401), handling expiration...'); // Debug log
        handleTokenExpiration();
      } else {
        // For other errors, just clear the token and redirect
        console.log('Other error, clearing token...'); // Debug log
        localStorage.removeItem('token');
        setUser(null);
        
        if (typeof window !== 'undefined') {
          const pathname = window.location.pathname;
          if (pathname.startsWith('/admin') || pathname.startsWith('/student')) {
            window.location.href = '/login';
          }
        }
      }
    } finally {
      setLoading(false);
      setAuthCheckInProgress(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);



  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, handleTokenExpiration }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
