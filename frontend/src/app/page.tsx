'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import DynamicHead from '@/components/DynamicHead';
import HeaderHome from '@/components/HeaderHome';
import DynamicFavicon from '@/components/DynamicFavicon';
import DynamicFooter from '@/components/DynamicFooter';
import MobileNavigation from '@/components/MobileNavigation';
import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import HomeTemplate2 from '@/components/home-templates/HomeTemplate2';
import HomeTemplate3 from '@/components/home-templates/HomeTemplate3';

interface SystemSettings {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  logoUrl?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  contactEmail?: string;
  supportEmail?: string;
  privacyEmail?: string;
  legalEmail?: string;
  contactPhone?: string;
  address?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  googleAnalyticsId?: string;
  facebookPixelId?: string;
  customCss?: string;
  customJs?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  homeTemplate?: string;
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
  const { systemSettings, loading: settingsLoading } = useSystemSettings();

  // Template switching logic
  if (settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Get the home template setting, default to 'default' (existing home page)
  const homeTemplate = systemSettings?.homeTemplate || 'default';

  // Render the appropriate template based on the setting
  switch (homeTemplate) {
    case 'template2':
      return <HomeTemplate2 />;
    case 'template3':
      return <HomeTemplate3 />;
    default:
      // Render the existing home page (default template)
      return <DefaultHomePage />;
  }
}

// Default Home Page Component (existing implementation)
function DefaultHomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [currentFeature, setCurrentFeature] = useState(0);
  const { systemSettings, loading: settingsLoading } = useSystemSettings();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

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
      title: "Extensive Question Bank",
      description: "Over 50,000+ practice questions with detailed solutions, covering all JEE Main and Advanced topics",
      bgGradient: "from-red-500 to-red-600",
      image: "data:image/svg+xml,%3Csvg width='300' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='300' height='200' fill='%23dc2626'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='white' text-anchor='middle' dy='.3em'%3EQuestions%3C/text%3E%3C/svg%3E"
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
        const [subjectsRes, plansRes] = await Promise.all([
          api.get('/subjects').catch(() => ({ data: [] })), // Public subjects endpoint
          api.get('/plans').catch(() => ({ data: [] })) // Public plans endpoint
        ]);

        setSubjects(subjectsRes.data || []);
        setPlans(plansRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
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

  const formatPrice = (priceCents: number) => {
    return `₹${(priceCents / 100).toLocaleString()}`;
  };

  if (loading || settingsLoading) {
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
        title="Home"
        description={systemSettings?.siteDescription}
      />
      <main className="min-h-screen bg-white">
      {/* Navigation */}
      <HeaderHome systemSettings={systemSettings || undefined} />

      {/* Hero Section with Feature Carousel */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-orange-50 via-white to-red-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-12 items-center">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-bold text-gray-900 tracking-tight sm:text-5xl md:text-6xl">
              Master JEE with
                <span className="block text-orange-600">Smart Practice</span>
              </h1>
              <p className="mt-6 text-xl text-gray-500 max-w-3xl">
                {systemSettings?.siteDescription || 'Comprehensive JEE preparation platform'}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link
                  href="/register"
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 transition-colors duration-200"
                >
                  Start Free Trial →
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  Sign In
                </Link>
              </div>
              <p className="mt-4 text-sm text-gray-500">
                Free 2-day trial • No credit card required • Join 25,000+ students
              </p>
            </div>
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="relative">
                <div className="bg-red-600 rounded-lg p-8 text-white">
                  <h2 className="text-2xl font-bold mb-4">PYQ Bank</h2>
                  <div className="bg-white rounded-lg p-6 text-gray-900">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                        <span className="text-2xl">📚</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Previous Year Questions</h3>
                      </div>
                    </div>
                    <p className="text-gray-600">
                      Extensive collection of JEE Main & Advanced questions from past 15+ years with detailed solutions and tips.
                    </p>
                  </div>
                </div>
                <div className="absolute top-4 right-4 flex space-x-2">
                  <button className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all">
                    <span className="text-white">‹</span>
                  </button>
                  <button className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-all">
                    <span className="text-white">›</span>
                  </button>
                </div>
                <div className="flex justify-center mt-4 space-x-2">
                  {[1, 2, 3, 4, 5].map((dot) => (
                    <div
                      key={dot}
                      className={`w-2 h-2 rounded-full ${
                        dot === 1 ? 'bg-orange-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="features" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-3xl font-bold text-gray-900">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features Section */}
      <section id="ai-features" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              AI-Powered Learning Experience
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Revolutionary artificial intelligence that transforms how you learn and prepare for JEE
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart AI Tutor</h3>
              <p className="text-gray-600 mb-4">
                Personal AI tutor that adapts to your learning style and provides 24/7 guidance with personalized explanations.
              </p>
              <div className="text-sm text-orange-600 font-medium">Always Available</div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Intelligent Analytics</h3>
              <p className="text-gray-600 mb-4">
                Advanced performance tracking with detailed insights on your strengths, weaknesses, and learning progress.
              </p>
              <div className="text-sm text-orange-600 font-medium">Real-time Insights</div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Adaptive Practice</h3>
              <p className="text-gray-600 mb-4">
                AI generates personalized practice questions that adapt to your skill level and focus on improvement areas.
              </p>
              <div className="text-sm text-orange-600 font-medium">Personalized Content</div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Instant AI Feedback</h3>
              <p className="text-gray-600 mb-4">
                Get immediate, detailed explanations for every question with AI-powered solution analysis and tips.
              </p>
              <div className="text-sm text-orange-600 font-medium">Instant Results</div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Smart Recommendations</h3>
              <p className="text-gray-600 mb-4">
                AI analyzes your performance and suggests the optimal study path and resources for maximum success.
              </p>
              <div className="text-sm text-orange-600 font-medium">Optimized Learning</div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Success Prediction</h3>
              <p className="text-gray-600 mb-4">
                Advanced AI models predict your exam performance and suggest targeted improvements for better results.
              </p>
              <div className="text-sm text-orange-600 font-medium">Future Ready</div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link href="/student/ai/analytics" className="bg-orange-600 text-white px-8 py-4 rounded-lg hover:bg-orange-700 transition-colors font-semibold text-lg shadow-lg">
              Explore AI Features
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Success Stories
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Hear from students who achieved their JEE dreams
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                  {testimonials[currentTestimonial].avatar}
                </div>
                <blockquote className="text-xl text-gray-700 mb-4">
                  "{testimonials[currentTestimonial].content}"
                </blockquote>
                <div className="font-semibold text-gray-900">
                  {testimonials[currentTestimonial].name}
                </div>
                <div className="text-orange-600">
                  {testimonials[currentTestimonial].score}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose the plan that works best for your JEE preparation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.length > 0 ? (
              plans.map((plan, index) => {
                // Determine if this is a popular/recommended plan
                const isPopular = plan.name.toLowerCase().includes('premium') || 
                                plan.name.toLowerCase().includes('pro') || 
                                plan.name.toLowerCase().includes('standard') ||
                                (plans.length === 3 && index === 1); // Middle plan in 3-plan layout
                
                // Get plan features based on price range
                const getPlanFeatures = (priceCents: number) => {
                  if (priceCents < 150000) { // Less than ₹1500
                    return [
                      'Basic practice questions',
                      'Limited AI suggestions',
                      'Basic analytics',
                      '2-day free trial'
                    ];
                  } else if (priceCents < 250000) { // Less than ₹2500
                    return [
                      'Unlimited practice questions',
                      'Advanced AI suggestions',
                      'Detailed analytics',
                      'Previous year papers',
                      'Priority support',
                      '2-day free trial'
                    ];
                  } else {
                    return [
                      'Everything in Premium',
                      'Personal mentor sessions',
                      'Custom study plans',
                      'Exam paper analysis',
                      'Priority support',
                      '2-day free trial'
                    ];
                  }
                };

                return (
                  <div key={plan.id} className={`bg-white rounded-lg shadow-lg p-8 relative ${
                    isPopular 
                      ? 'ring-2 ring-orange-600 transform scale-105' 
                      : 'hover:shadow-xl transition-shadow duration-300'
                  }`}>
                    {isPopular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                          Most Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="mb-4">
                        <span className="text-4xl font-bold text-gray-900">
                          {formatPrice(plan.priceCents)}
                        </span>
                        <span className="text-gray-600">/{plan.interval.toLowerCase()}</span>
                      </div>
                      <p className="text-gray-600 mb-6">{plan.description}</p>
                      
                      {/* Plan Features */}
                      <div className="mb-6">
                        <ul className="space-y-2 text-sm text-gray-600">
                          {getPlanFeatures(plan.priceCents).map((feature, featureIndex) => (
                            <li key={featureIndex} className="flex items-center justify-center">
                              <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <Link
                        href="/register"
                        className={`w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md transition-all duration-200 ${
                          isPopular
                            ? 'text-white bg-orange-600 hover:bg-orange-700 shadow-lg hover:shadow-xl'
                            : 'text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200'
                        }`}
                      >
                        Get Started
                        {isPopular && (
                          <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        )}
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              // Fallback pricing cards when plans are not loaded
              [
                { 
                  id: 'fallback-1', 
                  name: 'Basic', 
                  description: 'Perfect for getting started with JEE preparation',
                  priceCents: 99900, 
                  interval: 'MONTH',
                  isPopular: false,
                  features: ['Basic practice questions', 'Limited AI suggestions', 'Basic analytics', '2-day free trial']
                },
                { 
                  id: 'fallback-2', 
                  name: 'Premium', 
                  description: 'Most popular choice with advanced features',
                  priceCents: 199900, 
                  interval: 'MONTH',
                  isPopular: true,
                  features: ['Unlimited practice questions', 'Advanced AI suggestions', 'Detailed analytics', 'Previous year papers', 'Priority support', '2-day free trial']
                },
                { 
                  id: 'fallback-3', 
                  name: 'Pro', 
                  description: 'Complete JEE preparation with all features',
                  priceCents: 299900, 
                  interval: 'MONTH',
                  isPopular: false,
                  features: ['Everything in Premium', 'Personal mentor sessions', 'Custom study plans', 'Exam paper analysis', 'Priority support', '2-day free trial']
                }
              ].map((plan) => (
                <div key={plan.id} className={`bg-white rounded-lg shadow-lg p-8 relative ${
                  plan.isPopular 
                    ? 'ring-2 ring-orange-600 transform scale-105' 
                    : 'hover:shadow-xl transition-shadow duration-300'
                }`}>
                  {plan.isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-orange-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Most Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(plan.priceCents)}
                      </span>
                      <span className="text-gray-600">/{plan.interval.toLowerCase()}</span>
                    </div>
                    <p className="text-gray-600 mb-6">{plan.description}</p>
                    
                    {/* Plan Features */}
                    <div className="mb-6">
                      <ul className="space-y-2 text-sm text-gray-600">
                        {plan.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center justify-center">
                            <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <Link
                      href="/register"
                      className={`w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md transition-all duration-200 ${
                        plan.isPopular
                          ? 'text-white bg-orange-600 hover:bg-orange-700 shadow-lg hover:shadow-xl'
                          : 'text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200'
                      }`}
                    >
                      Get Started
                      {plan.isPopular && (
                        <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      )}
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              All plans include a 2-day free trial • No credit card required
            </p>
            <Link
              href="/help"
              className="text-orange-600 hover:text-orange-700 font-medium"
            >
              Need help choosing? Contact us →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl mb-4">
            Ready to Start Your JEE Journey?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join 25,000+ students who are already preparing with {systemSettings?.siteTitle || 'JEE App'}
          </p>
          <Link
            href="/register"
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-orange-600 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            Start Your Free Trial Today →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <DynamicFooter />
      <MobileNavigation />
      </main>
      </>
      );
}
