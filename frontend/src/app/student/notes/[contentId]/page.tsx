'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Calendar, Tag, BookOpen, AlertCircle } from 'lucide-react';
import { useToastContext } from '@/contexts/ToastContext';
import api from '@/lib/api';

interface NoteData {
  notes: string;
  lastUpdated: string;
  version: number;
}

interface ContentData {
  id: string;
  title: string;
  subject: string;
  topic: string;
  subtopic: string;
}

export default function NoteDetailPage({ params }: { params: Promise<{ contentId: string }> }) {
  const router = useRouter();
  const { showSuccess, showError } = useToastContext();
  const [noteData, setNoteData] = useState<NoteData | null>(null);
  const [contentData, setContentData] = useState<ContentData | null>(null);
  const [notesContent, setNotesContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalContent, setOriginalContent] = useState('');

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      if (resolvedParams.contentId) {
        loadNoteData(resolvedParams.contentId);
      }
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    setHasChanges(notesContent !== originalContent);
  }, [notesContent, originalContent]);

  const loadNoteData = async (contentId: string) => {
    setLoading(true);
    try {
      // Load note data
      const noteResponse = await api.get(`/student/content-learning/notes/${contentId}`);
      if (noteResponse.data) {
        setNoteData(noteResponse.data);
        setNotesContent(noteResponse.data.notes || '');
        setOriginalContent(noteResponse.data.notes || '');
      }

      // Load content data
      const contentResponse = await api.get(`/student/lms/content/${contentId}`);
      if (contentResponse.data) {
        setContentData(contentResponse.data);
      }
    } catch (error) {
      console.error('Failed to load note data:', error);
      showError('Failed to load note', 'Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async () => {
    if (!notesContent.trim()) {
      showError('Empty Notes', 'Please enter some notes before saving.');
      return;
    }

    setSaving(true);
    try {
      const resolvedParams = await params;
      const response = await api.post(`/student/content-learning/notes/${resolvedParams.contentId}`, {
        notes: notesContent
      });
      
      setNoteData(response.data);
      setOriginalContent(notesContent);
      setHasChanges(false);
      
      showSuccess('Notes Saved!', 'Your notes have been saved successfully.');
    } catch (error) {
      console.error('Failed to save notes:', error);
      showError('Save Failed', 'Failed to save notes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      const confirmed = window.confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      if (!confirmed) return;
    }
    router.push('/student/notes');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Notes
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {contentData?.title || 'Note Editor'}
              </h1>
              {contentData && (
                <div className="mt-2 flex items-center text-sm text-gray-600">
                  <Tag className="w-4 h-4 mr-1" />
                  <span>{contentData.subject}</span>
                  <span className="mx-2">›</span>
                  <span>{contentData.topic}</span>
                  <span className="mx-2">›</span>
                  <span>{contentData.subtopic}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {hasChanges && (
                <div className="flex items-center text-amber-600 text-sm">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  <span>Unsaved changes</span>
                </div>
              )}
              <button
                onClick={saveNotes}
                disabled={saving || !hasChanges}
                className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                  saving || !hasChanges
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 text-white hover:bg-orange-700'
                }`}
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>

        {/* Note Info */}
        {noteData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-blue-700">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Version {noteData.version}</span>
                </div>
                <div className="flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  <span>Last updated: {formatDate(noteData.lastUpdated)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Editor */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Your Notes
              </label>
              <textarea
                id="notes"
                value={notesContent}
                onChange={(e) => setNotesContent(e.target.value)}
                placeholder="Write your notes here..."
                className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
                style={{ minHeight: '400px' }}
              />
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>{notesContent.length} characters</span>
              <div className="flex items-center space-x-4">
                <span>Auto-save: {hasChanges ? 'Pending' : 'Saved'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Tips for effective note-taking:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Use bullet points and numbered lists for better organization</li>
            <li>• Highlight key concepts and formulas</li>
            <li>• Include examples and practice problems</li>
            <li>• Add your own insights and connections</li>
            <li>• Review and update your notes regularly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
