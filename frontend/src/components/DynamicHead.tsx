'use client';

import Head from 'next/head';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface SEOData {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  siteFavicon?: string;
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  twitterHandle?: string;
}

interface DynamicHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  canonicalUrl?: string;
  ogImage?: string;
  type?: 'website' | 'article' | 'profile';
  structuredData?: any;
}

export default function DynamicHead({ 
  title, 
  description, 
  keywords, 
  image,
  url,
  canonicalUrl,
  ogImage,
  type = 'website',
  structuredData
}: DynamicHeadProps) {
  const [seoData, setSeoData] = useState<SEOData | null>(null);

  useEffect(() => {
    const fetchSEOData = async () => {
      try {
        const response = await api.get('/system-settings');
        setSeoData(response.data);
      } catch {
        // Fallback SEO data
        setSeoData({
          siteTitle: 'JEE App - Complete JEE Preparation Platform',
          siteDescription: 'Master JEE Main & Advanced with AI-powered practice tests, 50,000+ questions, detailed analytics, and comprehensive study materials.',
          siteKeywords: 'JEE preparation, JEE Main, JEE Advanced, practice tests, AI learning, physics, chemistry, mathematics, online coaching, mock tests',
          twitterHandle: '@jeemaster'
        });
      }
    };

    fetchSEOData();
  }, []);

  if (!seoData) return null;

  const finalTitle = title ? `${title} | ${seoData.siteTitle}` : seoData.siteTitle;
  const finalDescription = description || seoData.siteDescription;
  const finalKeywords = keywords || seoData.siteKeywords;
  const finalImage = ogImage || image || '/og-image.jpg';
  const finalUrl = canonicalUrl || url || (typeof window !== 'undefined' ? window.location.href : '');

  const finalStructuredData = structuredData || {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "name": seoData.siteTitle,
    "description": seoData.siteDescription,
    "url": finalUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${finalUrl}/logo.png`
    },
    "sameAs": [
      "https://facebook.com/jeemaster",
      "https://twitter.com/jeemaster",
      "https://instagram.com/jeemaster"
    ],
    "offers": {
      "@type": "Offer",
      "category": "Education",
      "description": "JEE preparation courses and practice tests"
    }
  };

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      <meta name="keywords" content={finalKeywords} />
      <meta name="author" content={seoData.siteTitle} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="en" />
      <meta name="revisit-after" content="7 days" />

      {/* Viewport and Mobile */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={finalUrl} />
      <meta property="og:site_name" content={seoData.siteTitle} />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
      <meta name="twitter:image" content={finalImage} />
      <meta name="twitter:site" content={seoData.twitterHandle || '@jeemaster'} />
      <meta name="twitter:creator" content={seoData.twitterHandle || '@jeemaster'} />

      {/* Additional Meta Tags */}
      <meta name="theme-color" content="#ea580c" />
      <meta name="msapplication-TileColor" content="#ea580c" />
      <meta name="msapplication-TileImage" content="/mstile-144x144.png" />

      {/* Canonical URL */}
      <link rel="canonical" href={finalUrl} />

      {/* Favicons - Dynamic from SystemSettings */}
      <link rel="icon" type="image/x-icon" href={seoData.siteFavicon || '/favicon.ico'} />
      <link rel="icon" type="image/png" sizes="32x32" href={seoData.siteFavicon || '/favicon-32x32.png'} />
      <link rel="icon" type="image/png" sizes="16x16" href={seoData.siteFavicon || '/favicon-16x16.png'} />
      <link rel="apple-touch-icon" sizes="180x180" href={seoData.siteFavicon || '/apple-touch-icon.png'} />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(finalStructuredData)
        }}
      />

      {/* Preconnect for Performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://accounts.google.com" />

      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
    </Head>
  );
} 