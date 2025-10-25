'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import api from '@/lib/api';
import { toast } from '@/lib/toast';
import Swal from 'sweetalert2';

interface PDFFile {
  fileName: string;
  filePath: string;
  fileSize: number;
  status: string;
  questionCount?: number;
  hasImportedQuestions?: boolean;
  cacheId?: string;
  importedAt?: string;
  hasJsonFile?: boolean;
  jsonContent?: string;
  jsonQuestionCount?: number;
  databaseId?: string;
  importedQuestionCount?: number;
  hasLatexContent?: boolean;
  latexFilePath?: string;
  latexContent?: string;
}

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  fileCount: number;
  isExpanded: boolean;
}

interface ProcessingStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  retrying: number;
}


interface ProcessingStatus {
  id: string;
  fileName: string;
  processingStatus: string;
  errorMessage?: string;
  outputFilePath?: string;
  processingTimeMs?: number;
  lastProcessedAt?: string;
  logs: Array<{
    id: string;
    logType: string;
    message: string;
    createdAt: string;
  }>;
}

export default function PDFProcessorPage() {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<PDFFile[]>([]);
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [statusDetails, setStatusDetails] = useState<ProcessingStatus | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [editingJson, setEditingJson] = useState<string | null>(null);
  const [jsonContent, setJsonContent] = useState<string>('');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [folderTree, setFolderTree] = useState<FolderNode[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [filteredPdfs, setFilteredPdfs] = useState<PDFFile[]>([]);
  const [showFolderPanel, setShowFolderPanel] = useState<boolean>(true);
  const [showLatexModal, setShowLatexModal] = useState(false);
  const [latexContent, setLatexContent] = useState<string>('');
  const [latexFilePath, setLatexFilePath] = useState<string>('');
  const [currentStatus, setCurrentStatus] = useState<string>('');

  useEffect(() => {
    fetchPDFs();
    fetchStats();
  }, []);

  // Update filtered PDFs when selectedFolder or pdfs change
  useEffect(() => {
    if (selectedFolder === '') {
      setFilteredPdfs(pdfs);
    } else {
      const basePath = 'content\\';
      const filtered = pdfs.filter(pdf => {
        const relativePath = pdf.filePath.includes(basePath) 
          ? pdf.filePath.split(basePath)[1] 
          : pdf.filePath;
        return relativePath.startsWith(selectedFolder + '\\') || relativePath === selectedFolder;
      });
      setFilteredPdfs(filtered);
    }
  }, [selectedFolder, pdfs]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showActionMenu) {
        const target = event.target as Element;
        if (!target.closest('.action-menu-container')) {
          setShowActionMenu(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionMenu]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Toggle folder panel with Ctrl/Cmd + B
      if ((event.ctrlKey || event.metaKey) && event.key === 'b') {
        event.preventDefault();
        setShowFolderPanel(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Build folder tree from PDF file paths
  const buildFolderTree = (pdfs: PDFFile[]): FolderNode[] => {
    const basePath = 'content\\';
    const folderMap = new Map<string, FolderNode>();
    
    // First pass: create all folder nodes
    pdfs.forEach(pdf => {
      const relativePath = pdf.filePath.includes(basePath) 
        ? pdf.filePath.split(basePath)[1] 
        : pdf.filePath;
      
      const pathParts = relativePath.split('\\').filter(part => part && !part.endsWith('.pdf'));
      
      let fullPath = '';
      pathParts.forEach((part, index) => {
        fullPath = fullPath ? `${fullPath}\\${part}` : part;
        
        if (!folderMap.has(fullPath)) {
          folderMap.set(fullPath, {
            name: part,
            path: fullPath,
            children: [],
            fileCount: 0,
            isExpanded: index === 0 // Auto-expand first level (content subfolders)
          });
        }
      });
    });
    
    // Second pass: build parent-child relationships
    const rootNodes: FolderNode[] = [];
    
    folderMap.forEach((node, path) => {
      const pathParts = path.split('\\');
      
      if (pathParts.length === 1) {
        // Root level node
        rootNodes.push(node);
      } else {
        // Find parent
        const parentPath = pathParts.slice(0, -1).join('\\');
        const parent = folderMap.get(parentPath);
        if (parent) {
          parent.children.push(node);
        }
      }
    });
    
    // Third pass: count files in each folder
    const countFiles = (nodes: FolderNode[]): void => {
      nodes.forEach(node => {
        const filesInFolder = pdfs.filter(p => {
          const pRelativePath = p.filePath.includes(basePath) 
            ? p.filePath.split(basePath)[1] 
            : p.filePath;
          return pRelativePath.startsWith(node.path + '\\') || pRelativePath === node.path;
        });
        node.fileCount = filesInFolder.length;
        
        if (node.children.length > 0) {
          countFiles(node.children);
        }
      });
    };
    
    // Sort all levels
    const sortNodes = (nodes: FolderNode[]): void => {
      nodes.sort((a, b) => a.name.localeCompare(b.name));
      nodes.forEach(node => {
        if (node.children.length > 0) {
          sortNodes(node.children);
        }
      });
    };
    
    sortNodes(rootNodes);
    countFiles(rootNodes);
    
    return rootNodes;
  };

  // Toggle folder expansion
  const toggleFolder = (folderPath: string) => {
    const updateTree = (nodes: FolderNode[]): FolderNode[] => {
      return nodes.map(node => {
        if (node.path === folderPath) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        if (node.children.length > 0) {
          return { ...node, children: updateTree(node.children) };
        }
        return node;
      });
    };
    
    setFolderTree(updateTree(folderTree));
  };

  // Select folder for filtering
  const selectFolder = (folderPath: string) => {
    setSelectedFolder(folderPath);
  };

  // Render tree node recursively
  const renderTreeNode = (node: FolderNode, level: number = 0) => {
    const hasChildren = node.children.length > 0;
    const isSelected = selectedFolder === node.path;
    
    return (
      <div key={node.path}>
        <div 
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 rounded ${
            isSelected ? 'bg-blue-100 text-blue-800' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => selectFolder(node.path)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(node.path);
              }}
              className="mr-1 w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700"
            >
              {node.isExpanded ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4 mr-1"></div>}
          
          <svg className="w-4 h-4 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          </svg>
          
          <span className="text-sm font-medium">{node.name}</span>
          {node.fileCount > 0 && (
            <span className="ml-2 text-xs text-gray-500">({node.fileCount})</span>
          )}
        </div>
        
        {hasChildren && node.isExpanded && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const fetchPDFs = async () => {
    try {
      const response = await api.get('/admin/pdf-processor/list');
      if (response.data.success) {
        const pdfs = response.data.data;
        
        // Fetch question counts, JSON status, and import status for all files
        const pdfsWithCounts = await Promise.all(
          pdfs.map(async (pdf: PDFFile) => {
            let enhancedPdf = { ...pdf };
            
            // Check for JSON file existence and content
            try {
              const jsonResponse = await api.get(`/admin/pdf-processor/json-status/${pdf.fileName}`);
              if (jsonResponse.data.success) {
                const jsonData = jsonResponse.data.data;
                enhancedPdf = {
                  ...enhancedPdf,
                  hasJsonFile: jsonData.hasJsonFile,
                  jsonContent: jsonData.jsonContent,
                  jsonQuestionCount: jsonData.questionCount,
                  databaseId: jsonData.databaseId
                };
              }
            } catch (error) {
              console.warn(`Failed to check JSON status for ${pdf.fileName}:`, error);
            }
            
            // Check if questions have been imported using importedAt field
            const hasImportedQuestions = pdf.importedAt !== null && pdf.importedAt !== undefined;
            
            // Get cache ID for review page navigation
            let cacheId = null;
            if (hasImportedQuestions && enhancedPdf.databaseId) {
              cacheId = enhancedPdf.databaseId;
            }
            
            console.log(`PDF ${pdf.fileName}: importedAt=${pdf.importedAt}, hasImportedQuestions=${hasImportedQuestions}, databaseId=${enhancedPdf.databaseId}, importedQuestionCount=${pdf.importedQuestionCount}`);
            
            if (pdf.status === 'COMPLETED') {
              try {
                // Get question count
                const countResponse = await api.get(`/admin/pdf-processor/question-count/${pdf.fileName}`);
                if (countResponse.data.success) {
                  const questionCount = countResponse.data.data.questionCount;
                  
                          return { 
                    ...enhancedPdf, 
                            questionCount,
                    hasImportedQuestions,
                    cacheId,
                    importedQuestionCount: pdf.importedQuestionCount
                  };
                }
              } catch (error) {
                console.warn(`Failed to get question count for ${pdf.fileName}:`, error);
              }
            }
            
            // Return with import status even if no question count available
            return { 
              ...enhancedPdf, 
              hasImportedQuestions,
              cacheId,
              importedQuestionCount: pdf.importedQuestionCount
            };
          })
        );
        
        setPdfs(pdfsWithCounts);
        
        // Build folder tree
        const tree = buildFolderTree(pdfsWithCounts);
        console.log('Built folder tree:', tree);
        setFolderTree(tree);
      }
    } catch (error) {
      console.error('Error fetching PDFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/pdf-processor/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };


  const processPDF = async (fileName: string, filePath?: string) => {
    setProcessing(fileName);
    toast.loading('Processing PDF...', 'Please wait');
    
    try {
      const response = await api.post('/admin/pdf-processor/process', {
        fileName,
        filePath,
        userPrompt: undefined,
        aiProvider: 'openai' // Use default provider
      });
      
      if (response.data.success) {
        toast.close();
        toast.success('PDF processing initiated successfully!');
        fetchPDFs();
        fetchStats();
      }
    } catch (error: any) {
      console.error('Error processing PDF:', error);
      toast.close();
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const retryProcessing = async (fileName: string, currentStatus: string) => {
    // Show confirmation for completed files since it will overwrite existing data
    if (currentStatus === 'COMPLETED') {
      const result = await Swal.fire({
        title: 'Confirm Reprocessing',
        text: 'This will reprocess the PDF and overwrite the existing processed data. Are you sure you want to continue?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, reprocess it!',
        cancelButtonText: 'Cancel'
      });
      
      if (!result.isConfirmed) {
        return;
      }
    }

    setProcessing(fileName);
    toast.loading('Retrying PDF processing...', 'Please wait');
    
    try {
      const response = await api.post(`/admin/pdf-processor/retry/${fileName}`);
      
      if (response.data.success) {
        toast.close();
        toast.success('PDF processing retry initiated successfully!');
        fetchPDFs();
        fetchStats();
      }
    } catch (error: any) {
      console.error('Error retrying PDF processing:', error);
      toast.close();
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const viewStatus = async (fileName: string) => {
    try {
      const response = await api.get(`/admin/pdf-processor/status/${fileName}`);
      if (response.data.success) {
        setStatusDetails(response.data.data);
        setShowStatusModal(true);
      }
    } catch (error: any) {
      console.error('Error fetching status:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const resetRetryCount = async (fileName: string) => {
    const result = await Swal.fire({
      title: 'Reset Retry Count',
      text: 'This will reset the retry count and allow you to retry processing. Are you sure?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, reset it!',
      cancelButtonText: 'Cancel'
    });
    
    if (!result.isConfirmed) {
      return;
    }

    setProcessing(fileName);
    toast.loading('Resetting retry count...', 'Please wait');
    
    try {
      const response = await api.post(`/admin/pdf-processor/reset-retry/${fileName}`);
      
      if (response.data.success) {
        toast.close();
        toast.success('Retry count reset successfully!');
        fetchPDFs();
      }
    } catch (error: any) {
      console.error('Error resetting retry count:', error);
      toast.close();
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const downloadProcessed = async (fileName: string) => {
    try {
      const response = await api.get(`/admin/pdf-processor/download/${fileName}`);
      if (response.data.success) {
        const { outputFilePath, downloadUrl } = response.data.data;
        
        // Create a temporary link element to trigger download
        const link = document.createElement('a');
        link.href = downloadUrl || `/api/admin/pdf-processor/download-file/${fileName}`;
        link.download = fileName.replace('.pdf', '.json');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Also show success message
        toast.success(`Download started for: ${fileName}`);
      }
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const importProcessedJSON = async (fileName: string) => {
    // Find the PDF to get question count and cache ID
    const pdf = pdfs.find(p => p.fileName === fileName);
    const questionCount = pdf?.jsonQuestionCount;
    const cacheId = pdf?.databaseId;
    
    if (!cacheId) {
      toast.error('Database ID not found for this file');
      return;
    }
    
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Import Questions',
      html: `This will import <strong>${questionCount ? `${questionCount} questions` : 'all questions'}</strong> from <br><strong>${fileName}</strong><br><br>into the Question database with <strong>'under review'</strong> status.<br><br>After import, you can click the <strong>'Review'</strong> button to approve/reject questions.<br><br>Are you sure you want to continue?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, import them!',
      cancelButtonText: 'Cancel',
      width: '500px'
    });
    
    if (!result.isConfirmed) {
      return;
    }

    toast.loading('Importing questions...', 'Please wait');
    
    try {
      const response = await api.post(`/admin/pdf-processor/import/${cacheId}`);
      
      if (response.data.success) {
        toast.close();
        const { importedCount, skippedCount, totalQuestions, errors, cacheId: responseCacheId } = response.data.data;
        
        let message;
        if (importedCount === 0) {
          message = `No new questions imported. ${skippedCount} questions were skipped (duplicates).`;
          if (errors && errors.length > 0) {
            message += ` ${errors.length} questions had validation errors.`;
          }
          toast.warning(message);
        } else {
          message = `Import completed! ${importedCount} questions imported successfully.`;
        if (skippedCount > 0) {
            message += ` ${skippedCount} questions were skipped (duplicates).`;
        }
          if (errors && errors.length > 0) {
            message += ` ${errors.length} questions had validation errors.`;
          }
        toast.success(message);
        }
        
        // Show detailed results if there were errors
        if (errors && errors.length > 0) {
          console.warn('Import errors:', errors);
          setTimeout(() => {
            toast.warning(`Some questions had issues. Check console for details.`);
          }, 2000);
        }

        // Refresh the PDF list to update the import status and show "Review" button
        fetchPDFs();
        
        // Show detailed import results and option to go to review page
        setTimeout(async () => {
          let resultText = '';
          let icon = 'success';
          let title = 'Import Results';
          
          if (importedCount === 0) {
            title = 'No New Questions Imported';
            icon = 'warning';
            resultText = `No new questions were imported from this file.<br><br>`;
            resultText += `📊 <strong>Import Statistics:</strong><br>`;
            resultText += `❌ <strong>0</strong> questions imported<br>`;
            resultText += `⚠️ <strong>${skippedCount}</strong> questions skipped (duplicates)<br>`;
            resultText += `📝 <strong>${totalQuestions}</strong> total questions processed<br><br>`;
            
            if (errors && errors.length > 0) {
              resultText += `⚠️ <strong>${errors.length}</strong> questions had validation errors<br><br>`;
            }
            
            resultText += `All questions from this file already exist in the database.`;
          } else {
            resultText = `Import completed successfully!<br><br>`;
            resultText += `📊 <strong>Import Statistics:</strong><br>`;
            resultText += `✅ <strong>${importedCount}</strong> questions imported<br>`;
            if (skippedCount > 0) {
              resultText += `⚠️ <strong>${skippedCount}</strong> questions skipped (duplicates)<br>`;
            }
            resultText += `📝 <strong>${totalQuestions}</strong> total questions processed<br><br>`;
            
            if (errors && errors.length > 0) {
              resultText += `⚠️ <strong>${errors.length}</strong> questions had validation errors<br><br>`;
            }
            
            resultText += `Would you like to go to the review page to approve/reject the imported questions?`;
          }

          const result = await Swal.fire({
            title: title,
            html: resultText,
            icon: icon as any,
            showCancelButton: importedCount > 0,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, go to review!',
            cancelButtonText: 'Stay here',
            width: '500px'
          });
          
          if (result.isConfirmed && responseCacheId && importedCount > 0) {
            router.push(`/admin/pdf-review/${responseCacheId}`);
          }
        }, 2000); // Wait 2 seconds to show the success message
      }
    } catch (error: any) {
      console.error('Error importing JSON:', error);
      toast.close();
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const openJsonEditor = async (fileName: string) => {
    const pdf = pdfs.find(p => p.fileName === fileName);
    setEditingJson(fileName);
    setJsonContent(pdf?.jsonContent || '');
    
    // Use LaTeX file path directly from PDF list (now includes latexFilePath)
    setLatexFilePath(pdf?.latexFilePath || '');
    
    // Set current status
    setCurrentStatus(pdf?.status || 'Unknown');
    
    setShowJsonModal(true);
  };

  const saveJsonContent = async () => {
    if (!editingJson || !jsonContent.trim()) {
      toast.error('Please enter JSON content');
      return;
    }

    toast.loading('Saving JSON content...', 'Please wait');
    
    try {
      const response = await api.post(`/admin/pdf-processor/save-json/${editingJson}`, {
        jsonContent: jsonContent.trim()
      });
      
      if (response.data.success) {
        toast.close();
        const { questionCount, jsonFilePath } = response.data.data;
        toast.success('JSON updated', 'JSON content saved successfully!');
        
        // Keep modal open and refresh the PDF list
        fetchPDFs();
      }
    } catch (error: any) {
      console.error('Error saving JSON content:', error);
      toast.close();
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const updateQuestionsFromJson = async () => {
    if (!editingJson || !jsonContent.trim()) {
      toast.error('Please enter JSON content');
      return;
    }

    // Find the PDF to get cache ID
    const pdf = pdfs.find(p => p.fileName === editingJson);
    const cacheId = pdf?.databaseId;
    
    if (!cacheId) {
      toast.error('Database ID not found for this file');
      return;
    }

    // Parse JSON to get question count
    let questionCount = 0;
    try {
      const parsedJson = JSON.parse(jsonContent.trim());
      questionCount = parsedJson.questions?.length || 0;
    } catch (error) {
      toast.error('Invalid JSON format');
      return;
    }

    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Update Questions',
      html: `This will update <strong>${questionCount} questions</strong> from <br><strong>${editingJson}</strong><br><br>This will insert new questions or update existing ones in the Question database with <strong>'under review'</strong> status.<br><br>Are you sure you want to continue?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, update them!',
      cancelButtonText: 'Cancel',
      width: '500px'
    });
    
    if (!result.isConfirmed) {
      return;
    }

    toast.loading('Updating questions...', 'Please wait');
    
    try {
      const response = await api.post(`/admin/pdf-processor/update-questions/${cacheId}`, {
        jsonContent: jsonContent.trim()
      });
      
      if (response.data.success) {
        toast.close();
        const { importedCount, updatedCount, skippedCount, totalQuestions, errors } = response.data.data;
        
        let message;
        if (importedCount === 0 && updatedCount === 0) {
          message = `No questions updated. ${skippedCount} questions were skipped (duplicates).`;
          if (errors && errors.length > 0) {
            message += ` ${errors.length} questions had validation errors.`;
          }
          toast.warning(message);
        } else {
          message = `Update completed! ${importedCount} new questions imported, ${updatedCount} questions updated.`;
          if (skippedCount > 0) {
            message += ` ${skippedCount} questions were skipped (duplicates).`;
          }
          if (errors && errors.length > 0) {
            message += ` ${errors.length} questions had validation errors.`;
          }
          toast.success(message);
        }
        
        // Refresh the PDF list to show updated data
        await fetchPDFs();
        
        // Close the modal
        setShowJsonModal(false);
        setEditingJson(null);
        setJsonContent('');
        setLatexFilePath('');
      } else {
        toast.close();
        toast.error(response.data.message || 'Failed to update questions');
      }
    } catch (error: any) {
      toast.close();
      console.error('Error updating questions:', error);
      toast.error(error.response?.data?.message || 'Failed to update questions');
    }
  };

  const markAsCompleted = async () => {
    if (!editingJson) {
      toast.error('No file selected');
      return;
    }

    // Find the PDF to get cache ID
    const pdf = pdfs.find(p => p.fileName === editingJson);
    const cacheId = pdf?.databaseId;
    
    if (!cacheId) {
      toast.error('Database ID not found for this file');
      return;
    }

    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Mark as Completed',
      html: `Are you sure you want to mark <strong>${editingJson}</strong> as completed?<br><br>This will update the processing status to <strong>'COMPLETED'</strong>.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, mark as completed!',
      cancelButtonText: 'Cancel',
      width: '400px'
    });
    
    if (!result.isConfirmed) {
      return;
    }

    toast.loading('Updating status...', 'Please wait');
    
    try {
      const response = await api.post(`/admin/pdf-processor/mark-completed/${cacheId}`);
      
      if (response.data.success) {
        toast.close();
        toast.success('File marked as completed successfully!');
        
        // Update the current status
        setCurrentStatus('COMPLETED');
        
        // Refresh the PDF list to show updated data
        await fetchPDFs();
      } else {
        toast.close();
        toast.error(response.data.message || 'Failed to mark as completed');
      }
    } catch (error: any) {
      toast.close();
      console.error('Error marking as completed:', error);
      toast.error(error.response?.data?.message || 'Failed to mark as completed');
    }
  };

  const previewQuestions = () => {
    if (!editingJson) {
      toast.error('No file selected');
      return;
    }

    // Find the PDF to get cache ID
    const pdf = pdfs.find(p => p.fileName === editingJson);
    const cacheId = pdf?.databaseId;
    
    if (!cacheId) {
      toast.error('Database ID not found for this file');
      return;
    }

    // Open the questions review page in a new window
    const reviewUrl = `/admin/pdf-review/${cacheId}`;
    window.open(reviewUrl, '_blank');
  };

  const refreshModalData = async () => {
    if (!editingJson) {
      toast.error('No file selected');
      return;
    }

    toast.loading('Refreshing data...', 'Please wait');

    try {
      // Refresh the PDF list to get latest data
      await fetchPDFs();
      
      // Find the updated PDF data
      const updatedPdf = pdfs.find(p => p.fileName === editingJson);
      
      if (updatedPdf) {
        // Update the current status
        setCurrentStatus(updatedPdf.status);
        
        // Update LaTeX file path if available
        if (updatedPdf.latexFilePath) {
          setLatexFilePath(updatedPdf.latexFilePath);
        }
        
        // Update JSON content if available
        if (updatedPdf.jsonContent) {
          setJsonContent(updatedPdf.jsonContent);
        }
        
        toast.success('Data refreshed successfully!');
      } else {
        toast.error('File not found in updated data');
      }
    } catch (error: any) {
      console.error('Error refreshing modal data:', error);
      toast.error(`Error refreshing data: ${error.message}`);
    }
  };

  const approveAllQuestions = async () => {
    if (!editingJson) {
      toast.error('No file selected');
      return;
    }

    // Find the PDF to get cache ID
    const pdf = pdfs.find(p => p.fileName === editingJson);
    const cacheId = pdf?.databaseId;
    
    if (!cacheId) {
      toast.error('Database ID not found for this file');
      return;
    }

    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Approve All Questions',
      html: `This will approve <strong>all questions</strong> for <br><strong>${editingJson}</strong><br><br>This action will change the status from <strong>'under review'</strong> to <strong>'approved'</strong> for all questions associated with this file.<br><br>Are you sure you want to continue?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a', // Green color
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, approve all!',
      cancelButtonText: 'Cancel',
      width: '500px'
    });

    if (!result.isConfirmed) {
      return;
    }

    toast.loading('Approving questions...', 'Please wait');

    try {
      const response = await api.post(`/admin/pdf-processor/approve-all/${cacheId}`);
      
      if (response.data.success) {
        const { approvedCount, fileName } = response.data.data;
        
        toast.success(`Successfully approved ${approvedCount} questions!`);
        
        // Refresh the PDF list to show updated status
        await fetchPDFs();
        
        // Show success details
        Swal.fire({
          title: 'Questions Approved!',
          html: `
            <div class="text-left">
              <p><strong>File:</strong> ${fileName}</p>
              <p><strong>Questions Approved:</strong> ${approvedCount}</p>
              <p><strong>Status:</strong> All questions are now approved</p>
            </div>
          `,
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } else {
        toast.error(`Failed to approve questions: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Error approving questions:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const uploadJsonToProcessed = async (fileName: string) => {
    const pdf = pdfs.find(p => p.fileName === fileName);
    const questionCount = pdf?.jsonQuestionCount;
    
    const result = await Swal.fire({
      title: 'Upload JSON to Processed',
      html: `This will upload the JSON content to the <strong>Processed</strong> folder and save it to <strong>PDFProcessorCache</strong>.<br><br><strong>${questionCount ? `${questionCount} questions` : 'Questions'}</strong> will be available for import.<br><br>Continue?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, upload it!',
      cancelButtonText: 'Cancel',
      width: '450px'
    });
    
    if (!result.isConfirmed) {
      return;
    }

    toast.loading('Uploading JSON to Processed folder...', 'Please wait');
    
    try {
      const response = await api.post(`/admin/pdf-processor/upload-json/${fileName}`);
      
      if (response.data.success) {
        toast.close();
        toast.success('JSON uploaded to Processed folder successfully!');
        fetchPDFs(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Error uploading JSON:', error);
      toast.close();
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const processWithMathpix = async (fileName: string, keepModalOpen: boolean = false) => {
    const pdf = pdfs.find(p => p.fileName === fileName);
    if (!pdf) {
      toast.error('PDF not found');
      return;
    }

    const result = await Swal.fire({
      title: 'Process with Mathpix',
      text: `This will process "${pdf.fileName}" with Mathpix to extract LaTeX content. This may take a few minutes. Continue?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Process',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#f97316', // Orange color to match Mathpix button
    });

    if (!result.isConfirmed) return;

    toast.loading('Processing PDF with Mathpix...', 'Please wait');

    try {
      const response = await api.post(`/admin/pdf-processor/process-mathpix-file/${fileName}`);
      
      if (response.data.success) {
        const { latexContent, latexFilePath, processingTimeMs } = response.data.data;
        
        toast.success(
          `Mathpix processing completed successfully!`,
          `LaTeX content extracted in ${Math.round(processingTimeMs / 1000)}s`
        );

        // Refresh the PDF list to show updated status
        await fetchPDFs();

        // If called from modal, show a simpler success message and don't show detailed dialog
        if (keepModalOpen) {
          // Just show a brief success message without the detailed dialog
          toast.success('LaTeX content extracted successfully! You can now view it in the LaTeX file path field.');
        } else {
          // Show success details dialog (original behavior for main table)
          Swal.fire({
            title: 'Processing Complete!',
            html: `
              <div class="text-left">
                <p><strong>File:</strong> ${pdf.fileName}</p>
                <p><strong>Processing Time:</strong> ${Math.round(processingTimeMs / 1000)}s</p>
                <p><strong>LaTeX Content Length:</strong> ${latexContent?.length || 0} characters</p>
                <p><strong>LaTeX File Path:</strong> ${latexFilePath || 'Not saved'}</p>
              </div>
            `,
            icon: 'success',
            confirmButtonText: 'OK'
          });
        }

      } else {
        toast.error(`Mathpix processing failed: ${response.data.message}`);
      }

    } catch (error: any) {
      console.error('Mathpix processing error:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };

  const viewLatexContent = async (cacheId: string) => {
    try {
      const response = await api.get(`/admin/pdf-processor/latex-content/${cacheId}`);
      
      if (response.data.success) {
        const { latexContent, latexFilePath } = response.data.data;
        
        if (latexContent) {
          setLatexContent(latexContent);
          setLatexFilePath(latexFilePath || '');
          setShowLatexModal(true);
        } else {
          toast.error('No LaTeX content found for this PDF');
        }
      } else {
        toast.error('Failed to load LaTeX content');
      }

    } catch (error: any) {
      console.error('Error loading LaTeX content:', error);
      toast.error(`Error: ${error.response?.data?.message || error.message}`);
    }
  };


  const toggleActionMenu = (fileName: string) => {
    setShowActionMenu(showActionMenu === fileName ? null : fileName);
  };

  const closeActionMenu = () => {
    setShowActionMenu(null);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PROCESSING':
      case 'UPLOADING':
        return 'bg-blue-100 text-blue-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'RETRYING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
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
        <div className="flex space-x-6">
          {/* Folder Tree Sidebar */}
          {showFolderPanel && (
            <div className="w-80 bg-white rounded-lg shadow transition-all duration-300 ease-in-out">
              <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Folder Structure</h3>
                <button
                  onClick={() => setShowFolderPanel(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                  title="Hide folder panel (Ctrl+B)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {selectedFolder && (
                <div className="px-4 py-2 border-b border-gray-200">
                  <button
                    onClick={() => setSelectedFolder('')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    ← Show All Files
                  </button>
                </div>
              )}
              <div className="p-2 max-h-96 overflow-y-auto">
                {folderTree.length > 0 ? (
                  <div>
                    {folderTree.map(node => renderTreeNode(node))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No folders found
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 space-y-6">
          {/* Header */}
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">PDF Processor</h1>
                <p className="text-gray-600">Process JEE Previous Year Papers using AI providers (OpenAI GPT-4o or DeepSeek)</p>
              </div>
              {!showFolderPanel && (
                <button
                  onClick={() => setShowFolderPanel(true)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title="Show folder panel (Ctrl+B)"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                  </svg>
                  Show Folders
                </button>
              )}
            </div>
            {selectedFolder && (
              <div className="mt-2">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  📁 Filtered by: {selectedFolder}
                  <button
                    onClick={() => setSelectedFolder('')}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    ✕
                  </button>
                </span>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total PDFs</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-blue-600">{stats.processing}</div>
                <div className="text-sm text-gray-600">Processing</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="text-2xl font-bold text-orange-600">{stats.retrying}</div>
                <div className="text-sm text-gray-600">Retrying</div>
              </div>
            </div>
          )}


          {/* PDF List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Available PDFs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-80">
                      File Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      JSON Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Database ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPdfs.map((pdf) => (
                    <tr key={pdf.fileName} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="max-w-full">
                          <div className="text-sm font-medium text-gray-900 mb-1 break-words">
                          <a 
                            href={`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001'}/static/pdf/${encodeURIComponent(pdf.fileName)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            title="Click to open PDF in new tab"
                          >
                            {pdf.fileName}
                          </a>
                        </div>
                          <div className="flex items-start space-x-2">
                            <code className="flex-1 text-xs text-gray-500 break-all leading-tight">
                              {pdf.filePath}
                            </code>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(pdf.filePath).then(() => {
                                  toast.success('File path copied to clipboard!');
                                }).catch(() => {
                                  toast.error('Failed to copy file path');
                                });
                              }}
                              className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title="Copy file path to clipboard"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatFileSize(pdf.fileSize)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(pdf.status)}`}>
                          {pdf.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {pdf.hasJsonFile ? (
                            <div className="space-y-1">
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                JSON Available
                              </span>
                              {pdf.jsonQuestionCount && (
                                <div className="text-xs text-gray-500">
                                  {pdf.jsonQuestionCount} questions
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              No JSON
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          {pdf.databaseId ? (
                            <div className="space-y-1">
                              <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded font-mono">
                                {pdf.databaseId}
                              </code>
                          <button
                                onClick={() => {
                                  navigator.clipboard.writeText(pdf.databaseId!).then(() => {
                                    toast.success('Database ID copied to clipboard!');
                                  }).catch(() => {
                                    toast.error('Failed to copy database ID');
                                  });
                                }}
                                className="flex items-center text-xs text-gray-500 hover:text-gray-700"
                                title="Copy database ID"
                              >
                                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                Copy
                          </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Not in DB</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {/* Primary Actions - Always Visible */}
                          <div className="flex space-x-1">
                            {/* Add/Edit JSON Button - Show based on database status */}
                            {!pdf.databaseId ? (
                            <button
                                onClick={() => openJsonEditor(pdf.fileName)}
                                className="bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700 text-xs"
                                title="Add JSON content manually"
                              >
                                Add JSON
                            </button>
                            ) : (
                            <button
                                onClick={() => openJsonEditor(pdf.fileName)}
                                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-xs"
                                title="Edit JSON content"
                              >
                                Edit JSON
                          </button>
                        )}
                        
                            {/* Import/Preview Button - Show when content is in DB */}
                            {pdf.databaseId && (
                              pdf.hasImportedQuestions ? (
                            <button
                                onClick={() => router.push(`/admin/pdf-review/${pdf.cacheId}`)}
                                  className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-xs"
                                title={pdf.importedQuestionCount ? `Preview ${pdf.importedQuestionCount} imported questions` : 'Preview questions'}
                              >
                                Preview{pdf.importedQuestionCount ? ` (${pdf.importedQuestionCount})` : ''}
                            </button>
                            ) : (
                            <button
                                onClick={() => importProcessedJSON(pdf.fileName)}
                                  className="bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 text-xs"
                                  title={pdf.jsonQuestionCount ? `Import ${pdf.jsonQuestionCount} questions` : 'Import questions'}
                              >
                                  Import{pdf.jsonQuestionCount ? ` (${pdf.jsonQuestionCount})` : ''}
                            </button>
                              )
                        )}
                        
                            {/* Write to File Button - Show when JSON content exists in DB */}
                            {pdf.databaseId && pdf.jsonContent && (
                            <button
                                onClick={() => uploadJsonToProcessed(pdf.fileName)}
                                className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-xs"
                                title="Write JSON to Processed folder"
                            >
                                Write to File
                            </button>
                            )}

                            {/* Process Mathpix Button - Show for all PDFs with cacheId */}
                            {!pdf.hasLatexContent && (
                            <button
                                onClick={() => processWithMathpix(pdf.fileName)}
                                className="bg-orange-600 text-white px-3 py-1 rounded-md hover:bg-orange-700 text-xs"
                                title="Process PDF with Mathpix to extract LaTeX"
                            >
                                Process Mathpix
                            </button>
                            )}

                            {/* View LaTeX Button - Show only if LaTeX content exists */}
                            {pdf.databaseId && pdf.hasLatexContent && (
                            <button
                                onClick={() => viewLatexContent(pdf.databaseId!)}
                                className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-xs"
                                title="View extracted LaTeX content"
                            >
                                View LaTeX
                            </button>
                            )}
                          </div>

                          {/* Hamburger Menu for Secondary Actions */}
                          <div className="relative action-menu-container">
                              <button
                              onClick={() => toggleActionMenu(pdf.fileName)}
                              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md"
                              title="More actions"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                              </svg>
                              </button>

                            {/* Dropdown Menu */}
                            {showActionMenu === pdf.fileName && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                                <div className="py-1">
                                  {/* Process Button */}
                                  {pdf.status === 'PENDING' && (
                              <button
                                      onClick={() => {
                                        processPDF(pdf.fileName, pdf.filePath);
                                        closeActionMenu();
                                      }}
                                      disabled={processing === pdf.fileName}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {processing === pdf.fileName ? 'Processing...' : 'Process PDF'}
                              </button>
                            )}

                                  {/* Retry Button */}
                                  {(pdf.status === 'FAILED' || pdf.status === 'COMPLETED') && (
                                    <button
                                      onClick={() => {
                                        retryProcessing(pdf.fileName, pdf.status);
                                        closeActionMenu();
                                      }}
                                      disabled={processing === pdf.fileName}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {processing === pdf.fileName ? 'Retrying...' : 'Retry Processing'}
                                    </button>
                                  )}

                                  {/* Reset Retry Button */}
                                  {(pdf.status === 'FAILED' || pdf.status === 'COMPLETED') && (
                                    <button
                                      onClick={() => {
                                        resetRetryCount(pdf.fileName);
                                        closeActionMenu();
                                      }}
                                      disabled={processing === pdf.fileName}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      Reset Retry Count
                                    </button>
                                  )}

                                  {/* Download Button */}
                                  {pdf.status === 'COMPLETED' && (
                                    <button
                                      onClick={() => {
                                        downloadProcessed(pdf.fileName);
                                        closeActionMenu();
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      Download JSON
                                    </button>
                                  )}

                                  {/* View LaTeX Button */}
                                  {pdf.cacheId && (
                                    <button
                                      onClick={() => {
                                        viewLatexContent(pdf.cacheId!);
                                        closeActionMenu();
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                      View LaTeX Content
                                    </button>
                                  )}

                                  {/* View Status Button */}
                        {(pdf.status === 'FAILED' || pdf.status === 'COMPLETED' || pdf.status === 'PROCESSING' || pdf.status === 'UPLOADING' || pdf.status === 'RETRYING') && (
                          <button
                                      onClick={() => {
                                        viewStatus(pdf.fileName);
                                        closeActionMenu();
                                      }}
                                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            View Status
                          </button>
                        )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Status Modal */}
          {showStatusModal && statusDetails && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Processing Status: {statusDetails.fileName}
                    </h3>
                    <button
                      onClick={() => setShowStatusModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <strong>Status:</strong> 
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(statusDetails.processingStatus)}`}>
                        {statusDetails.processingStatus}
                      </span>
                    </div>
                    
                    {statusDetails.errorMessage && (
                      <div>
                        <strong>Error:</strong>
                        <p className="text-red-600 mt-1">{statusDetails.errorMessage}</p>
                      </div>
                    )}
                    
                    {statusDetails.processingTimeMs && (
                      <div>
                        <strong>Processing Time:</strong> {statusDetails.processingTimeMs}ms
                      </div>
                    )}
                    
                    {statusDetails.lastProcessedAt && (
                      <div>
                        <strong>Last Processed:</strong> {new Date(statusDetails.lastProcessedAt).toLocaleString()}
                      </div>
                    )}
                    
                    {statusDetails.outputFilePath && (
                      <div>
                        <strong>Output File:</strong> {statusDetails.outputFilePath}
                      </div>
                    )}
                    
                    {statusDetails.logs && statusDetails.logs.length > 0 && (
                      <div>
                        <strong>Recent Logs:</strong>
                        <div className="mt-2 max-h-40 overflow-y-auto">
                          {statusDetails.logs.map((log) => (
                            <div key={log.id} className="text-sm border-l-2 border-gray-200 pl-2 mb-1">
                              <span className="font-medium">{log.logType}:</span> {log.message}
                              <div className="text-xs text-gray-500">
                                {new Date(log.createdAt).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
                          {currentStatus}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {/* View PDF Button */}
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
   - ✅ Use the same wording, LaTeX math, and image references as in the file.  
3. Preserve **LaTeX math code** exactly as in the source (e.g., \`$$E=mc^2$$\`).  
4. **Do not skip ANY image references.** Every \`\\includegraphics\` in the \`.tex\` must be included in the JSON.   
   - Replace them with an HTML \`<img>\` tag.  
   - Format:  
     \`\`\`html
     <img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/FILENAME/IMAGE_FILE.EXT' />
     \`\`\`  
   - \`FILENAME\` = the \`.tex\` file's base name (without extension).  
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
5. Accept question numbering as \`Q1, Q2, …\` or \`1., 2., …\`.  
6. **Skip all promotional/branding content** (e.g., "Allen", "Best of Luck", headers/footers, watermarks, motivational lines). Keep only actual question data.  

---

### CHUNKED PROCESSING
- Physics: **Q1–Q30**  
- Chemistry: **Q31–Q60**  
- Mathematics: **Q61–Q90**  
- Each subject must have **exactly 30 questions**.  
- If fewer appear in the \`.tex\`, generate realistic filler questions to complete the block.  

---

### QUESTION CONTENT RULES
For each question:
- \`stem\`: must match the original question text from the \`.tex\`.  
- \`options\`: must match exactly the four options from the \`.tex\`.  
- \`isCorrect\`:  
  - If the correct answer is explicitly given in the \`.tex\`, preserve it.  
  - If missing, you may **generate the correct answer** as a subject expert.  
- \`explanation\`:  
  - If given in the file, preserve it.  
  - If missing, **generate a step-by-step reasoning** as a subject expert.  
- \`tip_formula\`:  
  - If given in the file, preserve it.  
  - If missing, **generate a key formula or shortcut**.  
- \`difficulty\`: assign as \`EASY\`, \`MEDIUM\`, or \`HARD\`.  
- Preserve all LaTeX math exactly.  

---

### CLASSIFICATION RULES
Use the official **JEE Main 2025 syllabus**:
- Physics (Units 1–20)  
- Chemistry (Units 1–20)  
- Mathematics (Units 1–14)  

Assign: **lesson → topic → subtopic**.  

---

### OUTPUT JSON FORMAT
\`\`\`json
{
  "questions": [
    {
      "id": "Q31",
      "stem": "Which of the following represents the lattice structure of $\\\\mathrm{A}_{0.95} \\\\mathrm{O}$ containing $\\\\mathrm{A}^{2+}, \\\\mathrm{A}^{3+}$ and $\\\\mathrm{O}^{2-}$ ions?",
      "options": [
        {"id": "A", "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION/2025_10_02_8d455ea6d672c1411a66g-01.jpg' />", "isCorrect": false},
        {"id": "B", "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION/2025_10_02_8d455ea6d672c1411a66g-01(1).jpg' />", "isCorrect": false},
        {"id": "C", "text": "<img src='https://rankora.s3.eu-north-1.amazonaws.com/content/images/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION/2025_10_02_8d455ea6d672c1411a66g-01(2).jpg' />", "isCorrect": true},
        {"id": "D", "text": "Defect-free lattice", "isCorrect": false}
      ],
      "explanation": "Applying charge neutrality: replacing 3 A²⁺ ions with 2 A³⁺ ions creates one cation vacancy. This explains the observed non-stoichiometry $A_{0.95}O$.",
      "tip_formula": "Charge neutrality: $\\\\Sigma q_{+} = \\\\Sigma q_{-}$",
      "difficulty": "MEDIUM",
      "subject": "Chemistry",
      "lesson": "Inorganic Chemistry",
      "topic": "Solid State",
      "subtopic": "Defects in Crystals",
      "yearAppeared": 2023,
      "isPreviousYear": true,
      "tags": ["solid-state", "defects", "charge-neutrality"]
    }
  ],
  "metadata": {
    "totalQuestions": 90,
    "subjects": ["Physics", "Chemistry", "Mathematics"],
    "difficultyDistribution": {"easy": 30, "medium": 45, "hard": 15}
  }
}
\`\`\`

### FINAL INSTRUCTION

Read the \`.tex\` file carefully and return **only the JSON output** in the schema above.  
Ensure exactly 30 questions, numbered sequentially (Q1–Q90), with lesson/topic/subtopic classification.  
Ignore and skip any **branding, coaching names, promotional headers/footers, or unrelated text**.  
Preserve **exactly the questions, options, and correct answers** from the \`.tex\` file.  
   - ❌ Do not fabricate or invent any question text or options.  
   - ✅ Use the same wording, LaTeX math, and image references as in the file.  
**Do not skip ANY image references.** Every \`\\includegraphics\` in the \`.tex\` must be included in the JSON.`;

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
                      <button
                        onClick={() => {
                          const pdf = pdfs.find(p => p.fileName === editingJson);
                          if (pdf?.filePath) {
                            try {
                              // Extract just the filename from the full path
                              const fileName = pdf.filePath.split(/[\\/]/).pop();
                              const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
                              // const fileUrl = `${apiBase}/static/pdf/${fileName}`;
                              const fileUrl = `${pdf.filePath || ''}`;
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
                      
                      {/* View LaTeX Button */}
                      <button
                        onClick={() => {
                          if (latexFilePath) {
                            try {
                              // Convert LaTeX file path to static URL
                              const fileName = latexFilePath.split(/[\\/]/).pop();
                              const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';
                              // const fileUrl = `${apiBase}/static/latex/${fileName}`;
                              const fileUrl = `${latexFilePath || ''}`;
                              console.log('Opening LaTeX URL:', fileUrl);
                              window.open(fileUrl, '_blank');
                            } catch (error) {
                              console.error('Error opening LaTeX file:', error);
                              toast.error('Failed to open LaTeX file');
                            }
                          } else {
                            toast.error('LaTeX file not found - Process with Mathpix first');
                          }
                        }}
                        className="px-3 py-1 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 transition-colors"
                        title="Open LaTeX file in new window"
                      >
                        View LaTeX
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
                          setLatexFilePath('');
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
                          {pdfs.find(p => p.fileName === editingJson)?.filePath || 'Path not found'}
                        </code>
                        <button
                          onClick={() => {
                            const filePath = pdfs.find(p => p.fileName === editingJson)?.filePath;
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        LaTeX File Path
                      </label>
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 border border-gray-300 rounded-md">
                        <code className="flex-1 text-sm text-gray-800 font-mono break-all">
                          {latexFilePath || 'No LaTeX file path available - Process with Mathpix first'}
                        </code>
                        {latexFilePath && (
                          <button
                            onClick={() => {
                              if (latexFilePath) {
                                // Extract local path from AWS URL or use as-is if it's already local
                                let localPath = latexFilePath;
                                if (latexFilePath.includes('s3.') || latexFilePath.includes('amazonaws.com')) {
                                  // Extract filename from AWS URL and construct local path
                                  const fileName = latexFilePath.split('/').pop();
                                  localPath = `C:\\wamp64\\www\\nodejs\\jee-app\\backend\\content\\latex\\${fileName}`;
                                }
                                
                                navigator.clipboard.writeText(localPath).then(() => {
                                  toast.success('LaTeX file path copied to clipboard!');
                                }).catch(() => {
                                  toast.error('Failed to copy LaTeX file path');
                                });
                              }
                            }}
                            className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                            title="Copy LaTeX file path to clipboard"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
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
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => processWithMathpix(editingJson!, true)}
                        className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
                        title="Process PDF with Mathpix to extract LaTeX"
                      >
                        Process Mathpix
                      </button>
                      <button
                        onClick={() => importProcessedJSON(editingJson!)}
                        className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                        title="Import questions from JSON content to database"
                      >
                        Import
                      </button>
                      <button
                        onClick={approveAllQuestions}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                        title="Approve all questions for this file"
                      >
                        Approve All
                      </button>
                      <button
                        onClick={previewQuestions}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                      >
                        Preview
                      </button>
                      <button
                        onClick={() => {
                          setShowJsonModal(false);
                          setEditingJson(null);
                          setJsonContent('');
                          setLatexFilePath('');
                        }}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateQuestionsFromJson}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                      >
                        Update Questions
                      </button>
                      <button
                        onClick={saveJsonContent}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                      >
                        Save JSON Content
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LaTeX Content Modal */}
          {showLatexModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
              <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      LaTeX Content Viewer
                    </h3>
                    <button
                      onClick={() => {
                        setShowLatexModal(false);
                        setLatexContent('');
                        setLatexFilePath('');
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    {latexFilePath && (
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>File Path:</strong> {latexFilePath}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mb-4">
                      <strong>Content Length:</strong> {latexContent.length} characters
                    </p>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LaTeX Content:
                    </label>
                    <textarea
                      value={latexContent}
                      readOnly
                      className="w-full h-96 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm bg-gray-50"
                      placeholder="No LaTeX content available..."
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(latexContent);
                        toast.success('LaTeX content copied to clipboard!');
                      }}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                    >
                      Copy to Clipboard
                    </button>
                    <button
                      onClick={() => {
                        setShowLatexModal(false);
                        setLatexContent('');
                        setLatexFilePath('');
                      }}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
