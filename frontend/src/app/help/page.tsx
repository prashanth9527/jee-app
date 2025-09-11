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
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function HelpPage() {
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
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
      answer: 'We offer comprehensive practice for all three JEE subjects: Physics, Chemistry, and Mathematics. Each subject has thousands of questions covering all topics from the JEE syllabus, including previous year questions from the last 15+ years.',
      category: 'getting-started'
    },
    {
      id: '3',
      question: 'How does the AI-powered learning work?',
      answer: 'Our AI analyzes your performance patterns, identifies your weak areas, and generates personalized questions to help you improve. The AI also provides detailed explanations and suggests study strategies based on your learning style and progress.',
      category: 'practice-tests'
    },
    {
      id: '4',
      question: 'Can I access JEE App on my mobile device?',
      answer: 'Yes! JEE App is fully responsive and works perfectly on all devices - desktop, tablet, and mobile. You can practice anywhere, anytime. Your progress syncs across all devices automatically.',
      category: 'mobile'
    },
    {
      id: '5',
      question: 'How do I track my progress and performance?',
      answer: 'Our detailed analytics dashboard shows your performance across all subjects, topics, and difficulty levels. You can see your accuracy trends, time management, and areas that need improvement. We also provide personalized recommendations for focused study.',
      category: 'practice-tests'
    },
    {
      id: '6',
      question: 'What subscription plans are available?',
      answer: 'We offer flexible subscription plans: Free Trial (2 days), Standard (₹999/month), and AI Premium (₹1,999/month). The AI Premium plan includes AI-generated questions, advanced analytics, and priority support. All plans include access to our full question bank.',
      category: 'account'
    },
    {
      id: '7',
      question: 'How do I cancel my subscription?',
      answer: 'You can cancel your subscription anytime from your account settings. Go to your profile, select "Subscriptions," and click "Cancel Subscription." Your access will continue until the end of your current billing period.',
      category: 'account'
    },
    {
      id: '8',
      question: 'I\'m having trouble logging in. What should I do?',
      answer: 'If you\'re having login issues, try resetting your password using the "Forgot Password" link on the login page. Make sure you\'re using the correct email address. If problems persist, contact our support team at support@jeemaster.com.',
      category: 'technical'
    },
    {
      id: '9',
      question: 'Are the questions similar to actual JEE exams?',
      answer: 'Yes! Our question bank includes thousands of previous year questions from actual JEE Main and Advanced exams. We also have questions created by our expert team that match the current JEE pattern, difficulty level, and question types.',
      category: 'practice-tests'
    },
    {
      id: '10',
      question: 'How often is new content added?',
      answer: 'We continuously add new questions, practice tests, and study materials. Our content team updates the platform weekly with new questions, and we add previous year questions as soon as they\'re available after each JEE exam.',
      category: 'practice-tests'
    },
    {
      id: '11',
      question: 'Can I download practice tests for offline use?',
      answer: 'Currently, all practice tests are available online through our platform. However, you can access the mobile version through your browser even without an internet connection for previously loaded content. We\'re working on full offline support for future updates.',
      category: 'mobile'
    },
    {
      id: '12',
      question: 'How do I contact support if I need help?',
      answer: 'You can reach our support team through multiple channels: Email us at support@jeemaster.com, use the contact form on our website, or chat with us live during support hours (Mon-Fri 9 AM - 6 PM IST). We typically respond within 24 hours.',
      category: 'technical'
    }
  ];

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
      <DynamicHead 
        title={`Help Center - ${systemSettings?.siteTitle || 'JEE App'} | FAQ & Support`}
        description={`Get instant answers to common questions about ${systemSettings?.siteTitle || 'JEE App'} platform, features, account management, and JEE preparation. Find help articles, tutorials, and support resources.`}
        keywords={`${systemSettings?.siteTitle || 'JEE App'} help, FAQ, support center, JEE preparation help, account help, ${systemSettings?.siteKeywords || 'JEE, preparation, practice tests'}`}
        canonicalUrl={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/help`}
        ogImage={systemSettings?.ogImage ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}${systemSettings.ogImage}` : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/og-help.jpg`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": `${systemSettings?.siteTitle || 'JEE App'} Help Center`,
          "description": "Comprehensive help center with FAQs, tutorials, and support resources for JEE preparation",
          "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/help`,
          "mainEntity": {
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How do I get started with JEE App?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Getting started is easy! Simply create a free account by clicking 'Get Started Free' on our homepage. You'll get a 2-day free trial to explore all our features."
                }
              },
              {
                "@type": "Question", 
                "name": "What subjects are available for practice?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "We offer comprehensive practice for all three JEE subjects: Physics, Chemistry, and Mathematics. Each subject has thousands of questions covering all topics from the JEE syllabus."
                }
              }
            ]
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
                Help
                <span className="block bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Center
                </span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                Find instant answers to your questions and get the most out of your JEE preparation journey.
              </p>
            </div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="py-8 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search for help articles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div className="md:w-64">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="py-12 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Quick Links</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Link href="#getting-started" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                <div className="text-3xl mb-3">🚀</div>
                <h3 className="font-semibold text-gray-900 mb-2">Getting Started</h3>
                <p className="text-sm text-gray-600">Learn how to set up your account and begin your JEE preparation journey.</p>
              </Link>
              <Link href="#practice-tests" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                <div className="text-3xl mb-3">📝</div>
                <h3 className="font-semibold text-gray-900 mb-2">Practice Tests</h3>
                <p className="text-sm text-gray-600">Understand how to take practice tests and interpret your results.</p>
              </Link>
              <Link href="#account" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                <div className="text-3xl mb-3">💳</div>
                <h3 className="font-semibold text-gray-900 mb-2">Account & Billing</h3>
                <p className="text-sm text-gray-600">Manage your subscription, billing, and account settings.</p>
              </Link>
              <Link href="/contact" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200">
                <div className="text-3xl mb-3">📞</div>
                <h3 className="font-semibold text-gray-900 mb-2">Contact Support</h3>
                <p className="text-sm text-gray-600">Still need help? Get in touch with our support team.</p>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Frequently Asked Questions
            </h2>
            
            {filteredFAQs.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">Try adjusting your search terms or browse different categories.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFAQs.map((faq) => (
                  <div key={faq.id} className="border border-gray-200 rounded-lg">
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="font-semibold text-gray-900 pr-4">{faq.question}</h3>
                      <svg
                        className={`w-5 h-5 text-gray-500 transition-transform ${
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
                        <div className="pt-4 border-t border-gray-200">
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Contact Support Section */}
        <section className="py-16 bg-gradient-to-r from-orange-600 to-red-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Still Need Help?
            </h2>
            <p className="mt-4 text-xl text-orange-100">
              Our support team is here to help you succeed in your JEE preparation
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact" className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-orange-600 bg-white hover:bg-gray-50 transition-colors">
                Contact Support
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <a href="mailto:support@jeemaster.com" className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-lg text-white hover:bg-white hover:text-orange-600 transition-colors">
                Email Us
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </a>
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
                <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase mb-4">Platform</h3>
                <ul className="space-y-3">
                  <li><a href="/#features" className="text-gray-300 hover:text-white transition-colors">Practice Tests</a></li>
                  <li><a href="/#features" className="text-gray-300 hover:text-white transition-colors">Previous Year Questions</a></li>
                  <li><a href="/#features" className="text-gray-300 hover:text-white transition-colors">Analytics</a></li>
                  <li><a href="/#features" className="text-gray-300 hover:text-white transition-colors">Leaderboard</a></li>
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
