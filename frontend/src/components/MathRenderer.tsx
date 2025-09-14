'use client';

import { useEffect, useRef } from 'react';

interface MathRendererProps {
  formula: string;
  className?: string;
  inline?: boolean;
}

function MathRenderer({ formula, className = '', inline = false }: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMath = async () => {
      if (!containerRef.current || !formula) return;

      try {
        // Load MathJax dynamically if not already loaded
        if (typeof window !== 'undefined' && !(window as any).MathJax) {
          const script = document.createElement('script');
          script.src = 'https://polyfill.io/v3/polyfill.min.js?features=es6';
          script.async = true;
          document.head.appendChild(script);

          const mathJaxScript = document.createElement('script');
          mathJaxScript.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js';
          mathJaxScript.async = true;
          document.head.appendChild(mathJaxScript);

          mathJaxScript.onload = () => {
            (window as any).MathJax = {
              tex: {
                inlineMath: [['$', '$'], ['\\(', '\\)']],
                displayMath: [['$$', '$$'], ['\\[', '\\]']],
                processEscapes: true,
                processEnvironments: true,
              },
              options: {
                skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
              },
            };
            renderFormula();
          };
        } else if ((window as any).MathJax) {
          renderFormula();
        }
      } catch (error) {
        console.error('Error loading MathJax:', error);
        // Fallback to plain text
        if (containerRef.current) {
          containerRef.current.textContent = formula;
        }
      }
    };

    const renderFormula = () => {
      if (!containerRef.current) return;

      try {
        // Clear container
        containerRef.current.innerHTML = '';

        // Convert simple formulas to LaTeX format if needed
        let latexFormula = formula;
        
        // Handle common mathematical symbols and patterns
        latexFormula = latexFormula
          .replace(/\^(\w+)/g, '^{$1}')  // Convert x^2 to x^{2}
          .replace(/\^(\d+)/g, '^{$1}')  // Convert x^2 to x^{2}
          .replace(/sqrt\(([^)]+)\)/g, '\\sqrt{$1}')  // Convert sqrt(x) to \sqrt{x}
          .replace(/log\(([^)]+)\)/g, '\\log($1)')  // Convert log(x) to \log(x)
          .replace(/sin\(([^)]+)\)/g, '\\sin($1)')  // Convert sin(x) to \sin(x)
          .replace(/cos\(([^)]+)\)/g, '\\cos($1)')  // Convert cos(x) to \cos(x)
          .replace(/tan\(([^)]+)\)/g, '\\tan($1)')  // Convert tan(x) to \tan(x)
          .replace(/alpha/g, '\\alpha')  // Convert alpha to \alpha
          .replace(/beta/g, '\\beta')    // Convert beta to \beta
          .replace(/gamma/g, '\\gamma')  // Convert gamma to \gamma
          .replace(/delta/g, '\\delta')  // Convert delta to \delta
          .replace(/theta/g, '\\theta')  // Convert theta to \theta
          .replace(/pi/g, '\\pi')        // Convert pi to \pi
          .replace(/∞/g, '\\infty')      // Convert ∞ to \infty
          .replace(/±/g, '\\pm')         // Convert ± to \pm
          .replace(/≤/g, '\\leq')        // Convert ≤ to \leq
          .replace(/≥/g, '\\geq')        // Convert ≥ to \geq
          .replace(/≠/g, '\\neq')        // Convert ≠ to \neq
          .replace(/⋅/g, '\\cdot')       // Convert ⋅ to \cdot
          .replace(/×/g, '\\times')      // Convert × to \times
          .replace(/÷/g, '\\div')        // Convert ÷ to \div
          .replace(/√/g, '\\sqrt');      // Convert √ to \sqrt

        // Wrap in appropriate delimiters
        const wrappedFormula = inline ? `\\(${latexFormula}\\)` : `\\[${latexFormula}\\]`;
        
        // Set the content
        containerRef.current.innerHTML = wrappedFormula;

        // Render with MathJax
        if ((window as any).MathJax?.typesetPromise) {
          (window as any).MathJax.typesetPromise([containerRef.current]);
        } else if ((window as any).MathJax?.Hub?.Queue) {
          (window as any).MathJax.Hub.Queue(['Typeset', (window as any).MathJax.Hub, containerRef.current]);
        }
      } catch (error) {
        console.error('Error rendering formula:', error);
        // Fallback to plain text
        if (containerRef.current) {
          containerRef.current.textContent = formula;
        }
      }
    };

    renderMath();
  }, [formula, inline]);

  return (
    <div 
      ref={containerRef} 
      className={`math-renderer ${inline ? 'inline' : 'block'} ${className}`}
      style={{
        textAlign: inline ? 'left' : 'center',
        fontSize: inline ? 'inherit' : '1.2em',
        lineHeight: inline ? 'normal' : '1.5',
        display: inline ? 'inline-block' : 'block',
      }}
    />
  );
}

export default MathRenderer;
