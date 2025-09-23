'use client';

import { useEffect } from 'react';
import parse from 'html-react-parser';

interface QuestionDisplayProps {
  content: string;
  className?: string;
}

export default function QuestionDisplay({ content, className = '' }: QuestionDisplayProps) {
  useEffect(() => {
    // Re-render math equations after content is displayed
    if (typeof window !== 'undefined') {
      if (window.MathJax) {
        // Use a timeout to ensure DOM is updated before MathJax processes
        setTimeout(() => {
          // Force MathJax to reprocess the content
          window.MathJax.typesetPromise?.();
        }, 100);
      }
    }
  }, [content]);

  // Process content to ensure LaTeX expressions are properly formatted
  const processContent = (content: string) => {
    // Fix common LaTeX issues that might prevent rendering
    return content
      // Fix malformed LaTeX expressions like $1\\alpha -> $\\alpha
      .replace(/\$(\d+)\\([a-zA-Z]+)/g, '$\\\\$2')
      // Fix missing backslashes in LaTeX commands
      .replace(/\$([^$]*?)([a-zA-Z]+)([^$]*?)\$/g, (match, before, command, after) => {
        // Check if it's a LaTeX command that needs backslashes
        const latexCommands = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'theta', 'lambda', 'mu', 'pi', 'sigma', 'tau', 'phi', 'omega', 'left', 'right', 'sqrt', 'frac', 'sum', 'int', 'lim', 'sin', 'cos', 'tan', 'log', 'ln', 'exp', 'max', 'min', 'det', 'trace', 'adj', 'binom'];
        if (latexCommands.includes(command)) {
          return `$${before}\\\\${command}${after}$`;
        }
        return match;
      })
      // Convert $...$ to \(...\) for better MathJax compatibility
      .replace(/\$([^$]+)\$/g, '\\($1\\)');
  };

  // Parse HTML content and render it safely
  const parsedContent = parse(processContent(content), {
    replace: (domNode: any) => {
      // Handle any special cases if needed
      return domNode;
    }
  });

  return (
    <div className={`question-content tex2jax_process ${className}`}>
      {parsedContent}
    </div>
  );
}

// Helper component for displaying question stem
export function QuestionStem({ stem, className = '' }: { stem: string; className?: string }) {
  return (
    <QuestionDisplay 
      content={stem} 
      className={`text-lg text-gray-900 leading-relaxed mb-4 ${className}`}
    />
  );
}

// Helper component for displaying explanations
export function QuestionExplanation({ explanation, className = '' }: { explanation: string; className?: string }) {
  return (
    <QuestionDisplay 
      content={explanation} 
      className={`text-sm text-green-700 leading-relaxed ${className}`}
    />
  );
}

// Helper component for displaying tips and formulas
export function QuestionTips({ tipFormula, className = '' }: { tipFormula: string; className?: string }) {
  return (
    <QuestionDisplay 
      content={tipFormula} 
      className={`text-sm text-yellow-700 leading-relaxed ${className}`}
    />
  );
}

// Helper component for displaying options with HTML/LaTeX support
export function QuestionOption({ 
  option, 
  index, 
  showCorrect = false,
  className = '' 
}: { 
  option: { text: string; isCorrect: boolean; order: number };
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
        <QuestionDisplay content={option.text} />
      </div>
    </div>
  );
}
