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
  Link,
  Image,
  Type,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Heading1,
  Heading2,
  Heading3,
  Strikethrough,
  Quote
} from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexRichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  className?: string;
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
  className = ""
}: LatexRichTextEditorProps) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

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

  // Render LaTeX content to HTML with enhanced formatting
  const renderLatexContent = useCallback((content: string): string => {
    const blocks = parseLatexBlocks(content);
    let html = content;
    let offset = 0;
    
    blocks.forEach(block => {
      try {
        const rendered = katex.renderToString(block.latex, {
          throwOnError: false,
          displayMode: block.type === 'display',
          strict: false
        });
        
        const before = html.substring(0, block.start + offset);
        const after = html.substring(block.end + offset);
        const replacement = `<span class="math-${block.type}" data-latex="${block.latex}">${rendered}</span>`;
        
        html = before + replacement + after;
        offset += replacement.length - (block.end - block.start);
      } catch (error) {
        console.warn('LaTeX rendering error:', error);
        // Keep original LaTeX if rendering fails
      }
    });
    
    // Enhanced markdown-like rendering
    html = html
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Strikethrough
      .replace(/~~(.*?)~~/g, '<del>$1</del>')
      // Code
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
      // Quotes
      .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li>$2</li>')
      // Line breaks
      .replace(/\n/g, '<br>');
    
    return html;
  }, [parseLatexBlocks]);

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
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
      case 'code':
        formattedText = `\`${selectedText}\``;
        break;
      case 'h1':
        formattedText = `# ${selectedText}`;
        break;
      case 'h2':
        formattedText = `## ${selectedText}`;
        break;
      case 'h3':
        formattedText = `### ${selectedText}`;
        break;
      case 'quote':
        formattedText = `> ${selectedText}`;
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
    const url = prompt('Enter URL:');
    if (url) {
      const text = prompt('Enter link text (optional):') || url;
      insertText(`[${text}](${url})`);
    }
  };

  // Handle image upload/paste
  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      insertText(`![Image](${imageUrl})`);
    };
    reader.readAsDataURL(file);
  };

  // Handle paste events
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          handleImageUpload(file);
        }
      }
    }
  };

  // Insert color
  const insertColor = (color: string) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const coloredText = `<span style="color: ${color}">${selectedText}</span>`;
    const newValue = value.substring(0, start) + coloredText + value.substring(end);
    onChange(newValue);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + coloredText.length, start + coloredText.length);
    }, 0);
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
          onClick={() => formatText('code')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Code"
        >
          <Code className="h-4 w-4" />
        </button>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={() => formatText('h1')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Heading 1"
        >
          <Heading1 className="h-4 w-4" />
        </button>
        <button
          onClick={() => formatText('h2')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Heading 2"
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          onClick={() => formatText('h3')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Heading 3"
        >
          <Heading3 className="h-4 w-4" />
        </button>
        <button
          onClick={() => formatText('quote')}
          className="p-1 hover:bg-gray-200 rounded"
          title="Quote"
        >
          <Quote className="h-4 w-4" />
        </button>
      </div>

      {/* Links and Media */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={insertLink}
          className="p-1 hover:bg-gray-200 rounded"
          title="Insert Link"
        >
          <Link className="h-4 w-4" />
        </button>
        <label className="p-1 hover:bg-gray-200 rounded cursor-pointer" title="Insert Image">
          <Image className="h-4 w-4" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleImageUpload(file);
              }
            }}
          />
        </label>
      </div>

      {/* Colors */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-600">Color:</span>
          {['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500'].map(color => (
            <button
              key={color}
              onClick={() => insertColor(color)}
              className="w-4 h-4 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={`Color: ${color}`}
            />
          ))}
        </div>
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
      </div>
    </div>
  );

  return (
    <div className={`latex-rich-text-editor border border-gray-300 rounded-lg ${className}`}>
      <Toolbar />
      
      <div className="relative">
        {isPreviewMode ? (
          <div
            ref={previewRef}
            className="p-4 min-h-[200px] prose max-w-none"
            style={{ height: `${height}px`, overflowY: 'auto' }}
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
            style={{ height: `${height}px` }}
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
  );
}
