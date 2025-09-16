'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardUrl } from '@/utils/dashboardUtils';

interface SystemSettings {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  logoUrl?: string;
}

interface HeaderSecondaryProps {
  systemSettings?: SystemSettings;
}

export default function HeaderSecondary({ systemSettings }: HeaderSecondaryProps) {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);


  return (
    <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand/Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                href="/" 
                className="flex items-center space-x-2 text-2xl font-bold text-orange-600 hover:text-orange-700 transition-colors"
                title={`${systemSettings?.siteTitle || 'JEE App'} - ${systemSettings?.siteKeywords || 'JEE preparation platform'}`}
                aria-label={`${systemSettings?.siteTitle || 'JEE App'} - Go to homepage`}
              >
                {systemSettings?.logoUrl && !logoError ? (
                  <img 
                    src={systemSettings.logoUrl} 
                    alt={`${systemSettings.siteTitle || 'JEE App'} Logo`}
                    className="h-8 w-auto object-contain"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <span>{systemSettings?.siteTitle || 'JEE App'}</span>
                )}
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="/" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                Home
              </Link>
              <Link href="/blogs" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                Blogs
              </Link>
              
              {/* <Link href="/previous-year-questions" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                PYQ Bank
              </Link> */}
              <Link href="/help" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                Help
              </Link>
              <Link href="/contact" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                Contact
              </Link>              
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link 
                  href={getDashboardUrl(user.role)} 
                  className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link href="/register" className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
                  Get Started Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-orange-600 focus:outline-none focus:text-orange-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              <Link 
                href="/" 
                className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link 
                href="/blogs" 
                className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Blogs
              </Link>
              <Link 
                href="/practice-tests" 
                className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Practice Tests
              </Link>
              <Link 
                href="/previous-year-questions" 
                className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                PYQ Bank
              </Link>
              <Link 
                href="/analytics" 
                className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Analytics
              </Link>
              <Link 
                href="/leaderboard" 
                className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Leaderboard
              </Link>
              {user ? (
                <>
                  <Link 
                    href={getDashboardUrl(user.role)} 
                    className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMenuOpen(false);
                    }}
                    className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors w-full text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    href="/login" 
                    className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link 
                    href="/register" 
                    className="bg-orange-600 text-white block px-3 py-2 rounded-lg text-base font-medium hover:bg-orange-700 transition-colors text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Get Started Free
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
