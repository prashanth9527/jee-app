'use client';

import { useEffect } from 'react';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import DynamicFavicon from '@/components/DynamicFavicon';
import DynamicHead from '@/components/DynamicHead';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { systemSettings } = useSystemSettings();

  // Update document title dynamically
  useEffect(() => {
    if (systemSettings?.siteTitle) {
      const currentPath = window.location.pathname;
      const pathSegments = currentPath.split('/').filter(Boolean);
      
      // Get the current page name from the URL
      let pageTitle = '';
      if (pathSegments.length > 1) {
        const pageName = pathSegments[pathSegments.length - 1];
        // Convert kebab-case to Title Case
        pageTitle = pageName
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      } else {
        pageTitle = 'Admin Dashboard';
      }
      
      // Set the document title
      document.title = `${pageTitle} - Admin - ${systemSettings.siteTitle}`;
    }
  }, [systemSettings?.siteTitle]);

  return (
    <>
      {/* Dynamic Favicon */}
      <DynamicFavicon 
        faviconUrl={systemSettings?.faviconUrl}
        siteTitle={systemSettings?.siteTitle}
      />
      
      {/* Dynamic Head with SEO */}
      <DynamicHead 
        title={`Admin Panel - ${systemSettings?.siteTitle || 'JEE App'}`}
        description={`Admin panel for ${systemSettings?.siteDescription || 'JEE preparation platform'}`}
        keywords={`admin panel, ${systemSettings?.siteKeywords || 'JEE, preparation, practice tests'}, JEE admin, education management`}
        canonicalUrl={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/admin`}
        ogImage={systemSettings?.ogImageUrl ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}${systemSettings.ogImageUrl}` : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/og-admin.jpg`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": systemSettings?.siteTitle || 'JEE App',
          "description": `Admin panel for ${systemSettings?.siteDescription || 'JEE preparation platform'}`,
          "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/admin`,
          "logo": systemSettings?.logoUrl ? {
            "@type": "ImageObject",
            "url": systemSettings.logoUrl
          } : undefined,
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Administrative Support",
            "email": systemSettings?.supportEmail || systemSettings?.contactEmail || "admin@jeemaster.com"
          },
          "sameAs": [
            systemSettings?.facebookUrl,
            systemSettings?.twitterUrl,
            systemSettings?.linkedinUrl,
            systemSettings?.instagramUrl,
            systemSettings?.youtubeUrl
          ].filter(Boolean),
          "offers": {
            "@type": "Offer",
            "category": "Education",
            "description": "JEE preparation courses and practice tests - Admin Management"
          }
        }}
      />
      
      {/* Render children */}
      {children}
    </>
  );
}
