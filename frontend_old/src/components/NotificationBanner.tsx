'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

interface Notification {
  id: string;
  title: string;
  message?: string;
  link?: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  validFrom: string;
  validUntil: string;
}

export default function NotificationBanner() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications/student');
        setNotifications(response.data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    if (notifications.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % notifications.length);
      }, 5000); // Change notification every 5 seconds

      return () => clearInterval(interval);
    }
  }, [notifications.length]);

  if (loading || notifications.length === 0) {
    return null;
  }

  const currentNotification = notifications[currentIndex];
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500';
      case 'HIGH':
        return 'bg-orange-500';
      case 'NORMAL':
        return 'bg-blue-500';
      case 'LOW':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'Urgent';
      case 'HIGH':
        return 'Important';
      case 'NORMAL':
        return 'Notice';
      case 'LOW':
        return 'Info';
      default:
        return 'Notice';
    }
  };

  return (
    <div className="relative bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${getPriorityColor(currentNotification.priority)}`}>
              {getPriorityText(currentNotification.priority)}
            </span>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                {currentNotification.title}
              </h3>
              {currentNotification.message && (
                <p className="text-sm text-gray-600 mt-1">
                  {currentNotification.message}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {currentNotification.link && (
              <Link
                href={currentNotification.link}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                View Details
                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
            
            <Link
              href="/student/notifications"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>
        </div>
        
        {/* Progress indicator for multiple notifications */}
        {notifications.length > 1 && (
          <div className="flex space-x-1 mt-2">
            {notifications.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`h-1 w-8 rounded-full transition-colors ${
                  index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
