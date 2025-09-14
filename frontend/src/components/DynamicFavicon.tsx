'use client';

import { useEffect } from 'react';

interface DynamicFaviconProps {
  faviconUrl?: string;
  siteTitle?: string;
}

export default function DynamicFavicon({ faviconUrl, siteTitle }: DynamicFaviconProps) {
  useEffect(() => {
    if (faviconUrl) {
      // Remove existing favicon links
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(favicon => favicon.remove());

      // Create new favicon link
      const link = document.createElement('link');
      link.rel = 'icon';
      link.href = faviconUrl;
      link.type = 'image/x-icon';
      document.head.appendChild(link);

      // Also update the page title if provided
      if (siteTitle) {
        document.title = siteTitle;
      }

      // Cleanup function to remove the favicon when component unmounts
      return () => {
        link.remove();
      };
    }
  }, [faviconUrl, siteTitle]);

  return null; // This component doesn't render anything visible
}
