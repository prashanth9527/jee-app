'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import MathRenderer from '@/components/MathRenderer';
import api from '@/lib/api';

interface SyllabusFile {
  path: string;
  name: string;
  directory: string;
  size: number;
  lastModified: string;
}

interface SyllabusSubject {
  subject: string;
  lessons: Array<{
    lesson: string;
    topics: string[];
  }>;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  details: {
    subjectsProcessed: number;
    subjectsCreated: number;
    subjectsSkipped: number;
    lessonsProcessed: number;
    lessonsCreated: number;
    lessonsSkipped: number;
    topicsProcessed: number;
    topicsCreated: number;
    topicsSkipped: number;
  };
}

interface ImportStats {
  jeeStreamExists: boolean;
  subjects: number;
  lessons: number;
  topics: number;
}

export default function SyllabusImportPage() {
  const [activeTab, setActiveTab] = useState<'files' | 'preview' | 'import' | 'stats'>('files');
  const [files, setFiles] = useState<SyllabusFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [stats, setStats] = useState<ImportStats | null>(null);
  const [importOptions, setImportOptions] = useState({
    createMissingSubjects: true,
    createMissingLessons: true,
    createMissingTopics: true,
    skipDuplicates: true,
  });

  const router = useRouter();

  useEffect(() => {
    loadFiles();
    loadStats();
  }, []);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/syllabus-import/files');
      setFiles(response.data.files || []);
    } catch (error: any) {
      console.error('Failed to load files:', error);
      alert('Failed to load syllabus files: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/admin/syllabus-import/stats');
      setStats(response.data.stats);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    }
  };

  const previewFile = async (filePath: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/syllabus-import/preview?file=${encodeURIComponent(filePath)}`);
      setPreview(response.data);
      setActiveTab('preview');
    } catch (error: any) {
      console.error('Preview failed:', error);
      alert('Preview failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const importSyllabus = async () => {
    if (!selectedFile) {
      alert('Please select a file to import');
      return;
    }

    try {
      setImporting(true);
      const response = await api.post('/admin/syllabus-import/import', {
        filePath: selectedFile,
        options: importOptions,
      });
      setImportResult(response.data.result);
      setActiveTab('import');
      loadStats(); // Refresh stats after import
    } catch (error: any) {
      console.error('Import failed:', error);
      alert('Import failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setImporting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <MathRenderer />
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Syllabus Import</h1>
              <p className="text-gray-600">Import JEE syllabus structure from JSON files</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('files')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'files'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Available Files
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'preview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                disabled={!selectedFile}
              >
                Preview
              </button>
              <button
                onClick={() => setActiveTab('import')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'import'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                disabled={!selectedFile}
              >
                Import
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'stats'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Statistics
              </button>
            </nav>
          </div>

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-gray-900">Available Syllabus Files</h2>
                <button
                  onClick={loadFiles}
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {files.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No syllabus files found in the seeds directory</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedFile === file.path
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedFile(file.path)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{file.name}</h3>
                          <p className="text-sm text-gray-600">{file.directory}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{formatFileSize(file.size)}</span>
                            <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              previewFile(file.path);
                            }}
                            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                          >
                            Preview
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {preview ? (
                <div className="space-y-6">
                  <div className="bg-white border rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">File Information</h2>
                    <div className="space-y-2">
                      <p><span className="font-medium">File:</span> {preview.filePath}</p>
                      <p><span className="font-medium">Subjects:</span> {preview.preview?.subjects || 0}</p>
                      <p><span className="font-medium">Total Lessons:</span> {preview.preview?.totalLessons || 0}</p>
                      <p><span className="font-medium">Total Topics:</span> {preview.preview?.totalTopics || 0}</p>
                    </div>
                  </div>

                  <div className="bg-white border rounded-lg p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Validation</h2>
                    <div className={`p-4 rounded-md ${
                      preview.validation?.isValid 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-red-50 border border-red-200'
                    }`}>
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-3 ${
                          preview.validation?.isValid ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <span className={`font-medium ${
                          preview.validation?.isValid ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {preview.validation?.isValid ? 'Valid' : 'Invalid'}
                        </span>
                      </div>
                      {preview.validation?.errors && preview.validation.errors.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm text-red-700 font-medium">Errors:</p>
                          <ul className="mt-1 text-sm text-red-600 list-disc list-inside">
                            {preview.validation.errors.map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Sample Data (First 3 Subjects)</h3>
                    {preview.sampleData?.map((subject: SyllabusSubject, subjectIndex: number) => (
                      <div key={subjectIndex} className="border border-gray-200 rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-gray-900">Subject: {subject.subject}</h4>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-500">Lessons ({subject.lessons.length}):</p>
                            {subject.lessons.slice(0, 3).map((lesson, lessonIndex) => (
                              <div key={lessonIndex} className="ml-4 p-3 bg-gray-50 rounded">
                                <p className="text-sm font-medium text-gray-700">{lesson.lesson}</p>
                                <div className="mt-2">
                                  <p className="text-xs text-gray-500">Topics ({lesson.topics.length}):</p>
                                  <div className="mt-1 flex flex-wrap gap-1">
                                    {lesson.topics.slice(0, 5).map((topic, topicIndex) => (
                                      <span key={topicIndex} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                        {topic}
                                      </span>
                                    ))}
                                    {lesson.topics.length > 5 && (
                                      <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                        +{lesson.topics.length - 5} more
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {subject.lessons.length > 3 && (
                              <p className="text-sm text-gray-500 ml-4">+{subject.lessons.length - 3} more lessons</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Select a file to preview syllabus structure</p>
                </div>
              )}
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Import Options</h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="createMissingSubjects"
                      checked={importOptions.createMissingSubjects}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, createMissingSubjects: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="createMissingSubjects" className="ml-2 text-sm text-gray-700">
                      Create missing subjects
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="createMissingLessons"
                      checked={importOptions.createMissingLessons}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, createMissingLessons: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="createMissingLessons" className="ml-2 text-sm text-gray-700">
                      Create missing lessons
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="createMissingTopics"
                      checked={importOptions.createMissingTopics}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, createMissingTopics: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="createMissingTopics" className="ml-2 text-sm text-gray-700">
                      Create missing topics
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="skipDuplicates"
                      checked={importOptions.skipDuplicates}
                      onChange={(e) => setImportOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="skipDuplicates" className="ml-2 text-sm text-gray-700">
                      Skip duplicates
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Import Syllabus</h2>
                  <p className="text-sm text-gray-600">
                    {selectedFile ? `Selected: ${selectedFile}` : 'No file selected'}
                  </p>
                </div>
                <button
                  onClick={importSyllabus}
                  disabled={!selectedFile || importing}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? 'Importing...' : 'Import Syllabus'}
                </button>
              </div>

              {importResult && (
                <div className="bg-white border rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Import Results</h2>
                  <div className={`p-4 rounded-md ${
                    importResult.success 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-yellow-50 border border-yellow-200'
                  }`}>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className={`w-4 h-4 rounded-full mr-3 ${
                          importResult.success ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                        <span className={`font-medium ${
                          importResult.success ? 'text-green-800' : 'text-yellow-800'
                        }`}>
                          {importResult.success ? 'Import Successful' : 'Import Completed with Warnings'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-700">Imported</p>
                          <p className="text-green-600 font-semibold">{importResult.imported}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Skipped</p>
                          <p className="text-yellow-600 font-semibold">{importResult.skipped}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Subjects</p>
                          <p className="text-blue-600 font-semibold">{importResult.details.subjectsCreated}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Lessons</p>
                          <p className="text-blue-600 font-semibold">{importResult.details.lessonsCreated}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">Topics</p>
                          <p className="text-blue-600 font-semibold">{importResult.details.topicsCreated}</p>
                        </div>
                      </div>

                      {importResult.errors.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-red-700">Errors:</p>
                          <ul className="mt-1 text-sm text-red-600 list-disc list-inside max-h-32 overflow-y-auto">
                            {importResult.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Current Database Statistics</h2>
                {stats ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                        stats.jeeStreamExists ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        <div className={`w-6 h-6 rounded-full ${
                          stats.jeeStreamExists ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      </div>
                      <p className="text-sm font-medium text-gray-700">JEE Stream</p>
                      <p className={`text-lg font-semibold ${
                        stats.jeeStreamExists ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {stats.jeeStreamExists ? 'Exists' : 'Missing'}
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-blue-100 mx-auto mb-2 flex items-center justify-center">
                        <span className="text-blue-600 font-bold text-lg">{stats.subjects}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Subjects</p>
                      <p className="text-lg font-semibold text-blue-600">{stats.subjects}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-purple-100 mx-auto mb-2 flex items-center justify-center">
                        <span className="text-purple-600 font-bold text-lg">{stats.lessons}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Lessons</p>
                      <p className="text-lg font-semibold text-purple-600">{stats.lessons}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-orange-100 mx-auto mb-2 flex items-center justify-center">
                        <span className="text-orange-600 font-bold text-lg">{stats.topics}</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">Topics</p>
                      <p className="text-lg font-semibold text-orange-600">{stats.topics}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">Loading statistics...</p>
                )}
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
