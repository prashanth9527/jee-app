'use client';

import { useState } from 'react';
import { Calculator, BookOpen, Code, FileText, Lightbulb, Zap } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function RichTextDemoPage() {
  const [content, setContent] = useState('');
  const [previewContent, setPreviewContent] = useState('');

  // Pre-defined math examples for JEE
  const mathExamples = {
    calculus: {
      title: "Calculus Examples",
      examples: [
        {
          name: "Derivative",
          latex: "\\frac{d}{dx}(x^n) = nx^{n-1}"
        },
        {
          name: "Integration",
          latex: "\\int x^n dx = \\frac{x^{n+1}}{n+1} + C"
        },
        {
          name: "Limit",
          latex: "\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1"
        },
        {
          name: "Chain Rule",
          latex: "\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)"
        }
      ]
    },
    algebra: {
      title: "Algebra Examples",
      examples: [
        {
          name: "Quadratic Formula",
          latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}"
        },
        {
          name: "Binomial Theorem",
          latex: "(a + b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k"
        },
        {
          name: "Arithmetic Progression",
          latex: "S_n = \\frac{n}{2}[2a + (n-1)d]"
        },
        {
          name: "Geometric Progression",
          latex: "S_n = \\frac{a(1-r^n)}{1-r}"
        }
      ]
    },
    physics: {
      title: "Physics Examples",
      examples: [
        {
          name: "Kinematic Equation",
          latex: "v = u + at"
        },
        {
          name: "Newton's Second Law",
          latex: "F = ma"
        },
        {
          name: "Work-Energy Theorem",
          latex: "W = \\Delta KE = \\frac{1}{2}mv^2 - \\frac{1}{2}mu^2"
        },
        {
          name: "Ohm's Law",
          latex: "V = IR"
        }
      ]
    },
    chemistry: {
      title: "Chemistry Examples",
      examples: [
        {
          name: "Ideal Gas Law",
          latex: "PV = nRT"
        },
        {
          name: "Nernst Equation",
          latex: "E = E^0 - \\frac{RT}{nF} \\ln Q"
        },
        {
          name: "Arrhenius Equation",
          latex: "k = A e^{-\\frac{E_a}{RT}}"
        },
        {
          name: "pH Calculation",
          latex: "pH = -\\log[H^+]"
        }
      ]
    }
  };

  const insertMathExample = (latex: string) => {
    const mathBlock = `$$${latex}$$`;
    setContent(prev => prev + mathBlock + '\n\n');
  };

  const insertInlineMath = (latex: string) => {
    const inlineMath = `$${latex}$`;
    setContent(prev => prev + inlineMath);
  };

  const loadSampleContent = () => {
    const sampleContent = `
<h2>Sample JEE Question with Math Equations</h2>

<p>Consider the function <span class="math">$f(x) = x^3 - 3x^2 + 2x$</span>. Find the critical points and determine the nature of each critical point.</p>

<h3>Solution:</h3>

<p><strong>Step 1:</strong> Find the first derivative:</p>
$$f'(x) = \\frac{d}{dx}(x^3 - 3x^2 + 2x) = 3x^2 - 6x + 2$$

<p><strong>Step 2:</strong> Find critical points by setting $f'(x) = 0$:</p>
$$3x^2 - 6x + 2 = 0$$

<p>Using the quadratic formula:</p>
$$x = \\frac{6 \\pm \\sqrt{36 - 24}}{6} = \\frac{6 \\pm \\sqrt{12}}{6} = \\frac{6 \\pm 2\\sqrt{3}}{6} = 1 \\pm \\frac{\\sqrt{3}}{3}$$

<p><strong>Step 3:</strong> Find the second derivative:</p>
$$f''(x) = 6x - 6$$

<p><strong>Step 4:</strong> Determine the nature of critical points:</p>
<ul>
  <li>At $x = 1 + \\frac{\\sqrt{3}}{3}$: $f''(x) > 0$ → Local minimum</li>
  <li>At $x = 1 - \\frac{\\sqrt{3}}{3}$: $f''(x) < 0$ → Local maximum</li>
</ul>

<h3>Physics Example:</h3>

<p>A particle moves along the x-axis with velocity $v(t) = 3t^2 - 12t + 9$ m/s. Find the displacement between $t = 0$ and $t = 3$ seconds.</p>

<p><strong>Solution:</strong></p>
$$\\text{Displacement} = \\int_0^3 v(t) dt = \\int_0^3 (3t^2 - 12t + 9) dt$$

$$= \\left[ t^3 - 6t^2 + 9t \\right]_0^3 = 27 - 54 + 27 = 0 \\text{ m}$$

<h3>Chemistry Example:</h3>

<p>Calculate the pH of a 0.1 M solution of acetic acid ($K_a = 1.8 \\times 10^{-5}$).</p>

<p><strong>Solution:</strong></p>
$$K_a = \\frac{[H^+][CH_3COO^-]}{[CH_3COOH]}$$

<p>For weak acids: $[H^+] = \\sqrt{K_a \\times C}$</p>
$$[H^+] = \\sqrt{1.8 \\times 10^{-5} \\times 0.1} = \\sqrt{1.8 \\times 10^{-6}} = 1.34 \\times 10^{-3}$$

$$pH = -\\log[H^+] = -\\log(1.34 \\times 10^{-3}) = 2.87$$
    `;
    setContent(sampleContent);
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Calculator className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">TinyMCE Rich Text Editor Demo</h1>
          </div>
          <p className="text-gray-600 text-lg">
            Experience the power of TinyMCE with integrated math equation support for JEE content creation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Editor Controls */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Rich Text Editor
                </h2>
                <button
                  onClick={loadSampleContent}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Lightbulb className="h-4 w-4" />
                  Load Sample Content
                </button>
              </div>
              
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Start typing your JEE content here... Use the math button to insert equations!"
                height={500}
                className="border border-gray-200 rounded-lg"
              />
            </div>

            {/* Preview */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Code className="h-5 w-5" />
                Live Preview
              </h3>
              <div 
                className="prose max-w-none border border-gray-200 rounded-lg p-4 min-h-[200px]"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Math Insert */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Math Insert
              </h3>
              
              {Object.entries(mathExamples).map(([category, data]) => (
                <div key={category} className="mb-6">
                  <h4 className="font-medium text-gray-800 mb-3">{data.title}</h4>
                  <div className="space-y-2">
                    {data.examples.map((example, index) => (
                      <button
                        key={index}
                        onClick={() => insertMathExample(example.latex)}
                        className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="text-sm font-medium text-gray-700 mb-1">
                          {example.name}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">
                          {example.latex}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Math Syntax Help */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Math Syntax Help
              </h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Inline Math</h4>
                  <p className="text-gray-600 mb-1">Use single dollar signs: <code className="bg-gray-100 px-1 rounded">$x^2$</code></p>
                  <p className="text-gray-500">Example: The equation $x^2 + y^2 = r^2$ represents a circle.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Display Math</h4>
                  <p className="text-gray-600 mb-1">Use double dollar signs: <code className="bg-gray-100 px-1 rounded">$$x^2$$</code></p>
                  <p className="text-gray-500">Example: $$E = mc^2$$</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Common Symbols</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><code>\\alpha</code> → α</div>
                    <div><code>\\beta</code> → β</div>
                    <div><code>\\gamma</code> → γ</div>
                    <div><code>\\delta</code> → δ</div>
                    <div><code>\\pi</code> → π</div>
                    <div><code>\\sigma</code> → σ</div>
                    <div><code>\\infty</code> → ∞</div>
                    <div><code>\\sum</code> → ∑</div>
                    <div><code>\\int</code> → ∫</div>
                    <div><code>\\sqrt</code> → √</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Integration Examples */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Integration Examples
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-1">Question Form</h4>
                  <p className="text-blue-700">Replace textarea with RichTextEditor for question stems, explanations, and solutions.</p>
                </div>
                
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-1">Formula Bank</h4>
                  <p className="text-green-700">Enhanced formula descriptions with rich formatting and examples.</p>
                </div>
                
                <div className="p-3 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-1">Study Materials</h4>
                  <p className="text-purple-700">Create comprehensive study guides with embedded math equations.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">1. Replace Textareas</h4>
              <p className="text-sm text-gray-600">Update question forms to use RichTextEditor instead of basic textareas.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">2. Add Math Validation</h4>
              <p className="text-sm text-gray-600">Implement validation for LaTeX syntax and math equation rendering.</p>
            </div>
            <div className="p-4 border border-gray-200 rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">3. Mobile Optimization</h4>
              <p className="text-sm text-gray-600">Ensure math equations render properly on mobile devices.</p>
            </div>
          </div>
        </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
