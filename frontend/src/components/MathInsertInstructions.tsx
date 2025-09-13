'use client';

import { Calculator, MousePointer, Type, Eye } from 'lucide-react';

export default function MathInsertInstructions() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-800">How to Insert Math Equations</h3>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
            1
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MousePointer className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Click the Math Button</span>
            </div>
            <p className="text-blue-700 text-sm">
              Look for the "Math" button in the toolbar (it has a calculator icon). If you don't see it, try refreshing the page.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
            2
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Type className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Enter LaTeX Equation</span>
            </div>
            <p className="text-blue-700 text-sm">
              Type your equation in LaTeX format (e.g., <code className="bg-blue-100 px-1 rounded">{"\\frac{a}{b}"}</code>) or use the quick insert buttons.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
            3
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-800">Preview & Insert</span>
            </div>
            <p className="text-blue-700 text-sm">
              Preview your equation in the dialog, then click "Insert Math" to add it to the editor.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-100 rounded-lg">
        <h4 className="font-medium text-blue-800 mb-2">Quick Examples:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div><code className="bg-white px-1 rounded">{"\\frac{a}{b}"}</code> → Fraction</div>
          <div><code className="bg-white px-1 rounded">x^2</code> → Superscript</div>
          <div><code className="bg-white px-1 rounded">{"\\int_0^1"}</code> → Integral</div>
          <div><code className="bg-white px-1 rounded">{"\\sum_{i=1}^n"}</code> → Summation</div>
        </div>
      </div>
    </div>
  );
}
