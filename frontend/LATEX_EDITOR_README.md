# LaTeX Rich Text Editor

A custom-built rich text editor specifically designed for JEE content creation with native LaTeX support and immediate preview capabilities.

## Features

### ✅ Core Features
- **Native LaTeX Support**: Direct LaTeX input without external plugins
- **Immediate Preview**: Real-time rendering of LaTeX expressions using KaTeX
- **Dual Mode**: Switch between edit mode and preview mode
- **Rich Toolbar**: Quick access to common math symbols and LaTeX templates
- **JEE Optimized**: Pre-built templates for Calculus, Algebra, Physics, and Chemistry

### 🔧 Technical Features
- **KaTeX Integration**: Fast, server-side LaTeX rendering
- **No External Dependencies**: Self-contained solution
- **Responsive Design**: Works on desktop and mobile devices
- **TypeScript Support**: Full type safety and IntelliSense
- **Customizable**: Easy to extend with new LaTeX templates

## Components

### 1. LatexRichTextEditor Component
**Location**: `src/components/LatexRichTextEditor.tsx`

A reusable React component that provides LaTeX-enabled rich text editing.

```typescript
interface LatexRichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  height?: number;
  disabled?: boolean;
  className?: string;
}
```

### 2. Demo Page
**Location**: `src/app/admin/latex-editor-demo/page.tsx`

A comprehensive demo page showcasing all editor features with JEE-specific examples.

### 3. Test Component
**Location**: `src/components/LatexTestComponent.tsx`

A simple test component for verifying LaTeX rendering functionality.

## Usage

### Basic Usage

```tsx
import LatexRichTextEditor from '@/components/LatexRichTextEditor';

function MyComponent() {
  const [content, setContent] = useState('');

  return (
    <LatexRichTextEditor
      value={content}
      onChange={setContent}
      placeholder="Enter your content here..."
      height={400}
    />
  );
}
```

### LaTeX Syntax

#### Inline Math
Use single dollar signs for inline math expressions:
```latex
$x^2 + y^2 = r^2$
```

#### Display Math
Use double dollar signs for display math expressions:
```latex
$$\int_0^\infty e^{-x} dx = 1$$
```

### Common LaTeX Commands

| Command | Result | Description |
|---------|--------|-------------|
| `\frac{a}{b}` | $\frac{a}{b}$ | Fraction |
| `\sqrt{x}` | $\sqrt{x}$ | Square root |
| `x^{n}` | $x^{n}$ | Superscript |
| `x_{n}` | $x_{n}$ | Subscript |
| `\sum_{i=1}^{n}` | $\sum_{i=1}^{n}$ | Summation |
| `\int_{a}^{b}` | $\int_{a}^{b}$ | Integral |
| `\lim_{x \to a}` | $\lim_{x \to a}$ | Limit |
| `\alpha, \beta, \gamma` | $\alpha, \beta, \gamma$ | Greek letters |

## Toolbar Features

### Text Formatting
- **Bold**: `**text**`
- **Italic**: `*text*`
- **Underline**: `<u>text</u>`
- **Code**: `` `code` ``

### Math Symbols
- Fraction: `\frac{numerator}{denominator}`
- Square Root: `\sqrt{expression}`
- Power: `x^{power}`
- Integral: `\int_{a}^{b} f(x) dx`
- Summation: `\sum_{i=1}^{n} x_i`
- Limit: `\lim_{x \to \infty} f(x)`

### Greek Letters
Quick access to common Greek letters: α, β, γ, δ, π, σ, ∞

## JEE-Specific Templates

### Calculus
- Derivative: `\frac{d}{dx}(x^n) = nx^{n-1}`
- Integration: `\int x^n dx = \frac{x^{n+1}}{n+1} + C`
- Limit: `\lim_{x \to 0} \frac{\sin x}{x} = 1`
- Chain Rule: `\frac{d}{dx}[f(g(x))] = f'(g(x)) \cdot g'(x)`

### Algebra
- Quadratic Formula: `x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}`
- Binomial Theorem: `(a + b)^n = \sum_{k=0}^{n} \binom{n}{k} a^{n-k} b^k`
- Arithmetic Progression: `S_n = \frac{n}{2}[2a + (n-1)d]`

### Physics
- Kinematic Equation: `v = u + at`
- Newton's Second Law: `F = ma`
- Work-Energy Theorem: `W = \Delta KE = \frac{1}{2}mv^2 - \frac{1}{2}mu^2`

### Chemistry
- Ideal Gas Law: `PV = nRT`
- Nernst Equation: `E = E^0 - \frac{RT}{nF} \ln Q`
- pH Calculation: `pH = -\log[H^+]`

## Integration Guide

### 1. Replace Existing Textareas

Replace basic textarea elements with LatexRichTextEditor:

```tsx
// Before
<textarea 
  value={content}
  onChange={(e) => setContent(e.target.value)}
  rows={6}
/>

// After
<LatexRichTextEditor
  value={content}
  onChange={setContent}
  height={300}
/>
```

### 2. Handle Content Display

The editor outputs markdown-like content with LaTeX expressions. When displaying:

```tsx
<div dangerouslySetInnerHTML={{ 
  __html: renderLatexContent(content) 
}} />
```

### 3. Question Module Integration

For JEE question creation:

```tsx
<LatexRichTextEditor
  value={question.stem}
  onChange={(content) => setQuestion({...question, stem: content})}
  placeholder="Enter the question stem with LaTeX math expressions..."
  height={200}
/>
```

## Styling

The editor includes comprehensive CSS styles for proper LaTeX rendering:

- Inline math expressions are styled with appropriate spacing
- Display math expressions are centered with background highlighting
- KaTeX rendering is optimized for readability
- Prose styles ensure proper typography

## Performance Considerations

- LaTeX parsing is optimized for real-time editing
- KaTeX rendering is fast and server-side compatible
- No external CDN dependencies required
- Minimal bundle size impact

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Dependencies

- `katex`: LaTeX rendering engine
- `lucide-react`: Icon library
- `react`: React framework

## Future Enhancements

- [ ] Equation numbering
- [ ] Math equation validation
- [ ] Export to PDF with LaTeX
- [ ] Collaborative editing support
- [ ] Mobile-optimized toolbar
- [ ] Custom LaTeX template builder
- [ ] Math equation search and replace
- [ ] Integration with question bank

## Troubleshooting

### Common Issues

1. **LaTeX not rendering**: Ensure KaTeX is properly imported
2. **Preview not updating**: Check if the content state is properly managed
3. **Toolbar not responsive**: Verify CSS classes are applied correctly

### Debug Mode

Enable debug logging by adding to the component:

```tsx
<LatexRichTextEditor
  value={content}
  onChange={setContent}
  debug={true} // Add this prop for debugging
/>
```

## Contributing

When adding new features:

1. Maintain TypeScript type safety
2. Add comprehensive tests
3. Update documentation
4. Ensure mobile compatibility
5. Follow existing code style

## License

This component is part of the JEE Practice Platform and follows the same licensing terms.



