import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../styles/math.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SystemSettingsProvider } from '@/contexts/SystemSettingsContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { Analytics } from "@vercel/analytics/next"
import MobileNavigation from '@/components/MobileNavigation';
import PWAInstaller from '@/components/PWAInstaller';
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jeemaster.com'),
  title: {
    default: 'JEE Master - Complete JEE Preparation Platform',
    template: '%s | JEE Master'
  },
  description: 'Master JEE Main & Advanced with AI-powered practice tests, 50,000+ questions, detailed analytics, and comprehensive study materials.',
  keywords: 'JEE preparation, JEE Main, JEE Advanced, practice tests, AI learning, physics, chemistry, mathematics, online coaching, mock tests',
  authors: [{ name: 'JEE Master Team' }],
  creator: 'JEE Master',
  publisher: 'JEE Master',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://jeemaster.com',
    siteName: 'JEE Master',
    title: 'JEE Master - Complete JEE Preparation Platform',
    description: 'Master JEE Main & Advanced with AI-powered practice tests, 50,000+ questions, detailed analytics, and comprehensive study materials.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'JEE Master - Complete JEE Preparation Platform',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JEE Master - Complete JEE Preparation Platform',
    description: 'Master JEE Main & Advanced with AI-powered practice tests, 50,000+ questions, detailed analytics, and comprehensive study materials.',
    images: ['/og-image.jpg'],
    creator: '@jeemaster',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
  alternates: {
    canonical: 'https://jeemaster.com',
  },
  category: 'education',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Theme initialization script - runs before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme');
                  const root = document.documentElement;
                  
                  if (theme === 'dark') {
                    root.classList.add('dark');
                  } else if (theme === 'light') {
                    root.classList.remove('dark');
                  } else {
                    // Check system preference
                    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    if (systemPrefersDark) {
                      root.classList.add('dark');
                    } else {
                      root.classList.remove('dark');
                    }
                  }
                } catch (e) {
                  console.error('Theme init error:', e);
                }
              })();
            `
          }}
        />
        {/* PWA Meta Tags */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="JEE App" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="JEE App" />
        
        {/* Default Favicon and app icons - will be overridden by DynamicFavicon if available */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* PWA Icons */}
        <link rel="apple-touch-icon" sizes="72x72" href="/icons/icon-72x72.png" />
        <link rel="apple-touch-icon" sizes="96x96" href="/icons/icon-96x96.png" />
        <link rel="apple-touch-icon" sizes="128x128" href="/icons/icon-128x128.png" />
        <link rel="apple-touch-icon" sizes="144x144" href="/icons/icon-144x144.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="384x384" href="/icons/icon-384x384.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512x512.png" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://accounts.google.com" />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//connect.facebook.net" />
        
        {/* Structured data for educational organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "EducationalOrganization",
              "name": "JEE Master",
              "description": "Complete JEE preparation platform with AI-powered learning",
              "url": "https://jeemaster.com",
              "logo": {
                "@type": "ImageObject",
                "url": "https://jeemaster.com/logo.png"
              },
              "contactPoint": {
                "@type": "ContactPoint",
                "contactType": "Customer Support",
                "email": "support@jeemaster.com"
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
            })
          }}
        />
      </head>
      <body className={`${inter.className} font-sans antialiased min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300`}>
        <ThemeProvider>
          <SystemSettingsProvider>
            <AuthProvider>
              <ToastProvider>
                <div id="root" className="min-h-screen flex flex-col">
                  <main className="flex-1 pb-16 md:pb-0">
                    {children}
                    <Analytics />
                    <SpeedInsights />
                  </main>
                  <MobileNavigation />
                  <PWAInstaller />
                </div>
              </ToastProvider>
            </AuthProvider>
          </SystemSettingsProvider>
        </ThemeProvider>
        
        {/* Portal root for modals */}
        <div id="modal-root"></div>
        
        {/* Google Analytics placeholder */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
            `
          }}
        />
        
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}
