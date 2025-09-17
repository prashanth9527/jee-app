'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Swal from 'sweetalert2';

interface PaymentStatus {
  success: boolean;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  orderId: string;
  gatewayOrderId?: string;
  error?: string;
}

function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [isPolling, setIsPolling] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const orderId = searchParams.get('orderId');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!orderId) {
      setError('No order ID provided');
      setLoading(false);
      return;
    }

    // Start the 5-minute timer
    startTimer();
    
    // Start polling for payment status
    checkPaymentStatus();
    const pollInterval = setInterval(checkPaymentStatus, 3000); // Check every 3 seconds
    intervalRef.current = pollInterval;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [orderId]);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const checkPaymentStatus = async () => {
    if (!orderId || !isPolling) return;

    try {
      const response = await api.get(`/payments/status/${orderId}`);
      const status: PaymentStatus = response.data;

      setPaymentStatus(status);
      setError(null);

      if (status.success && status.status === 'COMPLETED') {
        // Payment successful - stop polling and redirect
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }

        // Show success message and redirect
        Swal.fire({
          title: '🎉 Payment Successful!',
          text: 'Your subscription is now active! Redirecting to dashboard...',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false,
          allowOutsideClick: false
        }).then(() => {
          router.push('/student');
        });
      } else if (status.status === 'FAILED' || status.status === 'CANCELLED') {
        // Payment failed - stop polling
        setIsPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      }
    } catch (err: any) {
      console.error('Error checking payment status:', err);
      setError(err?.response?.data?.error || 'Failed to check payment status');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = () => {
    // Redirect back to subscriptions page to retry payment
    router.push('/student/subscriptions');
  };

  const handleTryNewPayment = () => {
    // Redirect to subscriptions page to start a new payment
    router.push('/student/subscriptions');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusIcon = () => {
    if (loading) {
      return (
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
      );
    }

    if (paymentStatus?.status === 'COMPLETED') {
      return (
        <div className="text-green-500 text-6xl mb-4">
          ✅
        </div>
      );
    }

    if (paymentStatus?.status === 'FAILED' || paymentStatus?.status === 'CANCELLED') {
      return (
        <div className="text-red-500 text-6xl mb-4">
          ❌
        </div>
      );
    }

    if (isPolling) {
      return (
        <div className="text-orange-500 text-6xl mb-4 animate-pulse">
          ⏳
        </div>
      );
    }

    return (
      <div className="text-gray-500 text-6xl mb-4">
        ⏰
      </div>
    );
  };

  const getStatusMessage = () => {
    if (loading) {
      return 'Checking payment status...';
    }

    if (paymentStatus?.status === 'COMPLETED') {
      return 'Payment Successful! Your subscription is now active.';
    }

    if (paymentStatus?.status === 'FAILED') {
      return 'Payment failed. Please try again.';
    }

    if (paymentStatus?.status === 'CANCELLED') {
      return 'Payment was cancelled. You can try again anytime.';
    }

    if (isPolling) {
      return 'Waiting for payment confirmation...';
    }

    return 'Payment verification timeout. Please check your payment status or try again.';
  };

  const getStatusColor = () => {
    if (paymentStatus?.status === 'COMPLETED') {
      return 'text-green-600';
    }

    if (paymentStatus?.status === 'FAILED' || paymentStatus?.status === 'CANCELLED') {
      return 'text-red-600';
    }

    if (isPolling) {
      return 'text-orange-600';
    }

    return 'text-gray-600';
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Payment Link</h1>
          <p className="text-gray-600 mb-6">No order ID provided. Please try again from the subscription page.</p>
          <button
            onClick={() => router.push('/student/subscriptions')}
            className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go to Subscriptions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Status Icon */}
        {getStatusIcon()}

        {/* Status Message */}
        <h1 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
          {getStatusMessage()}
        </h1>

        {/* Order ID */}
        <div className="mb-6">
          <p className="text-sm text-gray-500">Order ID:</p>
          <p className="text-sm font-mono text-gray-700 break-all">{orderId}</p>
        </div>

        {/* Timer (only show when polling) */}
        {isPolling && (
          <div className="mb-6">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-700 mb-2">Checking payment status...</p>
              <div className="flex items-center justify-center space-x-2">
                <div className="text-2xl font-bold text-orange-600">
                  {formatTime(timeRemaining)}
                </div>
                <span className="text-orange-600">remaining</span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(timeRemaining / 300) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        {!isPolling && paymentStatus?.status !== 'COMPLETED' && (
          <div className="space-y-3">
            <button
              onClick={handleRetryPayment}
              className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              🔄 Retry Payment
            </button>
            <button
              onClick={handleTryNewPayment}
              className="w-full bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              💳 Try New Payment
            </button>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 text-sm text-gray-500">
          <p>Having trouble? Contact support or try again from the subscription page.</p>
        </div>

        {/* Back to Dashboard Button (for completed payments) */}
        {paymentStatus?.status === 'COMPLETED' && (
          <div className="mt-6">
            <button
              onClick={() => router.push('/student')}
              className="w-full bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              🚀 Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
        <p className="mt-4 text-gray-900 font-medium">Loading payment status...</p>
        <p className="mt-2 text-gray-600 text-sm">Please wait while we prepare your payment information.</p>
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentStatusContent />
    </Suspense>
  );
}
