'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminLayout from '@/components/AdminLayout';
import MathRenderer from '@/components/MathRenderer';
import { QuestionStem, QuestionOption, QuestionExplanation, QuestionTips } from '@/components/QuestionDisplay';
import api from '@/lib/api';

interface JsonFile {
  path: string;
  name: string;
  directory: string;
}

interface QuestionPreview {
  stem: string;
  options: Array<{
    text: string;
    isCorrect: boolean;
  }>;
  explanation?: string;
  tip_formula?: string;
  difficulty?: string;
  yearAppeared?: number;
  stream?: string;
  subject?: string;
  topic?: string;
  subtopic?: string;
  tags?: string[];
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  details: {
    questionsProcessed: number;
    questionsCreated: number;
    questionsSkipped: number;
    tagsCreated: number;
    subjectsCreated: number;
    topicsCreated: number;
    subtopicsCreated: number;
  };
}

interface ImportStats {
  totalQuestions: number;
  totalSubjects: number;
  totalTopics: number;
  totalSubtopics: number;
  totalTags: number;
  recentImports: Array<{
    id: string;
    stem: string;
    createdAt: string;
    subject?: { name: string };
  }>;
}

export default function JsonImportPage() {
  const router = useRouter();
  
  // State management
  const [jsonFiles, setJsonFiles] = useState<JsonFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [preview, setPreview] = useState<{
    filePath: string;
    totalQuestions: number;
    sampleQuestions: QuestionPreview[];
    errors: string[];
  } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [stats, setStats] = useState<ImportStats | null>(null);
  
  // Loading states
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importing, setImporting] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Import options
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    createMissingSubjects: true,
    createMissingTopics: true,
    createMissingSubtopics: true,
  });

  // Active tab
  const [activeTab, setActiveTab] = useState<'files' | 'preview' | 'import' | 'stats'>('files');

  useEffect(() => {
    loadJsonFiles();
    loadStats();
  }, []);

  useEffect(() => {
    if (selectedFile) {
      loadPreview(selectedFile);
    }
  }, [selectedFile]);

  const loadJsonFiles = async () => {
    try {
      setLoadingFiles(true);
      const response = await api.get('/admin/json-import/files');
      if (response.data.success) {
        const files = response.data.files.map((filePath: string) => {
          const pathParts = filePath.split('/');
          return {
            path: filePath,
            name: pathParts[pathParts.length - 1],
            directory: pathParts.slice(0, -1).join('/'),
          };
        });
        setJsonFiles(files);
      }
    } catch (error) {
      console.error('Failed to load JSON files:', error);
    } finally {
      setLoadingFiles(false);
    }
  };

  const loadPreview = async (filePath: string) => {
    try {
      setLoadingPreview(true);
      const response = await api.get(`/admin/json-import/preview?filePath=${encodeURIComponent(filePath)}`);
      if (response.data.success) {
        setPreview(response.data);
        setActiveTab('preview');
      }
    } catch (error) {
      console.error('Failed to load preview:', error);
    } finally {
      setLoadingPreview(false);
    }
  };

  const loadStats = async () => {
    try {
      setLoadingStats(true);
      const response = await api.get('/admin/json-import/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert('Please select a file to import');
      return;
    }

    try {
      setImporting(true);
      const response = await api.post('/admin/json-import/import', {
        filePath: selectedFile,
        options: importOptions,
      });
      
      if (response.data.success) {
        setImportResult(response.data.result);
        setActiveTab('import');
        // Reload stats after successful import
        loadStats();
      } else {
        alert('Import failed: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Import failed:', error);
      alert('Import failed: ' + (error.response?.data?.message || error.message));
    } finally {
      setImporting(false);
    }
  };

  const validateFile = async (filePath: string) => {
    try {
      const response = await api.post('/admin/json-import/validate', { filePath });
      return response.data;
    } catch (error: any) {
      console.error('Validation failed:', error);
      return { success: false, validation: { isValid: false, errors: [error.message] } };
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <MathRenderer />
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">JSON Import</h1>
              <p className="text-gray-600">Import questions from JSON files in the seeds directory</p>
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
                <h2 className="text-lg font-semibold text-gray-900">Available JSON Files</h2>
                <button
                  onClick={loadJsonFiles}
                  disabled={loadingFiles}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50"
                >
                  {loadingFiles ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {loadingFiles ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : jsonFiles.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No JSON files found in the seeds directory</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {jsonFiles.map((file) => (
                    <div
                      key={file.path}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedFile === file.path
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedFile(file.path)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{file.name}</h3>
                          <p className="text-sm text-gray-500">{file.directory}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-400">JSON</span>
                          {selectedFile === file.path && (
                            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
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
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Question Preview</h2>
                {selectedFile && (
                  <span className="text-sm text-gray-500">
                    {selectedFile.split('/').pop()}
                  </span>
                )}
              </div>

              {loadingPreview ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : preview ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-medium text-blue-900">File Information</h3>
                    <p className="text-sm text-blue-700">
                      Total Questions: {preview.totalQuestions}
                    </p>
                    {preview.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm text-red-700">Errors:</p>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                          {preview.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">Sample Questions (First 5)</h3>
                    {preview.sampleQuestions.map((question, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                            <div className="flex items-center space-x-2">
                              {question.difficulty && (
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(question.difficulty)}`}>
                                  {question.difficulty}
                                </span>
                              )}
                              {question.yearAppeared && (
                                <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                                  {question.yearAppeared}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-700">
                            <QuestionStem stem={question.stem} />
                          </div>
                          
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500">Options:</p>
                            {question.options.map((option, optionIndex) => (
                              <QuestionOption
                                key={optionIndex}
                                option={{
                                  text: option.text,
                                  isCorrect: option.isCorrect,
                                  order: optionIndex
                                }}
                                index={optionIndex}
                                showCorrect={true}
                                className="text-sm"
                              />
                            ))}
                          </div>

                          {question.explanation && (
                            <div className="text-sm text-gray-600">
                              <p className="font-medium">Explanation:</p>
                              <QuestionExplanation explanation={question.explanation} />
                            </div>
                          )}

                          <div className="flex flex-wrap gap-2">
                            {question.stream && (
                              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
                                Stream: {question.stream}
                              </span>
                            )}
                            {question.subject && (
                              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                Subject: {question.subject}
                              </span>
                            )}
                            {question.topic && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                Topic: {question.topic}
                              </span>
                            )}
                            {question.subtopic && (
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                                Subtopic: {question.subtopic}
                              </span>
                            )}
                            {question.tags && question.tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Select a file to preview questions</p>
                </div>
              )}
            </div>
          )}

          {/* Import Tab */}
          {activeTab === 'import' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Import Questions</h2>
                {selectedFile && (
                  <span className="text-sm text-gray-500">
                    {selectedFile.split('/').pop()}
                  </span>
                )}
              </div>

              {selectedFile ? (
                <div className="space-y-6">
                  {/* Import Options */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-3">Import Options</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.skipDuplicates}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Skip duplicate questions</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.createMissingSubjects}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, createMissingSubjects: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Create missing subjects</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.createMissingTopics}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, createMissingTopics: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Create missing topics</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={importOptions.createMissingSubtopics}
                          onChange={(e) => setImportOptions(prev => ({ ...prev, createMissingSubtopics: e.target.checked }))}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Create missing subtopics</span>
                      </label>
                    </div>
                  </div>

                  {/* Import Button */}
                  <div className="flex justify-center">
                    <button
                      onClick={handleImport}
                      disabled={importing}
                      className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {importing ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Importing...</span>
                        </div>
                      ) : (
                        'Import Questions'
                      )}
                    </button>
                  </div>

                  {/* Import Results */}
                  {importResult && (
                    <div className="space-y-4">
                      <h3 className="font-medium text-gray-900">Import Results</h3>
                      <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="flex items-center space-x-2 mb-3">
                          {importResult.success ? (
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          )}
                          <span className={`font-medium ${importResult.success ? 'text-green-800' : 'text-red-800'}`}>
                            {importResult.success ? 'Import Successful' : 'Import Completed with Errors'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{importResult.details.questionsProcessed}</div>
                            <div className="text-sm text-gray-600">Processed</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{importResult.details.questionsCreated}</div>
                            <div className="text-sm text-gray-600">Created</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{importResult.details.questionsSkipped}</div>
                            <div className="text-sm text-gray-600">Skipped</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{importResult.details.tagsCreated}</div>
                            <div className="text-sm text-gray-600">Tags Created</div>
                          </div>
                        </div>

                        {importResult.errors.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                            <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                              {importResult.errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Select a file to import questions</p>
                </div>
              )}
            </div>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Import Statistics</h2>
                <button
                  onClick={loadStats}
                  disabled={loadingStats}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50"
                >
                  {loadingStats ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {loadingStats ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : stats ? (
                <div className="space-y-6">
                  {/* Overall Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.totalQuestions}</div>
                      <div className="text-sm text-gray-600">Total Questions</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.totalSubjects}</div>
                      <div className="text-sm text-gray-600">Subjects</div>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-yellow-600">{stats.totalTopics}</div>
                      <div className="text-sm text-gray-600">Topics</div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.totalSubtopics}</div>
                      <div className="text-sm text-gray-600">Subtopics</div>
                    </div>
                    <div className="bg-indigo-50 p-4 rounded-lg text-center">
                      <div className="text-2xl font-bold text-indigo-600">{stats.totalTags}</div>
                      <div className="text-sm text-gray-600">Tags</div>
                    </div>
                  </div>

                  {/* Recent Imports */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Recent Imports (Last 24 Hours)</h3>
                    {stats.recentImports.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No recent imports</p>
                    ) : (
                      <div className="space-y-2">
                        {stats.recentImports.map((import_) => (
                          <div key={import_.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {import_.stem.replace(/<[^>]*>/g, '').substring(0, 100)}...
                              </p>
                              {import_.subject && (
                                <p className="text-xs text-gray-500">{import_.subject.name}</p>
                              )}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(import_.createdAt).toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Failed to load statistics</p>
                </div>
              )}
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
