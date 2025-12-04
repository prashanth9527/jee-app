'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import Swal from 'sweetalert2';

interface PDFProcessorCacheRecord {
  id: string;
  fileName: string;
  filePath: string;
  pdfFilePath?: string;
  fileSize: number;
  recordType: 'pyq' | 'question' | 'lms';
  chatGptFileId?: string;
  processingStatus: string;
  systemPrompt?: string;
  userPrompt?: string;
  responseData?: any;
  processedData?: any;
  jsonContent?: string;
  outputFilePath?: string;
  latexContent?: string;
  latexFilePath?: string;
  zipFilePath?: string;
  htmlContent?: string;
  htmlFilePath?: string;
  lmsContentId?: string;
  errorMessage?: string;
  processingTimeMs?: number;
  retryCount: number;
  lastProcessedAt?: string;
  importedAt?: string;
  createdAt: string;
  updatedAt: string;
  logsCount: number;
  questionsCount: number;
}

interface CacheStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retrying: number;
  uploading: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function PDFProcessorCachePage() {
  const [records, setRecords] = useState<PDFProcessorCacheRecord[]>([]);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingJson, setEditingJson] = useState<string | null>(null);
  const [jsonContent, setJsonContent] = useState<string>('');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    recordType: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [searchInput, setSearchInput] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [ignoreBackground, setIgnoreBackground] = useState(true);
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    fetchRecords();
    fetchStats();
  }, [pagination.page, pagination.limit, filters]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      if (filters.status) params.append('status', filters.status);
      if (filters.recordType) params.append('recordType', filters.recordType);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/admin/pdf-processor-cache?${params}`);
      
      if (response.data.success) {
        setRecords(response.data.data || []);
        setPagination(prev => ({
          ...prev,
          ...response.data.pagination
        }));
      } else {
        setRecords([]);
      }
    } catch (error) {
      console.error('Error fetching records:', error);
      toast.error('Failed to fetch PDF processor cache records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/pdf-processor-cache/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async (id: string, fileName: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `This will permanently delete the cache record for "${fileName}". This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const response = await api.delete(`/admin/pdf-processor-cache/${id}`);
        if (response.data.success) {
          toast.success('Cache record deleted successfully');
          fetchRecords();
          fetchStats();
        }
      } catch (error) {
        console.error('Error deleting record:', error);
        toast.error('Failed to delete cache record');
      }
    }
  };

  const processWithMathpix = async (id: string) => {
    const record = records.find(r => r.id === id);
    if (!record) {
      toast.error('Record not found');
      return;
    }

    const result = await Swal.fire({
      title: 'Process with Mathpix',
      html: `
        <div>
          <p>This will process "${record.fileName}" with Mathpix to extract LaTeX content. This may take a few minutes.</p>
          <div style="margin-top: 15px;">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="ignoreBackground" ${ignoreBackground ? 'checked' : ''} style="margin: 0;">
              <span>Ignore page backgrounds (skip_recrop)</span>
            </label>
            <small style="color: #666; margin-top: 5px; display: block;">
              This helps Mathpix focus on text content and ignore decorative backgrounds
            </small>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Process',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316', // Orange color to match Mathpix button
      preConfirm: () => {
        const checkbox = document.getElementById('ignoreBackground') as HTMLInputElement;
        return { ignoreBackground: checkbox.checked };
      }
    });

    if (!result.isConfirmed) return;

    const backgroundOption = result.value?.ignoreBackground ?? ignoreBackground;
    setIgnoreBackground(backgroundOption);

    setProcessing(id);
    toast.loading('Processing PDF with Mathpix...', 'Please wait');

    try {
      // Use the new clean MathpixProcessorService endpoint
      const endpoint = `/admin/pdf-processor-cache/${record.id}/process-mathpix`;
      const response = await api.post(endpoint);

      // console.log('response', response);
      if (response.data.success) {
        toast.success('PDF processed with Mathpix successfully');
        console.log('Processing result:', response.data.data);
        // Add a small delay to ensure database is fully updated
        setTimeout(() => {
          fetchRecords();
          fetchStats();
        }, 1000);
      } else {
        toast.error(response.data.message || 'Mathpix processing failed');
      }
    } catch (error: any) {
      console.error('Error processing with Mathpix:', error);
      toast.error(`Failed to process with Mathpix: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const processWithMathpixToHtml = async (fileName: string) => {
    const record = records.find(r => r.id === fileName);
    if (!record) {
      toast.error('Record not found');
      return;
    }

    const result = await Swal.fire({
      title: 'Process with Mathpix to HTML',
      html: `
        <div>
          <p>This will process "${record.fileName}" with Mathpix to extract HTML content. This may take a few minutes.</p>
          <div style="margin-top: 15px;">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="ignoreBackgroundHtml" ${ignoreBackground ? 'checked' : ''} style="margin: 0;">
              <span>Ignore page backgrounds (skip_recrop)</span>
            </label>
            <small style="color: #666; margin-top: 5px; display: block;">
              This helps Mathpix focus on text content and ignore decorative backgrounds
            </small>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Process to HTML',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981', // Green color for HTML processing
      preConfirm: () => {
        const checkbox = document.getElementById('ignoreBackgroundHtml') as HTMLInputElement;
        return { ignoreBackground: checkbox.checked };
      }
    });

    if (!result.isConfirmed) return;

    const backgroundOption = result.value?.ignoreBackground ?? ignoreBackground;
    setIgnoreBackground(backgroundOption);

    setProcessing(fileName);
    toast.loading('Processing PDF with Mathpix to HTML...', 'Please wait');

    try {
      const response = await api.post(`/admin/pdf-processor-cache/${record.id}/process-mathpix-html`);

      console.log('HTML processing response', response);
      if (response.data.success) {
        toast.success('PDF processed with Mathpix to HTML successfully');
        console.log('HTML processing result:', response.data.data);
        // Add a small delay to ensure database is fully updated
        setTimeout(() => {
          fetchRecords();
          fetchStats();
        }, 1000);
      } else {
        toast.error(response.data.message || 'Mathpix HTML processing failed');
      }
    } catch (error: any) {
      console.error('Error processing with Mathpix to HTML:', error);
      toast.error(`Failed to process with Mathpix to HTML: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      toast.success('ID copied to clipboard');
      
      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedId(null);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy ID:', error);
      toast.error('Failed to copy ID');
    }
  };

  const viewPDF = (filePath: string, fileName: string) => {
    try {
    // Extract the relative path from the full file path
      // The filePath should be something like: C:\wamp64\www\nodejs\jee-app\content\JEE\Previous Papers\2025\Session2\Physics\0804-Physics Paper+With+Sol Evening.pdf
      // We need to extract: JEE\Previous Papers\2025\Session2\Physics\0804-Physics Paper+With+Sol Evening.pdf
      
      // Find the 'content' directory in the path
      const contentIndex = filePath.indexOf('content');
      if (contentIndex === -1) {
        console.error('Content directory not found in file path:', filePath);
        toast.error('Invalid file path');
        return;
      }
      
      // Extract the relative path from content directory
      const relativePath = filePath.substring(contentIndex + 8); // Skip 'content' + path separator
      const encodedPath = encodeURIComponent(relativePath);
      
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
      const pdfUrl = `${apiBase}/static/pdf/${encodedPath}`;
    window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error opening PDF:', error);
      toast.error('Failed to open PDF file');
    }
  };

  const viewLatex = (latexContent: string, fileName: string) => {
    // Create a new window/tab to display LaTeX content
    const latexWindow = window.open('', '_blank');
    if (latexWindow) {
      latexWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>LaTeX Content - ${fileName}</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: 'Courier New', monospace; 
              margin: 20px; 
              background: #f5f5f5;
              line-height: 1.6;
            }
            .container { 
              max-width: 1200px; 
              margin: 0 auto; 
              background: white; 
              padding: 20px; 
              border-radius: 8px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            pre { 
              background: #f8f9fa; 
              padding: 20px; 
              border-radius: 4px; 
              overflow-x: auto; 
              white-space: pre-wrap;
              border: 1px solid #e9ecef;
            }
            h1 { 
              color: #333; 
              border-bottom: 2px solid #007bff; 
              padding-bottom: 10px;
            }
            .file-info {
              background: #e3f2fd;
              padding: 10px;
              border-radius: 4px;
              margin-bottom: 20px;
              border-left: 4px solid #2196f3;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>LaTeX Content</h1>
            <div class="file-info">
              <strong>File:</strong> ${fileName}<br>
              <strong>Generated:</strong> ${new Date().toLocaleString()}
            </div>
            <pre>${latexContent}</pre>
          </div>
        </body>
        </html>
      `);
      latexWindow.document.close();
    }
  };

  const viewHtml = (htmlContent: string, fileName: string) => {
    // Create a new window/tab to display HTML content
    const htmlWindow = window.open('', '_blank');
    if (htmlWindow) {
      htmlWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>HTML Content - ${fileName}</title>
          <meta charset="utf-8">
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              margin: 20px; 
              background: #f5f5f5;
              line-height: 1.6;
            }
            .container { 
              max-width: 1200px; 
              margin: 0 auto; 
              background: white; 
              padding: 20px; 
              border-radius: 8px; 
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .html-content { 
              background: #f8f9fa; 
              padding: 20px; 
              border-radius: 4px; 
              overflow-x: auto; 
              border: 1px solid #e9ecef;
            }
            h1 { 
              color: #333; 
              border-bottom: 2px solid #10b981; 
              padding-bottom: 10px;
            }
            .file-info {
              background: #d1fae5;
              padding: 10px;
              border-radius: 4px;
              margin-bottom: 20px;
              border-left: 4px solid #10b981;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>HTML Content</h1>
            <div class="file-info">
              <strong>File:</strong> ${fileName}<br>
              <strong>Generated:</strong> ${new Date().toLocaleString()}
            </div>
            <div class="html-content">${htmlContent}</div>
          </div>
        </body>
        </html>
      `);
      htmlWindow.document.close();
    }
  };

  const openJsonEditor = async (fileName: string) => {
    const record = records.find(r => r.fileName === fileName);
    if (!record) {
      toast.error('Record not found');
      return;
    }

    setEditingJson(fileName);
    setCurrentStatus(record.processingStatus);
    setJsonContent(record.jsonContent || '');
    setShowJsonModal(true);
  };

  const saveJsonContent = async () => {
    if (!editingJson || !jsonContent.trim()) {
      toast.error('Please enter JSON content');
      return;
    }

    // Find the record to get the cache ID
    const currentRecord = records.find(r => r.fileName === editingJson);
    if (!currentRecord) {
      toast.error('Record not found');
      return;
    }

    toast.loading('Saving JSON content...', 'Please wait');
    
    try {
      const response = await api.post(`/admin/pdf-processor/save-json/${currentRecord.id}`, {
        jsonContent: jsonContent.trim()
      });
      
        if (response.data.success) {
          toast.close();
          const { questionCount, jsonFilePath } = response.data.data;
          toast.success('JSON updated', `JSON content saved to database and file: ${jsonFilePath}`);
        
        // Keep modal open and refresh the records
        fetchRecords();
      }
    } catch (error: any) {
      console.error('Error saving JSON content:', error);
      toast.close();
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const saveLMSContent = async () => {
    if (!editingJson) return;

    const currentRecord = records.find(r => r.fileName === editingJson);
    if (!currentRecord || currentRecord.recordType !== 'lms') {
      toast.error('This function is only available for LMS records');
      return;
    }

    if (!currentRecord.htmlContent) {
      toast.error('No HTML content found for this record');
      return;
    }

    toast.loading('Saving LMS content...', 'Please wait');
    
    try {
      const response = await api.post(`/admin/pdf-processor-cache/${currentRecord.id}/save-lms-content`);
      
      if (response.data.success) {
        toast.close();
        toast.success('LMS content saved successfully!');
        fetchRecords();
        refreshModalData();
      }
    } catch (error: any) {
      console.error('Error saving LMS content:', error);
      toast.close();
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const deleteLMSContent = async () => {
    if (!editingJson) return;

    const currentRecord = records.find(r => r.fileName === editingJson);
    if (!currentRecord) return;

    const confirmed = await Swal.fire({
      title: 'Delete LMS Content',
      html: `This will delete the LMS content for <strong>${editingJson}</strong><br><br>This action cannot be undone. Are you sure you want to continue?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!confirmed.isConfirmed) return;

    try {
      toast.loading('Deleting LMS content...', 'Please wait');
      const response = await api.delete(`/admin/pdf-processor-cache/${currentRecord.id}/delete-lms-content`);
      
      if (response.data.success) {
        toast.close();
        toast.success('LMS content deleted successfully!');
        fetchRecords();
        refreshModalData();
      }
    } catch (error: any) {
      console.error('Error deleting LMS content:', error);
      toast.close();
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const previewLMSContent = () => {
    if (!editingJson) return;

    const currentRecord = records.find(r => r.fileName === editingJson);
    if (!currentRecord) return;

    // Navigate to the LMS content preview page
    window.open(`/admin/lms-content-preview/${currentRecord.id}`, '_blank');
  };

  const markAsCompleted = async () => {
    if (!editingJson) return;

    // Find the record to get the cacheId
    const currentRecord = records.find(r => r.fileName === editingJson);
    if (!currentRecord) {
      toast.error('Record not found');
      return;
    }

    try {
      const response = await api.post(`/admin/pdf-processor/mark-completed/${currentRecord.id}`);
      if (response.data.success) {
        toast.success('File marked as completed');
        setCurrentStatus('COMPLETED');
        fetchRecords();
        fetchStats();
      }
    } catch (error: any) {
      console.error('Error marking as completed:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const importQuestions = async () => {
    if (!editingJson) return;

    const currentRecord = records.find(r => r.fileName === editingJson);
    if (!currentRecord) return;

    // Parse JSON to get question count
    let questionCount = 0;
    try {
      if (currentRecord.jsonContent) {
        const jsonData = JSON.parse(currentRecord.jsonContent);
        questionCount = jsonData.questions ? jsonData.questions.length : 0;
      }
    } catch (error) {
      console.error('Error parsing JSON for question count:', error);
    }

    // Show confirmation dialog
    const confirmed = await Swal.fire({
      title: 'Update Questions',
      html: `This will update <strong>${questionCount} questions</strong> from <strong>${editingJson}</strong><br><br>This will insert new questions or update existing ones in the Question database with 'under review' status.<br><br>Are you sure you want to continue?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, update them!',
      cancelButtonText: 'Cancel'
    });

    if (!confirmed.isConfirmed) return;

    try {
      setImporting(true);
      toast.info('Importing questions from JSON...');
      const response = await api.post(`/admin/pdf-processor-cache/${currentRecord.id}/import-questions`);
      if (response.data.success) {
        toast.success(`Successfully imported ${response.data.importedCount} questions`);
        await refreshModalData();
        await fetchRecords(); // Refresh the main table
      } else {
        toast.error(response.data.message || 'Failed to import questions');
      }
    } catch (error: any) {
      console.error('Error importing questions:', error);
      toast.error(error.response?.data?.message || 'Failed to import questions');
    } finally {
      setImporting(false);
    }
  };

  const processWithChatGPT = async () => {
    if (!editingJson) return;

    const currentRecord = records.find(r => r.fileName === editingJson);
    if (!currentRecord) return;

    if (!currentRecord.latexFilePath) {
      toast.error('LaTeX file path not found. Please process with Mathpix first.');
      return;
    }

    setProcessing(editingJson);
    toast.loading('Processing LaTeX file with ChatGPT (streaming)...', 'This may take several minutes for large files');

    try {
      const response = await api.post(`/admin/pdf-processor-cache/${currentRecord.id}/process-chatgpt`, {
        latexFilePath: currentRecord.latexFilePath
      });

      if (response.data.success) {
        const questionsCount = response.data.questionsCount || 0;
        const chunksProcessed = response.data.chunksProcessed || 0;
        const totalChunks = response.data.totalChunks || 0;
        
        toast.success(`LaTeX file processed successfully! Found ${questionsCount} questions from ${chunksProcessed}/${totalChunks} chunks`);
        
        // Update the JSON content in the modal
        if (response.data.jsonContent) {
          setJsonContent(response.data.jsonContent);
        }
        
        // Refresh the modal data to get updated record
        await refreshModalData();
        await fetchRecords(); // Refresh the main table
      } else {
        toast.error(response.data.message || 'ChatGPT processing failed');
      }
    } catch (error: any) {
      console.error('Error processing with ChatGPT:', error);
      toast.error(`Failed to process with ChatGPT: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const processWithClaude = async () => {
    if (!editingJson) return;

    const currentRecord = records.find(r => r.fileName === editingJson);
    if (!currentRecord) return;

    if (!currentRecord.latexFilePath) {
      toast.error('No LaTeX file found. Please process with Mathpix first.');
      return;
    }

    setProcessing(editingJson);
    toast.loading('Processing LaTeX file with Claude...', 'This may take several minutes for large files');

    try {
      const response = await api.post(`/admin/pdf-processor-cache/${currentRecord.id}/process-claude`, {
        latexFilePath: currentRecord.latexFilePath
      });

      if (response.data.success) {
        const questionsCount = response.data.questionsCount || 0;
        const chunksProcessed = response.data.chunksProcessed || 0;
        
        toast.success(`LaTeX file processed successfully! Found ${questionsCount} questions${chunksProcessed > 1 ? ` from ${chunksProcessed} chunks` : ''}`);
        
        // Update the JSON content in the modal
        if (response.data.jsonContent) {
          setJsonContent(response.data.jsonContent);
        }
        
        // Refresh the modal data to get updated record
        await refreshModalData();
        await fetchRecords(); // Refresh the main table
      } else {
        toast.error(response.data.message || 'Claude processing failed');
      }
    } catch (error: any) {
      console.error('Error processing with Claude:', error);
      toast.error(`Failed to process with Claude: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const previewQuestions = () => {
    const record = records.find(r => r.fileName === editingJson);
    if (record?.importedAt) {
      // Open PDF review page in new window
      window.open(`/admin/pdf-review/${record.id}`, '_blank');
    }
  };

  const deleteQuestions = async () => {
    if (!editingJson) return;

    const currentRecord = records.find(r => r.fileName === editingJson);
    if (!currentRecord) return;

    // Show confirmation dialog
    const confirmed = await Swal.fire({
      title: 'Delete Questions',
      html: `This will delete <strong>ALL questions</strong> associated with <strong>${editingJson}</strong><br><br>This action cannot be undone. Are you sure you want to continue?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete them!',
      cancelButtonText: 'Cancel'
    });

    if (!confirmed.isConfirmed) return;

    try {
      toast.info('Deleting questions...');
      const response = await api.delete(`/admin/pdf-processor-cache/${currentRecord.id}/delete-questions`);
      if (response.data.success) {
        toast.success(`Successfully deleted ${response.data.deletedCount} questions`);
        await refreshModalData();
        await fetchRecords(); // Refresh the main table
      } else {
        toast.error(response.data.message || 'Failed to delete questions');
      }
    } catch (error: any) {
      console.error('Error deleting questions:', error);
      toast.error(error.response?.data?.message || 'Failed to delete questions');
    }
  };

  const refreshModalData = async () => {
    if (!editingJson) return;

    try {
      const response = await api.get(`/admin/pdf-processor-cache/${records.find(r => r.fileName === editingJson)?.id}`);
      if (response.data.success) {
        const record = response.data.data;
        setJsonContent(record.jsonContent || '');
        setCurrentStatus(record.processingStatus);
        toast.success('Modal data refreshed');
      }
    } catch (error: any) {
      console.error('Error refreshing modal data:', error);
      toast.error('Failed to refresh modal data');
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setFilters(prev => ({ ...prev, search: '' }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSyncFiles = async () => {
    try {
      setSyncing(true);
      toast.info('Syncing files from content folder...');
      
      const response = await api.post('/admin/pdf-processor-cache/sync-files');
      
      if (response.data.success) {
        const message = `Sync completed! ${response.data.synced} files synced${response.data.updated ? `, ${response.data.updated} files updated` : ''}, ${response.data.skipped} duplicates skipped`;
        toast.success(message);
        // Refresh the records and stats
        await fetchRecords();
        await fetchStats();
      } else {
        toast.error(response.data.message || 'Failed to sync files');
      }
    } catch (error: any) {
      console.error('Error syncing files:', error);
      toast.error(error.response?.data?.message || 'Failed to sync files');
    } finally {
      setSyncing(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'retrying':
        return 'bg-orange-100 text-orange-800';
      case 'uploading':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && records.length === 0) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <AdminLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PDF Processor Cache</h1>
              <p className="text-gray-600">Manage PDF processing cache records</p>
              <div className="mt-2 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">Background Processing:</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    ignoreBackground 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {ignoreBackground ? 'Ignore Backgrounds' : 'Process All Content'}
                  </span>
                </div>
                <button
                  onClick={() => setIgnoreBackground(!ignoreBackground)}
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Toggle Setting
                </button>
              </div>
            </div>
            <button
              onClick={handleSyncFiles}
              disabled={syncing}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {syncing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Syncing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Sync Files
                </>
              )}
            </button>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Records</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white p-6 rounded-lg shadow relative z-10 overflow-visible">
            <div className="flex flex-wrap items-end gap-4 overflow-visible">
              <div className="flex-1 min-w-[150px] relative z-20">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">ALL</option>
                  <option value="PENDING">PENDING</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className="flex-1 min-w-[150px] relative z-20">
                <label className="block text-sm font-medium text-gray-700 mb-2">Record Type</label>
                <select
                  value={filters.recordType}
                  onChange={(e) => handleFilterChange('recordType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">ALL</option>
                  <option value="pyq">PYQ</option>
                  <option value="question">Question</option>
                  <option value="lms">LMS</option>
                </select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by filename..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>

              <div className="flex-1 min-w-[150px] relative z-20">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="createdAt">Created Date</option>
                  <option value="fileName">File Name</option>
                  <option value="fileSize">File Size</option>
                  <option value="processingStatus">Status</option>
                  <option value="processingTimeMs">Processing Time</option>
                  <option value="retryCount">Retry Count</option>
                  <option value="lastProcessedAt">Last Processed</option>
                  <option value="importedAt">Imported Date</option>
                </select>
              </div>

              <div className="flex-1 min-w-[120px] relative z-20">
                <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              <div className="flex-shrink-0">
                <button
                  onClick={handleSearch}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search</span>
                </button>
              </div>
            </div>

            {/* Clear Search and Active Search Status */}
            {(filters.search || searchInput) && (
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  {filters.search && (
                    <button
                      onClick={handleClearSearch}
                      className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                {filters.search && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Active Search:</span> "{filters.search}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Records Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID & Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {records && records.length > 0 ? records.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={record.fileName}>
                          {record.fileName}
                        </div>
                        {/* <div className="text-sm text-gray-500 truncate max-w-xs" title={record.filePath}>
                          {record.filePath}
                        </div> */}
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => {
                              try {
                                // Extract the relative path from the full file path
                                const contentIndex = record.filePath.indexOf('content');
                                if (contentIndex === -1) {
                                  console.error('Content directory not found in file path:', record.filePath);
                                  toast.error('Invalid file path');
                                  return;
                                }
                                
                                // Extract the relative path from content directory
                                // Find the position after 'content' and the path separator
                                const contentStart = contentIndex + 'content'.length;
                                const pathSeparator = record.filePath[contentStart] === '\\' || record.filePath[contentStart] === '/' ? 1 : 0;
                                const relativePath = record.filePath.substring(contentStart + pathSeparator);
                                // Convert backslashes to forward slashes for URL
                                const normalizedPath = relativePath.replace(/\\/g, '/');
                                // Only encode the filename, not the path separators
                                const pathParts = normalizedPath.split('/');
                                const encodedParts = pathParts.map(part => encodeURIComponent(part));
                                const encodedPath = encodedParts.join('/');
                                
                                // Use the backend API for static files
                                const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
                                const fileUrl = `${apiBase}/static/pdf/${encodedPath}`;
                                
                                console.log('PDF View Debug Info:');
                                console.log('- Original file path:', record.filePath);
                                console.log('- Relative path:', relativePath);
                                console.log('- Normalized path:', normalizedPath);
                                console.log('- Encoded path:', encodedPath);
                                console.log('- API base:', apiBase);
                                console.log('- Final URL:', fileUrl);
                                
                                window.open(fileUrl, '_blank');
                              } catch (error) {
                                console.error('Error opening PDF:', error);
                                toast.error('Failed to open PDF file');
                              }
                            }}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            title="View PDF"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View PDF
                          </button>
                          {record.latexContent && (
                          <button
                            onClick={() => window.open(record.latexFilePath || '', '_blank')}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            title="View LaTeX"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            View LaTeX
                          </button>
                          )}
                          {record.htmlContent && (
                          <button
                            onClick={() => viewHtml(record.htmlContent || '', record.fileName)}
                            className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                            title="View HTML"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                            View HTML
                          </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.recordType === 'pyq' ? 'bg-blue-100 text-blue-800' :
                          record.recordType === 'question' ? 'bg-green-100 text-green-800' :
                          record.recordType === 'lms' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.recordType?.toUpperCase() || 'PYQ'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-2">
                          {/* ID with Copy Button */}
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                              {record.id}
                            </span>
                            <button
                              onClick={() => copyId(record.id)}
                              className="inline-flex items-center justify-center w-6 h-6 text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                              title="Copy ID"
                            >
                              {copiedId === record.id ? (
                                <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                          {/* Status Badge */}
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.processingStatus)}`}>
                            {record.processingStatus}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFileSize(record.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.questionsCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-2">
                          {/* Edit JSON Button - Purple (only show if Mathpix processed) */}
                          {record.latexFilePath && (
                            <button
                              onClick={() => openJsonEditor(record.fileName)}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                              title="Edit JSON Content"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit JSON
                            </button>
                          )}

                          {/* Mathpix Processing Button */}
                          {!record.latexFilePath ? (
                            <button
                              onClick={() => processWithMathpix(record.id)}
                              disabled={processing === record.id}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {processing === record.id ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </>
                              ) : (
                                'Process Mathpix'
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => processWithMathpix(record.id)}
                              disabled={processing === record.id}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {processing === record.id ? (
                                <>
                                  <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing...
                                </>
                              ) : (
                                'Retry Mathpix'
                              )}
                            </button>
                          )}

                          {/* Mathpix HTML Processing Button - Only for LMS content type */}
                          {record.recordType === 'lms' && (
                            !record.htmlFilePath ? (
                              <button
                                onClick={() => processWithMathpixToHtml(record.id)}
                                disabled={processing === record.id}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {processing === record.id ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                  </>
                                ) : (
                                  'Process HTML'
                                )}
                              </button>
                            ) : (
                              <button
                                onClick={() => processWithMathpixToHtml(record.id)}
                                disabled={processing === record.id}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              >
                                {processing === record.id ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Processing...
                                  </>
                                ) : (
                                  'Retry HTML'
                                )}
                              </button>
                            )
                          )}

                          {/* Delete Button - Red */}
                          <button
                            onClick={() => handleDelete(record.id, record.fileName)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            title="Delete Record"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : null}
                </tbody>
              </table>
            </div>

            {(!records || records.length === 0) && !loading && (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No cache records found</h3>
                <p className="mt-1 text-sm text-gray-500">No PDF processor cache records match your current filters.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{pagination.total}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.page - 2)) + i;
                      if (pageNum > pagination.totalPages) return null;
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === pagination.page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}

          {/* JSON Editor Modal */}
          {showJsonModal && editingJson && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        JSON Content Editor: {editingJson}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          currentStatus === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          currentStatus === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                          currentStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                          currentStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {currentStatus} ({records.find(r => r.fileName === editingJson)?.recordType || 'Unknown'})
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* Copy Prompt Button */}
                      <button
                        onClick={() => {
                          const promptText = `You are an expert JEE (Joint Entrance Examination) question analyzer.  

I will provide you the full content of a \`.tex\` file containing JEE Physics, Chemistry, and Mathematics questions with solutions.  



Your task is to **extract and structure ALL questions into JSON format**.



---



### CRITICAL RULES

1. Respond with **ONLY valid JSON**. Do not include explanations or markdown. Start with \`{\` and end with \`}\`.  

2. Preserve **exactly the questions, options, and correct answers** from the \`.tex\` file.  

   - ❌ Do not fabricate or invent any question text or options.  

   - ✅ Only include content explicitly present in the provided \`.tex\` file.

3. **Do NOT generate filler or fake questions for missing ones**

4. All mathematical and chemical formulas must use LaTeX: $ ... $ (single dollar signs for inline math).

  **Preserve exactly the question text, math, and options** as they appear in the \`.tex\` file.

   - Keep all LaTeX math enclosed in single dollar signs \`$ ... $\`.

   - Preserve symbols, fractions, and expressions exactly.

5. **Do not skip ANY image references.** Every \`\\includegraphics\` in the \`.tex\` must be included in the JSON.   

   - Replace them with an HTML \`<img>\` tag.  

   - Format:  

     \`\`\`html

     <img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/FILENAME/IMAGE_FILE.EXT' />

     \`\`\`  

   - \`FILENAME\` = the \`.tex\` file's base name (without extension, and strip any trailing \`[1]\`, \`[2]\` etc).  

   - \`IMAGE_FILE\` = the original image filename from LaTeX (without extension).  

   - \`EXT\` =  

     - \`.png\` if the file name starts with \`smile-\`  

     - \`.jpg\` otherwise  

   - Example:  

     File: \`1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION.tex\`  

     \`\`\`latex

     \\includegraphics{2025_10_02_abc.png}

     \`\`\`  

     →  

     \`\`\`json

     "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION/2025_10_02_abc.jpg' />"

     \`\`\`  

   - Example:  

     File: \`smile-physics-paper.tex\`  

     \`\`\`latex

     \\includegraphics{diagram1}

     \`\`\`  

     →  

     \`\`\`json

     "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/smile-physics-paper/diagram1.png' />"

     \`\`\`  

6. Accept question numbering as \`Q1, Q2, …\` or \`1., 2., …\`.  

7. **Skip all promotional/branding content** (e.g., "Allen", "Best of Luck", headers/footers, watermarks, motivational lines). Keep only actual question data.  



---



### CHUNKED PROCESSING

- Physics: Section A **Q1-Q20** & Section B **Q1–Q10**  

- Chemistry: Section A **Q1-Q20** & Section B **Q1–Q10**  

- Mathematics: Section A **Q1-Q20** & Section B **Q1–Q10**  

- Each subject must have **exactly 30 questions**.  

- If fewer appear in the \`.tex\`, do not generate realistic filler questions to complete the block.  



---



### QUESTION CONTENT RULES

For each question:

- \`stem\`: must match the original question text from the \`.tex\`.  

- \`options\`: must match exactly the four options from the \`.tex\`.

- \`correctNumericAnswer\`: if there are no options found, then calculate the answer for the question and store it in 'correctNumericAnswer' field

- \`isOpenEnded\`: if there are no options found, make this field as true

- \`isCorrect\`:  

  - If the correct answer is explicitly given in the \`.tex\`, preserve it.  

  - If missing, you may **generate the correct answer** as a subject expert.  

- \`explanation\`:  

  - You can find explanation starts with 'Sol.'

  - If given in the file, preserve it.  

  - preserve the new lines OR paragraphs

  - If missing, **generate a step-by-step reasoning** as a subject expert.  

- \`tip_formula\`:  

  - If given in the file, preserve it.  

  - If missing, **generate a key formula or shortcut**.  

- If you found \`yearAppeared\` then \`isPreviousYear\` is true otherwise false

- \`difficulty\`: assign as \`EASY\`, \`MEDIUM\`, or \`HARD\`. 

- \`questionType\`: Can be any one from: MCQ_SINGLE, MCQ_MULTIPLE, OPEN_ENDED, PARAGRAPH 

- Preserve all LaTeX math exactly.  



---



### CLASSIFICATION RULES

Use the official **JEE Main 2025 syllabus**:

- Physics (Units 1–20)  

- Chemistry (Units 1–20)  

- Mathematics (Units 1–14)  

- If you found main heading as 'Exercise' OR Questions OR similar take them as 'exerciseName' if dont found those words take the subject name as 'exerciseName'

Assign: **lesson → topic → subtopic**.  



---



### OUTPUT JSON FORMAT

\`\`\`json

{

  "questions": [

    {

      "id": "Q31",

      "stem": "If $\\phi(x)=\\frac{1}{\\sqrt{x}} \\int_{\\frac{\\pi}{4}}^{x}\\left(4 \\sqrt{2} \\sin t-3 \\phi^{\\prime}(t)\\right) dt, x>0$, then $\\phi^{\\prime}\\left(\\frac{\\pi}{4}\\right)$ is equal to :",

      "options": [

        {"id": "A", "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION/2025_10_02_8d455ea6d672c1411a66g-01.jpg' />", "isCorrect": false},

        {"id": "B", "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION/2025_10_02_8d455ea6d672c1411a66g-01(1).jpg' />", "isCorrect": false},

        {"id": "C", "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION/2025_10_02_8d455ea6d672c1411a66g-01(2).jpg' />", "isCorrect": true},

        {"id": "D", "text": "Defect-free lattice", "isCorrect": false}

      ],

      "explanation": "$\\phi^{\\prime}(x)=\\frac{1}{\\sqrt{x}}\\left[\\left(4 \\sqrt{2} \\sin x-3 \\phi^{\\prime}(x)\\right) .1-0\\right]-\\frac{1}{2} x^{-3 / 2}\\int_{\\frac{\\pi}{4}}^{x}\\left(4 \\sqrt{2} \\sin t-3 \\phi^{\\prime}(t)\\right) dt$, $\\phi^{\\prime}\\left(\\frac{\\pi}{4}\\right)=\\frac{2}{\\sqrt{\\pi}}\\left[4-3 \\phi^{\\prime}\\left(\\frac{\\pi}{4}\\right)\\right]+0$, $\\left(1+\\frac{6}{\\sqrt{\\pi}}\\right) \\phi^{\\prime}\\left(\\frac{\\pi}{4}\\right)=\\frac{8}{\\sqrt{\\pi}}$, $\\phi^{\\prime}\\left(\\frac{\\pi}{4}\\right)=\\frac{8}{\\sqrt{\\pi}+6}$",

      "tip_formula": "Charge neutrality: $\\\\Sigma q_{+} = \\\\Sigma q_{-}$",

      "difficulty": "MEDIUM",

      "subject": "Chemistry",

      "lesson": "Inorganic Chemistry",

      "topic": "Solid State",

      "subtopic": "Defects in Crystals",

      "yearAppeared": 2023,

      "isPreviousYear": true,

      "isOpenEnded": false,

      "correctNumericAnswer": 2,

      "questionType": "MCQ_SINGLE",

      "exerciseName": "Exercise1",

      "tags": ["solid-state", "defects", "charge-neutrality"]

    }

  ],

  "metadata": {

    "totalQuestions": 90,

    "totalExercises": 3,

    "subjects": ["Physics", "Chemistry", "Mathematics"],

    "difficultyDistribution": {"easy": 30, "medium": 45, "hard": 15}

  }

}

\`\`\`



### IMPORTANT ANTI-FABRICATION RULES

Only output questions explicitly detected in the .tex file.

If something cannot be confidently extracted, omit it.

Do NOT make up question text, options, or correct answers.

Every extracted question must have originated verbatim from the .tex file content.



### CLASSIFICATION

For each extracted question, identify the appropriate:

subject (Physics, Chemistry, Mathematics)

lesson, topic, and subtopic based on JEE Main 2025 syllabus.

Do not guess if unclear — mark "lesson": "Unknown" etc. if uncertain.



### FINAL INSTRUCTION



Read the \`.tex\` file carefully and return **only the JSON output** in the schema above.  

Ensure exactly questions from .tex file do not invent OR fabricate, numbered sequentially (Q1, Q2 OR 1., 2., etc), with lesson/topic/subtopic classification.  

Ignore and skip any **branding, coaching names, promotional headers/footers, or unrelated text**.  

Preserve **exactly the questions, options, and correct answers** from the \`.tex\` file.  

   - ❌ Do not fabricate or invent any question text or options.  

   - ✅ Use the same wording, LaTeX math, and image references as in the file.  

**Do not skip ANY image references.** Every \`\\includegraphics\` in the \`.tex\` must be included in the JSON.  

Use single dollar signs $ ... $ for all LaTeX math expressions.

Read the .tex file carefully.

Return only valid JSON, faithfully representing every question that truly exists in the source file.

Do not generate or hallucinate new data under any circumstances.

Please proceed with extracting ALL **90** questions from the complete .tex file content you provided. Read through the entire document carefully and include all **90** questions. If you need do **CHUNKED PROCESSING** for reading all **90** questions

**Remember and take into your memory that, my attachment contains 90 questions, kindly give all 90 questions**

**Remember and take into your memory that, dont fabricate OR invent questions on your own, only give all questions in my '.tex' file. Extract ONLY the questions that actually exist in the file**

**don't give questins that doesnt exist in my document, only give all questions exists in my attachment**

**Never Never Never invent or duplicate questions to meet an expected number**`;

                          navigator.clipboard.writeText(promptText).then(() => {
                            toast.success('Prompt copied to clipboard!');
                          }).catch(() => {
                            toast.error('Failed to copy prompt');
                          });
                        }}
                        className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                        title="Copy AI prompt to clipboard"
                      >
                        Copy Prompt
                      </button>
                      
                      {/* View PDF Button */}
                      <button
                        onClick={() => {
                          const record = records.find(r => r.fileName === editingJson);
                          if (record?.filePath) {
                            try {
                              // Extract the relative path from the full file path
                              // The filePath should be something like: C:\wamp64\www\nodejs\jee-app\content\JEE\Previous Papers\2025\Session2\Physics\0804-Physics Paper+With+Sol Evening.pdf
                              // We need to extract: JEE/Previous Papers/2025/Session2/Physics/0804-Physics Paper+With+Sol Evening.pdf
                              
                              // Find the 'content' directory in the path
                              const contentIndex = record.filePath.indexOf('content');
                              if (contentIndex === -1) {
                                console.error('Content directory not found in file path:', record.filePath);
                                toast.error('Invalid file path');
                                return;
                              }
                              
                              // Extract the relative path from content directory
                              // Find the position after 'content' and the path separator
                              const contentStart = contentIndex + 'content'.length;
                              const pathSeparator = record.filePath[contentStart] === '\\' || record.filePath[contentStart] === '/' ? 1 : 0;
                              const relativePath = record.filePath.substring(contentStart + pathSeparator);
                              // Convert backslashes to forward slashes for URL
                              const normalizedPath = relativePath.replace(/\\/g, '/');
                              // Only encode the filename, not the path separators
                              const pathParts = normalizedPath.split('/');
                              const encodedParts = pathParts.map(part => encodeURIComponent(part));
                              const encodedPath = encodedParts.join('/');
                              
                              // Use the backend API for static files
                              const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
                              const fileUrl = `${apiBase}/static/pdf/${encodedPath}`;
                              console.log('Opening PDF URL:', fileUrl);
                              window.open(fileUrl, '_blank');
                            } catch (error) {
                              console.error('Error opening PDF:', error);
                              toast.error('Failed to open PDF file');
                            }
                          } else {
                            toast.error('PDF file not found');
                          }
                        }}
                        className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
                        title="Open PDF file in new window"
                      >
                        View PDF
                      </button>
                      
                      {/* Mark as Completed Button */}
                      <button
                        onClick={markAsCompleted}
                        disabled={currentStatus === 'COMPLETED'}
                        className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                          currentStatus === 'COMPLETED' 
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                            : 'text-white bg-green-600 hover:bg-green-700'
                        }`}
                        title={currentStatus === 'COMPLETED' ? 'Already completed' : 'Mark this file as completed'}
                      >
                        Mark as completed
                      </button>
                      
                      {/* Refresh Button */}
                      <button
                        onClick={refreshModalData}
                        className="px-3 py-1 text-sm font-medium text-white bg-blue-600 border border-blue-200 rounded-md hover:bg-blue-700 transition-colors"
                        title="Refresh modal data with latest changes"
                      >
                        Refresh
                      </button>
                      
                      {/* Close Button */}
                      <button
                        onClick={() => {
                          setShowJsonModal(false);
                          setEditingJson(null);
                          setJsonContent('');
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {/* PDF File Path Display */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PDF File Path
                      </label>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-300 rounded-md">
                        <code className="flex-1 text-sm text-gray-800 font-mono break-all">
                          {records.find(r => r.fileName === editingJson)?.filePath || 'Path not found'}
                        </code>
                        <button
                          onClick={() => {
                            const filePath = records.find(r => r.fileName === editingJson)?.filePath;
                            if (filePath) {
                              navigator.clipboard.writeText(filePath).then(() => {
                                toast.success('File path copied to clipboard!');
                              }).catch(() => {
                                toast.error('Failed to copy file path');
                              });
                            }
                          }}
                          className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                          title="Copy file path to clipboard"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* LaTeX File Path Display */}
                    {records.find(r => r.fileName === editingJson)?.latexFilePath && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          LaTeX File Path
                        </label>
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-300 rounded-md">
                          <code className="flex-1 text-sm text-gray-800 font-mono break-all">
                            {records.find(r => r.fileName === editingJson)?.latexFilePath || 'LaTeX path not found'}
                          </code>
                          <button
                            onClick={() => {
                              const latexPath = records.find(r => r.fileName === editingJson)?.latexFilePath;
                              if (latexPath) {
                                try {
                                  // Split into base and filename parts
                                  const lastSlashIndex = latexPath.lastIndexOf('/');
                                  const baseUrl = latexPath.substring(0, lastSlashIndex + 1);
                                  const fileName = latexPath.substring(lastSlashIndex + 1);

                                  // Encode only the filename (handles +, spaces, etc.)
                                  const encodedPath = baseUrl + encodeURIComponent(fileName);

                                  // Copy to clipboard
                                  navigator.clipboard.writeText(encodedPath)
                                    .then(() => toast.success('LaTeX file path copied to clipboard!'))
                                    .catch(() => toast.error('Failed to copy LaTeX file path'));
                                } catch (err) {
                                  toast.error('Error encoding LaTeX file path');
                                }
                              }
                            }}
                            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                            title="Copy LaTeX file path to clipboard"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>


                        </div>
                      </div>
                    )}

                    {/* HTML File Path Display - Only for LMS records */}
                    {records.find(r => r.fileName === editingJson)?.recordType === 'lms' && records.find(r => r.fileName === editingJson)?.htmlFilePath && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          HTML File Path
                        </label>
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-300 rounded-md">
                          <code className="flex-1 text-sm text-gray-800 font-mono break-all">
                            {records.find(r => r.fileName === editingJson)?.htmlFilePath || 'HTML path not found'}
                          </code>
                          <button
                            onClick={() => {
                              const htmlPath = records.find(r => r.fileName === editingJson)?.htmlFilePath;
                              if (htmlPath) {
                                try {
                                  // Split into base and filename parts
                                  const lastSlashIndex = htmlPath.lastIndexOf('/');
                                  const baseUrl = htmlPath.substring(0, lastSlashIndex + 1);
                                  const fileName = htmlPath.substring(lastSlashIndex + 1);

                                  // Encode only the filename (handles +, spaces, etc.)
                                  const encodedPath = baseUrl + encodeURIComponent(fileName);

                                  // Copy to clipboard
                                  navigator.clipboard.writeText(encodedPath)
                                    .then(() => toast.success('HTML file path copied to clipboard!'))
                                    .catch(() => toast.error('Failed to copy HTML file path'));
                                } catch (err) {
                                  toast.error('Error encoding HTML file path');
                                }
                              }
                            }}
                            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                            title="Copy HTML file path to clipboard"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        JSON Content (Paste your question data here)
                      </label>
                      <textarea
                        value={jsonContent}
                        onChange={(e) => setJsonContent(e.target.value)}
                        placeholder="Paste your JSON content here..."
                        className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      />
                    </div>
                    
                    <div className="flex justify-between">
                      {/* Left side - Delete Questions button (only show if imported) */}
                      <div>
                        {(() => {
                          const currentRecord = records.find(r => r.fileName === editingJson);
                          if (currentRecord?.importedAt) {
                            return (
                              <button
                                onClick={deleteQuestions}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                              >
                                Delete Questions
                              </button>
                            );
                          }
                          return null;
                        })()}
                      </div>

                      {/* Right side - Other action buttons */}
                      <div className="flex space-x-3">
                        <button
                          onClick={() => {
                            setShowJsonModal(false);
                            setEditingJson(null);
                            setJsonContent('');
                          }}
                          className="px-4 py-2 text-sm font-medium rounded-md border
    text-gray-700 bg-gray-100 hover:bg-gray-200 border-gray-300
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500
    dark:text-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-700"
                        >
                          Cancel
                        </button>
                        
                        {/* Always show Save JSON Content button */}
                        <button
                          onClick={saveJsonContent}
                          className="px-4 py-2 text-sm font-semibold rounded-md border
    text-white bg-blue-600 hover:bg-blue-500 border-blue-700
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-400
    dark:bg-blue-500 dark:hover:bg-blue-400 dark:border-blue-400"
                        >
                          Save JSON Content
                        </button>
                        
                        {/* LMS Content buttons for LMS records */}
                        {(() => {
                          const currentRecord = records.find(r => r.fileName === editingJson);
                          if (currentRecord?.recordType === 'lms') {
                            if (currentRecord.lmsContentId) {
                              // Show Delete and Preview buttons if LMS content exists
                              return (
                                <>
                                  <button
                                    onClick={deleteLMSContent}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                  >
                                    Delete Content
                                  </button>
                                  <button
                                    onClick={previewLMSContent}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                  >
                                    Preview Content
                                  </button>
                                </>
                              );
                            } else {
                              // Show Save Content button if no LMS content exists
                              return (
                                <button
                                  onClick={saveLMSContent}
                                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                                >
                                  Save Content
                                </button>
                              );
                            }
                          }
                          return null;
                        })()}
                        
                        {/* Additional buttons based on record state */}
                        {(() => {
                          const currentRecord = records.find(r => r.fileName === editingJson);
                          
                          // Always show Import/Re-import button if jsonContent exists
                          if (currentRecord?.jsonContent) {
                            return (
                              <>
                                <button
                                  onClick={importQuestions}
                                  disabled={importing}
                                  className={`px-4 py-2 text-sm font-medium text-white rounded-md transition-colors flex items-center space-x-2 ${
                                    importing 
                                      ? 'bg-gray-400 cursor-not-allowed' 
                                      : 'bg-red-600 hover:bg-red-700'
                                  }`}
                                >
                                  {importing ? (
                                    <>
                                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      Importing...
                                    </>
                                  ) : (
                                    currentRecord?.importedAt ? 'Re-import' : 'Import'
                                  )}
                                </button>
                                
                                {/* Show Preview button if already imported */}
                                {currentRecord?.importedAt && (
                                  <button
                                    onClick={previewQuestions}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                                  >
                                    Preview
                                  </button>
                                )}
                              </>
                            );
                          }
                          
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
