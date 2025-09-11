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
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  socialMediaLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  };
  aboutUsContent?: {
    mission?: string;
    vision?: string;
    values?: Array<{
      title: string;
      description: string;
      icon?: string;
    }>;
    teamMembers?: Array<{
      name: string;
      position: string;
      bio: string;
      avatar?: string;
    }>;
    achievements?: Array<{
      number: string;
      label: string;
      description?: string;
    }>;
  };
}

export default function AboutPage() {
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
          siteKeywords: 'JEE, preparation, practice tests',
          siteLogo: '/logo.png',
          siteFavicon: '/favicon.ico',
          ogImage: '/og-image.jpg',
          companyName: 'JEE App Education Pvt. Ltd.',
          companyAddress: 'Tech Park, Sector 5, Gurgaon, Haryana 122001, India',
          companyPhone: '+91 98765 43210',
          companyEmail: 'support@jeemaster.com',
          socialMediaLinks: {
            facebook: 'https://facebook.com/jeemaster',
            twitter: 'https://twitter.com/jeemaster',
            instagram: 'https://instagram.com/jeemaster',
            youtube: 'https://youtube.com/jeemaster',
            linkedin: 'https://linkedin.com/company/jeemaster'
          },
          aboutUsContent: {
            mission: 'At JEE App, we believe that every student deserves access to world-class JEE preparation resources. Our mission is to democratize quality education by providing AI-powered learning tools, comprehensive question banks, and personalized analytics that help students identify their strengths and weaknesses.',
            vision: 'To become India\'s leading JEE preparation platform, helping over 1 million students achieve their engineering dreams through innovative technology and personalized learning.',
            values: [
              {
                title: 'Excellence',
                description: 'We strive for the highest quality in everything we create and deliver.',
                icon: '🎯'
              },
              {
                title: 'Accessibility',
                description: 'Quality education should be accessible to every student, everywhere.',
                icon: '🤝'
              },
              {
                title: 'Innovation',
                description: 'We continuously innovate to provide the best learning experience.',
                icon: '💡'
              },
              {
                title: 'Student Success',
                description: 'Every decision we make is guided by what\'s best for our students.',
                icon: '❤️'
              }
            ],
            teamMembers: [
              {
                name: 'Dr. Rajesh Sharma',
                position: 'Founder & CEO',
                bio: 'IIT Delhi alumnus with 15+ years of experience in education technology. Former faculty at top coaching institutes.',
                avatar: 'RS'
              },
              {
                name: 'Priya Mehta',
                position: 'CTO',
                bio: 'AI/ML expert from IIT Bombay. Leads our technology team in developing cutting-edge learning algorithms.',
                avatar: 'PM'
              },
              {
                name: 'Arjun Kumar',
                position: 'Head of Content',
                bio: 'Physics expert with 12+ years of JEE coaching experience. Curates and validates all our question content.',
                avatar: 'AK'
              }
            ],
            achievements: [
              { number: '50,000+', label: 'Practice Questions', description: 'Comprehensive question bank covering all JEE topics' },
              { number: '25,000+', label: 'Active Students', description: 'Students preparing for JEE across India' },
              { number: '98.7%', label: 'Success Rate', description: 'Students achieving their target scores' },
              { number: '15+', label: 'Years of PYQs', description: 'Previous year questions from actual JEE exams' }
            ]
          }
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
        title={`About Us - ${systemSettings?.siteTitle || 'JEE App'} | Leading JEE Preparation Platform`}
        description={`Learn about ${systemSettings?.siteTitle || 'JEE App'}'s mission to revolutionize JEE preparation with AI-powered learning, comprehensive study materials, and expert team. Discover our values, achievements, and commitment to student success.`}
        keywords={`about ${systemSettings?.siteTitle || 'JEE App'}, JEE preparation company, education technology, AI learning, JEE coaching team, ${systemSettings?.siteKeywords || 'JEE, preparation, practice tests'}`}
        canonicalUrl={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/about`}
        ogImage={systemSettings?.ogImage ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}${systemSettings.ogImage}` : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/og-about.jpg`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": systemSettings?.companyName || systemSettings?.siteTitle || 'JEE App',
          "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}`,
          "logo": systemSettings?.siteLogo ? `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}${systemSettings.siteLogo}` : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jeemaster.com'}/logo.png`,
          "description": systemSettings?.siteDescription || 'Comprehensive JEE preparation platform',
          "address": {
            "@type": "PostalAddress",
            "streetAddress": systemSettings?.companyAddress?.split(',')[0] || "Tech Park, Sector 5",
            "addressLocality": "Gurgaon",
            "addressRegion": "Haryana",
            "postalCode": "122001",
            "addressCountry": "India"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": systemSettings?.companyPhone || "+91 98765 43210",
            "contactType": "Customer Support",
            "email": systemSettings?.companyEmail || "support@jeemaster.com"
          },
          "sameAs": systemSettings?.socialMediaLinks ? Object.values(systemSettings.socialMediaLinks).filter(Boolean) : [],
          "foundingDate": "2020",
          "numberOfEmployees": "50-100",
          "industry": "Education Technology"
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
              
              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center space-x-8">
                <Link href="/" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                  Home
                </Link>
                <Link href="/contact" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                  Contact
                </Link>
                <Link href="/help" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                  Help
                </Link>
                <Link href="/login" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">
                  Login
                </Link>
                <Link href="/register" className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors shadow-md hover:shadow-lg">
                  Get Started Free
                </Link>
              </div>

              {/* Mobile menu button */}
              <div className="lg:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  {!mobileMenuOpen ? (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Mobile menu */}
            <div className={`lg:hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white border-t border-gray-200">
                <Link href="/" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">
                  Home
                </Link>
                <Link href="/contact" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">
                  Contact
                </Link>
                <Link href="/help" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">
                  Help Center
                </Link>
                <Link href="/privacy" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">
                  Privacy Policy
                </Link>
                <Link href="/terms" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">
                  Terms of Service
                </Link>
                
                <div className="border-t border-gray-200 pt-2 space-y-2">
                  <Link href="/login" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">
                    Login
                  </Link>
                  <Link href="/register" className="block px-3 py-2 text-base font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-md text-center transition-colors">
                    Get Started Free
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="pt-20 pb-16 bg-gradient-to-br from-orange-50 via-white to-red-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
              About
                <span className="block bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  {systemSettings?.siteTitle || 'JEE App'}
                </span>
            </h1>
              <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
                {systemSettings?.siteDescription || 'Empowering JEE aspirants with cutting-edge AI technology and comprehensive learning resources to achieve their dreams.'}
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                  Our Mission
                </h2>
                <p className="mt-6 text-lg text-gray-600">
                  {systemSettings?.aboutUsContent?.mission || 'At JEE App, we believe that every student deserves access to world-class JEE preparation resources. Our mission is to democratize quality education by providing AI-powered learning tools, comprehensive question banks, and personalized analytics that help students identify their strengths and weaknesses.'}
                </p>
                <p className="mt-4 text-lg text-gray-600">
                  We're committed to making JEE preparation more effective, engaging, and accessible to students across India, 
                  regardless of their location or economic background.
                </p>
              </div>
              <div className="mt-12 lg:mt-0">
                <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl p-8 text-white">
                  <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                  <p className="text-lg text-orange-100">
                    {systemSettings?.aboutUsContent?.vision || 'To become India\'s leading JEE preparation platform, helping over 1 million students achieve their engineering dreams through innovative technology and personalized learning.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Our Impact
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Numbers that speak for our commitment to student success
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {(systemSettings?.aboutUsContent?.achievements || [
                { number: '50,000+', label: 'Practice Questions', description: 'Comprehensive question bank' },
                { number: '25,000+', label: 'Active Students', description: 'Students across India' },
                { number: '98.7%', label: 'Success Rate', description: 'Students achieving targets' },
                { number: '15+', label: 'Years of PYQs', description: 'Previous year questions' }
              ]).map((achievement, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl font-bold text-orange-600 mb-2">{achievement.number}</div>
                  <div className="text-sm text-gray-600">{achievement.label}</div>
                  {achievement.description && (
                    <div className="text-xs text-gray-500 mt-1">{achievement.description}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Meet Our Team
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                Passionate educators and technologists working together for your success
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(systemSettings?.aboutUsContent?.teamMembers || [
                { name: 'Dr. Rajesh Sharma', position: 'Founder & CEO', bio: 'IIT Delhi alumnus with 15+ years of experience in education technology. Former faculty at top coaching institutes.', avatar: 'RS' },
                { name: 'Priya Mehta', position: 'CTO', bio: 'AI/ML expert from IIT Bombay. Leads our technology team in developing cutting-edge learning algorithms.', avatar: 'PM' },
                { name: 'Arjun Kumar', position: 'Head of Content', bio: 'Physics expert with 12+ years of JEE coaching experience. Curates and validates all our question content.', avatar: 'AK' }
              ]).map((member, index) => (
                <div key={index} className="text-center">
                  <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    {member.avatar || member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                  <p className="text-orange-600 font-medium">{member.position}</p>
                  <p className="mt-2 text-gray-600">{member.bio}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
                Our Values
              </h2>
              <p className="mt-4 text-xl text-gray-600">
                The principles that guide everything we do
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {(systemSettings?.aboutUsContent?.values || [
                { title: 'Excellence', description: 'We strive for the highest quality in everything we create and deliver.', icon: '🎯' },
                { title: 'Accessibility', description: 'Quality education should be accessible to every student, everywhere.', icon: '🤝' },
                { title: 'Innovation', description: 'We continuously innovate to provide the best learning experience.', icon: '💡' },
                { title: 'Student Success', description: 'Every decision we make is guided by what\'s best for our students.', icon: '❤️' }
              ]).map((value, index) => (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">{value.icon}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-orange-600 to-red-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to Start Your JEE Journey?
            </h2>
            <p className="mt-4 text-xl text-orange-100">
              Join thousands of successful students who trust {systemSettings?.siteTitle || 'JEE App'} for their preparation
            </p>
            <div className="mt-8">
              <Link href="/register" className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-orange-600 bg-white hover:bg-gray-50 transition-colors">
                Start Your Free Trial Today
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center mb-4">
                  <DynamicLogo 
                    systemSettings={systemSettings} 
                    size="md"
                    showText={true}
                    className="text-orange-400"
                  />
                </div>
                <p className="text-gray-400 mb-4">
                  {systemSettings?.siteDescription || 'The most comprehensive JEE preparation platform with AI-powered features, extensive question banks, and detailed analytics to ensure your success.'}
                </p>
                <div className="flex space-x-4">
                  {systemSettings?.socialMediaLinks?.facebook && (
                    <a href={systemSettings.socialMediaLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                      <span className="sr-only">Facebook</span>
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                      </svg>
                    </a>
                  )}
                  {systemSettings?.socialMediaLinks?.twitter && (
                    <a href={systemSettings.socialMediaLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                      <span className="sr-only">Twitter</span>
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </a>
                  )}
                  {systemSettings?.socialMediaLinks?.youtube && (
                    <a href={systemSettings.socialMediaLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                      <span className="sr-only">YouTube</span>
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                      </svg>
                    </a>
                  )}
                  {systemSettings?.socialMediaLinks?.instagram && (
                    <a href={systemSettings.socialMediaLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                      <span className="sr-only">Instagram</span>
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348zm7.718 0c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348z" clipRule="evenodd" />
                      </svg>
                    </a>
                  )}
                  {systemSettings?.socialMediaLinks?.linkedin && (
                    <a href={systemSettings.socialMediaLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                      <span className="sr-only">LinkedIn</span>
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" clipRule="evenodd" />
                      </svg>
                    </a>
                  )}
                </div>
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
