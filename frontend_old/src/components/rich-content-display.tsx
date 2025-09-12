
import React, { useEffect } from 'react'
import parse from 'html-react-parser'
import { cn } from '@/lib/utils'

interface RichContentDisplayProps {
  content: string
  className?: string
}

export const RichContentDisplay: React.FC<RichContentDisplayProps> = ({
  content,
  className
}) => {
  const sanitizeContent = (html: string) => {
    // Basic HTML sanitization - in production, use a proper sanitizer
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  }

  useEffect(() => {
    // Inject global styles for rich content
    const styleId = 'rich-content-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        .rich-content .katex {
          font-size: 1em;
        }
        .rich-content .katex-display {
          margin: 0.5em 0;
        }
        .rich-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
        }
        .rich-content .ql-formula {
          display: inline-block;
          margin: 0 2px;
        }
      `
      document.head.appendChild(style)
    }
  }, [])

  if (!content || content.trim() === '') {
    return null
  }

  return (
    <div 
      className={cn(
        "rich-content prose prose-sm max-w-none",
        "prose-headings:text-foreground prose-p:text-foreground",
        "prose-strong:text-foreground prose-em:text-foreground",
        "prose-code:text-foreground prose-code:bg-muted",
        "prose-blockquote:text-muted-foreground prose-blockquote:border-border",
        "prose-ul:text-foreground prose-ol:text-foreground",
        "prose-li:text-foreground",
        className
      )}
    >
      {parse(sanitizeContent(content))}
    </div>
  )
}
