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
        window.MathJax.typesetPromise?.();
      }
    }
  }, [content]);

  // Parse HTML content and render it safely
  const parsedContent = parse(content, {
    replace: (domNode: any) => {
      // Handle any special cases if needed
      return domNode;
    }
  });

  return (
    <div className={`question-content ${className}`}>
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
