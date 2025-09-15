'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
// Using standard HTML elements with Tailwind CSS
// Using emojis instead of lucide-react icons
import Link from 'next/link';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const email = searchParams.get('email');
  const userId = searchParams.get('userId');

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow single digit
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    // Handle paste
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then(text => {
        const pastedOtp = text.replace(/\D/g, '').slice(0, 6);
        if (pastedOtp.length === 6) {
          const newOtp = pastedOtp.split('');
          setOtp(newOtp);
          setError('');
          // Focus last input
          inputRefs.current[5]?.focus();
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    if (!userId) {
      setError('Invalid verification link');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}/auth/complete-registration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          otpCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Verification failed');
      }

      // Store the access token
      localStorage.setItem('token', data.access_token);
      
      // Redirect to appropriate dashboard based on user role
      const dashboardUrl = data.user?.role === 'ADMIN' ? '/admin' : 
                          data.user?.role === 'STUDENT' ? '/student' : 
                          data.user?.role === 'EXPERT' ? '/expert' : '/dashboard';
      router.push(dashboardUrl);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!userId || !email) return;

    setIsResending(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}/auth/resend-email-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to resend OTP');
      }

      // Reset timer
      setTimeLeft(300);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setError('');
      setResendSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => setResendSuccess(false), 3000);
      
      // Focus first input
      inputRefs.current[0]?.focus();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setIsResending(false);
    }
  };

  if (!email || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Link</h2>
            <p className="text-gray-600 mb-4">
              This verification link is invalid or has expired.
            </p>
            <Link href="/register">
              <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors">
                Go to Registration
              </button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">📱📧</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent 6-digit verification codes to{' '}
            <span className="font-medium text-gray-900">{email}</span>
            {' '}and your registered phone number
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Please check your email inbox, spam folder, and SMS messages. The codes will expire in 5 minutes.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    disabled={isLoading}
                  />
                ))}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-3">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {resendSuccess && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-3">
                  <p className="text-green-800 text-sm">✅ New verification code sent successfully!</p>
                </div>
              )}

                <div className="text-center">
                  {timeLeft > 0 ? (
                    <p className="text-sm text-gray-600">
                      Code expires in{' '}
                      <span className="font-medium text-red-600">
                        {formatTime(timeLeft)}
                      </span>
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      Code has expired
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="submit"
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  disabled={isLoading || otp.join('').length !== 6}
                >
                  {isLoading ? (
                    <>
                      <span className="mr-2">⏳</span>
                      Verifying...
                    </>
                  ) : (
                    'Verify Email'
                  )}
                </button>

                {canResend && (
                  <button
                    type="button"
                    className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    onClick={handleResendOtp}
                    disabled={isResending}
                  >
                    {isResending ? (
                      <>
                        <span className="mr-2">⏳</span>
                        Resending...
                      </>
                    ) : (
                      'Resend Code'
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>

        <div className="text-center">
          <Link
            href="/register"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <span className="mr-1">←</span>
            Back to registration
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading email verification...</p>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
