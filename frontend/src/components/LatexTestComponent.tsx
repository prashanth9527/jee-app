'use client';

import { useState } from 'react';
import LatexRichTextEditor from './LatexRichTextEditor';

export default function LatexTestComponent() {
  const [content, setContent] = useState('');

  const testExpressions = [
    'Simple: $x^2 + y^2 = r^2$',
    'Fraction: $\\frac{a}{b}$',
    'Display: $$\\int_0^\\infty e^{-x} dx = 1$$',
    'Complex: $$\\sum_{n=1}^\\infty \\frac{1}{n^2} = \\frac{\\pi^2}{6}$$',
    'Matrix: $$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$',
    'Greek: $\\alpha, \\beta, \\gamma, \\delta, \\pi, \\sigma$',
    'Physics: $E = mc^2$ and $F = ma$',
    'Chemistry: $pH = -\\log[H^+]$'
  ];

  const loadTestContent = () => {
    setContent(testExpressions.join('\n\n'));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">LaTeX Editor Test</h1>
      
      <div className="mb-4">
        <button
          onClick={loadTestContent}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Load Test Expressions
        </button>
      </div>

      <LatexRichTextEditor
        value={content}
        onChange={setContent}
        placeholder="Test LaTeX expressions here..."
        height={400}
      />

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Raw Content:</h3>
        <pre className="text-sm overflow-auto">{content}</pre>
      </div>
    </div>
  );
}


