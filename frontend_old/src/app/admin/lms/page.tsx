'use client';

import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';

export default function LMSPage() {
  const router = useRouter();

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">LMS Content Management</h1>
              <p className="text-gray-600 mt-1">Manage learning content and materials</p>
                </div>
                  <button
                    onClick={() => router.push('/admin/lms/add')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
              Add Content
                  </button>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-500">LMS content management interface will be implemented here.</p>
              </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
