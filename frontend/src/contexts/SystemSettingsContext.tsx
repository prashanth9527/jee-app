'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '@/lib/api';

interface SystemSettings {
  id?: string;
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  logoUrl?: string;
  logoFooter?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

interface SystemSettingsContextType {
  systemSettings: SystemSettings | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

interface SystemSettingsProviderProps {
  children: ReactNode;
}

export function SystemSettingsProvider({ children }: SystemSettingsProviderProps) {
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystemSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/system-settings');
      setSystemSettings(response.data);
    } catch (err: any) {
      console.error('Error fetching system settings:', err);
      setError(err.message || 'Failed to fetch system settings');
      
      // Set default settings if fetch fails
      setSystemSettings({
        siteTitle: 'JEE App',
        siteDescription: 'Comprehensive JEE preparation platform',
        siteKeywords: 'JEE, IIT, engineering, entrance exam, preparation',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const value: SystemSettingsContextType = {
    systemSettings,
    loading,
    error,
    refetch: fetchSystemSettings,
  };

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

export function useSystemSettings() {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider');
  }
  return context;
}
