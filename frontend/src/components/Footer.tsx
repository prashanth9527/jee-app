'use client';

import Link from 'next/link';

interface SystemSettings {
  siteTitle: string;
  siteDescription: string;
  contactEmail?: string;
  supportEmail?: string;
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
}

interface FooterProps {
  systemSettings?: SystemSettings;
}

export default function Footer({ systemSettings }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand and Description */}
          <div className="md:col-span-1">
            <Link 
              href="/" 
              className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent hover:from-orange-500 hover:to-red-500 transition-all duration-200 block mb-2"
              title={`${systemSettings?.siteTitle || 'JEE Master'} - ${systemSettings?.siteDescription || 'JEE preparation platform'}`}
              aria-label={`${systemSettings?.siteTitle || 'JEE Master'} - Go to homepage`}
            >
              {systemSettings?.siteTitle || 'JEE Master'}
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              {systemSettings?.siteDescription || 'Comprehensive JEE preparation platform'}
            </p>
          </div>

          {/* Platform Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">PLATFORM</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/practice-tests" className="text-white hover:text-orange-400 transition-colors text-sm">
                  Practice Tests
                </Link>
              </li>
              <li>
                <Link href="/previous-year-questions" className="text-white hover:text-orange-400 transition-colors text-sm">
                  Previous Year Questions
                </Link>
              </li>
              <li>
                <Link href="/analytics" className="text-white hover:text-orange-400 transition-colors text-sm">
                  Analytics
                </Link>
              </li>
              <li>
                <Link href="/leaderboard" className="text-white hover:text-orange-400 transition-colors text-sm">
                  Leaderboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">SUPPORT</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/help" className="text-white hover:text-orange-400 transition-colors text-sm">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-white hover:text-orange-400 transition-colors text-sm">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-white hover:text-orange-400 transition-colors text-sm">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-white hover:text-orange-400 transition-colors text-sm">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex justify-center">
            <p className="text-gray-400 text-sm text-center">
              © 2024 {systemSettings?.siteTitle || 'JEE Master'}. All rights reserved. Built for JEE aspirants by JEE experts.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
