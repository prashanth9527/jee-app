'use client';

import { useEffect, useRef } from 'react';

interface DynamicFaviconProps {
  faviconUrl?: string;
  siteTitle?: string;
}

export default function DynamicFavicon({ faviconUrl, siteTitle }: DynamicFaviconProps) {
  const faviconRefs = useRef<HTMLLinkElement[]>([]);

  useEffect(() => {
    if (faviconUrl) {
      // Remove existing dynamic favicons
      faviconRefs.current.forEach(link => {
        if (link && link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
      faviconRefs.current = [];

      // Create multiple favicon formats for better browser support
      const faviconFormats = [
        { rel: 'icon', type: 'image/x-icon', sizes: 'any' },
        { rel: 'icon', type: 'image/png', sizes: '32x32' },
        { rel: 'icon', type: 'image/png', sizes: '16x16' },
        { rel: 'apple-touch-icon', type: 'image/png', sizes: '180x180' },
        { rel: 'icon', type: 'image/png', sizes: '192x192' },
        { rel: 'icon', type: 'image/png', sizes: '512x512' }
      ];

      faviconFormats.forEach(format => {
        const link = document.createElement('link');
        link.rel = format.rel;
        link.href = faviconUrl;
        link.type = format.type;
        if (format.sizes) {
          link.sizes = format.sizes;
        }
        link.setAttribute('data-dynamic-favicon', 'true');
        
        faviconRefs.current.push(link);
        document.head.appendChild(link);
      });

      // Also update manifest.json if it exists
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (manifestLink) {
        // Update manifest with dynamic favicon
        fetch(manifestLink.href)
          .then(response => response.json())
          .then(manifest => {
            manifest.icons = manifest.icons.map((icon: any) => ({
              ...icon,
              src: faviconUrl
            }));
            // Note: We can't directly update the manifest file, but this shows the structure
          })
          .catch(() => {
            // Ignore manifest update errors
          });
      }
    }

    // Cleanup function
    return () => {
      faviconRefs.current.forEach(link => {
        if (link && link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
      faviconRefs.current = [];
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
