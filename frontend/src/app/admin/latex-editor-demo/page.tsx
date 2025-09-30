'use client';

import { useState } from 'react';
import { Calculator, BookOpen, Code, Lightbulb, Zap, Eye, Edit3, Calculator as MathIcon } from 'lucide-react';
import LatexRichTextEditor from '@/components/LatexRichTextEditor';
import AdminLayout from '@/components/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function LatexEditorDemoPage() {
  const [content, setContent] = useState('');
  const [showExamples, setShowExamples] = useState(false);

  // Pre-defined math examples for JEE
  const mathExamples = {
    calculus: {
      title: "Calculus Examples",
      examples: [
        {
          name: "Derivative",
          latex: "\\frac{d}{dx}(x^n) = nx^{n-1}",
          description: "Power rule for derivatives"
        },
        {
          name: "Integration",
          latex: "\\int x^n dx = \\frac{x^{n+1}}{n+1} + C",
          description: "Power rule for integration"
        },
        {
          name: "Limit",
          latex: "\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1",
          description: "Fundamental trigonometric limit"
        },
        {
          name: "Chain Rule",
          latex: "\\frac{d}{dx}[f(g(x))] = f'(g(x)) \\cdot g'(x)",
          description: "Derivative of composite functions"
        },
        {
          name: "Product Rule",
          latex: "\\frac{d}{dx}[f(x)g(x)] = f'(x)g(x) + f(x)g'(x)",
          description: "Derivative of product of functions"
        }
      ]
    },
    algebra: {
      title: "Algebra Examples",
      examples: [
        {
          name: "Quadratic Formula",
          latex: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}",
          description: "Solution to quadratic equations"
        },
        {
          name: "Binomial Theorem",
          latex: "(a + b)^n = \\sum_{k=0}^{n} \\binom{n}{k} a^{n-k} b^k",
          description: "Expansion of binomial expressions"
        },
        {
          name: "Arithmetic Progression",
          latex: "S_n = \\frac{n}{2}[2a + (n-1)d]",
          description: "Sum of arithmetic sequence"
        },
        {
          name: "Geometric Progression",
          latex: "S_n = \\frac{a(1-r^n)}{1-r}",
          description: "Sum of geometric sequence"
        },
        {
          name: "Logarithm Properties",
          latex: "\\log_a(xy) = \\log_a(x) + \\log_a(y)",
          description: "Product rule for logarithms"
        }
      ]
    },
    physics: {
      title: "Physics Examples",
      examples: [
        {
          name: "Kinematic Equation",
          latex: "v = u + at",
          description: "Velocity with constant acceleration"
        },
        {
          name: "Newton's Second Law",
          latex: "F = ma",
          description: "Force equals mass times acceleration"
        },
        {
          name: "Work-Energy Theorem",
          latex: "W = \\Delta KE = \\frac{1}{2}mv^2 - \\frac{1}{2}mu^2",
          description: "Work done equals change in kinetic energy"
        },
        {
          name: "Ohm's Law",
          latex: "V = IR",
          description: "Voltage equals current times resistance"
        },
        {
          name: "Einstein's Mass-Energy",
          latex: "E = mc^2",
          description: "Mass-energy equivalence"
        }
      ]
    },
    chemistry: {
      title: "Chemistry Examples",
      examples: [
        {
          name: "Ideal Gas Law",
          latex: "PV = nRT",
          description: "Relationship between pressure, volume, and temperature"
        },
        {
          name: "Nernst Equation",
          latex: "E = E^0 - \\frac{RT}{nF} \\ln Q",
          description: "Cell potential under non-standard conditions"
        },
        {
          name: "Arrhenius Equation",
          latex: "k = A e^{-\\frac{E_a}{RT}}",
          description: "Temperature dependence of reaction rate"
        },
        {
          name: "pH Calculation",
          latex: "pH = -\\log[H^+]",
          description: "Acidity measure of a solution"
        },
        {
          name: "Henderson-Hasselbalch",
          latex: "pH = pK_a + \\log\\frac{[A^-]}{[HA]}",
          description: "pH of buffer solutions"
        }
      ]
    }
  };

  const loadSampleContent = () => {
    const sampleContent = `# Sample JEE Question with LaTeX Math

## Problem Statement

Consider the function $f(x) = x^3 - 3x^2 + 2x$. Find the critical points and determine the nature of each critical point.

## Solution

### Step 1: Find the first derivative

$$f'(x) = \\frac{d}{dx}(x^3 - 3x^2 + 2x) = 3x^2 - 6x + 2$$

### Step 2: Find critical points

Set $f'(x) = 0$:
$$3x^2 - 6x + 2 = 0$$

Using the quadratic formula:
$$x = \\frac{6 \\pm \\sqrt{36 - 24}}{6} = \\frac{6 \\pm \\sqrt{12}}{6} = \\frac{6 \\pm 2\\sqrt{3}}{6} = 1 \\pm \\frac{\\sqrt{3}}{3}$$

### Step 3: Second derivative test

$$f''(x) = 6x - 6$$

- At $x = 1 + \\frac{\\sqrt{3}}{3}$: $f''(x) > 0$ → **Local minimum**
- At $x = 1 - \\frac{\\sqrt{3}}{3}$: $f''(x) < 0$ → **Local maximum**

## Physics Example

A particle moves along the x-axis with velocity $v(t) = 3t^2 - 12t + 9$ m/s. Find the displacement between $t = 0$ and $t = 3$ seconds.

**Solution:**
$$\\text{Displacement} = \\int_0^3 v(t) dt = \\int_0^3 (3t^2 - 12t + 9) dt$$

$$= \\left[ t^3 - 6t^2 + 9t \\right]_0^3 = 27 - 54 + 27 = 0 \\text{ m}$$

## Chemistry Example

Calculate the pH of a 0.1 M solution of acetic acid ($K_a = 1.8 \\times 10^{-5}$).

**Solution:**
$$K_a = \\frac{[H^+][CH_3COO^-]}{[CH_3COOH]}$$

For weak acids: $[H^+] = \\sqrt{K_a \\times C}$
$$[H^+] = \\sqrt{1.8 \\times 10^{-5} \\times 0.1} = \\sqrt{1.8 \\times 10^{-6}} = 1.34 \\times 10^{-3}$$

$$pH = -\\log[H^+] = -\\log(1.34 \\times 10^{-3}) = 2.87$$

## Advanced Examples

### Matrix Operations
$$\\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} 5 \\\\ 6 \\end{pmatrix}$$

### Vector Calculus
$$\\nabla \\times \\vec{F} = \\begin{vmatrix} \\hat{i} & \\hat{j} & \\hat{k} \\\\ \\frac{\\partial}{\\partial x} & \\frac{\\partial}{\\partial y} & \\frac{\\partial}{\\partial z} \\\\ F_x & F_y & F_z \\end{vmatrix}$$

### Complex Numbers
$$e^{i\\pi} + 1 = 0$$
$$z = r(\\cos\\theta + i\\sin\\theta) = re^{i\\theta}$$`;
    setContent(sampleContent);
  };

  const insertExample = (latex: string) => {
    const mathBlock = `$$${latex}$$`;
    setContent(prev => prev + '\n\n' + mathBlock + '\n');
  };

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <MathIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">LaTeX Rich Text Editor Demo</h1>
            </div>
            <p className="text-gray-600 text-lg">
              Experience the power of our custom LaTeX-enabled rich text editor with immediate preview and no external dependencies.
            </p>
            <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                Immediate Preview
              </div>
              <div className="flex items-center gap-1">
                <Code className="h-4 w-4" />
                KaTeX Rendering
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4" />
                No External Dependencies
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Editor */}
            <div className="lg:col-span-3 space-y-6">
              {/* Editor Controls */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Edit3 className="h-5 w-5" />
                    LaTeX Rich Text Editor
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowExamples(!showExamples)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      <BookOpen className="h-4 w-4" />
                      {showExamples ? 'Hide' : 'Show'} Examples
                    </button>
                    <button
                      onClick={loadSampleContent}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Lightbulb className="h-4 w-4" />
                      Load Sample
                    </button>
                  </div>
                </div>
                
                <LatexRichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Start typing your JEE content here... Use the toolbar buttons to insert LaTeX math expressions!"
                  height={600}
                  className="border border-gray-200 rounded-lg"
                />
              </div>

              {/* Features Showcase */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Key Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Immediate Preview</h4>
                    <p className="text-sm text-gray-600">LaTeX expressions are rendered instantly as you type, with no need for external plugins.</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Rich Toolbar</h4>
                    <p className="text-sm text-gray-600">Quick access to common math symbols, Greek letters, and LaTeX templates.</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">Dual Mode</h4>
                    <p className="text-sm text-gray-600">Switch between edit mode and preview mode for better content creation experience.</p>
                  </div>
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2">JEE Optimized</h4>
                    <p className="text-sm text-gray-600">Pre-built templates for Calculus, Algebra, Physics, and Chemistry equations.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Math Insert */}
              {showExamples && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Quick Math Insert
                  </h3>
                  
                  {Object.entries(mathExamples).map(([category, data]) => (
                    <div key={category} className="mb-6">
                      <h4 className="font-medium text-gray-800 mb-3">{data.title}</h4>
                      <div className="space-y-2">
                        {data.examples.map((example, index) => (
                          <button
                            key={index}
                            onClick={() => insertExample(example.latex)}
                            className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="text-sm font-medium text-gray-700 mb-1">
                              {example.name}
                            </div>
                            <div className="text-xs text-gray-500 font-mono mb-1">
                              {example.latex}
                            </div>
                            <div className="text-xs text-gray-400">
                              {example.description}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* LaTeX Syntax Help */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  LaTeX Syntax Help
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
                    <h4 className="font-medium text-gray-800 mb-2">Common Commands</h4>
                    <div className="space-y-1 text-xs">
                      <div><code>{"\\frac{a}{b}"}</code> → fraction</div>
                      <div><code>{"\\sqrt{x}"}</code> → square root</div>
                      <div><code>{"x^{n}"}</code> → superscript</div>
                      <div><code>{"x_{n}"}</code> → subscript</div>
                      <div><code>{"\\sum_{i=1}^{n}"}</code> → summation</div>
                      <div><code>{"\\int_{a}^{b}"}</code> → integral</div>
                      <div><code>{"\\lim_{x \\to a}"}</code> → limit</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Integration Guide */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Integration Guide
                </h3>
                
                <div className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-1">Question Module</h4>
                    <p className="text-blue-700">Perfect for JEE question creation with complex mathematical expressions.</p>
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
                <h4 className="font-medium text-gray-800 mb-2">1. Question Module Integration</h4>
                <p className="text-sm text-gray-600">Replace existing textareas in question creation forms with this LaTeX editor.</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">2. Enhanced Features</h4>
                <p className="text-sm text-gray-600">Add more LaTeX templates, equation numbering, and advanced formatting options.</p>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-800 mb-2">3. Mobile Optimization</h4>
                <p className="text-sm text-gray-600">Ensure LaTeX equations render properly on mobile devices and tablets.</p>
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
