'use client';

import { useState, useEffect } from 'react';
import { X, Brain, FileText, Map, Video, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import api from '@/lib/api';

interface ContentSummarySidebarProps {
  contentId: string | null;
  isVisible: boolean;
  onClose: () => void;
}

interface SummaryData {
  contentId: string;
  summary: string | null;
  mindMap: string | null;
  videoLink: string | null;
  hasSummary: boolean;
}

// Simple Markdown to HTML converter
const formatMarkdownToHTML = (text: string): string => {
  if (!text) return '';
  
  return text
    // Bold text **text** -> <strong>text</strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic text *text* -> <em>text</em>
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Headers # Header -> <h3>Header</h3>
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold text-gray-900 mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 mt-4 mb-2">$1</h1>')
    // Lists - * item -> <li>item</li>
    .replace(/^\* (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
    .replace(/^- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
    // Numbered lists - 1. item -> <li>item</li>
    .replace(/^\d+\. (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
    // Line breaks
    .replace(/\n/g, '<br>')
    // Wrap lists in ul tags
    .replace(/(<li class="ml-4 mb-1">.*<\/li>)/g, '<ul class="list-disc list-inside space-y-1">$1</ul>')
    // Clean up nested ul tags
    .replace(/<\/ul>\s*<ul class="list-disc list-inside space-y-1">/g, '');
};

export default function ContentSummarySidebar({ contentId, isVisible, onClose }: ContentSummarySidebarProps) {
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'mindmap' | 'video'>('summary');

  useEffect(() => {
    if (contentId && isVisible) {
      loadSummaryData();
    }
  }, [contentId, isVisible]);

  const loadSummaryData = async () => {
    if (!contentId) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/student/lms/content/${contentId}/summary`);
      setSummaryData(response.data.data);
    } catch (error) {
      console.error('Error loading summary:', error);
      setError('Failed to load summary data');
    } finally {
      setLoading(false);
    }
  };

  const generateSummary = async (type: 'summary' | 'mindmap' | 'both' = 'summary') => {
    if (!contentId) return;
    
    try {
      setGenerating(true);
      setError(null);
      const response = await api.post(`/student/lms/content/${contentId}/generate-summary`, {
        type
      });
      setSummaryData(response.data.data);
    } catch (error: any) {
      console.error('Error generating summary:', error);
      setError(error.response?.data?.message || 'Failed to generate summary');
    } finally {
      setGenerating(false);
    }
  };

  const updateSummary = async (field: 'contentSummary' | 'mindMap' | 'videoLink', value: string) => {
    if (!contentId) return;
    
    try {
      const response = await api.post(`/student/lms/content/${contentId}/update-summary`, {
        [field]: value
      });
      setSummaryData(response.data.data);
    } catch (error) {
      console.error('Error updating summary:', error);
      setError('Failed to update summary');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-2xl border-l border-gray-200 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Content Summary</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'summary'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          Summary
        </button>
        <button
          onClick={() => setActiveTab('mindmap')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'mindmap'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Map className="w-4 h-4 inline mr-2" />
          Mind Map
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'video'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <Video className="w-4 h-4 inline mr-2" />
          Video
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-32 text-center">
            <div>
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 mb-2">{error}</p>
              <button
                onClick={loadSummaryData}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <div className="space-y-4">
                {summaryData?.summary ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">AI Generated Summary</h3>
                      <button
                        onClick={() => generateSummary('summary')}
                        disabled={generating}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Regenerate Summary"
                      >
                        <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <div 
                        className="text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: formatMarkdownToHTML(summaryData.summary) 
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Summary Available</h3>
                    <p className="text-gray-600 mb-4">Generate an AI-powered summary of this content</p>
                    <button
                      onClick={() => generateSummary('summary')}
                      disabled={generating}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Generate Summary
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mind Map Tab */}
            {activeTab === 'mindmap' && (
              <div className="space-y-4">
                {summaryData?.mindMap ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">AI Generated Mind Map</h3>
                      <button
                        onClick={() => generateSummary('mindmap')}
                        disabled={generating}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Regenerate Mind Map"
                      >
                        <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <div 
                        className="text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: formatMarkdownToHTML(summaryData.mindMap) 
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Map className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Mind Map Available</h3>
                    <p className="text-gray-600 mb-4">Generate a visual mind map of this content</p>
                    <button
                      onClick={() => generateSummary('mindmap')}
                      disabled={generating}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Map className="w-4 h-4 mr-2" />
                          Generate Mind Map
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Video Tab */}
            {activeTab === 'video' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Related Video</h3>
                  {summaryData?.videoLink ? (
                    <div>
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Video Link
                        </label>
                        <input
                          type="url"
                          value={summaryData.videoLink}
                          onChange={(e) => updateSummary('videoLink', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter video URL"
                        />
                      </div>
                      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                        <iframe
                          src={summaryData.videoLink}
                          className="w-full h-full"
                          allowFullScreen
                          title="Related Video"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Video Link</h3>
                      <p className="text-gray-600 mb-4">Add a related video for this content</p>
                      <div className="space-y-3">
                        <input
                          type="url"
                          placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              const target = e.target as HTMLInputElement;
                              if (target.value) {
                                updateSummary('videoLink', target.value);
                                target.value = '';
                              }
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            const input = document.querySelector('input[type="url"]') as HTMLInputElement;
                            if (input?.value) {
                              updateSummary('videoLink', input.value);
                              input.value = '';
                            }
                          }}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add Video Link
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>AI-Powered Learning</span>
          <span>Powered by OpenAI</span>
        </div>
      </div>
    </div>
  );
}

