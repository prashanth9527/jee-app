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
  socialMediaLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    youtube?: string;
    linkedin?: string;
  };
}

interface Subject {
  id: string;
  name: string;
  description: string;
  stream?: {
    name: string;
    code: string;
  };
  _count: {
    questions: number;
  };
}

interface Plan {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  interval: string;
  isActive: boolean;
}

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentFeature, setCurrentFeature] = useState(0);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const testimonials = [
    {
      name: "Rahul Sharma",
      score: "JEE Main: 98.7 percentile",
      content: "The AI-powered practice tests helped me identify my weak areas and improve systematically. The detailed analytics were game-changing!",
      avatar: "RS"
    },
    {
      name: "Priya Patel",
      score: "JEE Advanced: AIR 245",
      content: "Previous year questions with detailed explanations made all the difference. The platform's question quality is exceptional.",
      avatar: "PP"
    },
    {
      name: "Arjun Kumar",
      score: "JEE Main: 99.2 percentile",
      content: "The performance tracking and leaderboard features kept me motivated throughout my preparation journey.",
      avatar: "AK"
    }
  ];

  const appFeatures = [
    {
      icon: "🤖",
      title: "AI-Powered Learning",
      description: "Advanced AI generates personalized questions and provides intelligent explanations based on your performance patterns",
      bgGradient: "from-orange-400 to-red-500",
      image: "data:image/svg+xml,%3Csvg width='300' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='300' height='200' fill='%23f97316'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='white' text-anchor='middle' dy='.3em'%3EAI Learning%3C/text%3E%3C/svg%3E"
    },
    {
      icon: "📊",
      title: "Detailed Analytics",
      description: "Comprehensive performance tracking with subject-wise analysis, weak area identification, and progress trends",
      bgGradient: "from-orange-500 to-orange-600",
      image: "data:image/svg+xml,%3Csvg width='300' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='300' height='200' fill='%23ea580c'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='white' text-anchor='middle' dy='.3em'%3EAnalytics%3C/text%3E%3C/svg%3E"
    },
    {
      icon: "📚",
      title: "Previous Year Questions",
      description: "Extensive collection of JEE Main & Advanced questions from past 15+ years with detailed solutions and tips",
      bgGradient: "from-red-500 to-red-600",
      image: "data:image/svg+xml,%3Csvg width='300' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='300' height='200' fill='%23dc2626'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='white' text-anchor='middle' dy='.3em'%3EPYQ Bank%3C/text%3E%3C/svg%3E"
    },
    {
      icon: "⚡",
      title: "Instant Feedback",
      description: "Get immediate results with detailed explanations, formula tips, and step-by-step solutions for every question",
      bgGradient: "from-orange-600 to-amber-600",
      image: "data:image/svg+xml,%3Csvg width='300' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='300' height='200' fill='%23d97706'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='white' text-anchor='middle' dy='.3em'%3EInstant Results%3C/text%3E%3C/svg%3E"
    },
    {
      icon: "🏆",
      title: "Leaderboard & Competition",
      description: "Compete with thousands of JEE aspirants, track your rank in real-time, and stay motivated with gamification",
      bgGradient: "from-red-600 to-rose-600",
      image: "data:image/svg+xml,%3Csvg width='300' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='300' height='200' fill='%23e11d48'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='white' text-anchor='middle' dy='.3em'%3ELeaderboard%3C/text%3E%3C/svg%3E"
    },
    {
      icon: "📱",
      title: "Multi-Platform Access",
      description: "Practice anywhere with our responsive web app and mobile application, sync progress across all devices",
      bgGradient: "from-amber-500 to-orange-500",
      image: "data:image/svg+xml,%3Csvg width='300' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='300' height='200' fill='%23f59e0b'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='white' text-anchor='middle' dy='.3em'%3EMobile App%3C/text%3E%3C/svg%3E"
    }
  ];

  const stats = [
    { number: "50,000+", label: "Practice Questions", icon: "📝" },
    { number: "25,000+", label: "Active Students", icon: "👨‍🎓" },
    { number: "98.7%", label: "Success Rate", icon: "🎯" },
    { number: "15+", label: "Years of PYQs", icon: "📚" }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, subjectsRes, plansRes] = await Promise.all([
          api.get('/system-settings'),
          api.get('/admin/subjects').catch(() => ({ data: [] })), // Fallback if not accessible
          api.get('/subscriptions/plans').catch(() => ({ data: [] })) // Fallback if not accessible
        ]);

        setSystemSettings(settingsRes.data);
        setSubjects(subjectsRes.data || []);
        setPlans(plansRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        // Set defaults if API fails
        setSystemSettings({
          siteTitle: 'JEE App',
          siteDescription: 'Comprehensive JEE preparation platform',
          siteKeywords: 'JEE, preparation, practice tests',
          siteLogo: '/logo.png',
          siteFavicon: '/favicon.ico',
          ogImage: '/og-image.jpg',
          socialMediaLinks: {
            facebook: 'https://facebook.com/jeemaster',
            twitter: 'https://twitter.com/jeemaster',
            instagram: 'https://instagram.com/jeemaster',
            youtube: 'https://youtube.com/jeemaster',
            linkedin: 'https://linkedin.com/company/jeemaster'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % appFeatures.length);
    }, 4000);
    return () => clearInterval(timer);
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

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, [mobileMenuOpen]);

  const formatPrice = (priceCents: number) => {
    return `₹${(priceCents / 100).toLocaleString()}`;
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
        title="Home"
        description={systemSettings?.siteDescription}
      />
      <div className="min-h-screen bg-white">
      {/* Enhanced Navigation */}
        <nav className="bg-white shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <DynamicLogo 
                  systemSettings={systemSettings} 
                  size="md"
                  showText={true}
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <div className="relative group">
                  <button className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors flex items-center">
                    Features
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <a href="#features" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">AI Learning</a>
                      <a href="#features" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">Analytics</a>
                      <a href="#features" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">PYQ Bank</a>
                      <a href="#features" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">Leaderboard</a>
                    </div>
                  </div>
                </div>
                <a href="#subjects" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">Subjects</a>
                <a href="#testimonials" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">Success Stories</a>
                <a href="#pricing" className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors">Pricing</a>
                <div className="relative group">
                  <button className="text-gray-600 hover:text-orange-600 px-3 py-2 text-sm font-medium transition-colors flex items-center">
                    More
                    <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-1">
                      <Link href="/about" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">About Us</Link>
                      <Link href="/contact" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">Contact</Link>
                      <Link href="/help" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">Help Center</Link>
                      <Link href="/privacy" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">Privacy Policy</Link>
                      <Link href="/terms" className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600">Terms of Service</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center space-x-4">
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
              <div className="space-y-1">
                <div className="px-3 py-2 text-sm font-medium text-gray-500 uppercase tracking-wider">Features</div>
                <a href="#features" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">AI Learning</a>
                <a href="#features" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">Analytics</a>
                <a href="#features" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">PYQ Bank</a>
                <a href="#features" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">Leaderboard</a>
              </div>
              
              <a href="#subjects" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">Subjects</a>
              <a href="#testimonials" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">Success Stories</a>
              <a href="#pricing" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">Pricing</a>
              
              <div className="border-t border-gray-200 pt-2">
                <div className="px-3 py-2 text-sm font-medium text-gray-500 uppercase tracking-wider">More</div>
                <Link href="/about" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">About Us</Link>
                <Link href="/contact" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">Contact</Link>
                <Link href="/help" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">Help Center</Link>
                <Link href="/privacy" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">Privacy Policy</Link>
                <Link href="/terms" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-md transition-colors">Terms of Service</Link>
              </div>
              
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

      {/* Hero Section with Feature Carousel */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
              Master JEE with
                <span className="block bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Smart Practice
                </span>
            </h1>
              <p className="mt-3 text-base text-gray-600 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                {systemSettings?.siteDescription || 'Prepare for JEE Main & Advanced with our comprehensive platform featuring AI-generated questions, detailed analytics, and extensive question banks.'}
            </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/register" className="flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 transition-colors md:py-4 md:text-lg md:px-10 btn-orange">
                Start Free Trial
                    <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <Link href="/login" className="flex items-center justify-center px-8 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors md:py-4 md:text-lg md:px-10">
                    Sign In
              </Link>
                </div>
                <p className="mt-3 text-sm text-gray-600">
                  Free 2-day trial • No credit card required • Join 25,000+ students
                </p>
              </div>
            </div>
            
            {/* Feature Carousel */}
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-xl lg:max-w-md">
                <div className="relative overflow-hidden bg-white rounded-xl shadow-2xl">
                  <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentFeature * 100}%)` }}
                  >
                    {appFeatures.map((feature, index) => (
                      <div key={index} className="w-full flex-shrink-0">
                        <div className={`h-48 bg-gradient-to-br ${feature.bgGradient} flex items-center justify-center`}>
                          <img 
                            src={feature.image} 
                            alt={feature.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-6">
                          <div className="flex items-center mb-3">
                            <span className="text-2xl mr-3">{feature.icon}</span>
                            <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                          </div>
                          <p className="text-gray-600 text-sm">{feature.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Carousel indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {appFeatures.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentFeature(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentFeature ? 'bg-orange-600' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Carousel controls */}
                  <button
                    onClick={() => setCurrentFeature((prev) => (prev - 1 + appFeatures.length) % appFeatures.length)}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-2 shadow-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentFeature((prev) => (prev + 1) % appFeatures.length)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-2 shadow-lg transition-colors"
              >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Subjects Section */}
      <section id="subjects" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Master All JEE Subjects
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Comprehensive coverage with thousands of practice questions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {subjects.length > 0 ? subjects.slice(0, 3).map((subject, index) => (
              <div key={subject.id} className="bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105">
                <div className="text-center">
                  <div className="text-4xl mb-4">
                    {subject.name === 'Physics' ? '⚡' : 
                     subject.name === 'Chemistry' ? '🧪' : 
                     subject.name === 'Mathematics' ? '📐' : '📚'}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{subject.name}</h3>
                  <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 mb-4">
                    {subject._count.questions.toLocaleString()} Questions
                  </div>
                  <p className="text-gray-600">{subject.description || 'Comprehensive topic coverage'}</p>
                  {subject.stream && (
                    <p className="text-sm text-orange-600 mt-2">Stream: {subject.stream.name}</p>
                  )}
                </div>
              </div>
            )) : (
              // Default subjects if no data
              [
                { name: "Physics", icon: "⚡", topics: "Mechanics, Electricity, Magnetism, Optics", questions: "10,000+" },
                { name: "Chemistry", icon: "🧪", topics: "Physical, Organic, Inorganic Chemistry", questions: "8,500+" },
                { name: "Mathematics", icon: "📐", topics: "Algebra, Calculus, Geometry, Trigonometry", questions: "12,000+" }
              ].map((subject, index) => (
                <div key={index} className="bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-lg p-8 hover:shadow-xl transition-all hover:scale-105">
                  <div className="text-center">
                    <div className="text-4xl mb-4">{subject.icon}</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{subject.name}</h3>
                    <div className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 mb-4">
                      {subject.questions} Questions
                    </div>
                    <p className="text-gray-600">{subject.topics}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Admin & Expert Features */}
      <section className="py-16 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white mb-12">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Powerful Admin & Expert Tools
            </h2>
            <p className="mt-4 text-xl text-orange-100">
              Complete management system for educators and administrators
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <div className="text-3xl mb-3">📝</div>
              <h3 className="font-semibold mb-2">Question Management</h3>
              <p className="text-sm text-orange-100">Create, edit, and organize questions with bulk import/export</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-sm text-orange-100">Comprehensive analytics and performance insights</p>
              </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <div className="text-3xl mb-3">👥</div>
              <h3 className="font-semibold mb-2">User Management</h3>
              <p className="text-sm text-orange-100">Manage students, experts, and subscriptions</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-white">
              <div className="text-3xl mb-3">🎓</div>
              <h3 className="font-semibold mb-2">LMS Integration</h3>
              <p className="text-sm text-orange-100">Learning management with H5P, SCORM support</p>
            </div>
          </div>
              </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Success Stories
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Join thousands of successful JEE aspirants
              </p>
            </div>
          <div className="relative">
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  {testimonials[currentTestimonial].avatar}
                </div>
                <blockquote className="text-xl text-gray-700 mb-4">
                  &quot;{testimonials[currentTestimonial].content}&quot;
                </blockquote>
                <div className="font-semibold text-gray-900">{testimonials[currentTestimonial].name}</div>
                <div className="text-orange-600 font-medium">{testimonials[currentTestimonial].score}</div>
              </div>
            </div>
            <div className="flex justify-center mt-6 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentTestimonial ? 'bg-orange-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic Pricing Section */}
      <section id="pricing" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Choose Your Plan
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Flexible pricing for every student&apos;s needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.length > 0 ? plans.filter(plan => plan.isActive).map((plan, index) => (
              <div key={plan.id} className={`bg-white rounded-xl p-6 ${index === 1 ? 'border-2 border-orange-600 relative' : 'border border-gray-200'}`}>
                {index === 1 && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">Most Popular</span>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                  <div className="mt-4 text-3xl font-bold text-gray-900">{formatPrice(plan.priceCents)}</div>
                  <div className="text-gray-600">per {plan.interval.toLowerCase()}</div>
                </div>
                <div className="mt-6">
                  <p className="text-gray-600 text-sm">{plan.description}</p>
                </div>
                <div className="mt-6">
                  <Link 
                    href="/register" 
                    className={`w-full flex justify-center py-2 px-4 rounded-lg transition-colors ${
                      index === 1 
                        ? 'bg-orange-600 text-white hover:bg-orange-700' 
                        : 'border border-orange-600 text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              </div>
            )) : (
              // Default plans if no data
              [
                { name: "Free Trial", price: "₹0", period: "2 days free", description: "Limited practice tests, Basic analytics, Mobile app access" },
                { name: "Standard", price: "₹999", period: "per month", description: "Unlimited practice tests, All PYQ questions, Detailed analytics" },
                { name: "AI Premium", price: "₹1,999", period: "per month", description: "Everything in Standard + AI-generated questions, AI explanations" }
              ].map((plan, index) => (
                <div key={index} className={`bg-white rounded-xl p-6 ${index === 1 ? 'border-2 border-orange-600 relative' : 'border border-gray-200'}`}>
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-orange-600 text-white px-3 py-1 rounded-full text-sm font-medium">Most Popular</span>
                    </div>
                  )}
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                    <div className="mt-4 text-3xl font-bold text-gray-900">{plan.price}</div>
                    <div className="text-gray-500">{plan.period}</div>
                  </div>
                  <div className="mt-6">
                    <p className="text-gray-600 text-sm">{plan.description}</p>
                  </div>
                  <div className="mt-6">
                    <Link 
                      href="/register" 
                      className={`w-full flex justify-center py-2 px-4 rounded-lg transition-colors ${
                        index === 1 
                          ? 'bg-orange-600 text-white hover:bg-orange-700' 
                          : 'border border-orange-600 text-orange-600 hover:bg-orange-50'
                      }`}
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              ))
            )}
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
            Join 25,000+ students who are already preparing with {systemSettings?.siteTitle || 'JEE App'}
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
                  <a href={systemSettings.socialMediaLinks.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                    </svg>
                  </a>
                )}
                {systemSettings?.socialMediaLinks?.twitter && (
                  <a href={systemSettings.socialMediaLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <span className="sr-only">Twitter</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                )}
                {systemSettings?.socialMediaLinks?.youtube && (
                  <a href={systemSettings.socialMediaLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <span className="sr-only">YouTube</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.417-4.814a2.507 2.507 0 0 1 1.768-1.768C5.744 5 11.998 5 11.998 5s6.255 0 7.814.418ZM15.194 12 10 15V9l5.194 3Z" clipRule="evenodd" />
                    </svg>
                  </a>
                )}
                {systemSettings?.socialMediaLinks?.instagram && (
                  <a href={systemSettings.socialMediaLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                    <span className="sr-only">Instagram</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path fillRule="evenodd" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348zm7.718 0c-1.297 0-2.348-1.051-2.348-2.348s1.051-2.348 2.348-2.348 2.348 1.051 2.348 2.348-1.051 2.348-2.348 2.348z" clipRule="evenodd" />
                    </svg>
                  </a>
                )}
                {systemSettings?.socialMediaLinks?.linkedin && (
                  <a href={systemSettings.socialMediaLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
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
                <li><a href="#features" className="text-gray-300 hover:text-white transition-colors">Practice Tests</a></li>
                <li><a href="#features" className="text-gray-300 hover:text-white transition-colors">Previous Year Questions</a></li>
                <li><a href="#features" className="text-gray-300 hover:text-white transition-colors">Analytics</a></li>
                <li><a href="#features" className="text-gray-300 hover:text-white transition-colors">Leaderboard</a></li>
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
