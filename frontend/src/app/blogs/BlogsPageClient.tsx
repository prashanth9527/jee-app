'use client';

import { useSystemSettings } from '@/contexts/SystemSettingsContext';
import HeaderSecondary from '@/components/HeaderSecondary';

export default function BlogsPageClient() {
  const { systemSettings } = useSystemSettings();
  return <HeaderSecondary systemSettings={systemSettings || undefined} />;
}
