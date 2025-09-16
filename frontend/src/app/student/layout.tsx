'use client';

import { useEffect } from 'react';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import DynamicFavicon from '@/components/DynamicFavicon';
import DynamicHead from '@/components/DynamicHead';

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
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
        pageTitle = 'Dashboard';
      }
      
      // Set the document title
      document.title = `${pageTitle} - ${systemSettings.siteTitle}`;
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
        title={`Student Portal - ${systemSettings?.siteTitle || 'JEE App'}`}
        description={systemSettings?.siteDescription || 'JEE preparation platform for students'}
        keywords={systemSettings?.siteKeywords || 'JEE, preparation, practice tests, student portal'}
        canonicalUrl={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/student`}
        ogImage={systemSettings?.ogImageUrl ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}${systemSettings.ogImageUrl}` : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/og-student.jpg`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          "name": systemSettings?.siteTitle || 'JEE App',
          "description": systemSettings?.siteDescription || 'JEE preparation platform for students',
          "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/student`,
          "logo": systemSettings?.logoUrl ? {
            "@type": "ImageObject",
            "url": systemSettings.logoUrl
          } : undefined,
          "contactPoint": {
            "@type": "ContactPoint",
            "contactType": "Customer Support",
            "email": systemSettings?.supportEmail || systemSettings?.contactEmail || "support@jeemaster.com"
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
            "description": "JEE preparation courses and practice tests"
          }
        }}
      />
      
      {/* Render children */}
      {children}
    </>
  );
}
