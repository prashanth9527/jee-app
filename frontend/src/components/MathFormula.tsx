'use client';

import { useEffect, useRef, useState } from 'react';

interface MathFormulaProps {
  formula: string;
  inline?: boolean;
  className?: string;
}

export default function MathFormula({ formula, inline = false, className = '' }: MathFormulaProps) {
  const mathRef = useRef<HTMLDivElement>(null);
  const [displayFormula, setDisplayFormula] = useState(formula);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.MathJax && mathRef.current) {
      setHasError(false);
      
      // Typeset the math
      window.MathJax.typesetPromise([mathRef.current]).catch((err: any) => {
        console.error('MathJax typesetting error:', err);
        setHasError(true);
      });
    }
  }, [formula, inline]);

  return (
    <div 
      ref={mathRef} 
      className={`math-formula ${inline ? 'inline' : 'block'} ${className}`}
      style={{ minHeight: inline ? 'auto' : '2rem' }}
    >
      {hasError ? (
        <span className="text-gray-600">{formula}</span>
      ) : (
        inline ? (
          <span>{formula}</span>
        ) : (
          <div>{formula}</div>
        )
      )}
    </div>
  );
}

