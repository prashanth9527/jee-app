'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import DynamicHead from '@/components/DynamicHead';
import DynamicLogo from '@/components/DynamicLogo';

interface SystemSettings {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  siteLogo?: string;
  siteFavicon?: string;
  ogImage?: string;
  companyName?: string;
  contactEmail?: string;
  supportEmail?: string;
  privacyEmail?: string;
  legalEmail?: string;
  socialMediaLinks?: {
    facebook?: string;
    twitter?: string;
    youtube?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export default function TermsPage() {
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRes = await api.get('/system-settings');
        setSystemSettings(settingsRes.data);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setSystemSettings({
          siteTitle: 'JEE App',
          siteDescription: 'Comprehensive JEE preparation platform',
          siteKeywords: 'JEE, preparation, practice tests'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

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
      if (window.innerWidth >= 1024) { // lg breakpoint
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleResize);
    }

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
      <DynamicHead 
        title={`Terms of Service - ${systemSettings?.siteTitle || 'JEE App'} | Terms & Conditions`}
        description={`Read the terms and conditions for using ${systemSettings?.siteTitle || 'JEE App'} platform and services for JEE preparation. Legal terms, user agreements, and service conditions.`}
        keywords={`${systemSettings?.siteTitle || 'JEE App'} terms of service, terms and conditions, user agreement, legal terms, ${systemSettings?.siteKeywords || 'JEE, preparation, practice tests'}`}
        canonicalUrl={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/terms`}
        ogImage={systemSettings?.ogImage ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}${systemSettings.ogImage}` : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/og-terms.jpg`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": `${systemSettings?.siteTitle || 'JEE App'} Terms of Service`,
          "description": "Terms and conditions for using our JEE preparation platform and services",
          "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/terms`,
          "dateModified": "2024-12-01",
          "publisher": {
            "@type": "Organization",
            "name": systemSettings?.companyName || systemSettings?.siteTitle || 'JEE App'
          }
        }}
      />
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <DynamicLogo 
                  systemSettings={systemSettings} 
                  size="md"
                  showText={true}
                />
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/login" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link href="/register" className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg">
                  Get Started Free
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-20 pb-16 bg-gradient-to-br from-orange-50 via-white to-red-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
                Terms of
                <span className="block bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Service
                </span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                Please read these terms carefully before using JEE App platform and services.
              </p>
              <p className="mt-4 text-sm text-gray-500">
                Last updated: December 2024
              </p>
            </div>
          </div>
        </section>

        {/* Terms Content */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose prose-lg max-w-none">
              
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    By accessing or using JEE App ("the Platform"), you agree to be bound by these Terms of Service 
                    ("Terms"). If you do not agree to these Terms, please do not use our services.
                  </p>
                  <p>
                    These Terms apply to all users of the Platform, including students, parents, and any other individuals 
                    who access or use our services.
                  </p>
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                <div className="space-y-4 text-gray-700">
                  <p>JEE App provides:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Online JEE preparation platform with practice tests and study materials</li>
                    <li>AI-powered learning recommendations and analytics</li>
                    <li>Previous year question banks and mock tests</li>
                    <li>Performance tracking and progress monitoring</li>
                    <li>Educational content and study resources</li>
                    <li>Mobile and web applications for learning</li>
                  </ul>
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                <div className="space-y-4 text-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900">Account Creation</h3>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>You must provide accurate and complete information when creating an account</li>
                    <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                    <li>You must be at least 13 years old to create an account</li>
                    <li>Parents/guardians may create accounts for students under 18</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6">Account Responsibilities</h3>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>You are responsible for all activities that occur under your account</li>
                    <li>You must notify us immediately of any unauthorized use</li>
                    <li>You may not share your account with others</li>
                    <li>We reserve the right to suspend or terminate accounts for violations</li>
                  </ul>
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Subscription and Payment</h2>
                <div className="space-y-4 text-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900">Free Trial</h3>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>We offer a 2-day free trial for new users</li>
                    <li>No credit card required for the free trial</li>
                    <li>Trial includes access to limited features</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6">Paid Subscriptions</h3>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                    <li>All fees are non-refundable except as required by law</li>
                    <li>Prices may change with 30 days' notice to existing subscribers</li>
                    <li>You can cancel your subscription at any time</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6">Payment Processing</h3>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>We use secure third-party payment processors</li>
                    <li>You authorize us to charge your payment method for subscription fees</li>
                    <li>Failed payments may result in service suspension</li>
                  </ul>
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Acceptable Use</h2>
                <div className="space-y-4 text-gray-700">
                  <p>You agree to use the Platform only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on intellectual property rights</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Use automated tools to access the Platform (except as permitted)</li>
                    <li>Share or distribute content without authorization</li>
                    <li>Harass, abuse, or harm other users</li>
                    <li>Upload malicious software or viruses</li>
                    <li>Use the Platform for commercial purposes without permission</li>
                  </ul>
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
                <div className="space-y-4 text-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900">Our Content</h3>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>All content on the Platform is owned by JEE App or our licensors</li>
                    <li>You may not copy, modify, or distribute our content without permission</li>
                    <li>You may use our content only for personal educational purposes</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6">Your Content</h3>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>You retain ownership of content you create or upload</li>
                    <li>You grant us a license to use your content to provide our services</li>
                    <li>You are responsible for ensuring you have rights to any content you share</li>
                  </ul>
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Privacy and Data Protection</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    Your privacy is important to us. Our collection and use of personal information is governed by our 
                    <Link href="/privacy" className="text-orange-600 hover:text-orange-700"> Privacy Policy</Link>, 
                    which is incorporated into these Terms by reference.
                  </p>
                  <p>
                    By using our services, you consent to the collection and use of information as described in our Privacy Policy.
                  </p>
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Disclaimers and Limitations</h2>
                <div className="space-y-4 text-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900">Service Availability</h3>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>We strive to provide continuous service but cannot guarantee 100% uptime</li>
                    <li>We may suspend service for maintenance, updates, or technical issues</li>
                    <li>We are not responsible for third-party service interruptions</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6">Educational Results</h3>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>We provide educational tools but cannot guarantee specific results</li>
                    <li>Success depends on individual effort and study habits</li>
                    <li>We are not responsible for exam outcomes or admission decisions</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6">Limitation of Liability</h3>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Our liability is limited to the amount you paid for our services</li>
                    <li>We are not liable for indirect, incidental, or consequential damages</li>
                    <li>Some jurisdictions may not allow limitation of liability</li>
                  </ul>
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Termination</h2>
                <div className="space-y-4 text-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900">By You</h3>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>You may terminate your account at any time</li>
                    <li>Cancellation takes effect at the end of your current billing period</li>
                    <li>You can delete your account from your profile settings</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6">By Us</h3>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>We may suspend or terminate accounts for Terms violations</li>
                    <li>We may discontinue services with reasonable notice</li>
                    <li>We reserve the right to refuse service to anyone</li>
                  </ul>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6">Effect of Termination</h3>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>Your access to the Platform will cease</li>
                    <li>We may retain certain data as required by law</li>
                    <li>Provisions that should survive termination will remain in effect</li>
                  </ul>
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Dispute Resolution</h2>
                <div className="space-y-4 text-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900">Governing Law</h3>
                  <p>These Terms are governed by the laws of India, without regard to conflict of law principles.</p>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6">Dispute Resolution Process</h3>
                  <ol className="list-decimal list-inside ml-4 space-y-2">
                    <li>Contact us first to attempt informal resolution</li>
                    <li>If informal resolution fails, disputes will be resolved through binding arbitration</li>
                    <li>Arbitration will be conducted in India</li>
                    <li>You may opt out of arbitration within 30 days of account creation</li>
                  </ol>
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
                <div className="space-y-4 text-gray-700">
                  <p>We may modify these Terms from time to time. When we make changes:</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>We will post the updated Terms on our website</li>
                    <li>We will notify you of material changes via email or platform notification</li>
                    <li>Continued use after changes constitutes acceptance of new Terms</li>
                    <li>If you disagree with changes, you may terminate your account</li>
                  </ul>
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Miscellaneous</h2>
                <div className="space-y-4 text-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900">Entire Agreement</h3>
                  <p>These Terms, together with our Privacy Policy, constitute the entire agreement between you and JEE App.</p>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6">Severability</h3>
                  <p>If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in effect.</p>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6">Waiver</h3>
                  <p>Our failure to enforce any provision does not constitute a waiver of that provision.</p>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mt-6">Assignment</h3>
                  <p>We may assign these Terms to any third party. You may not assign your rights without our consent.</p>
                </div>
              </div>

              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
                <div className="space-y-4 text-gray-700">
                  <p>If you have questions about these Terms, please contact us:</p>
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <p><strong>Email:</strong> {systemSettings?.legalEmail || systemSettings?.contactEmail || 'legal@jeemaster.com'}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center mb-4">
                  <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                    {systemSettings?.siteTitle || 'JEE App'}
                  </span>
                </div>
                <p className="text-gray-400 mb-4">
                  {systemSettings?.siteDescription || 'The most comprehensive JEE preparation platform with AI-powered features, extensive question banks, and detailed analytics to ensure your success.'}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Platformdddd</h3>
                <ul className="space-y-3">
                  <li><Link href="/student/practice" className="text-gray-300 hover:text-white transition-colors">Practice Tests</Link></li>
                  <li><Link href="/student/pyq" className="text-gray-300 hover:text-white transition-colors">Previous Year Questions</Link></li>
                  <li><Link href="/student/performance" className="text-gray-300 hover:text-white transition-colors">Analytics</Link></li>
                  <li><Link href="/student/leaderboard" className="text-gray-300 hover:text-white transition-colors">Leaderboard</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Support</h3>
                <ul className="space-y-3">
                  <li><Link href="/help" className="text-gray-300 hover:text-white transition-colors">Help Center</Link></li>
                  <li><Link href="/contact" className="text-gray-300 hover:text-white transition-colors">Contact Us</Link></li>
                  <li><Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-gray-300 hover:text-white transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-gray-800 text-center">
              <p className="text-gray-400">
                © 2024 {systemSettings?.siteTitle || 'JEE App'}. All rights reserved. Built for JEE aspirants by JEE experts.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
