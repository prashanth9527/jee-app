'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, FileText, HelpCircle, LogIn, ClipboardList, GraduationCap, Archive } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function MobileNavigation() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [isVisible, setIsVisible] = useState(false);


  useEffect(() => {
    // Show mobile navigation on mobile devices
    const checkMobile = () => {
      setIsVisible(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isVisible) return null;

  // Show loading state while authentication is being checked
  if (loading) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
        </div>
      </div>
    );
  }

  // Guest user navigation
  if (!user) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
        <div className="flex items-center justify-around py-2">
          <Link
            href="/"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              pathname === '/' ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </Link>
          
          <Link
            href="/pyq"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              pathname?.startsWith('/pyq') ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">PYQ Bank</span>
          </Link>
          
          <Link
            href="/blogs"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              pathname?.startsWith('/blogs') ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <FileText className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Blogs</span>
          </Link>
          
          <Link
            href="/contact"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              pathname?.startsWith('/contact') ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <HelpCircle className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Contact</span>
          </Link>
          
          <Link
            href="/login"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              pathname?.startsWith('/login') || pathname?.startsWith('/register') ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <LogIn className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Login</span>
          </Link>
        </div>
      </div>
    );
  }

  // Student user navigation
  if (user?.role === 'STUDENT') {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 md:hidden">
        <div className="flex items-center justify-around py-2">
          <Link
            href="/student"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              pathname === '/student' ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Dashboard</span>
          </Link>
          
          <Link
            href="/student/practice"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              pathname?.startsWith('/student/practice') ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <ClipboardList className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Practice</span>
          </Link>
          
          <Link
            href="/student/exam-papers"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              pathname?.startsWith('/student/exam-papers') ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <GraduationCap className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Exam Papers</span>
          </Link>
          
          <Link
            href="/student/pyq"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              pathname?.startsWith('/student/pyq') ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <Archive className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Previous Papers</span>
          </Link>
          
          <Link
            href="/student/lms"
            className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
              pathname?.startsWith('/student/lms') ? 'text-orange-600 bg-orange-50' : 'text-gray-600 hover:text-orange-600'
            }`}
          >
            <BookOpen className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">LMS</span>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}
