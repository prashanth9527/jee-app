import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jeemaster.com'),
  title: {
    default: 'JEE App - Complete JEE Preparation Platform',
    template: '%s | JEE App'
  },
  description: 'Master JEE Main & Advanced with AI-powered practice tests, 50,000+ questions, detailed analytics, and comprehensive study materials.',
  keywords: 'JEE preparation, JEE Main, JEE Advanced, practice tests, AI learning, physics, chemistry, mathematics, online coaching, mock tests',
  authors: [{ name: 'JEE App Team' }],
  creator: 'JEE App',
  publisher: 'JEE App',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
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
        {/* Theme color for mobile browsers */}
        <meta name="theme-color" content="#ea580c" />
        <meta name="msapplication-TileColor" content="#ea580c" />
        
        {/* Favicon and app icons - These will be overridden by DynamicHead component */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
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
              "name": "JEE App",
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
          <AuthProvider>
            <div id="root" className="min-h-screen flex flex-col">
              <main className="flex-1">
                {children}
              </main>
            </div>
          </AuthProvider>
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
      </body>
    </html>
  );
}
