'use client';

import { useState, useRef, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Code,
  Calculator as SquareRoot,
  Calculator as Function,
  Sigma,
  Divide,
  Image,
  Link,
  Palette,
  Strikethrough,
  Highlighter,
  Maximize,
  Minimize,
  X,
  Check,
  Upload
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cleanLatex } from '@/utils/textCleaner';

interface LatexRichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>; // Optional image upload handler
}

interface MathBlock {
  id: string;
  latex: string;
  start: number;
  end: number;
  type: 'inline' | 'display';
}

export default function LatexRichTextEditor({
  value,
  onChange,
  placeholder = "Enter your content here...",
  height = 400,
  disabled = false,
  className = "",
  onImageUpload
}: LatexRichTextEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [selectedColor, setSelectedColor] = useState('#000000');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse LaTeX blocks from content
  const parseLatexBlocks = useCallback((content: string): MathBlock[] => {
    const blocks: MathBlock[] = [];
    const inlineRegex = /\$([^$]+)\$/g;
    const displayRegex = /\$\$([^$]+)\$\$/g;
    
    let match;
    
    // Find inline math blocks
    while ((match = inlineRegex.exec(content)) !== null) {
      blocks.push({
        id: `inline-${match.index}`,
        latex: match[1],
        start: match.index,
        end: match.index + match[0].length,
        type: 'inline'
      });
    }
    
    // Find display math blocks
    while ((match = displayRegex.exec(content)) !== null) {
      blocks.push({
        id: `display-${match.index}`,
        latex: match[1],
        start: match.index,
        end: match.index + match[0].length,
        type: 'display'
      });
    }
    
    return blocks.sort((a, b) => a.start - b.start);
  }, []);

  // Preprocess LaTeX content to fix common issues
  const preprocessLatex = useCallback((latex: string): string => {
    // Debug logging for LaTeX preprocessing
    if (process.env.NODE_ENV === 'development') {
      console.log('Original LaTeX:', latex);
    }
    
    // Use the utility function to clean the LaTeX content
    const processed = cleanLatex(latex);
    
    // Debug logging for processed LaTeX
    if (process.env.NODE_ENV === 'development' && processed !== latex) {
      console.log('Processed LaTeX:', processed);
    }
    
    return processed;
  }, []);

  // Render markdown and LaTeX content to HTML
  const renderLatexContent = useCallback((content: string): string => {
    let html = content;
    
    // First, render LaTeX blocks
    const blocks = parseLatexBlocks(content);
    let offset = 0;
    
    blocks.forEach(block => {
      try {
        // Preprocess the LaTeX to fix common issues
        const processedLatex = preprocessLatex(block.latex);
        
        const rendered = katex.renderToString(processedLatex, {
          throwOnError: false,
          displayMode: block.type === 'display',
          strict: false,
          trust: true, // Allow more LaTeX commands
          macros: {
            // Add custom macros if needed
            "\\rac": "\\frac",
            "\\R": "\\mathbb{R}",
            "\\N": "\\mathbb{N}",
            "\\Z": "\\mathbb{Z}",
            "\\Q": "\\mathbb{Q}",
            "\\C": "\\mathbb{C}"
          }
        });
        
        const before = html.substring(0, block.start + offset);
        const after = html.substring(block.end + offset);
        const replacement = `<span class="math-${block.type}" data-latex="${block.latex}">${rendered}</span>`;
        
        html = before + replacement + after;
        offset += replacement.length - (block.end - block.start);
      } catch (error) {
        console.warn('LaTeX rendering error:', error, 'Original LaTeX:', block.latex);
        // Keep original LaTeX if rendering fails
      }
    });
    
    // Then render markdown formatting
    html = renderMarkdown(html);
    
    return html;
  }, [parseLatexBlocks, preprocessLatex]);

  // Render markdown formatting
  const renderMarkdown = (text: string): string => {
    let html = text;
    
    // Skip processing if content already contains HTML tags (to avoid double processing)
    if (/<[^>]+>/.test(html)) {
      // Only process line breaks for HTML content
      html = html.replace(/\n/g, '<br>');
      return html;
    }
    
    // Process in order of specificity to avoid conflicts
    
    // Images: ![alt](url) - process first to avoid conflicts with links
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-2" />');
    
    // Links: [text](url) - process after images
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Inline code: `code` - process before other formatting to avoid conflicts
    html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Strikethrough: ~~text~~ - process before bold/italic
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
    
    // Bold: **text** or __text__ - process before italic
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    
    // Italic: *text* or _text_ - process after bold, but avoid conflicts
    // Use a more compatible approach without lookbehind
    html = html.replace(/\b\*([^*\n]+)\*\b/g, '<em>$1</em>');
    html = html.replace(/\b_([^_\n]+)_\b/g, '<em>$1</em>');
    
    // Line breaks - convert to <br> tags
    html = html.replace(/\n/g, '<br>');
    
    return html;
  };

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  // Handle paste events for images
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items || !onImageUpload) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          try {
            const uploadedUrl = await onImageUpload(file);
            const imageMarkup = `![Pasted Image](${uploadedUrl})`;
            insertText(imageMarkup);
          } catch (error) {
            console.error('Image paste failed:', error);
            alert('Image paste failed. Please try again.');
          }
        }
        break;
      }
    }
  };

  // Insert text at cursor position
  const insertText = (text: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.substring(0, start) + text + value.substring(end);
    
    onChange(newValue);
    
    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  // Insert LaTeX math
  const insertMath = (latex: string, type: 'inline' | 'display' = 'inline') => {
    const wrapper = type === 'display' ? `$$${latex}$$` : `$${latex}$`;
    insertText(wrapper);
  };

  // Format text
  const formatText = (format: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `<u>${selectedText}</u>`;
        break;
      case 'strikethrough':
        formattedText = `~~${selectedText}~~`;
        break;
      case 'highlight':
        formattedText = `<mark>${selectedText}</mark>`;
        break;
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'color':
        formattedText = `<span style="color: ${selectedColor}">${selectedText}</span>`;
        break;
      default:
        formattedText = selectedText;
    }
    
    const newValue = value.substring(0, start) + formattedText + value.substring(end);
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  // Insert link
  const insertLink = () => {
    if (!linkUrl || !linkText) return;
    
    const linkMarkup = `[${linkText}](${linkUrl})`;
    insertText(linkMarkup);
    
    // Reset dialog state
    setShowLinkDialog(false);
    setLinkUrl('');
    setLinkText('');
  };

  // Insert image
  const insertImage = () => {
    if (!imageUrl) return;
    
    const imageMarkup = `![${imageAlt}](${imageUrl})`;
    insertText(imageMarkup);
    
    // Reset dialog state
    setShowImageDialog(false);
    setImageUrl('');
    setImageAlt('');
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImageUpload) return;

    try {
      const uploadedUrl = await onImageUpload(file);
      setImageUrl(uploadedUrl);
      setShowImageDialog(true);
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Image upload failed. Please try again.');
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Common LaTeX templates
  const latexTemplates = {
    fraction: '\\frac{numerator}{denominator}',
    sqrt: '\\sqrt{expression}',
    power: 'x^{power}',
    subscript: 'x_{subscript}',
    integral: '\\int_{a}^{b} f(x) dx',
    sum: '\\sum_{i=1}^{n} x_i',
    limit: '\\lim_{x \\to \\infty} f(x)',
    matrix: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}',
    vector: '\\vec{v} = \\begin{pmatrix} x \\\\ y \\\\ z \\end{pmatrix}',
    partial: '\\frac{\\partial f}{\\partial x}',
    infinity: '\\infty',
    alpha: '\\alpha',
    beta: '\\beta',
    gamma: '\\gamma',
    delta: '\\delta',
    epsilon: '\\epsilon',
    theta: '\\theta',
    lambda: '\\lambda',
    mu: '\\mu',
    pi: '\\pi',
    sigma: '\\sigma',
    phi: '\\phi',
    omega: '\\omega'
  };

  // Toolbar component
  const Toolbar = () => (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-200 bg-gray-50">
      {/* Text formatting */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={() => formatText('bold')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Bold"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          onClick={() => formatText('italic')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Italic"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          onClick={() => formatText('underline')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Underline"
        >
          <Underline className="h-4 w-4" />
        </button>
        <button
          onClick={() => formatText('strikethrough')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <button
          onClick={() => formatText('highlight')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Highlight"
        >
          <Highlighter className="h-4 w-4" />
        </button>
        <button
          onClick={() => formatText('code')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Code"
        >
          <Code className="h-4 w-4" />
        </button>
      </div>

      {/* Color and Media */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-1 hover:bg-gray-200 rounded"
            title="Text Color"
          >
            <Palette className="h-4 w-4" />
          </button>
          {showColorPicker && (
            <div className="absolute top-8 left-0 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="color"
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <button
                  onClick={() => {
                    formatText('color');
                    setShowColorPicker(false);
                  }}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                >
                  Apply
                </button>
              </div>
              <div className="text-xs text-gray-500">Select text and apply color</div>
            </div>
          )}
        </div>
        <button
          onClick={() => setShowImageDialog(true)}
          className="p-1 hover:bg-gray-200 rounded"
          title="Insert Image"
        >
          <Image className="h-4 w-4" />
        </button>
        <button
          onClick={() => setShowLinkDialog(true)}
          className="p-1 hover:bg-gray-200 rounded"
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </button>
        {onImageUpload && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1 hover:bg-gray-200 rounded"
            title="Upload Image (or paste from clipboard)"
          >
            <Upload className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Lists */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={() => insertText('\n- ')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Bullet List"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertText('\n1. ')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Numbered List"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      {/* Math symbols */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={() => insertMath(latexTemplates.fraction)}
          className="p-1 hover:bg-gray-200 rounded"
          title="Fraction"
        >
          <Divide className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertMath(latexTemplates.sqrt)}
          className="p-1 hover:bg-gray-200 rounded"
          title="Square Root"
        >
          <SquareRoot className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertMath(latexTemplates.power)}
          className="p-1 hover:bg-gray-200 rounded"
          title="Power"
        >
          <Function className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertMath(latexTemplates.integral)}
          className="p-1 hover:bg-gray-200 rounded"
          title="Integral"
        >
          ∫
        </button>
        <button
          onClick={() => insertMath(latexTemplates.sum)}
          className="p-1 hover:bg-gray-200 rounded"
          title="Summation"
        >
          <Sigma className="h-4 w-4" />
        </button>
        <button
          onClick={() => insertMath(latexTemplates.limit)}
          className="p-1 hover:bg-gray-200 rounded"
          title="Limit"
        >
          lim
        </button>
      </div>

      {/* Greek letters */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={() => insertMath(latexTemplates.alpha)}
          className="p-1 hover:bg-gray-200 rounded text-sm"
          title="Alpha"
        >
          α
        </button>
        <button
          onClick={() => insertMath(latexTemplates.beta)}
          className="p-1 hover:bg-gray-200 rounded text-sm"
          title="Beta"
        >
          β
        </button>
        <button
          onClick={() => insertMath(latexTemplates.gamma)}
          className="p-1 hover:bg-gray-200 rounded text-sm"
          title="Gamma"
        >
          γ
        </button>
        <button
          onClick={() => insertMath(latexTemplates.delta)}
          className="p-1 hover:bg-gray-200 rounded text-sm"
          title="Delta"
        >
          δ
        </button>
        <button
          onClick={() => insertMath(latexTemplates.pi)}
          className="p-1 hover:bg-gray-200 rounded text-sm"
          title="Pi"
        >
          π
        </button>
        <button
          onClick={() => insertMath(latexTemplates.sigma)}
          className="p-1 hover:bg-gray-200 rounded text-sm"
          title="Sigma"
        >
          σ
        </button>
        <button
          onClick={() => insertMath(latexTemplates.infinity)}
          className="p-1 hover:bg-gray-200 rounded text-sm"
          title="Infinity"
        >
          ∞
        </button>
      </div>

      {/* Display mode toggle */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => insertMath('', 'display')}
          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          title="Display Math Block"
        >
          $$ Display $$
        </button>
        <button
          onClick={() => setIsPreviewMode(!isPreviewMode)}
          className={`px-2 py-1 text-xs rounded ${
            isPreviewMode 
              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          title="Toggle Preview"
        >
          {isPreviewMode ? 'Edit' : 'Preview'}
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-1 hover:bg-gray-200 rounded"
          title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <div className={`latex-rich-text-editor border border-gray-300 rounded-lg ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
        <Toolbar />
        
        <div className="relative">
          {isPreviewMode ? (
          <div
            ref={previewRef}
            className="p-4 min-h-[200px] prose max-w-none prose-headings:text-gray-900 prose-strong:text-gray-900 prose-em:text-gray-700 prose-code:bg-gray-100 prose-code:text-gray-800"
            style={{ height: isFullscreen ? 'calc(100vh - 120px)' : `${height}px`, overflowY: 'auto' }}
            dangerouslySetInnerHTML={{ 
              __html: renderLatexContent(value) || `<p class="text-gray-400">${placeholder}</p>`
            }}
          />
          ) : (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleTextChange}
              onPaste={handlePaste}
              placeholder={placeholder}
              disabled={disabled}
              className="w-full p-4 border-0 resize-none focus:outline-none font-mono text-sm"
              style={{ height: isFullscreen ? 'calc(100vh - 120px)' : `${height}px` }}
            />
          )}
        </div>
        
        {/* Status bar */}
        <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
          <div>
            {isPreviewMode ? 'Preview Mode' : 'Edit Mode'} • 
            LaTeX blocks: {parseLatexBlocks(value).length}
          </div>
          <div>
            Characters: {value.length}
          </div>
        </div>
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Insert Link</h3>
              <button
                onClick={() => setShowLinkDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Link Text
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Enter link text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowLinkDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={insertLink}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Insert Image</h3>
              <button
                onClick={() => setShowImageDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Describe the image"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowImageDialog(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={insertImage}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Insert Image
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
