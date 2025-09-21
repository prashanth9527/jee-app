'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import Swal from 'sweetalert2';

interface SystemSettings {
  id: string;
  siteTitle: string;
  siteDescription?: string;
  siteKeywords?: string;
  logoUrl?: string;
  faviconUrl?: string;
  ogImageUrl?: string;
  contactEmail?: string;
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
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  homeTemplate?: string;
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingOgImage, setUploadingOgImage] = useState(false);

  const [formData, setFormData] = useState({
    siteTitle: '',
    siteDescription: '',
    siteKeywords: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    facebookUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    googleAnalyticsId: '',
    facebookPixelId: '',
    customCss: '',
    customJs: '',
    maintenanceMode: false,
    maintenanceMessage: '',
    homeTemplate: 'default',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/admin/system-settings');
      setSettings(response.data);
      setFormData({
        siteTitle: response.data.siteTitle || '',
        siteDescription: response.data.siteDescription || '',
        siteKeywords: response.data.siteKeywords || '',
        contactEmail: response.data.contactEmail || '',
        contactPhone: response.data.contactPhone || '',
        address: response.data.address || '',
        facebookUrl: response.data.facebookUrl || '',
        twitterUrl: response.data.twitterUrl || '',
        linkedinUrl: response.data.linkedinUrl || '',
        instagramUrl: response.data.instagramUrl || '',
        youtubeUrl: response.data.youtubeUrl || '',
        googleAnalyticsId: response.data.googleAnalyticsId || '',
        facebookPixelId: response.data.facebookPixelId || '',
        customCss: response.data.customCss || '',
        customJs: response.data.customJs || '',
        maintenanceMode: response.data.maintenanceMode || false,
        maintenanceMessage: response.data.maintenanceMessage || '',
        homeTemplate: response.data.homeTemplate || 'default',
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      Swal.fire('Error', 'Failed to fetch system settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put('/admin/system-settings', formData);
      setSettings(response.data);
      Swal.fire('Success', 'System settings updated successfully', 'success');
    } catch (error) {
      console.error('Error updating settings:', error);
      Swal.fire('Error', 'Failed to update system settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'logo' | 'favicon' | 'ogImage') => {
    const formData = new FormData();
    formData.append(type, file);

    try {
      let response;
      switch (type) {
        case 'logo':
          setUploadingLogo(true);
          response = await api.post('/admin/system-settings/upload/logo', formData);
          break;
        case 'favicon':
          setUploadingFavicon(true);
          response = await api.post('/admin/system-settings/upload/favicon', formData);
          break;
        case 'ogImage':
          setUploadingOgImage(true);
          response = await api.post('/admin/system-settings/upload/og-image', formData);
          break;
      }

      if (response?.data) {
        setSettings(prev => prev ? { ...prev, [`${type}Url`]: response.data[`${type}Url`] } : null);
        Swal.fire('Success', `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`, 'success');
      }
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      Swal.fire('Error', `Failed to upload ${type}`, 'error');
    } finally {
      setUploadingLogo(false);
      setUploadingFavicon(false);
      setUploadingOgImage(false);
    }
  };

  const handleDeleteImage = async (type: 'logo' | 'favicon' | 'ogImage') => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `This will delete the current ${type}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/admin/system-settings/${type}`);
        setSettings(prev => prev ? { ...prev, [`${type}Url`]: null } : null);
        Swal.fire('Deleted!', `${type.charAt(0).toUpperCase() + type.slice(1)} has been deleted.`, 'success');
      } catch (error) {
        console.error(`Error deleting ${type}:`, error);
        Swal.fire('Error', `Failed to delete ${type}`, 'error');
      }
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
            <h1 className="text-3xl font-bold mb-2">System Settings</h1>
            <p className="text-purple-100">Manage your application's branding, SEO, and configuration</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Site Title *
                    </label>
                    <input
                      type="text"
                      value={formData.siteTitle}
                      onChange={(e) => setFormData(prev => ({ ...prev, siteTitle: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="Enter site title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Site Description
                    </label>
                    <textarea
                      value={formData.siteDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, siteDescription: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="Enter site description for SEO"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Site Keywords
                    </label>
                    <input
                      type="text"
                      value={formData.siteKeywords}
                      onChange={(e) => setFormData(prev => ({ ...prev, siteKeywords: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="Enter keywords separated by commas"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Home Page Template
                    </label>
                    <select
                      value={formData.homeTemplate}
                      onChange={(e) => setFormData(prev => ({ ...prev, homeTemplate: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    >
                      <option value="default">Default Template (Orange/Red Theme)</option>
                      <option value="template2">Template 2 (Green/Teal Theme)</option>
                      <option value="template3">Template 3 (Blue/Purple Theme)</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-1">
                      Choose the design template for your home page. Changes will be visible immediately.
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="contact@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="text"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="+1234567890"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="Enter business address"
                    />
                  </div>
                </div>
              </div>

              {/* Social Media Links */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Social Media Links</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Facebook URL
                    </label>
                    <input
                      type="url"
                      value={formData.facebookUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, facebookUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="https://facebook.com/yourpage"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Twitter URL
                    </label>
                    <input
                      type="url"
                      value={formData.twitterUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, twitterUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="https://twitter.com/yourhandle"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={formData.linkedinUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, linkedinUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="https://linkedin.com/company/yourcompany"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Instagram URL
                    </label>
                    <input
                      type="url"
                      value={formData.instagramUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, instagramUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="https://instagram.com/yourhandle"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      YouTube URL
                    </label>
                    <input
                      type="url"
                      value={formData.youtubeUrl}
                      onChange={(e) => setFormData(prev => ({ ...prev, youtubeUrl: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="https://youtube.com/yourchannel"
                    />
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Analytics & Tracking</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Google Analytics ID
                    </label>
                    <input
                      type="text"
                      value={formData.googleAnalyticsId}
                      onChange={(e) => setFormData(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="G-XXXXXXXXXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Facebook Pixel ID
                    </label>
                    <input
                      type="text"
                      value={formData.facebookPixelId}
                      onChange={(e) => setFormData(prev => ({ ...prev, facebookPixelId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="XXXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Custom Code */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Custom Code</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Custom CSS
                    </label>
                    <textarea
                      value={formData.customCss}
                      onChange={(e) => setFormData(prev => ({ ...prev, customCss: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white font-mono text-sm"
                      placeholder="/* Add your custom CSS here */"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Custom JavaScript
                    </label>
                    <textarea
                      value={formData.customJs}
                      onChange={(e) => setFormData(prev => ({ ...prev, customJs: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white font-mono text-sm"
                      placeholder="// Add your custom JavaScript here"
                    />
                  </div>
                </div>
              </div>

              {/* Maintenance Mode */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Maintenance Mode</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="maintenanceMode"
                      checked={formData.maintenanceMode}
                      onChange={(e) => setFormData(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
                      Enable Maintenance Mode
                    </label>
                  </div>

                  {formData.maintenanceMode && (
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Maintenance Message
                      </label>
                      <textarea
                        value={formData.maintenanceMessage}
                        onChange={(e) => setFormData(prev => ({ ...prev, maintenanceMessage: e.target.value }))}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        placeholder="Enter maintenance message to display to users"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="bg-white rounded-lg shadow p-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>

            {/* Image Uploads */}
            <div className="space-y-6">
              {/* Logo Upload */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Logo</h2>
                <div className="space-y-4">
                  {settings?.logoUrl && (
                    <div className="text-center">
                      <img
                        src={settings.logoUrl}
                        alt="Current Logo"
                        className="max-w-full h-20 mx-auto mb-2"
                      />
                      <button
                        onClick={() => handleDeleteImage('logo')}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete Logo
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Upload Logo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'logo');
                        }
                      }}
                      disabled={uploadingLogo}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: PNG, JPG, SVG (max 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Favicon Upload */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Favicon</h2>
                <div className="space-y-4">
                  {settings?.faviconUrl && (
                    <div className="text-center">
                      <img
                        src={settings.faviconUrl}
                        alt="Current Favicon"
                        className="w-8 h-8 mx-auto mb-2"
                      />
                      <button
                        onClick={() => handleDeleteImage('favicon')}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete Favicon
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Upload Favicon
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'favicon');
                        }
                      }}
                      disabled={uploadingFavicon}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: ICO, PNG (32x32px, max 2MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* OG Image Upload */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Social Media Image</h2>
                <div className="space-y-4">
                  {settings?.ogImageUrl && (
                    <div className="text-center">
                      <img
                        src={settings.ogImageUrl}
                        alt="Current OG Image"
                        className="max-w-full h-32 mx-auto mb-2"
                      />
                      <button
                        onClick={() => handleDeleteImage('ogImage')}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Delete Image
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Upload Social Media Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(file, 'ogImage');
                        }
                      }}
                      disabled={uploadingOgImage}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 1200x630px (max 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
} 