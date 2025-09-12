'use client';

import React from 'react';
import { GoogleSignInButtonProps, createGoogleSignInHandler } from '@/lib/google-auth';

export default function GoogleSignInButton({
  onSuccess,
  onError,
  redirectUri,
  className = '',
  children,
  disabled = false
}: GoogleSignInButtonProps) {
  const handleClick = createGoogleSignInHandler(onSuccess, onError, redirectUri);

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`group relative inline-flex items-center justify-center px-6 py-4 border-2 border-transparent rounded-xl shadow-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100 text-white font-semibold w-full animate-pulse-subtle ${className}`}
    >
      {/* Subtle shine effect */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
      
      {/* Google Logo */}
      <div className="relative z-10 flex items-center">
        <svg className="w-6 h-6 mr-4 drop-shadow-sm" viewBox="0 0 24 24">
          <path
            fill="#FFFFFF"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#FFFFFF"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FFFFFF"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#FFFFFF"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        <span className="text-base font-semibold tracking-wide">
          {children || 'Continue with Google'}
        </span>
      </div>
      
      {/* Loading indicator */}
      {disabled && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-600 rounded-xl">
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </button>
  );
} 