
import React, { useEffect, useRef, useState } from 'react'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'
import 'katex/dist/katex.min.css'
import { cn } from '@/lib/utils'

// Import KaTeX and register it with Quill
import katex from 'katex'

interface RichTextEditorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minHeight?: string
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value = '',
  onChange,
  placeholder = 'Enter text...',
  className,
  disabled = false,
  minHeight = '120px'
}) => {
  const quillRef = useRef<ReactQuill>(null)
  const [mounted, setMounted] = useState(false)
  const [quillReady, setQuillReady] = useState(false)

  useEffect(() => {
    // Register KaTeX with window object so Quill can access it
    if (typeof window !== 'undefined') {
      (window as any).katex = katex
    }
    
    setMounted(true)
    
    // Inject styles for Quill editor theming
    const styleId = 'rich-text-editor-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .rich-text-editor .ql-editor {
          min-height: ${minHeight};
          font-size: 14px;
          line-height: 1.5;
        }
        .rich-text-editor .ql-toolbar {
          border-top: 1px solid hsl(var(--border));
          border-left: 1px solid hsl(var(--border));
          border-right: 1px solid hsl(var(--border));
          border-bottom: none;
          background: hsl(var(--background));
        }
        .rich-text-editor .ql-container {
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          color: hsl(var(--foreground));
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: hsl(var(--muted-foreground));
        }
        .katex {
          font-size: 1em;
        }
      `
      document.head.appendChild(style)
    }

    // Set a small delay to ensure everything is loaded
    const timer = setTimeout(() => {
      setQuillReady(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [minHeight])

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['blockquote', 'code-block'],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['link', 'image'],
      ['clean'],
      ['formula']
    ],
    formula: true,
    clipboard: {
      matchVisual: false
    }
  }

  const formats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'color', 'background', 'list', 'bullet', 'blockquote',
    'code-block', 'script', 'indent', 'align', 'link',
    'image', 'formula'
  ]

  const handleChange = (content: string) => {
    if (onChange) {
      onChange(content)
    }
  }

  if (!mounted || !quillReady) {
    return (
      <div 
        className={cn(
          "border border-input rounded-md bg-background",
          className
        )}
        style={{ minHeight }}
      >
        <div className="p-4 text-muted-foreground">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className={cn("rich-text-editor", className)}>
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
        style={{
          minHeight: minHeight
        }}
      />
    </div>
  )
}
