'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import DynamicHead from '@/components/DynamicHead';
import DynamicFooter from '@/components/DynamicFooter';
import DynamicFavicon from '@/components/DynamicFavicon';
import DynamicLogo from '@/components/DynamicLogo';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function HelpPage() {
  const { systemSettings, loading } = useSystemSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories = [
    { id: 'all', name: 'All Topics' },
    { id: 'getting-started', name: 'Getting Started' },
    { id: 'account', name: 'Account & Billing' },
    { id: 'practice-tests', name: 'Practice Tests' },
    { id: 'technical', name: 'Technical Support' },
    { id: 'mobile', name: 'Mobile App' }
  ];

  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I get started with JEE App?',
      answer: 'Getting started is easy! Simply create a free account by clicking "Get Started Free" on our homepage. You\'ll get a 2-day free trial to explore all our features. Complete your profile, choose your subjects, and start taking practice tests immediately.',
      category: 'getting-started'
    },
    {
      id: '2',
      question: 'What subjects are available for practice?',
      answer: 'We offer comprehensive practice tests for all JEE Main and Advanced subjects: Physics, Chemistry, and Mathematics. Each subject is divided into topics and subtopics for focused learning.',
      category: 'getting-started'
    },
    {
      id: '3',
      question: 'How do I upgrade to a premium plan?',
      answer: 'You can upgrade to a premium plan anytime from your dashboard. Go to the Subscriptions section, choose your preferred plan, and complete the payment. Your premium features will be activated immediately.',
      category: 'account'
    },
    {
      id: '4',
      question: 'Can I access the platform on my mobile device?',
      answer: 'Yes! Our platform is fully responsive and works great on mobile devices. You can access all features through your mobile browser, including practice tests, analytics, and study materials.',
      category: 'mobile'
    },
    {
      id: '5',
      question: 'How are practice tests scored?',
      answer: 'Practice tests are scored based on the number of correct answers. Each question carries equal weight. You can view detailed explanations for each question and track your performance over time.',
      category: 'practice-tests'
    },
    {
      id: '6',
      question: 'What if I encounter technical issues?',
      answer: 'You can reach our support team through multiple channels: Email us, use the contact form on our website, or chat with us live during support hours (Mon-Fri 9 AM - 6 PM IST). We typically respond within 24 hours.',
      category: 'technical'
    }
  ];

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

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (id: string) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

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
        title={`Help Center - ${systemSettings?.siteTitle || 'JEE App'} | FAQ & Support`}
        description={`Get instant answers to common questions about ${systemSettings?.siteTitle || 'JEE App'} platform, features, account management, and JEE preparation. Find help articles, tutorials, and support resources.`}
        keywords={`${systemSettings?.siteTitle || 'JEE App'} help, FAQ, support center, JEE preparation help, account help, practice tests help, ${systemSettings?.siteKeywords || 'JEE, preparation, practice tests'}`}
        canonicalUrl={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/help`}
        ogImage={systemSettings?.ogImageUrl ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}${systemSettings.ogImageUrl}` : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/og-help.jpg`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": faq.answer
            }
          })),
          "publisher": {
            "@type": "Organization",
            "name": systemSettings?.siteTitle || 'JEE App',
            "url": process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'
          }
        }}
      />
      <div className="min-h-screen bg-white">
        {/* Navigation */}
        <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Brand/Logo */}
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center">
                  <DynamicLogo 
                    systemSettings={systemSettings} 
                    size="md"
                    showText={true}
                    className="hover:opacity-80 transition-opacity"
                  />
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
                  <Link href="/pyq-bank" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                    PYQ Bank
                  </Link>
                  <Link href="/help" className="text-orange-600 px-3 py-2 text-sm font-medium">
                    Help
                  </Link>
                  <Link href="/contact" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                    Contact
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
                  <Link href="/pyq-bank" className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    PYQ Bank
                  </Link>
                  <Link href="/help" className="text-orange-600 block px-3 py-2 text-base font-medium" onClick={() => setMobileMenuOpen(false)}>
                    Help
                  </Link>
                  <Link href="/contact" className="text-gray-600 hover:text-orange-600 block px-3 py-2 text-base font-medium transition-colors" onClick={() => setMobileMenuOpen(false)}>
                    Contact
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
                Help Center
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                Find instant answers to your questions and get the most out of {systemSettings?.siteTitle || 'JEE App'}
              </p>
            </div>
          </section>

          {/* Search and Filter Section */}
          <section className="py-12 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <div className="relative max-w-lg mx-auto">
                  <input
                    type="text"
                    placeholder="Search help articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-orange-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="py-12 bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">
                Frequently Asked Questions
              </h2>

              <div className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-lg font-medium text-gray-900">{faq.question}</span>
                      <svg
                        className={`h-5 w-5 text-gray-500 transition-transform ${
                          expandedFAQ === faq.id ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedFAQ === faq.id && (
                      <div className="px-6 pb-4">
                        <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredFAQs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No FAQs found matching your search criteria.</p>
                </div>
              )}
            </div>
          </section>

          {/* Contact Support Section */}
          <section className="py-16 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Still need help?
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Can&apos;t find what you&apos;re looking for? Our support team is here to help!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors"
                >
                  Contact Support
                </Link>
                <a
                  href={`mailto:${systemSettings?.supportEmail || 'support@jeemaster.com'}`}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Email Us
                </a>
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