'use client';

import { useEffect, useRef } from 'react';
import parse from 'html-react-parser';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cleanLatex } from '@/utils/textCleaner';

interface LatexContentDisplayProps {
  content: string;
  className?: string;
}

// Global style injection for KaTeX color inheritance (only inject once)
let katexStyleInjected = false;

export default function LatexContentDisplay({ content, className = '' }: LatexContentDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Ensure KaTeX elements inherit text color (inject style only once globally)
  useEffect(() => {
    if (!katexStyleInjected) {
      const style = document.createElement('style');
      style.id = 'katex-color-inherit';
      style.textContent = `
        /* Force KaTeX to inherit text color from parent */
        .latex-content-display .katex,
        .latex-content-display .katex *,
        .latex-content-display .katex-display,
        .latex-content-display .katex-display * {
          color: inherit !important;
        }
        .math-display .katex,
        .math-display .katex *,
        .math-inline .katex,
        .math-inline .katex * {
          color: inherit !important;
        }
        /* Ensure KaTeX respects parent text color classes */
        .text-gray-900 .katex,
        .text-gray-900 .katex *,
        .text-green-700 .katex,
        .text-green-700 .katex *,
        .text-gray-700 .katex,
        .text-gray-700 .katex * {
          color: inherit !important;
        }
        /* Fallback: if no color is inherited, use a visible default */
        .latex-content-display:not([class*="text-"]) .katex,
        .latex-content-display:not([class*="text-"]) .katex * {
          color: #1f2937 !important; /* gray-800 */
        }
      `;
      document.head.appendChild(style);
      katexStyleInjected = true;
    }
  }, []);

  // Parse LaTeX blocks from content
  const parseLatexBlocks = (content: string) => {
    const blocks: Array<{ id: string; latex: string; start: number; end: number; type: 'inline' | 'display' }> = [];
    
    // Support multiple LaTeX delimiters (order matters - check display math before inline):
    // 1. \[ ... \] for display math
    // 2. \( ... \) for inline math
    // 3. $$ ... $$ for display math
    // 4. $ ... $ for inline math (but check if it contains display environments)
    
    // Helper to detect if LaTeX content contains display math environments
    const isDisplayMath = (latex: string): boolean => {
      const displayEnvs = [
        '\\begin{aligned}',
        '\\begin{align}',
        '\\begin{alignat}',
        '\\begin{eqnarray}',
        '\\begin{equation}',
        '\\begin{gather}',
        '\\begin{multline}',
        '\\begin{split}',
        '\\begin{array}',
        '\\begin{matrix}',
        '\\begin{pmatrix}',
        '\\begin{bmatrix}',
        '\\begin{vmatrix}',
        '\\begin{Vmatrix}',
        '\\begin{cases}',
      ];
      return displayEnvs.some(env => latex.includes(env));
    };
    
    const patterns = [
      { regex: /\\\[([\s\S]*?)\\\]/g, type: 'display' as const },    // \[ ... \]
      { regex: /\\\(([\s\S]+?)\\\)/g, type: 'inline' as const },        // \( ... \)
      { regex: /\$\$([\s\S]*?)\$\$/g, type: 'display' as const },       // $$ ... $$
      { regex: /\$([\s\S]+?)\$/g, type: 'inline' as const },            // $ ... $ (will check for display envs)
    ];
    
    patterns.forEach(({ regex, type }) => {
      let match;
      const regexCopy = new RegExp(regex.source, regex.flags);
      
      while ((match = regexCopy.exec(content)) !== null) {
        const start = match.index;
        const end = match.index + match[0].length;
        
        // Check if this range overlaps with existing blocks
        const overlaps = blocks.some(block => 
          (start >= block.start && start < block.end) ||
          (end > block.start && end <= block.end) ||
          (start <= block.start && end >= block.end)
        );
        
        if (!overlaps) {
          // Unescape LaTeX content (convert \\ to \)
          const unescapedLatex = match[1].replace(/\\\\/g, '\\');
          
          // Determine actual type: if single $ contains display math, treat as display
          const actualType = (type === 'inline' && isDisplayMath(unescapedLatex)) 
            ? 'display' 
            : type;
          
          blocks.push({
            id: `${actualType}-${match.index}`,
            latex: unescapedLatex,
            start,
            end,
            type: actualType
          });
        }
      }
    });
    
    return blocks.sort((a, b) => a.start - b.start);
  };

  // Render LaTeX content to HTML
  const renderLatexContent = (content: string): string => {
    const blocks = parseLatexBlocks(content);
    let html = content;
    let offset = 0;
    
    blocks.forEach(block => {
      // Clean the LaTeX content before rendering
      const cleanedLatex = cleanLatex(block.latex);
      
      try {
        const rendered = katex.renderToString(cleanedLatex, {
          throwOnError: false,
          displayMode: block.type === 'display',
          strict: false,
          trust: true,
          macros: {
            "\\xrightarrow": "\\stackrel{#1}{\\rightarrow}",
            "\\xleftarrow": "\\stackrel{#1}{\\leftarrow}",
            "\\xleftrightarrow": "\\stackrel{#1}{\\leftrightarrow}",
            "\\xRightarrow": "\\stackrel{#1}{\\Rightarrow}",
            "\\xLeftarrow": "\\stackrel{#1}{\\Leftarrow}",
            "\\xLeftrightarrow": "\\stackrel{#1}{\\Leftrightarrow}",
            "\\xhookrightarrow": "\\stackrel{#1}{\\hookrightarrow}",
            "\\xhookleftarrow": "\\stackrel{#1}{\\hookleftarrow}",
            "\\xrightharpoonup": "\\stackrel{#1}{\\rightharpoonup}",
            "\\xrightharpoondown": "\\stackrel{#1}{\\rightharpoondown}",
            "\\xleftharpoonup": "\\stackrel{#1}{\\leftharpoonup}",
            "\\xleftharpoondown": "\\stackrel{#1}{\\leftharpoondown}",
            "\\xrightleftharpoons": "\\stackrel{#1}{\\rightleftharpoons}",
            "\\xleftrightharpoons": "\\stackrel{#1}{\\leftrightharpoons}",
            "\\xmapsto": "\\stackrel{#1}{\\mapsto}",
            "\\xlongequal": "\\stackrel{#1}{=}",
            "\\xlongleftarrow": "\\stackrel{#1}{\\longleftarrow}",
            "\\xlongrightarrow": "\\stackrel{#1}{\\longrightarrow}",
            "\\xlongleftrightarrow": "\\stackrel{#1}{\\longleftrightarrow}",
            "\\xLongleftarrow": "\\stackrel{#1}{\\Longleftarrow}",
            "\\xLongrightarrow": "\\stackrel{#1}{\\Longrightarrow}",
            "\\xLongleftrightarrow": "\\stackrel{#1}{\\Longleftrightarrow}",
            "\\xlongmapsto": "\\stackrel{#1}{\\longmapsto}",
            "\\substack": "\\begin{array}{c}#1\\end{array}",
            "\\underset": "\\mathop{#2}\\limits_{#1}",
            "\\overset": "\\mathop{#2}\\limits^{#1}",
            
            // Common LaTeX fixes
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
        // Add explicit color styling to ensure math is visible
        const replacement = `<span class="math-${block.type}" data-latex="${block.latex}" style="color: inherit;">${rendered}</span>`;
        
        html = before + replacement + after;
        offset += replacement.length - (block.end - block.start);
      } catch (error) {
        console.warn('LaTeX rendering error for:', block.latex, 'Cleaned:', cleanedLatex, error);
        // Keep original LaTeX if rendering fails
      }
    });
    
    return html;
  };

  // Process content to handle both HTML and LaTeX
  const processContent = (content: string) => {
    // First render LaTeX expressions
    const latexRendered = renderLatexContent(content);
    
    // Then process any remaining HTML
    return latexRendered;
  };

  // Ensure content is a string
  const contentString = typeof content === 'string' ? content : String(content || '');
  
  // Parse HTML content and render it safely
  const parsedContent = parse(processContent(contentString), {
    replace: (domNode: any) => {
      // Handle any special cases if needed
      return domNode;
    }
  });

  return (
    <div 
      ref={containerRef}
      className={`latex-content-display ${className}`}
    >
      {parsedContent}
    </div>
  );
}

// Helper component for displaying question stem
export function LatexQuestionStem({ stem, className = '' }: { stem: string; className?: string }) {
  return (
    <LatexContentDisplay 
      content={stem} 
      className={`text-lg text-gray-900 leading-relaxed mb-4 ${className}`}
    />
  );
}

// Helper component for displaying explanations
export function LatexQuestionExplanation({ explanation, className = '' }: { explanation: string; className?: string }) {
  return (
    <LatexContentDisplay 
      content={explanation} 
      className={`text-sm text-green-700 leading-relaxed ${className}`}
    />
  );
}

// Helper component for displaying tips and formulas
export function LatexQuestionTips({ tipFormula, className = '' }: { tipFormula: string; className?: string }) {
  return (
    <LatexContentDisplay 
      content={tipFormula} 
      className={`text-sm text-yellow-700 leading-relaxed ${className}`}
    />
  );
}

// Helper component for displaying options with LaTeX support
export function LatexQuestionOption({ 
  option, 
  index, 
  showCorrect = false,
  className = '' 
}: { 
  option: { text: string; isCorrect: boolean; order?: number };
  index: number;
  showCorrect?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex items-start ${className}`}>
      <span className={`w-6 h-6 border rounded mr-3 flex items-center justify-center text-sm flex-shrink-0 mt-1 ${
        showCorrect && option.isCorrect 
          ? 'border-green-500 bg-green-100 text-green-700 font-medium' 
          : 'border-gray-300'
      }`}>
        {String.fromCharCode(65 + (option.order || index))}
      </span>
      <div className={`flex-1 ${
        showCorrect && option.isCorrect 
          ? 'text-green-600 font-medium' 
          : 'text-gray-700'
      }`}>
        <LatexContentDisplay content={option.text} />
      </div>
    </div>
  );
}


