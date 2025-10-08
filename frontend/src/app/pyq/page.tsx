'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Clock, Users, TrendingUp, ArrowRight } from 'lucide-react';

export default function PYQPage() {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalYears: 0,
    totalStudents: 0,
    successRate: 0
  });

  useEffect(() => {
    // Mock data - in real app, fetch from API
    setStats({
      totalQuestions: 15000,
      totalYears: 10,
      totalStudents: 50000,
      successRate: 85
    });
  }, []);

  const subjects = [
    {
      name: 'Physics',
      questions: 5000,
      color: 'bg-red-500',
      icon: '⚡'
    },
    {
      name: 'Chemistry',
      questions: 5000,
      color: 'bg-green-500',
      icon: '🧪'
    },
    {
      name: 'Mathematics',
      questions: 5000,
      color: 'bg-blue-500',
      icon: '📐'
    }
  ];

  const years = [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Previous Year Questions Bank</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Access 15,000+ authentic JEE Main & Advanced questions from the last 10 years. 
            Practice with real exam questions and boost your confidence.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalQuestions.toLocaleString()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Questions</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalYears}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Years</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalStudents.toLocaleString()}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Students</div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
            <TrendingUp className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.successRate}%</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">Success Rate</div>
          </div>
        </div>

        {/* Login Prompt */}
        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-200 mb-2">Ready to Start Practicing?</h3>
              <p className="text-blue-800 dark:text-blue-300">
                Sign in to access our complete PYQ bank with detailed solutions, 
                performance analytics, and personalized recommendations.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Subjects */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Subjects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {subjects.map((subject, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-12 h-12 ${subject.color} rounded-lg flex items-center justify-center text-white text-xl`}>
                    {subject.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{subject.name}</h3>
                    <p className="text-gray-600">{subject.questions.toLocaleString()} questions</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">JEE Main</span>
                    <span className="font-medium">{Math.floor(subject.questions * 0.6).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">JEE Advanced</span>
                    <span className="font-medium">{Math.floor(subject.questions * 0.4).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Years */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Years</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {years.map((year) => (
              <div key={year} className="bg-white rounded-lg shadow-md p-4 text-center hover:shadow-lg transition-shadow">
                <div className="text-lg font-semibold text-gray-900 mb-1">{year}</div>
                <div className="text-sm text-gray-600">1,500+ questions</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Why Choose Our PYQ Bank?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Authentic Questions</h3>
              <p className="text-gray-600 text-sm">
                All questions are sourced directly from official JEE exam papers
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Detailed Solutions</h3>
              <p className="text-gray-600 text-sm">
                Step-by-step solutions with explanations for every question
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Performance Analytics</h3>
              <p className="text-gray-600 text-sm">
                Track your progress and identify areas for improvement
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





