'use client';

import Link from 'next/link';
import Image from 'next/image';

interface DynamicLogoProps {
  systemSettings: {
    siteTitle?: string;
    siteLogo?: string;
  } | null;
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function DynamicLogo({ 
  systemSettings, 
  className = '', 
  showText = true, 
  size = 'md' 
}: DynamicLogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const getLogoInitials = (title: string) => {
    return title.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <Link href="/" className={`flex items-center space-x-3 ${className}`}>
      {systemSettings?.siteLogo ? (
        <div className={`${sizeClasses[size]} relative`}>
          <Image
            src={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}${systemSettings.siteLogo}`}
            alt={`${systemSettings?.siteTitle || 'JEE App'} Logo`}
            fill
            className="object-contain"
            priority
          />
        </div>
      ) : (
        <div className={`${sizeClasses[size]} bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center`}>
          <span className="text-white font-bold text-sm">
            {getLogoInitials(systemSettings?.siteTitle || 'JEE App')}
          </span>
        </div>
      )}
      {showText && (
        <span className={`font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent hover:from-orange-700 hover:to-red-700 transition-all duration-300 ${textSizeClasses[size]}`}>
          {systemSettings?.siteTitle || 'JEE App'}
        </span>
      )}
    </Link>
  );
}
