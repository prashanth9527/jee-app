'use client';

import { useEffect, useRef } from 'react';
import parse from 'html-react-parser';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface LatexContentDisplayProps {
  content: string;
  className?: string;
}

export default function LatexContentDisplay({ content, className = '' }: LatexContentDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse LaTeX blocks from content
  const parseLatexBlocks = (content: string) => {
    const blocks: Array<{ id: string; latex: string; start: number; end: number; type: 'inline' | 'display' }> = [];
    const inlineRegex = /\$([^$]+)\$/g;
    const displayRegex = /\$\$([^$]+)\$\$/g;
    
    let match;
    
    // Find inline math blocks
    while ((match = inlineRegex.exec(content)) !== null) {
      // Unescape LaTeX content (convert \\ to \)
      const unescapedLatex = match[1].replace(/\\\\/g, '\\');
      blocks.push({
        id: `inline-${match.index}`,
        latex: unescapedLatex,
        start: match.index,
        end: match.index + match[0].length,
        type: 'inline'
      });
    }
    
    // Find display math blocks
    while ((match = displayRegex.exec(content)) !== null) {
      // Unescape LaTeX content (convert \\ to \)
      const unescapedLatex = match[1].replace(/\\\\/g, '\\');
      blocks.push({
        id: `display-${match.index}`,
        latex: unescapedLatex,
        start: match.index,
        end: match.index + match[0].length,
        type: 'display'
      });
    }
    
    return blocks.sort((a, b) => a.start - b.start);
  };

  // Render LaTeX content to HTML
  const renderLatexContent = (content: string): string => {
    const blocks = parseLatexBlocks(content);
    let html = content;
    let offset = 0;
    
    blocks.forEach(block => {
      try {
        const rendered = katex.renderToString(block.latex, {
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
            "\\overset": "\\mathop{#2}\\limits^{#1}"
          }
        });
        
        const before = html.substring(0, block.start + offset);
        const after = html.substring(block.end + offset);
        const replacement = `<span class="math-${block.type}" data-latex="${block.latex}">${rendered}</span>`;
        
        html = before + replacement + after;
        offset += replacement.length - (block.end - block.start);
      } catch (error) {
        console.warn('LaTeX rendering error for:', block.latex, error);
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

  // Parse HTML content and render it safely
  const parsedContent = parse(processContent(content), {
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



