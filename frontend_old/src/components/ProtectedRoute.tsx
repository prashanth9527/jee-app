'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'STUDENT' | 'EXPERT';
  allowedRoles?: Array<'ADMIN' | 'STUDENT' | 'EXPERT'>;
}

export default function ProtectedRoute({ children, requiredRole, allowedRoles }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }

      const roleAllowed = allowedRoles ? allowedRoles.includes(user.role as any) : true;
      if ((requiredRole && user.role !== requiredRole) || !roleAllowed) {
        // Redirect to appropriate dashboard based on user role
        if (user.role === 'ADMIN') {
          router.push('/admin');
        } else if (user.role === 'EXPERT') {
          router.push('/expert');
        } else {
          router.push('/student');
        }
        return;
      }
    }
  }, [user, loading, requiredRole, allowedRoles, router]);



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  const roleAllowed = allowedRoles ? allowedRoles.includes(user.role as any) : true;
  if ((requiredRole && user.role !== requiredRole) || !roleAllowed) {
    return null; // Will redirect to appropriate dashboard
  }

  return <>{children}</>;
} 
