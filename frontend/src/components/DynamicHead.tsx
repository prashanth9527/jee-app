'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface SystemSettings {
  siteTitle: string;
  siteDescription?: string;
  siteKeywords?: string;
  logoUrl?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  customCss?: string;
  customJs?: string;
}

interface DynamicHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
}

export default function DynamicHead({ 
  title, 
  description, 
  keywords, 
  ogImage 
}: DynamicHeadProps) {
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/system-settings');
        setSettings(response.data);
      } catch (error) {
        console.error('Error fetching system settings:', error);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    if (!settings) return;

    // Update document title
    const pageTitle = title ? `${title} - ${settings.siteTitle}` : settings.siteTitle;
    document.title = pageTitle;

    // Update meta description
    const metaDescription = description || settings.siteDescription;
    let metaDescElement = document.querySelector('meta[name="description"]');
    if (!metaDescElement) {
      metaDescElement = document.createElement('meta');
      metaDescElement.setAttribute('name', 'description');
      document.head.appendChild(metaDescElement);
    }
    metaDescElement.setAttribute('content', metaDescription || '');

    // Update meta keywords
    const metaKeywords = keywords || settings.siteKeywords;
    let metaKeywordsElement = document.querySelector('meta[name="keywords"]');
    if (!metaKeywordsElement) {
      metaKeywordsElement = document.createElement('meta');
      metaKeywordsElement.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywordsElement);
    }
    metaKeywordsElement.setAttribute('content', metaKeywords || '');

    // Update favicon
    if (settings.faviconUrl) {
      let faviconElement = document.querySelector('link[rel="icon"]');
      if (!faviconElement) {
        faviconElement = document.createElement('link');
        faviconElement.setAttribute('rel', 'icon');
        document.head.appendChild(faviconElement);
      }
      faviconElement.setAttribute('href', settings.faviconUrl);
    }

    // Update Open Graph tags
    const ogTitle = title || settings.siteTitle;
    let ogTitleElement = document.querySelector('meta[property="og:title"]');
    if (!ogTitleElement) {
      ogTitleElement = document.createElement('meta');
      ogTitleElement.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitleElement);
    }
    ogTitleElement.setAttribute('content', ogTitle);

    const ogDesc = description || settings.siteDescription;
    let ogDescElement = document.querySelector('meta[property="og:description"]');
    if (!ogDescElement) {
      ogDescElement = document.createElement('meta');
      ogDescElement.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescElement);
    }
    ogDescElement.setAttribute('content', ogDesc || '');

    const ogImg = ogImage || settings.ogImageUrl;
    if (ogImg) {
      let ogImgElement = document.querySelector('meta[property="og:image"]');
      if (!ogImgElement) {
        ogImgElement = document.createElement('meta');
        ogImgElement.setAttribute('property', 'og:image');
        document.head.appendChild(ogImgElement);
      }
      ogImgElement.setAttribute('content', ogImg);
    }

    // Add Google Analytics
    if (settings.googleAnalyticsId) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.googleAnalyticsId}`;
      document.head.appendChild(script);

      const gtagScript = document.createElement('script');
      gtagScript.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${settings.googleAnalyticsId}');
      `;
      document.head.appendChild(gtagScript);
    }

    // Add Facebook Pixel
    if (settings.facebookPixelId) {
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${settings.facebookPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);
    }

    // Add custom CSS
    if (settings.customCss) {
      let customCssElement = document.getElementById('custom-css');
      if (!customCssElement) {
        customCssElement = document.createElement('style');
        customCssElement.id = 'custom-css';
        document.head.appendChild(customCssElement);
      }
      customCssElement.textContent = settings.customCss;
    }

    // Add custom JavaScript
    if (settings.customJs) {
      let customJsElement = document.getElementById('custom-js');
      if (!customJsElement) {
        customJsElement = document.createElement('script');
        customJsElement.id = 'custom-js';
        document.head.appendChild(customJsElement);
      }
      customJsElement.textContent = settings.customJs;
    }
  }, [settings, title, description, keywords, ogImage]);

  return null; // This component doesn't render anything
} 