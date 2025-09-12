"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import DynamicHead from '@/components/DynamicHead';

interface SystemSettings {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  siteLogo?: string;
  siteFavicon?: string;
  ogImage?: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [pageLoading, setPageLoading] = useState(true);

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
      } finally {
        setPageLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (!otpSent) {
        // Send OTP
        if (method === 'email') {
          if (!email.trim()) {
            setError('Please enter your email address');
            setLoading(false);
            return;
          }
          
          await api.post('/auth/send-forgot-password-otp', { email });
          setOtpSent(true);
          setSuccess(`Verification code sent to ${email}. Please check your email.`);
        } else {
          if (!phone.trim()) {
            setError('Please enter your phone number');
            setLoading(false);
            return;
          }
          
          await api.post('/auth/send-forgot-password-sms', { phone });
          setOtpSent(true);
          setSuccess(`Verification code sent to ${phone}. Please check your SMS.`);
        }
      } else {
        // Verify OTP and redirect to reset password
        if (!otpCode.trim()) {
          setError('Please enter the verification code');
          setLoading(false);
          return;
        }

        const identifier = method === 'email' ? email : phone;
        const response = await api.post('/auth/verify-forgot-password-otp', {
          identifier,
          otpCode,
          method
        });

        if (response.data.token) {
          // Store the reset token and redirect to reset password page
          localStorage.setItem('passwordResetToken', response.data.token);
          localStorage.setItem('passwordResetIdentifier', identifier);
          localStorage.setItem('passwordResetMethod', method);
          
          window.location.href = '/reset-password';
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setLoading(true);

    try {
      if (method === 'email') {
        await api.post('/auth/send-forgot-password-otp', { email });
        setSuccess('Verification code resent to your email.');
      } else {
        await api.post('/auth/send-forgot-password-sms', { phone });
        setSuccess('Verification code resent to your phone.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setOtpSent(false);
    setOtpCode('');
    setError(null);
    setSuccess(null);
  };

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <DynamicHead
        title={`Forgot Password | ${systemSettings?.siteTitle || 'JEE App'}`}
        description="Reset your password using email or phone verification"
        keywords={`forgot password, reset password, ${systemSettings?.siteKeywords || ''}`}
        canonicalUrl="/forgot-password"
      />
      
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <Link href="/">
              <img
                className="mx-auto h-12 w-auto"
                src={systemSettings?.siteLogo || "/logo.png"}
                alt={systemSettings?.siteTitle || "JEE App"}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/logo.png";
                }}
              />
            </Link>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Forgot Password?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Don't worry! Enter your email or phone number and we'll send you a verification code.
            </p>
          </div>

          <div className="bg-gradient-to-br from-white to-orange-50 py-8 px-6 shadow-2xl rounded-2xl border-2 border-orange-100 hover:border-orange-200 transition-all duration-300 transform hover:scale-[1.02]">
            {/* Method Selection */}
            {!otpSent && (
              <div className="mb-6">
                <div className="flex space-x-1 bg-orange-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('email');
                      setError(null);
                    }}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                      method === 'email'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('phone');
                      setError(null);
                    }}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                      method === 'phone'
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Phone
                  </button>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="space-y-6">
              {!otpSent ? (
                <>
                  {/* Email Input */}
                  {method === 'email' && (
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
                        placeholder="Enter your email address"
                      />
                    </div>
                  )}

                  {/* Phone Input */}
                  {method === 'phone' && (
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* OTP Input */}
                  <div>
                    <label htmlFor="otpCode" className="block text-sm font-medium text-gray-700">
                      Verification Code
                    </label>
                    <input
                      id="otpCode"
                      name="otpCode"
                      type="text"
                      required
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors text-gray-900 bg-white text-center text-lg tracking-widest"
                      placeholder="Enter verification code"
                      maxLength={6}
                    />
                    <p className="mt-2 text-sm text-gray-600">
                      Enter the 6-digit code sent to your {method === 'email' ? 'email' : 'phone'}
                    </p>
                  </div>

                  {/* Resend Code */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={loading}
                      className="text-sm text-orange-600 hover:text-orange-500 font-medium disabled:opacity-50"
                    >
                      Didn't receive the code? Resend
                    </button>
                  </div>

                  {/* Change Method */}
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="text-sm text-gray-600 hover:text-gray-500 font-medium"
                    >
                      Use different {method === 'email' ? 'phone number' : 'email'}
                    </button>
                  </div>
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {otpSent ? 'Verifying...' : 'Send Code'}
                  </div>
                ) : (
                  otpSent ? 'Verify Code' : 'Send Verification Code'
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-orange-600 hover:text-orange-500 font-medium transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
