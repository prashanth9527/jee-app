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

interface HeaderHomeProps {
  systemSettings?: SystemSettings;
}

export default function HeaderHome({ systemSettings }: HeaderHomeProps) {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);


  return (
    <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Brand/Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Link 
                href="/" 
                className="flex items-center space-x-3 text-2xl font-bold text-orange-600 hover:text-orange-700 transition-all duration-300 hover:scale-105"
                title={`${systemSettings?.siteTitle || 'JEE App'} - ${systemSettings?.siteKeywords || 'JEE preparation platform'}`}
                aria-label={`${systemSettings?.siteTitle || 'JEE App'} - Go to homepage`}
              >
                {systemSettings?.logoUrl && !logoError ? (
                  <div className="relative">
                    <img 
                      src={systemSettings.logoUrl} 
                      alt={`${systemSettings.siteTitle || 'JEE App'} Logo`}
                      className="h-16 w-auto object-contain drop-shadow-lg hover:scale-105 transition-transform duration-200"
                      onError={() => setLogoError(true)}
                      style={{ maxHeight: '64px', minHeight: '48px' }}
                    />
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-200">
                    <span className="text-white font-bold text-xl">
                      {(systemSettings?.siteTitle || 'JEE App').split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
              </Link>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link href="#features" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                Features
              </Link>
              <Link href="#subjects" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                Subjects
              </Link>
              <Link href="#testimonials" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                Success Stories
              </Link>
              <Link href="#pricing" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                Pricing
              </Link>
              <Link href="/blogs" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                Blogs
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
                <Link href="/pyq-bank" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                  PYQ Bank
                </Link>
                <Link href="/login" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                  Login
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
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-25 z-40"
              onClick={() => setIsMenuOpen(false)}
            />
            
            {/* Mobile Menu Panel */}
            <div className="fixed inset-y-0 right-0 w-80 max-w-[85vw] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-red-50">
                  <div className="flex items-center space-x-3">
                    {systemSettings?.logoUrl && !logoError ? (
                      <img 
                        src={systemSettings.logoUrl} 
                        alt={`${systemSettings.siteTitle || 'JEE App'} Logo`}
                        className="h-10 w-auto object-contain"
                        onError={() => setLogoError(true)}
                        style={{ maxHeight: '40px', minHeight: '32px' }}
                      />
                    ) : (
                      <div className="h-10 w-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {(systemSettings?.siteTitle || 'JEE App').split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-lg font-bold text-gray-900">
                      {systemSettings?.siteTitle || 'JEE App'}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Mobile Menu Content */}
                <div className="flex-1 overflow-y-auto py-4">
                  <div className="px-4 space-y-2">
                    {/* Quick Actions */}
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                        Quick Actions
                      </h3>
                      <div className="space-y-1">
                        <Link 
                          href="/pyq-bank" 
                          className="flex items-center px-3 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 group"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="font-medium">PYQ Bank</span>
                        </Link>
                        <Link 
                          href="/blogs" 
                          className="flex items-center px-3 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 group"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                          <span className="font-medium">Blogs</span>
                        </Link>
                      </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="mb-6">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-3">
                        Explore
                      </h3>
                      <div className="space-y-1">
                        <a 
                          href="#features" 
                          className="flex items-center px-3 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 group"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                          <span className="font-medium">Features</span>
                        </a>
                        <a 
                          href="#subjects" 
                          className="flex items-center px-3 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 group"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          <span className="font-medium">Subjects</span>
                        </a>
                        <a 
                          href="#testimonials" 
                          className="flex items-center px-3 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 group"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                          <span className="font-medium">Success Stories</span>
                        </a>
                        <a 
                          href="#pricing" 
                          className="flex items-center px-3 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 group"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="font-medium">Pricing</span>
                        </a>
                      </div>
                    </div>

                    {/* User Actions */}
                    <div className="border-t border-gray-200 pt-4">
                      {user ? (
                        <div className="space-y-2">
                          <div className="px-3 py-2 bg-gray-50 rounded-lg mb-3">
                            <p className="text-sm font-medium text-gray-900">{user.fullName}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                          <Link 
                            href={getDashboardUrl(user.role)} 
                            className="flex items-center px-3 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 group"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                            </svg>
                            <span className="font-medium">Dashboard</span>
                          </Link>
                          <button
                            onClick={() => {
                              logout();
                              setIsMenuOpen(false);
                            }}
                            className="flex items-center w-full px-3 py-3 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 group"
                          >
                            <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-medium">Logout</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <Link 
                            href="/login" 
                            className="flex items-center px-3 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-all duration-200 group"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <svg className="w-5 h-5 mr-3 text-gray-400 group-hover:text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            <span className="font-medium">Login</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}