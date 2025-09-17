'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaymentStatusTestPage() {
  const router = useRouter();
  const [testOrderId, setTestOrderId] = useState('test-order-123');

  const handleTestPaymentStatus = () => {
    router.push(`/student/payment-status?orderId=${testOrderId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Test Payment Status Page
        </h1>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Test Order ID:
          </label>
          <input
            type="text"
            value={testOrderId}
            onChange={(e) => setTestOrderId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Enter test order ID"
          />
        </div>

        <button
          onClick={handleTestPaymentStatus}
          className="w-full bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition-colors font-medium"
        >
          Test Payment Status Page
        </button>

        <div className="mt-6 text-sm text-gray-500">
          <p className="mb-2">This page allows you to test the payment status page with different order IDs.</p>
          <p>Try these test scenarios:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Valid order ID (will show polling)</li>
            <li>Invalid order ID (will show error)</li>
            <li>Empty order ID (will show invalid link)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
