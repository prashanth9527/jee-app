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

export default function HomeTemplate3() {
  const [currentCard, setCurrentCard] = useState(0);
  const { systemSettings, loading: settingsLoading } = useSystemSettings();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const featureCards = [
    {
      title: "AI-Powered Learning",
      description: "Advanced artificial intelligence creates personalized study plans based on your learning patterns and performance.",
      icon: "🤖",
      gradient: "from-blue-500 to-purple-600"
    },
    {
      title: "Comprehensive Analytics",
      description: "Detailed performance insights help you identify strengths and weaknesses across all subjects.",
      icon: "📊",
      gradient: "from-purple-500 to-indigo-600"
    },
    {
      title: "Expert Content",
      description: "High-quality questions and solutions created by JEE experts and IIT alumni.",
      icon: "🎓",
      gradient: "from-indigo-500 to-blue-600"
    }
  ];

  const testimonials = [
    {
      name: "Sneha Reddy",
      score: "JEE Advanced: AIR 89",
      content: "The AI-driven approach helped me focus on my weak areas and improve my overall performance significantly.",
      avatar: "SR"
    },
    {
      name: "Vikram Singh",
      score: "JEE Main: 99.1 percentile",
      content: "The detailed analytics and progress tracking features are incredible. I could see my improvement week by week.",
      avatar: "VS"
    },
    {
      name: "Ananya Gupta",
      score: "JEE Advanced: AIR 156",
      content: "The question bank is extensive and the explanations are crystal clear. This platform is a game-changer!",
      avatar: "AG"
    }
  ];

  const stats = [
    { number: "98.7%", label: "Success Rate", icon: "🎯", color: "text-blue-600" },
    { number: "25K+", label: "Active Students", icon: "👥", color: "text-purple-600" },
    { number: "50K+", label: "Questions", icon: "📚", color: "text-indigo-600" },
    { number: "15+", label: "Years PYQs", icon: "📖", color: "text-blue-700" }
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
      setCurrentCard((prev) => (prev + 1) % featureCards.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const formatPrice = (priceCents: number) => {
    return `₹${(priceCents / 100).toLocaleString()}`;
  };

  if (loading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
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
      
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <HeaderHome />
        
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                Excel in JEE with
                <span className="block bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  Smart Preparation
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
                Join thousands of successful JEE aspirants with our AI-powered learning platform, comprehensive question bank, and expert guidance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/register" 
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
                >
                  Start Free Trial
                </Link>
                <Link 
                  href="/demo" 
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Watch Demo
                </Link>
              </div>
            </div>
          </div>
          
          {/* Animated Background Elements */}
          <div className="absolute top-20 left-20 w-16 h-16 bg-cyan-300/20 rounded-full animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-purple-300/20 rounded-full animate-bounce"></div>
          <div className="absolute top-1/2 left-10 w-12 h-12 bg-blue-300/20 rounded-full animate-ping"></div>
          <div className="absolute bottom-1/3 right-10 w-20 h-20 bg-indigo-300/20 rounded-full animate-pulse"></div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl mb-2">{stat.icon}</div>
                  <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.number}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Cards Section */}
        <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Why Students Choose Us
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our platform combines cutting-edge technology with proven teaching methods to deliver exceptional results.
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <div className={`bg-gradient-to-r ${featureCards[currentCard].gradient} rounded-2xl p-8 text-white shadow-2xl transition-all duration-1000`}>
                <div className="text-center">
                  <div className="text-6xl mb-4">{featureCards[currentCard].icon}</div>
                  <h3 className="text-3xl font-bold mb-4">{featureCards[currentCard].title}</h3>
                  <p className="text-xl text-blue-100 leading-relaxed">{featureCards[currentCard].description}</p>
                </div>
              </div>

              <div className="flex justify-center mt-6 space-x-2">
                {featureCards.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCard(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === currentCard ? 'bg-blue-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI Features Section */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Revolutionary AI Learning Technology
              </h2>
              <p className="text-xl text-gray-600">
                Discover how artificial intelligence transforms your learning experience.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-8 rounded-xl hover:shadow-xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="text-xl font-bold mb-4">AI-Powered Tutor</h3>
                <p className="text-blue-100 mb-6">
                  Personal AI tutor that understands your learning patterns and provides customized guidance 24/7.
                </p>
                <div className="flex items-center text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">Always Available</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-8 rounded-xl hover:shadow-xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-bold mb-4">Deep Learning Analytics</h3>
                <p className="text-purple-100 mb-6">
                  Advanced machine learning algorithms analyze your performance to identify learning gaps and opportunities.
                </p>
                <div className="flex items-center text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">ML Insights</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white p-8 rounded-xl hover:shadow-xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-bold mb-4">Intelligent Question Generation</h3>
                <p className="text-indigo-100 mb-6">
                  AI creates unique practice questions tailored to your current skill level and learning objectives.
                </p>
                <div className="flex items-center text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">Dynamic Content</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 text-white p-8 rounded-xl hover:shadow-xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-bold mb-4">Real-time AI Feedback</h3>
                <p className="text-blue-100 mb-6">
                  Get instant, intelligent feedback with detailed explanations powered by advanced AI reasoning.
                </p>
                <div className="flex items-center text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">Instant AI</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-cyan-600 to-teal-600 text-white p-8 rounded-xl hover:shadow-xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-4">🧠</div>
                <h3 className="text-xl font-bold mb-4">Cognitive Learning Path</h3>
                <p className="text-cyan-100 mb-6">
                  AI maps your cognitive strengths and creates an optimized learning journey for maximum retention.
                </p>
                <div className="flex items-center text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">Brain Optimized</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-teal-600 to-green-600 text-white p-8 rounded-xl hover:shadow-xl transition-all transform hover:scale-105">
                <div className="text-4xl mb-4">📈</div>
                <h3 className="text-xl font-bold mb-4">Predictive Success Modeling</h3>
                <p className="text-teal-100 mb-6">
                  Advanced AI models predict your exam performance and suggest strategic improvements for success.
                </p>
                <div className="flex items-center text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">Future Ready</span>
                </div>
              </div>
            </div>

            <div className="text-center mt-12">
              <Link href="/student/ai/analytics" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold text-lg shadow-lg">
                Experience AI Learning
              </Link>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Success Stories
              </h2>
              <p className="text-xl text-gray-600">
                Hear from students who achieved their JEE dreams with our platform.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-4">
                      {testimonial.avatar}
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">{testimonial.name}</h4>
                    <p className="text-blue-600 font-semibold mb-4">{testimonial.score}</p>
                    <p className="text-gray-600 italic">"{testimonial.content}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        {plans.length > 0 && (
          <section className="py-20 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                  Choose Your Plan
                </h2>
                <p className="text-xl text-gray-600">
                  Flexible pricing options to suit every student's needs.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {plans.slice(0, 3).map((plan) => (
                  <div key={plan.id} className={`bg-white rounded-2xl p-8 shadow-lg border-2 ${
                    plan.name.toLowerCase().includes('premium') ? 'border-blue-500 transform scale-105' : 'border-gray-200'
                  }`}>
                    {plan.name.toLowerCase().includes('premium') && (
                      <div className="text-center mb-4">
                        <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                      <div className="text-4xl font-bold text-blue-600 mb-4">
                        {formatPrice(plan.priceCents)}
                        <span className="text-lg text-gray-500">/{plan.interval}</span>
                      </div>
                      <p className="text-gray-600 mb-6">{plan.description}</p>
                      <Link 
                        href="/register" 
                        className={`block w-full py-3 rounded-lg font-semibold transition-colors ${
                          plan.name.toLowerCase().includes('premium') 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700' 
                            : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                        }`}
                      >
                        Get Started
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Start Your JEE Journey?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of successful students and take your preparation to the next level.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors shadow-lg"
              >
                Start Free Trial
              </Link>
              <Link 
                href="/contact" 
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                Contact Us
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
