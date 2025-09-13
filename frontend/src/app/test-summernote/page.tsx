'use client';

import { useState, useEffect } from 'react';
import SummernoteEditor from '@/components/SummernoteEditorSimple';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function TestSummernotePage() {
  const [content, setContent] = useState('');

  // Load Bootstrap CSS for Summernote
  useEffect(() => {
    if (!document.querySelector('link[href*="bootstrap"]')) {
      const bootstrapCSS = document.createElement('link');
      bootstrapCSS.rel = 'stylesheet';
      bootstrapCSS.href = 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css';
      document.head.appendChild(bootstrapCSS);
    }

    // Load Bootstrap JS for modals
    if (!document.querySelector('script[src*="bootstrap"]')) {
      const bootstrapJS = document.createElement('script');
      bootstrapJS.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js';
      document.head.appendChild(bootstrapJS);
    }

    // Load Font Awesome for icons
    if (!document.querySelector('link[href*="font-awesome"]')) {
      const fontAwesomeCSS = document.createElement('link');
      fontAwesomeCSS.rel = 'stylesheet';
      fontAwesomeCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
      document.head.appendChild(fontAwesomeCSS);
    }
  }, []);

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Summernote Editor Test</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Editor</h2>
          <SummernoteEditor
            value={content}
            onChange={setContent}
            placeholder="Test the Summernote editor here..."
            height={300}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <div 
            className="prose max-w-none border border-gray-200 rounded-lg p-4 min-h-[100px]"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">HTML Output</h2>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm">
            {content}
          </pre>
        </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
