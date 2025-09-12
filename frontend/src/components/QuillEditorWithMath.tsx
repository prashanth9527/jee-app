'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Import Quill CSS
import 'react-quill/dist/quill.snow.css'
// Import KaTeX CSS for math equations
import 'katex/dist/katex.min.css'

interface QuillEditorWithMathProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function QuillEditorWithMath({ value, onChange, placeholder = "Start typing..." }: QuillEditorWithMathProps) {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Load KaTeX before initializing the editor
    const loadMathSupport = async () => {
      try {
        // Load KaTeX first
        const katex = await import('katex')
        // Make KaTeX available globally
        const globalWindow = window as any
        globalWindow.katex = katex.default || katex
        
        setIsReady(true)
      } catch (error) {
        console.warn('Failed to load math support:', error)
        // Still allow editor to load without math support
        setIsReady(true)
      }
    }

    loadMathSupport()
  }, [])

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
      ['clean']
    ],
  }

  const formats = [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike', 'blockquote',
    'list', 'bullet', 'indent',
    'link', 'image', 'video',
    'color', 'background',
    'align', 'script',
    'code-block', 'direction'
  ]

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-64 border border-gray-300 rounded-lg bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading Math Support...</p>
        </div>
      </div>
    )
  }

  // Dynamically import ReactQuill only after math support is ready
  const ReactQuill = dynamic(() => import('react-quill') as any, {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64 border border-gray-300 rounded-lg bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading Quill Editor...</p>
        </div>
      </div>
    ),
  }) as any

  return (
    <div className="quill-editor-container">
      <ReactQuill
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
