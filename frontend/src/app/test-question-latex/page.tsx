'use client';

import { useState } from 'react';
import LatexRichTextEditor from '@/components/LatexRichTextEditor';
import { 
  LatexQuestionStem, 
  LatexQuestionExplanation, 
  LatexQuestionTips, 
  LatexQuestionOption 
} from '@/components/LatexContentDisplay';

export default function TestQuestionLatexPage() {
  const [stem, setStem] = useState('');
  const [explanation, setExplanation] = useState('');
  const [tipFormula, setTipFormula] = useState('');
  const [options, setOptions] = useState([
    { text: '', isCorrect: true, order: 0 },
    { text: '', isCorrect: false, order: 1 },
    { text: '', isCorrect: false, order: 2 },
    { text: '', isCorrect: false, order: 3 }
  ]);

  const loadSampleQuestion = () => {
    setStem(`Find the derivative of the function $f(x) = x^3 - 3x^2 + 2x$.

**Step 1:** Apply the power rule to each term:
$$f'(x) = \\frac{d}{dx}(x^3) - \\frac{d}{dx}(3x^2) + \\frac{d}{dx}(2x)$$

**Step 2:** Calculate each derivative:
$$f'(x) = 3x^2 - 6x + 2$$`);

    setExplanation(`To find the derivative of $f(x) = x^3 - 3x^2 + 2x$, we use the power rule:

**Power Rule:** $\\frac{d}{dx}(x^n) = nx^{n-1}$

**Step-by-step solution:**
1. For $x^3$: $\\frac{d}{dx}(x^3) = 3x^{3-1} = 3x^2$
2. For $3x^2$: $\\frac{d}{dx}(3x^2) = 3 \\cdot 2x^{2-1} = 6x$
3. For $2x$: $\\frac{d}{dx}(2x) = 2 \\cdot 1x^{1-1} = 2$

**Final Answer:** $f'(x) = 3x^2 - 6x + 2$`);

    setTipFormula(`**Key Concepts:**
- Power Rule: $\\frac{d}{dx}(x^n) = nx^{n-1}$
- Constant Multiple Rule: $\\frac{d}{dx}(cf(x)) = c \\cdot f'(x)$
- Sum Rule: $\\frac{d}{dx}(f(x) + g(x)) = f'(x) + g'(x)$

**Common Mistakes:**
- Forgetting to subtract 1 from the exponent
- Not applying the constant multiple rule correctly`);

    setOptions([
      { text: '$f\'(x) = 3x^2 - 6x + 2$', isCorrect: true, order: 0 },
      { text: '$f\'(x) = 3x^2 - 6x$', isCorrect: false, order: 1 },
      { text: '$f\'(x) = x^2 - 3x + 2$', isCorrect: false, order: 2 },
      { text: '$f\'(x) = 3x^2 + 6x + 2$', isCorrect: false, order: 3 }
    ]);
  };

  const updateOption = (index: number, text: string) => {
    const newOptions = [...options];
    newOptions[index].text = text;
    setOptions(newOptions);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">LaTeX Question Editor Test</h1>
              <p className="text-gray-600 mt-1">
                Test the LaTeX editor integration with question creation
              </p>
            </div>
            <button
              onClick={loadSampleQuestion}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Load Sample Question
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Editor Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Question Editor</h2>
            
            {/* Question Stem */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Stem</h3>
              <LatexRichTextEditor
                value={stem}
                onChange={setStem}
                placeholder="Enter the question stem with LaTeX math equations..."
                height={200}
              />
            </div>

            {/* Answer Options */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Answer Options</h3>
              <div className="space-y-4">
                {options.map((option, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="w-6 h-6 border rounded flex items-center justify-center text-sm flex-shrink-0 mt-1">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <div className="flex-1">
                      <LatexRichTextEditor
                        value={option.text}
                        onChange={(content) => updateOption(index, content)}
                        placeholder={`Option ${String.fromCharCode(65 + index)}...`}
                        height={100}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Explanation</h3>
              <LatexRichTextEditor
                value={explanation}
                onChange={setExplanation}
                placeholder="Enter detailed explanation with LaTeX math equations..."
                height={200}
              />
            </div>

            {/* Tips & Formulas */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips & Formulas</h3>
              <LatexRichTextEditor
                value={tipFormula}
                onChange={setTipFormula}
                placeholder="Enter helpful tips and formulas with LaTeX..."
                height={150}
              />
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Question Preview</h2>
            
            {/* Question Stem Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Stem</h3>
              <LatexQuestionStem stem={stem} />
            </div>

            {/* Answer Options Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Answer Options</h3>
              <div className="space-y-4">
                {options.map((option, index) => (
                  <LatexQuestionOption
                    key={index}
                    option={option}
                    index={index}
                    showCorrect={true}
                  />
                ))}
              </div>
            </div>

            {/* Explanation Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Explanation</h3>
              <LatexQuestionExplanation explanation={explanation} />
            </div>

            {/* Tips & Formulas Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tips & Formulas</h3>
              <LatexQuestionTips tipFormula={tipFormula} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
