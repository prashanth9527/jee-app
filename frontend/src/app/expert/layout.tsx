'use client';

import { useEffect } from 'react';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import DynamicFavicon from '@/components/DynamicFavicon';

interface ExpertLayoutProps {
  children: React.ReactNode;
}

export default function ExpertLayout({ children }: ExpertLayoutProps) {
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
        pageTitle = 'Expert Dashboard';
      }
      
      // Set the document title
      document.title = `${pageTitle} - Expert - ${systemSettings.siteTitle}`;
    }
  }, [systemSettings?.siteTitle]);

  // Update meta description dynamically
  useEffect(() => {
    if (systemSettings?.siteDescription) {
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', `Expert panel for ${systemSettings.siteDescription}`);
    }
  }, [systemSettings?.siteDescription]);

  // Update meta keywords dynamically
  useEffect(() => {
    if (systemSettings?.siteKeywords) {
      // Update meta keywords
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute('content', `expert panel, ${systemSettings.siteKeywords}, JEE expert, education expert, question creation`);
    }
  }, [systemSettings?.siteKeywords]);

  // Update Open Graph meta tags and structured data
  useEffect(() => {
    if (systemSettings) {
      const updateMetaTag = (property: string, content: string) => {
        let metaTag = document.querySelector(`meta[property="${property}"]`);
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('property', property);
          document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', content);
      };

      const updateMetaName = (name: string, content: string) => {
        let metaTag = document.querySelector(`meta[name="${name}"]`);
        if (!metaTag) {
          metaTag = document.createElement('meta');
          metaTag.setAttribute('name', name);
          document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', content);
      };

      // Update Open Graph tags
      updateMetaTag('og:site_name', systemSettings.siteTitle);
      updateMetaTag('og:title', document.title);
      updateMetaTag('og:description', `Expert panel for ${systemSettings.siteDescription}`);
      updateMetaTag('og:type', 'website');
      updateMetaTag('og:locale', 'en_US');
      
      if (systemSettings.ogImageUrl) {
        updateMetaTag('og:image', systemSettings.ogImageUrl);
      }

      // Update Twitter Card tags
      updateMetaName('twitter:title', document.title);
      updateMetaName('twitter:description', `Expert panel for ${systemSettings.siteDescription}`);
      updateMetaName('twitter:site', '@jeemaster');
      updateMetaName('twitter:creator', '@jeemaster');
      updateMetaName('twitter:card', 'summary_large_image');
      
      if (systemSettings.ogImageUrl) {
        updateMetaName('twitter:image', systemSettings.ogImageUrl);
      }

      // Update canonical URL
      const canonicalUrl = window.location.href;
      let canonicalLink = document.querySelector('link[rel="canonical"]');
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonicalUrl);

      // Add structured data for educational organization with expert context
      const structuredData = {
        "@context": "https://schema.org",
        "@type": "EducationalOrganization",
        "name": systemSettings.siteTitle,
        "description": `Expert panel for ${systemSettings.siteDescription}`,
        "url": window.location.origin,
        "logo": systemSettings.logoUrl ? {
          "@type": "ImageObject",
          "url": systemSettings.logoUrl
        } : undefined,
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "Expert Support",
          "email": systemSettings.supportEmail || systemSettings.contactEmail || "expert@jeemaster.com"
        },
        "sameAs": [
          systemSettings.facebookUrl,
          systemSettings.twitterUrl,
          systemSettings.linkedinUrl,
          systemSettings.instagramUrl,
          systemSettings.youtubeUrl
        ].filter(Boolean),
        "offers": {
          "@type": "Offer",
          "category": "Education",
          "description": "JEE preparation courses and practice tests - Expert Content Creation"
        }
      };

      // Remove existing structured data script
      const existingScript = document.querySelector('script[type="application/ld+json"]');
      if (existingScript) {
        existingScript.remove();
      }

      // Add new structured data script
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
  }, [systemSettings]);

  return (
    <>
      {/* Dynamic Favicon */}
      <DynamicFavicon 
        faviconUrl={systemSettings?.faviconUrl}
        siteTitle={systemSettings?.siteTitle}
      />
      
      {/* Render children */}
      {children}
    </>
  );
}
