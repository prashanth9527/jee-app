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

export default function HomeTemplate2() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { systemSettings, loading: settingsLoading } = useSystemSettings();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const heroSlides = [
    {
      title: "Master JEE with AI",
      subtitle: "Personalized learning paths powered by advanced AI technology",
      image: "data:image/svg+xml,%3Csvg width='600' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='600' height='400' fill='%23059669'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='white' text-anchor='middle' dy='.3em'%3EAI Learning%3C/text%3E%3C/svg%3E",
      bgColor: "from-emerald-600 to-teal-700"
    },
    {
      title: "50,000+ Questions",
      subtitle: "Comprehensive question bank covering all JEE topics",
      image: "data:image/svg+xml,%3Csvg width='600' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='600' height='400' fill='%23059669'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='white' text-anchor='middle' dy='.3em'%3EQuestions%3C/text%3E%3C/svg%3E",
      bgColor: "from-teal-600 to-cyan-700"
    },
    {
      title: "Detailed Analytics",
      subtitle: "Track your progress with comprehensive performance insights",
      image: "data:image/svg+xml,%3Csvg width='600' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='600' height='400' fill='%23059669'/%3E%3Ctext x='50%25' y='50%25' font-size='24' fill='white' text-anchor='middle' dy='.3em'%3EAnalytics%3C/text%3E%3C/svg%3E",
      bgColor: "from-cyan-600 to-blue-700"
    }
  ];

  const features = [
    {
      icon: "🧠",
      title: "Smart AI Tutor",
      description: "Get personalized explanations and learning recommendations"
    },
    {
      icon: "📈",
      title: "Progress Tracking",
      description: "Monitor your improvement with detailed analytics"
    },
    {
      icon: "🎯",
      title: "Targeted Practice",
      description: "Focus on weak areas with intelligent question selection"
    },
    {
      icon: "⚡",
      title: "Instant Feedback",
      description: "Get immediate explanations for every question"
    }
  ];

  const stats = [
    { number: "98.7%", label: "Success Rate", color: "text-emerald-600" },
    { number: "25K+", label: "Students", color: "text-teal-600" },
    { number: "50K+", label: "Questions", color: "text-cyan-600" },
    { number: "15+", label: "Years PYQs", color: "text-blue-600" }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, plansRes] = await Promise.all([
          api.get('/subjects').catch(() => ({ data: [] })),
          api.get('/plans').catch(() => ({ data: [] }))
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
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const formatPrice = (priceCents: number) => {
    return `₹${(priceCents / 100).toLocaleString()}`;
  };

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <>
      <DynamicHead 
        title={systemSettings?.siteTitle || 'JEE App'} 
        description={systemSettings?.siteDescription || 'Comprehensive JEE preparation platform'} 
        keywords={systemSettings?.siteKeywords}
        ogImage={systemSettings?.ogImageUrl}
      />
      <DynamicFavicon faviconUrl={systemSettings?.faviconUrl} />
      
      <main className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <HeaderHome />
        
        {/* Hero Section with Slider */}
        <section className="relative overflow-hidden">
          <div className={`absolute inset-0 bg-gradient-to-r ${heroSlides[currentSlide].bgColor} transition-all duration-1000`}></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-white">
                <h1 className="text-4xl md:text-6xl font-bold mb-6">
                  {heroSlides[currentSlide].title}
                </h1>
                <p className="text-xl md:text-2xl text-emerald-100 mb-8">
                  {heroSlides[currentSlide].subtitle}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/register" 
                    className="bg-white text-emerald-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-50 transition-colors shadow-lg"
                  >
                    Start Learning Now
                  </Link>
                  <Link 
                    href="/demo" 
                    className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-emerald-600 transition-colors"
                  >
                    Try Demo
                  </Link>
                </div>
              </div>
              <div className="relative">
                <img 
                  src={heroSlides[currentSlide].image} 
                  alt={`${heroSlides[currentSlide].title} - ${heroSlides[currentSlide].subtitle}`}
                  className="w-full h-80 object-cover rounded-2xl shadow-2xl"
                />
                <div className="absolute bottom-4 left-4 right-4 flex space-x-2">
                  {heroSlides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentSlide(index)}
                      aria-label={`Go to slide ${index + 1}: ${heroSlides[index].title}`}
                      className={`flex-1 h-1 rounded-full ${
                        index === currentSlide ? 'bg-white' : 'bg-white/30'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.number}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-emerald-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Powerful Features
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Everything you need to excel in JEE preparation, all in one platform.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                AI-Powered Learning Features
              </h2>
              <p className="text-xl text-gray-600">
                Experience the future of education with our advanced AI technology.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white p-8 rounded-xl hover:shadow-xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-bold mb-4">Smart AI Tutor</h3>
                <p className="text-emerald-100 mb-6">
                  Get personalized explanations and learning recommendations tailored to your learning style and pace.
                </p>
                <div className="flex items-center text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">24/7 Available</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white p-8 rounded-xl hover:shadow-xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold mb-4">Intelligent Analytics</h3>
                <p className="text-teal-100 mb-6">
                  Advanced performance tracking with detailed insights on your strengths, weaknesses, and progress trends.
                </p>
                <div className="flex items-center text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">Real-time Insights</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white p-8 rounded-xl hover:shadow-xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold mb-4">Adaptive Practice</h3>
                <p className="text-cyan-100 mb-6">
                  AI-generated practice questions that adapt to your skill level and focus on areas that need improvement.
                </p>
                <div className="flex items-center text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">Personalized</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-8 rounded-xl hover:shadow-xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-bold mb-4">Instant Feedback</h3>
                <p className="text-blue-100 mb-6">
                  Get immediate, detailed explanations for every question with AI-powered solution analysis.
                </p>
                <div className="flex items-center text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">Instant Results</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-8 rounded-xl hover:shadow-xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="text-xl font-bold mb-4">Smart Recommendations</h3>
                <p className="text-indigo-100 mb-6">
                  AI suggests the best study path based on your performance, goals, and learning preferences.
                </p>
                <div className="flex items-center text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">Optimized Path</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-pink-600 text-white p-8 rounded-xl hover:shadow-xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-xl font-bold mb-4">Progress Prediction</h3>
                <p className="text-purple-100 mb-6">
                  AI predicts your exam performance and suggests targeted improvements to maximize your success.
                </p>
                <div className="flex items-center text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">Predictive Analytics</span>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link href="/student/ai/analytics" className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-4 rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all font-semibold text-lg shadow-lg">
                Explore AI Features
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        {plans.length > 0 && (
          <section className="py-20 bg-gradient-to-br from-emerald-50 to-teal-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Flexible Pricing
                </h2>
                <p className="text-xl text-gray-600">
                  Choose the plan that fits your learning needs and budget.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {plans.slice(0, 3).map((plan) => (
                  <div key={plan.id} className={`bg-white rounded-2xl p-8 shadow-lg relative ${
                    plan.name.toLowerCase().includes('premium') ? 'ring-2 ring-emerald-500 transform scale-105' : ''
                  }`}>
                    {plan.name.toLowerCase().includes('premium') && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <span className="bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="text-4xl font-bold text-emerald-600 mb-4">
                        {formatPrice(plan.priceCents)}
                        <span className="text-lg text-gray-500">/{plan.interval}</span>
                      </div>
                      <p className="text-gray-600 mb-6">{plan.description}</p>
                      <Link 
                        href="/register" 
                        className={`block w-full py-3 rounded-lg font-semibold transition-colors ${
                          plan.name.toLowerCase().includes('premium') 
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        Choose Plan
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Ace JEE?
            </h2>
            <p className="text-xl text-emerald-100 mb-8">
              Join thousands of successful students and start your journey to IIT today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className="bg-white text-emerald-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-50 transition-colors shadow-lg"
              >
                Get Started Free
              </Link>
              <Link 
                href="/contact" 
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-emerald-600 transition-colors"
              >
                Talk to Expert
              </Link>
            </div>
          </div>
        </section>

      <DynamicFooter />
      <MobileNavigation />
      </main>
    </>
  );
}
