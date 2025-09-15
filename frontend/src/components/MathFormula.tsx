'use client';

import { useEffect, useRef } from 'react';

interface MathFormulaProps {
  formula: string;
  inline?: boolean;
  className?: string;
}

export default function MathFormula({ formula, inline = false, className = '' }: MathFormulaProps) {
  const mathRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.MathJax && mathRef.current) {
      // Clear previous content
      mathRef.current.innerHTML = '';
      
      // Create the math element
      const mathElement = document.createElement(inline ? 'span' : 'div');
      mathElement.textContent = formula;
      mathRef.current.appendChild(mathElement);

      // Typeset the math
      window.MathJax.typesetPromise([mathRef.current]).catch((err: any) => {
        console.error('MathJax typesetting error:', err);
        // Fallback: display as plain text
        if (mathRef.current) {
          mathRef.current.innerHTML = `<span class="text-gray-600">${formula}</span>`;
        }
      });
    }
  }, [formula, inline]);

  return (
    <div 
      ref={mathRef} 
      className={`math-formula ${inline ? 'inline' : 'block'} ${className}`}
      style={{ minHeight: inline ? 'auto' : '2rem' }}
    />
  );
}

