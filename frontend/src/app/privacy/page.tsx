'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import DynamicHead from '@/components/DynamicHead';
import DynamicFooter from '@/components/DynamicFooter';
import DynamicFavicon from '@/components/DynamicFavicon';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

export default function PrivacyPage() {
  const { systemSettings, loading } = useSystemSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when clicking outside or on window resize
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuOpen) {
        const target = event.target as Element;
        if (!target.closest('nav')) {
          setMobileMenuOpen(false);
        }
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);

  if (loading) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <DynamicFavicon 
        faviconUrl={systemSettings?.faviconUrl}
        siteTitle={systemSettings?.siteTitle}
      />
      <DynamicHead 
        title={`Privacy Policy - ${systemSettings?.siteTitle || 'JEE App'} | Data Protection & Privacy`}
        description={`Learn how ${systemSettings?.siteTitle || 'JEE App'} protects your privacy and handles your personal information while providing the best JEE preparation experience. GDPR compliant privacy policy.`}
        keywords={`${systemSettings?.siteTitle || 'JEE App'} privacy policy, data protection, GDPR compliance, privacy rights, ${systemSettings?.siteKeywords || 'JEE, preparation, practice tests'}`}
        canonicalUrl={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/privacy`}
        ogImage={systemSettings?.ogImageUrl ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}${systemSettings.ogImageUrl}` : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/og-privacy.jpg`}
      />
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Brand/Logo */}
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <Link 
                    href="/" 
                    className="flex items-center space-x-2 text-2xl font-bold text-orange-600 hover:text-orange-700 transition-colors"
                    title={`${systemSettings?.siteTitle || 'JEE App'} - ${systemSettings?.siteKeywords || 'JEE preparation platform'}`}
                    aria-label={`${systemSettings?.siteTitle || 'JEE App'} - Go to homepage`}
                  >
                    {systemSettings?.logoUrl ? (
                      <img 
                        src={systemSettings.logoUrl} 
                        alt={`${systemSettings.siteTitle || 'JEE App'} Logo`}
                        className="h-12 w-auto object-contain"
                        onError={(e) => {
                          // Fallback to text if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.innerHTML = `<span class="text-2xl font-bold">${systemSettings?.siteTitle || 'JEE App'}</span>`;
                          }
                        }}
                      />
                    ) : (
                      <span className="text-2xl font-bold">{systemSettings?.siteTitle || 'JEE App'}</span>
                    )}
                  </Link>
                </div>
              </div>

              {/* Desktop Navigation */}
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-8">
                  <Link href="/" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                    Home
                  </Link>
                  <Link href="/blogs" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                    Blogs
                  </Link>
                  <Link href="/previous-year-questions" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                    PYQ Bank
                  </Link>
                  <Link href="/help" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                    Help
                  </Link>
                  <Link href="/contact" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                    Contact
                  </Link>
                  <Link href="/privacy" className="text-orange-600 px-3 py-2 text-sm font-medium">
                    Privacy
                  </Link>
                </div>
              </div>

              {/* User Actions */}
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link href="/register" className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors">
                  Get Started Free
                </Link>
              </div>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-600 hover:text-orange-600 focus:outline-none focus:text-orange-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="md:hidden">
                <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
                  <Link href="/" className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Home
                  </Link>
                  <Link href="/blogs" className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Blogs
                  </Link>
                  <Link href="/previous-year-questions" className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    PYQ Bank
                  </Link>
                  <Link href="/help" className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Help
                  </Link>
                  <Link href="/contact" className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Contact
                  </Link>
                  <Link href="/privacy" className="text-orange-600 block px-3 py-2 text-base font-medium" onClick={() => setMobileMenuOpen(false)}>
                    Privacy
                  </Link>
                  <Link href="/login" className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/register" className="bg-orange-600 text-white block px-3 py-2 rounded-lg text-base font-medium hover:bg-orange-700 transition-colors text-center" onClick={() => setMobileMenuOpen(false)}>
                    Get Started Free
                  </Link>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Main Content */}
        <main className="pt-16">
          {/* Hero Section */}
          <section className="bg-gradient-to-br from-orange-50 to-red-50 py-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
                Privacy Policy
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                Your privacy is important to us. Learn how we collect, use, and protect your personal information.
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </section>

          {/* Privacy Policy Content */}
          <section className="py-20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="prose prose-lg max-w-none">
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Information We Collect</h2>
                  <p className="text-gray-700 mb-4">
                    We collect information you provide directly to us, such as when you create an account, 
                    use our services, or contact us for support.
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-6">
                    <li>Account information (name, email, phone number)</li>
                    <li>Profile information and preferences</li>
                    <li>Payment and billing information</li>
                    <li>Test results and performance data</li>
                    <li>Communication preferences</li>
                  </ul>

                  <h2 className="text-2xl font-bold text-gray-900 mb-6">2. How We Use Your Information</h2>
                  <p className="text-gray-700 mb-4">
                    We use the information we collect to provide, maintain, and improve our services:
                  </p>
                  <ul className="list-disc list-inside text-gray-700 mb-6">
                    <li>Deliver personalized learning experiences</li>
                    <li>Process payments and manage subscriptions</li>
                    <li>Provide customer support</li>
                    <li>Send important updates and notifications</li>
                    <li>Improve our platform and develop new features</li>
                  </ul>

                  <h2 className="text-2xl font-bold text-gray-900 mb-6">3. Information Sharing</h2>
                  <p className="text-gray-700 mb-4">
                    We do not sell, trade, or otherwise transfer your personal information to third parties 
                    without your consent, except as described in this policy.
                  </p>

                  <h2 className="text-2xl font-bold text-gray-900 mb-6">4. Data Security</h2>
                  <p className="text-gray-700 mb-4">
                    We implement appropriate security measures to protect your personal information against 
                    unauthorized access, alteration, disclosure, or destruction.
                  </p>

                  <h2 className="text-2xl font-bold text-gray-900 mb-6">5. Your Rights</h2>
                  <p className="text-gray-700 mb-4">
                    You have the right to access, update, or delete your personal information. 
                    You can also opt out of certain communications from us.
                  </p>

                  <h2 className="text-2xl font-bold text-gray-900 mb-6">6. Contact Us</h2>
                  <p className="text-gray-700 mb-4">
                    If you have any questions about this Privacy Policy, please contact us at:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">
                      <strong>Email:</strong> {systemSettings?.privacyEmail || 'privacy@jeemaster.com'}<br />
                      <strong>Address:</strong> {systemSettings?.address || 'Privacy Department, JEE Master Platform'}<br />
                      <strong>Phone:</strong> {systemSettings?.contactPhone || '+1 (555) 123-4567'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <DynamicFooter />
        </main>
      </div>
    </>
  );
}