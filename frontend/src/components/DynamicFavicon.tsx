'use client';

import { useEffect, useRef } from 'react';

interface DynamicFaviconProps {
  faviconUrl?: string;
  siteTitle?: string;
}

export default function DynamicFavicon({ faviconUrl, siteTitle }: DynamicFaviconProps) {
  const faviconRef = useRef<HTMLLinkElement | null>(null);

  useEffect(() => {
    if (faviconUrl) {
      // Remove existing dynamic favicon if it exists
      if (faviconRef.current) {
        faviconRef.current.remove();
        faviconRef.current = null;
      }

      // Create new favicon link
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = faviconUrl;
      link.type = 'image/x-icon';
      link.setAttribute('data-dynamic-favicon', 'true'); // Mark as dynamic for easy identification
      
      // Store reference for cleanup
      faviconRef.current = link;
      
      // Add to head
      document.head.appendChild(link);
    }

    // Cleanup function
    return () => {
      if (faviconRef.current) {
        faviconRef.current.remove();
        faviconRef.current = null;
      }
    };
  }, [faviconUrl]);

  // Handle title changes
  useEffect(() => {
    if (siteTitle && typeof document !== 'undefined') {
      const originalTitle = document.title;
      document.title = siteTitle;
      
      return () => {
        document.title = originalTitle;
      };
    }
  }, [siteTitle]);

  return null; // This component doesn't render anything visible
}
