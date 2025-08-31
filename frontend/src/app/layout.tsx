import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import DynamicHead from '@/components/DynamicHead';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "JEE Practice | Model Papers, Analytics, PYQs",
    template: "%s | JEE Practice",
  },
  description:
    "Practice JEE model papers by subject and topic, analyze performance, and review PYQs with explanations.",
  keywords: [
    "JEE",
    "JEE Mains",
    "JEE Advanced",
    "practice papers",
    "model tests",
    "previous year questions",
  ],
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "JEE Practice | Model Papers, Analytics, PYQs",
    description:
      "Practice JEE model papers by subject and topic, analyze performance, and review PYQs with explanations.",
    siteName: "JEE Practice",
  },
  twitter: {
    card: "summary_large_image",
    title: "JEE Practice | Model Papers, Analytics, PYQs",
    description:
      "Practice JEE model papers by subject and topic, analyze performance, and review PYQs with explanations.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "JEE Practice",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={query}`,
      "query-input": "required name=query",
    },
  };
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href={siteUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <DynamicHead />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
