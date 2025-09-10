'use client'

import { useState } from 'react'
import QuillEditorWithMath from './components/QuillEditorWithMath'

export default function Home() {
  const [value, setValue] = useState('')

  const handleSave = () => {
    console.log('Editor content:', value)
    alert('Content saved! Check console for output.')
  }

  const handleClear = () => {
    setValue('')
  }

  const handleLoadSample = () => {
    setValue(`
      <h1>Welcome to Quill.js Rich Text Editor!</h1>
      <p>This is a <strong>powerful</strong> and <em>flexible</em> rich text editor built with Quill.js and Next.js.</p>
      
      <h2>Features:</h2>
      <ul>
        <li>Rich text formatting</li>
        <li>Headers and text styles</li>
        <li>Lists and indentation</li>
        <li>Links and media</li>
        <li>Code blocks</li>
        <li><strong>Math equations with KaTeX!</strong></li>
        <li>And much more!</li>
      </ul>
      
      <h3>Math Equations Support:</h3>
      <p>This editor now supports mathematical equations! Click the formula button (∑) in the toolbar to insert math equations using LaTeX syntax.</p>
      
      <p>Try these examples:</p>
      <ul>
        <li>Quadratic formula: <span class="ql-formula" data-value="x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"></span></li>
        <li>Euler's identity: <span class="ql-formula" data-value="e^{i\\pi} + 1 = 0"></span></li>
        <li>Pythagorean theorem: <span class="ql-formula" data-value="a^2 + b^2 = c^2"></span></li>
      </ul>
      
      <blockquote>
        <p>Try editing this content or start fresh with your own text!</p>
      </blockquote>
      
      <p>You can also add <a href="https://quilljs.com" target="_blank">links</a> and format your text in various ways.</p>
    `)
  }


  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Quill.js Rich Text Editor Demo
            </h1>
            <p className="text-gray-600">
              A fully functional rich text editor built with Quill.js and Next.js
            </p>
          </div>

          <div className="mb-6">
            <div className="flex gap-3 mb-4">
              <button
                onClick={handleLoadSample}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Load Sample Content
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Save Content
              </button>
              <button
                onClick={handleClear}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Clear Editor
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rich Text Editor
            </label>
            <QuillEditorWithMath
              value={value}
              onChange={setValue}
              placeholder="Start typing your content here..."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Editor Content (HTML)
              </h3>
              <div className="bg-gray-100 p-4 rounded-lg">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap overflow-auto max-h-64">
                  {value || 'No content yet...'}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Preview
              </h3>
              <div className="bg-gray-100 p-4 rounded-lg min-h-64">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: value || 'No content to preview...' }}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Editor Features
            </h3>
            <ul className="text-blue-800 space-y-1">
              <li>• Text formatting (bold, italic, underline, strikethrough)</li>
              <li>• Headers (H1-H6) and text sizes</li>
              <li>• Text and background colors</li>
              <li>• Lists (ordered and unordered)</li>
              <li>• Text alignment and indentation</li>
              <li>• Links, images, and videos</li>
              <li>• Code blocks and blockquotes</li>
              <li>• Subscript and superscript</li>
              <li>• Right-to-left text direction</li>
              <li>• <strong>Math equations with KaTeX (LaTeX syntax)</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
