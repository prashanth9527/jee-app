'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'STUDENT' | 'EXPERT';
  profilePicture?: string;
  stream?: {
    id: string;
    name: string;
    code: string;
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

  const login = (token: string, userData: User) => {
    console.log('AuthContext login called with:', { token: token.substring(0, 20) + '...', userData }); // Debug log
    localStorage.setItem('token', token);
    setUser(userData);
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
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
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
      const { data } = await api.get('/auth/me');
      console.log('Auth check successful:', data); // Debug log
      setUser(data);
    } catch (error: any) {
      console.error('Auth check failed:', error);
      
      // Check if it's a 401 error (token expired)
      if (error.response?.status === 401) {
        console.log('Token expired, handling expiration...'); // Debug log
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
