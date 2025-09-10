'use client'

import { useEffect, useState, useRef } from 'react'
import dynamic from 'next/dynamic'

// Import Quill CSS
import 'react-quill/dist/quill.snow.css'
// Import KaTeX CSS for math equations
import 'katex/dist/katex.min.css'

interface QuillWithMathProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function QuillWithMath({ value, onChange, placeholder = "Start typing..." }: QuillWithMathProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [katexLoaded, setKatexLoaded] = useState(false)
  const quillRef = useRef<any>(null)

  useEffect(() => {
    // Load KaTeX and quill-katex before mounting the editor
    if (typeof window !== 'undefined') {
      Promise.all([
        import('katex'),
        import('quill-katex')
      ]).then(([katex, quillKatex]) => {
        // Make KaTeX available globally
        (window as any).katex = katex.default || katex
        
        // Register the formula module
        const ReactQuill = require('react-quill')
        const Quill = ReactQuill.default.Quill || ReactQuill.Quill
        
        if (Quill && quillKatex.default) {
          Quill.register('modules/formula', quillKatex.default)
          setKatexLoaded(true)
        }
      }).catch((error) => {
        console.warn('Failed to load KaTeX or quill-katex:', error)
        setKatexLoaded(true) // Still allow editor to load without math support
      })
    } else {
      setKatexLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (katexLoaded) {
      setIsMounted(true)
    }
  }, [katexLoaded])


  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'align': [] }],
      ['link', 'image', 'video'],
      ['formula'], // Math equation button
      ['clean']
    ],
    formula: true, // Enable math formula support
  }

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'script',
    'code-block', 'direction',
    'formula' // Include formula in formats
  ]

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-64 border border-gray-300 rounded-lg bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">
            {!katexLoaded ? 'Loading KaTeX and Math Support...' : 'Initializing Editor...'}
          </p>
        </div>
      </div>
    )
  }

  // Dynamically import ReactQuill only after mounting
  const ReactQuill = dynamic(() => import('react-quill'), {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 border border-gray-300 rounded-lg bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading Quill Editor...</p>
        </div>
      </div>
    ),
  })

  return (
    <div className="quill-editor-container">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        style={{ height: '400px' }}
      />
    </div>
  )
}
