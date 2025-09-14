'use client';

import { useState } from 'react';
import api from '@/lib/api';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';

interface ProcessingJob {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;
  totalQuestions: number;
  processedQuestions: number;
  errors: any[];
  results?: any;
}

export default function ContentSeedingPage() {
  const [uploading, setUploading] = useState(false);
  const [processingJob, setProcessingJob] = useState<ProcessingJob | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [folderPath, setFolderPath] = useState('');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
  };

  const uploadPdf = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);

      const response = await api.post('/admin/content-seeding/upload-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.jobId) {
        setProcessingJob({
          jobId: response.data.jobId,
          status: 'processing',
          progress: 0,
          totalQuestions: 0,
          processedQuestions: 0,
          errors: []
        });

        // Poll for status updates
        pollJobStatus(response.data.jobId);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    const poll = async () => {
      try {
        const response = await api.get(`/admin/content-seeding/processing-status/${jobId}`);
        const job = response.data;
        
        setProcessingJob(job);

        if (job.status === 'processing') {
          setTimeout(poll, 2000); // Poll every 2 seconds
        } else if (job.status === 'completed') {
          alert(`Processing completed! ${job.results.processedQuestions} questions imported successfully.`);
        } else if (job.status === 'failed') {
          alert(`Processing failed: ${job.error}`);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
      }
    };

    poll();
  };

  const processFolder = async () => {
    if (!folderPath) return;

    try {
      const response = await api.get(`/admin/content-seeding/extract-from-folder?folderPath=${encodeURIComponent(folderPath)}`);
      alert(`Folder processing completed! ${response.data.processedFiles} files processed.`);
    } catch (error) {
      console.error('Folder processing failed:', error);
      alert('Folder processing failed. Please check the path and try again.');
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Seeding</h1>
            <p className="text-gray-600">Upload and process PDF files to extract questions automatically</p>
          </div>

          {/* PDF Upload Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Upload PDF File</h2>
        
        <div className="mb-4">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {selectedFile && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}

            <button
              onClick={uploadPdf}
              disabled={!selectedFile || uploading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload and Process PDF'}
            </button>
          </div>

          {/* Processing Status */}
          {processingJob && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Processing Status</h2>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{processingJob.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${processingJob.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status:</span> {processingJob.status}
                </div>
                <div>
                  <span className="font-medium">Questions:</span> {processingJob.processedQuestions}/{processingJob.totalQuestions}
                </div>
              </div>

              {processingJob.errors.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium text-red-600 mb-2">Errors ({processingJob.errors.length})</h3>
                  <div className="max-h-32 overflow-y-auto">
                    {processingJob.errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-600 mb-1">
                        Question {error.questionIndex}: {error.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Folder Processing Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Process Folder</h2>
            
            <div className="mb-4">
              <input
                type="text"
                value={folderPath}
                onChange={(e) => setFolderPath(e.target.value)}
                placeholder="Enter folder path (e.g., content/JEE/Previous Papers/2025/Session1/Maths)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              onClick={processFolder}
              disabled={!folderPath}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Process All PDFs in Folder
            </button>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
