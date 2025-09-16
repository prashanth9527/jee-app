"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import api from '@/lib/api';
import DynamicHead from '@/components/DynamicHead';
import { useRouter } from 'next/navigation';
import StudentLayout from '@/components/StudentLayout';

interface SystemSettings {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
}

export default function StudentProfileSettingsPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  
  // Personal Information
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  
  // Email Change
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  
  // Phone Change
  const [newPhone, setNewPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  
  // Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Profile Picture Upload
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  // Success/Error messages
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch system settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await api.get('/system-settings');
        setSystemSettings(response.data);
      } catch {
        setSystemSettings({ 
          siteTitle: 'JEE App', 
          siteDescription: 'Comprehensive JEE preparation platform',
          siteKeywords: 'JEE preparation, JEE Main, JEE Advanced'
        });
      }
    };

    fetchSettings();
  }, []);

  // Initialize form data from user context
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setProfilePicture(user.profilePicture || '');
    }
  }, [user]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (profilePicPreview) {
        URL.revokeObjectURL(profilePicPreview);
      }
    };
  }, [profilePicPreview]);

  // Redirect if not authenticated or not student
  useEffect(() => {
    if (!user && !loading) {
      router.push('/login');
    } else if (user && user.role !== 'STUDENT') {
      const dashboardUrl = user.role === 'ADMIN' ? '/admin' : 
                          user.role === 'EXPERT' ? '/expert' : '/dashboard';
      router.push(dashboardUrl);
    }
  }, [user, loading, router]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Update personal information
  const handleUpdatePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/user/profile', {
        fullName
      });

      if (response.data.user) {
        login(localStorage.getItem('token') || '', response.data.user);
        showMessage('success', 'Profile updated successfully!');
      }
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  // Send email verification code
  const handleSendEmailOtp = async () => {
    if (!newEmail.trim()) {
      showMessage('error', 'Please enter a new email address');
      return;
    }

    setLoading(true);
    try {
      await api.post('/user/send-email-change-otp', { email: newEmail });
      setEmailOtpSent(true);
      showMessage('success', 'Verification code sent to your new email address');
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Verify and change email
  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOtp.trim()) {
      showMessage('error', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/user/change-email', {
        newEmail,
        otpCode: emailOtp
      });

      if (response.data.user) {
        login(localStorage.getItem('token') || '', response.data.user);
        setEmail(newEmail);
        setNewEmail('');
        setEmailOtp('');
        setEmailOtpSent(false);
        showMessage('success', 'Email changed successfully!');
      }
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'Failed to change email');
    } finally {
      setLoading(false);
    }
  };

  // Send phone verification code
  const handleSendPhoneOtp = async () => {
    if (!newPhone.trim()) {
      showMessage('error', 'Please enter a new phone number');
      return;
    }

    setLoading(true);
    try {
      await api.post('/user/send-phone-change-otp', { phone: newPhone });
      setPhoneOtpSent(true);
      showMessage('success', 'Verification code sent to your new phone number');
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  // Verify and change phone
  const handleChangePhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOtp.trim()) {
      showMessage('error', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      const response = await api.put('/user/change-phone', {
        newPhone,
        otpCode: phoneOtp
      });

      if (response.data.user) {
        login(localStorage.getItem('token') || '', response.data.user);
        setPhone(newPhone);
        setNewPhone('');
        setPhoneOtp('');
        setPhoneOtpSent(false);
        showMessage('success', 'Phone number changed successfully!');
      }
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'Failed to change phone number');
    } finally {
      setLoading(false);
    }
  };

  // Handle profile picture upload
  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        showMessage('error', 'Profile picture must be less than 5MB');
        return;
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setProfilePicPreview(previewUrl);
      setProfilePicFile(file);
    }
  };

  // Upload profile picture
  const handleUploadProfilePic = async () => {
    if (!profilePicFile) {
      showMessage('error', 'Please select a profile picture');
      return;
    }

    setUploading(true);
    try {
      // Get upload URL from backend
      const uploadResponse = await api.post('/user/get-profile-pic-upload-url', {
        fileName: profilePicFile.name,
        fileType: profilePicFile.type
      });

      console.log('Upload response:', uploadResponse.data);

      // Check if we have valid URLs
      if (!uploadResponse.data.uploadUrl) {
        throw new Error('No upload URL received from server');
      }
      
      if (!uploadResponse.data.pictureUrl || uploadResponse.data.pictureUrl.includes('undefined')) {
        throw new Error('Invalid picture URL received from server. Please check server configuration.');
      }

      // Upload to S3
      const uploadResult = await fetch(uploadResponse.data.uploadUrl, {
        method: 'PUT',
        body: profilePicFile,
        headers: {
          'Content-Type': profilePicFile.type,
        },
      });

      if (uploadResult.ok) {
        // Update user profile with new picture URL
        const updateResponse = await api.put('/user/profile', {
          profilePicture: uploadResponse.data.pictureUrl
        });

        if (updateResponse.data.user) {
          login(localStorage.getItem('token') || '', updateResponse.data.user);
          setProfilePicture(uploadResponse.data.pictureUrl);
          setProfilePicFile(null);
          // Clean up preview URL
          if (profilePicPreview) {
            URL.revokeObjectURL(profilePicPreview);
            setProfilePicPreview(null);
          }
          showMessage('success', 'Profile picture updated successfully!');
        }
      } else {
        const errorText = await uploadResult.text();
        console.error('S3 upload failed:', errorText);
        throw new Error(`Failed to upload to S3: ${uploadResult.status} ${uploadResult.statusText}`);
      }
    } catch (err: any) {
      console.error('Profile picture upload error:', err);
      showMessage('error', err?.response?.data?.message || err?.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
    }
  };

  // Change password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await api.put('/user/change-password', {
        currentPassword,
        newPassword
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showMessage('success', 'Password changed successfully!');
    } catch (err: any) {
      showMessage('error', err?.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  // Validate password strength
  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      errors: [
        password.length < minLength ? `At least ${minLength} characters` : null,
        !hasUpperCase ? 'At least one uppercase letter' : null,
        !hasLowerCase ? 'At least one lowercase letter' : null,
        !hasNumbers ? 'At least one number' : null,
        !hasSpecialChar ? 'At least one special character' : null,
      ].filter(Boolean)
    };
  };

  if (!user || user.role !== 'STUDENT') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const passwordValidation = validatePassword(newPassword);

  return (
    <StudentLayout>
      <DynamicHead
        title={`Profile Settings | ${systemSettings?.siteTitle || 'JEE App'}`}
        description="Manage your student profile settings and account information"
        keywords={`profile settings, account settings, student profile, ${systemSettings?.siteKeywords || ''}`}
        canonicalUrl="/student/profile-settings"
      />

      <div className="bg-gradient-to-br from-orange-50 to-blue-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8">
              <div className="flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-lg">
                  {profilePicture ? (
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="h-16 w-16 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-orange-600">
                      {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{user?.fullName}</h1>
                  <p className="text-orange-100">{user?.email}</p>
                  <p className="text-orange-200 text-sm capitalize">{user?.role?.toLowerCase()}</p>
                </div>
              </div>
            </div>

            {/* Success/Error Message */}
            {message && (
              <div className={`mx-6 mt-4 p-4 rounded-lg ${
                message.type === 'success' 
                  ? 'bg-green-50 border border-green-200 text-green-800' 
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}>
                <div className="flex">
                  <div className="flex-shrink-0">
                    {message.type === 'success' ? (
                      <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{message.text}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 px-6">
                {[
                  { id: 'personal', name: 'Personal Info', icon: '👤' },
                  { id: 'email', name: 'Email', icon: '📧' },
                  { id: 'phone', name: 'Phone', icon: '📱' },
                  { id: 'photo', name: 'Profile Photo', icon: '📷' },
                  { id: 'password', name: 'Password', icon: '🔒' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Personal Information Tab */}
              {activeTab === 'personal' && (
                <form onSubmit={handleUpdatePersonalInfo} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                          Full Name
                        </label>
                        <input
                          type="text"
                          id="fullName"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
                          placeholder="Enter your full name"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                    >
                      {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                  </div>
                </form>
              )}

              {/* Email Tab */}
              {activeTab === 'email' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Change Email Address</h3>
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <p className="text-sm text-gray-600">
                        <strong>Current Email:</strong> {email}
                      </p>
                    </div>
                    
                    {!emailOtpSent ? (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700">
                            New Email Address
                          </label>
                          <input
                            type="email"
                            id="newEmail"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
                            placeholder="Enter new email address"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSendEmailOtp}
                          disabled={loading}
                          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                        >
                          {loading ? 'Sending...' : 'Send Verification Code'}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleChangeEmail} className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-800">
                            A verification code has been sent to <strong>{newEmail}</strong>
                          </p>
                        </div>
                        <div>
                          <label htmlFor="emailOtp" className="block text-sm font-medium text-gray-700">
                            Verification Code
                          </label>
                          <input
                            type="text"
                            id="emailOtp"
                            value={emailOtp}
                            onChange={(e) => setEmailOtp(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white text-center text-lg tracking-widest"
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            required
                          />
                        </div>
                        <div className="flex space-x-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                          >
                            {loading ? 'Verifying...' : 'Verify & Change Email'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEmailOtpSent(false);
                              setEmailOtp('');
                            }}
                            className="px-6 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Phone Tab */}
              {activeTab === 'phone' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Change Phone Number</h3>
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <p className="text-sm text-gray-600">
                        <strong>Current Phone:</strong> {phone || 'Not set'}
                      </p>
                    </div>
                    
                    {!phoneOtpSent ? (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="newPhone" className="block text-sm font-medium text-gray-700">
                            New Phone Number
                          </label>
                          <input
                            type="tel"
                            id="newPhone"
                            value={newPhone}
                            onChange={(e) => setNewPhone(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
                            placeholder="Enter new phone number"
                            required
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          disabled={loading}
                          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                        >
                          {loading ? 'Sending...' : 'Send Verification Code'}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleChangePhone} className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-800">
                            A verification code has been sent to <strong>{newPhone}</strong>
                          </p>
                        </div>
                        <div>
                          <label htmlFor="phoneOtp" className="block text-sm font-medium text-gray-700">
                            Verification Code
                          </label>
                          <input
                            type="text"
                            id="phoneOtp"
                            value={phoneOtp}
                            onChange={(e) => setPhoneOtp(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white text-center text-lg tracking-widest"
                            placeholder="Enter 6-digit code"
                            maxLength={6}
                            required
                          />
                        </div>
                        <div className="flex space-x-4">
                          <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                          >
                            {loading ? 'Verifying...' : 'Verify & Change Phone'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPhoneOtpSent(false);
                              setPhoneOtp('');
                            }}
                            className="px-6 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Profile Photo Tab */}
              {activeTab === 'photo' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Picture</h3>
                    <div className="flex items-center space-x-6">
                      <div className="flex-shrink-0">
                        <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {profilePicPreview ? (
                            <img
                              src={profilePicPreview}
                              alt="Profile Preview"
                              className="h-24 w-24 rounded-full object-cover"
                            />
                          ) : profilePicture ? (
                            <img
                              src={profilePicture}
                              alt="Profile"
                              className="h-24 w-24 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-2xl font-bold text-gray-500">
                              {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePicChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                        />
                        <p className="mt-2 text-sm text-gray-500">
                          Upload a profile picture. Maximum file size: 5MB. Supported formats: JPG, PNG, GIF
                        </p>
                        {profilePicFile && (
                          <div className="mt-4 flex space-x-3">
                            <button
                              type="button"
                              onClick={handleUploadProfilePic}
                              disabled={uploading}
                              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                            >
                              {uploading ? 'Uploading...' : 'Upload Picture'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setProfilePicFile(null);
                                if (profilePicPreview) {
                                  URL.revokeObjectURL(profilePicPreview);
                                  setProfilePicPreview(null);
                                }
                              }}
                              disabled={uploading}
                              className="px-6 py-3 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 transition-all duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Password Tab */}
              {activeTab === 'password' && (
                <form onSubmit={handleChangePassword} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                          Current Password
                        </label>
                        <div className="mt-1 relative">
                          <input
                            type={showCurrentPassword ? 'text' : 'password'}
                            id="currentPassword"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
                            placeholder="Enter current password"
                            required
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                          New Password
                        </label>
                        <div className="mt-1 relative">
                          <input
                            type={showNewPassword ? 'text' : 'password'}
                            id="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
                            placeholder="Enter new password"
                            required
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        
                        {/* Password Requirements */}
                        {newPassword && (
                          <div className="mt-2">
                            <div className="text-xs text-gray-600 mb-2">Password requirements:</div>
                            <div className="space-y-1">
                              {[
                                { check: newPassword.length >= 8, text: 'At least 8 characters' },
                                { check: /[A-Z]/.test(newPassword), text: 'At least one uppercase letter' },
                                { check: /[a-z]/.test(newPassword), text: 'At least one lowercase letter' },
                                { check: /\d/.test(newPassword), text: 'At least one number' },
                                { check: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword), text: 'At least one special character' },
                              ].map((requirement, index) => (
                                <div key={index} className="flex items-center text-xs">
                                  <svg
                                    className={`h-3 w-3 mr-2 ${requirement.check ? 'text-green-500' : 'text-gray-300'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span className={requirement.check ? 'text-green-600' : 'text-gray-500'}>
                                    {requirement.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                          Confirm New Password
                        </label>
                        <div className="mt-1 relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
                            placeholder="Confirm new password"
                            required
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        
                        {/* Password Match Indicator */}
                        {confirmPassword && (
                          <div className="mt-2 flex items-center text-xs">
                            {newPassword === confirmPassword ? (
                              <>
                                <svg className="h-3 w-3 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span className="text-green-600">Passwords match</span>
                              </>
                            ) : (
                              <>
                                <svg className="h-3 w-3 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                <span className="text-red-600">Passwords do not match</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading || !passwordValidation.isValid || newPassword !== confirmPassword}
                      className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 transition-all duration-200 transform hover:scale-105"
                    >
                      {loading ? 'Changing Password...' : 'Change Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}

