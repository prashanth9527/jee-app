# Rich Text Editor Integration

This document describes the rich text editor integrations with math equation support for the JEE Practice Platform. We support both TinyMCE and Summernote editors.

## Overview

The integration provides powerful rich text editors with built-in math equation support, perfect for creating JEE questions with complex mathematical expressions. We offer two editor options:

- **TinyMCE**: Feature-rich editor with extensive plugin system
- **Summernote**: Lightweight editor with Bootstrap integration

## Features

### ✅ Implemented Features

- **Rich Text Editing**: Full WYSIWYG editor with formatting options
- **Math Equation Support**: LaTeX, MathJax, and KaTeX integration
- **JEE-Specific Examples**: Pre-built math examples for Calculus, Algebra, Physics, and Chemistry
- **Responsive Design**: Works on desktop and mobile devices
- **Live Preview**: Real-time preview of formatted content
- **Quick Math Insert**: One-click insertion of common JEE equations

### 🔧 Technical Features

- **Multiple Math Formats**: LaTeX, TeX, AsciiMath, MathML
- **Math Rendering**: KaTeX, MathJax support
- **Custom Toolbar**: Math-specific buttons and tools
- **Image Upload**: Built-in image handling
- **Table Support**: Advanced table editing
- **Code Syntax Highlighting**: Support for multiple programming languages
- **Accessibility**: Screen reader support and keyboard navigation

## Components

### 1. RichTextEditor Component (TinyMCE)
**Location**: `src/components/RichTextEditor.tsx`

A reusable React component that wraps TinyMCE with math equation support.

```typescript
interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  className?: string;
}
```

### 2. SummernoteEditor Component
**Location**: `src/components/SummernoteEditor.tsx`

A reusable React component that wraps Summernote with math equation support.

```typescript
interface SummernoteEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  className?: string;
}
```

### 3. Demo Pages
**TinyMCE Demo**: `src/app/admin/rich-text-demo/page.tsx`
**Summernote Demo**: `src/app/admin/summernote-demo/page.tsx`

Comprehensive demos showcasing all features with JEE-specific examples for both editors.

### 4. Integration Example
**Location**: `src/app/admin/questions/add-with-rich-text/page.tsx`

Real-world example of integrating the rich text editor into question creation forms.

## Usage Examples

### Basic Usage

#### TinyMCE Editor
```typescript
import RichTextEditor from '@/components/RichTextEditor';

function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <RichTextEditor
      value={content}
      onChange={setContent}
      placeholder="Enter your content here..."
      height={400}
    />
  );
}
```

#### Summernote Editor
```typescript
import SummernoteEditor from '@/components/SummernoteEditor';

function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <SummernoteEditor
      value={content}
      onChange={setContent}
      placeholder="Enter your content here..."
      height={400}
    />
  );
}
```

### Math Equation Examples

#### Inline Math
```latex
The derivative of $x^2$ is $2x$.
```

#### Display Math
```latex
$$f(x) = \int_0^x t^2 dt = \frac{x^3}{3}$$
```

#### Complex Equations
```latex
$$\lim_{x \to 0} \frac{\sin x}{x} = 1$$
```

## Math Syntax Reference

### Common Symbols
- `\alpha` → α
- `\beta` → β
- `\gamma` → γ
- `\delta` → δ
- `\pi` → π
- `\sigma` → σ
- `\infty` → ∞
- `\sum` → ∑
- `\int` → ∫
- `\sqrt` → √

### Fractions
```latex
\frac{numerator}{denominator}
```

### Superscripts and Subscripts
```latex
x^2, x_1, x^{n+1}, x_{i+1}
```

### Integrals
```latex
\int_0^1 x^2 dx
```

### Limits
```latex
\lim_{x \to \infty} f(x)
```

### Summations
```latex
\sum_{i=1}^n x_i
```

## Integration Guide

### 1. Replace Existing Textareas

Replace basic textarea elements with either RichTextEditor or SummernoteEditor:

```typescript
// Before
<textarea 
  value={content}
  onChange={(e) => setContent(e.target.value)}
  rows={6}
/>

// After - TinyMCE
<RichTextEditor
  value={content}
  onChange={setContent}
  height={300}
/>

// After - Summernote
<SummernoteEditor
  value={content}
  onChange={setContent}
  height={300}
/>
```

### 2. Handle HTML Content

The editor outputs HTML content. When displaying, use `dangerouslySetInnerHTML`:

```typescript
<div dangerouslySetInnerHTML={{ __html: content }} />
```

### 3. Math Rendering

Math equations are rendered using KaTeX/MathJax. Ensure these libraries are loaded:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
```

## Configuration

### TinyMCE Configuration

The TinyMCE editor is configured with the following key settings:

```typescript
{
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
    'math', 'katex', 'asciimath', 'tex', 'latex'
  ],
  toolbar: 'undo redo | blocks | ' +
    'bold italic underline strikethrough | alignleft aligncenter ' +
    'alignright alignjustify | bullist numlist outdent indent | ' +
    'removeformat | math | katex | asciimath | tex | latex | ' +
    'link image media table | code fullscreen preview | help',
  math_type_latex: true,
  math_type_tex: true,
  math_type_asciimath: true,
  math_type_mathml: true,
  math_type_katex: true,
  math_type_mathjax: true,
}
```

### Summernote Configuration

The Summernote editor is configured with the following key settings:

```typescript
{
  height: 400,
  placeholder: "Enter your content here...",
  toolbar: [
    ['style', ['style']],
    ['font', ['bold', 'underline', 'clear']],
    ['fontname', ['fontname']],
    ['color', ['color']],
    ['para', ['ul', 'ol', 'paragraph']],
    ['table', ['table']],
    ['insert', ['link', 'picture', 'video']],
    ['view', ['fullscreen', 'codeview', 'help']],
    ['math', ['math']]
  ],
  callbacks: {
    onChange: (contents: string) => {
      onChange(contents);
    },
    onInit: () => {
      addMathButton();
    }
  }
}
```

## Demo Pages

### 1. TinyMCE Rich Text Demo
**URL**: `/admin/rich-text-demo`

Features:
- Interactive TinyMCE editor with all features
- JEE-specific math examples
- Live preview
- Syntax help
- Integration examples

### 2. Summernote Rich Text Demo
**URL**: `/admin/summernote-demo`

Features:
- Interactive Summernote editor with math support
- JEE-specific math examples
- Custom math dialog
- Live preview
- Editor comparison
- Integration examples

### 3. Question Creation with Rich Text
**URL**: `/admin/questions/add-with-rich-text`

Features:
- Complete question creation form
- Rich text editor for all text fields
- Quick math insertion
- Form validation
- Preview functionality

## Choosing Between Editors

### When to Use TinyMCE
- **Feature-rich applications**: Need advanced table editing, code syntax highlighting, or extensive plugin support
- **Professional content creation**: Complex documents with multiple formatting options
- **Desktop-focused**: Primary usage on desktop devices
- **Advanced users**: Users comfortable with complex interfaces

### When to Use Summernote
- **Lightweight applications**: Need a simple, fast editor without bloat
- **Mobile-friendly**: Primary usage on mobile devices or responsive design
- **Bootstrap integration**: Already using Bootstrap framework
- **Simple content creation**: Basic rich text editing with math support
- **Beginner-friendly**: Users prefer simpler interfaces

## Best Practices

### 1. Content Structure
- Use headings (H1, H2, H3) for content hierarchy
- Use lists for step-by-step solutions
- Use tables for data presentation
- Use code blocks for formulas

### 2. Math Equations
- Use inline math for simple expressions: `$x^2$`
- Use display math for complex equations: `$$\int_0^1 x^2 dx$$`
- Test equations in preview before saving
- Use consistent notation across questions

### 3. Performance
- Limit editor height for better performance
- Use preview mode for long content
- Optimize images before upload
- Consider content length limits

## Troubleshooting

### Common Issues

1. **Math not rendering**: Ensure KaTeX/MathJax libraries are loaded
2. **Editor not loading**: Check TinyMCE CDN availability
3. **Content not saving**: Verify onChange handler is properly connected
4. **Mobile issues**: Test responsive behavior on different devices

### Debug Mode

Enable debug mode by adding to TinyMCE config:

```typescript
{
  debug: true,
  logLevel: 'debug'
}
```

## Future Enhancements

### Planned Features
- [ ] Custom math equation templates
- [ ] Equation numbering
- [ ] Collaborative editing
- [ ] Version history
- [ ] Export to PDF with math
- [ ] Mobile-optimized math input
- [ ] Voice-to-math conversion
- [ ] Handwriting recognition

### Integration Opportunities
- [ ] AI-powered equation suggestions
- [ ] Automatic difficulty assessment
- [ ] Content analytics
- [ ] Accessibility improvements
- [ ] Multi-language support

## Support

For issues or questions:
1. Check the demo pages for examples
2. Review the TinyMCE documentation
3. Test with the provided examples
4. Check browser console for errors

## Dependencies

### TinyMCE
- `@tinymce/tinymce-react`: ^6.3.0
- `katex`: ^0.16.22
- `mathjax`: ^4.0.0

### Summernote
- `summernote`: ^0.8.20
- `katex`: ^0.16.22
- `mathjax`: ^4.0.0

### Common
- `react`: ^18.2.0
- `next`: ^14.0.0

## License

This integration follows the same license as the main project.
