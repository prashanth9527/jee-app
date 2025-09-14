# JEE Mathematics Paper Content Seeding Guide

## Overview

This guide provides a comprehensive approach to seeding JEE Mathematics paper content from the PDF `2201-Mathematics Paper+With+Sol. Evening.pdf` into your database with full support for:

- ✅ TinyMCE rich text editor compatibility
- ✅ LaTeX equation rendering (MathJax/KaTeX)
- ✅ Image extraction and optimization from PDFs
- ✅ Structured question organization with topics/subtopics
- ✅ Multiple choice options with detailed explanations
- ✅ Tags for filtering and categorization

## 🗂️ File Structure Created

```
backend/
├── prisma/
│   └── seeds/
│       ├── mathematics-2201-evening-seed.ts      # Basic 5 questions
│       ├── mathematics-2201-enhanced-seed.ts     # Advanced 5 questions  
│       ├── run-mathematics-2201-seed.ts          # Seed runner
│       └── README.md                             # Detailed documentation
├── scripts/
│   └── process-pdf-images.js                    # PDF image extraction
└── public/images/questions/mathematics/2201-evening/
    ├── pages/          # Original high-res images
    ├── optimized/      # Web-optimized WebP images
    ├── thumbnails/     # Preview thumbnails
    ├── image-mapping.json    # Image metadata
    └── image-mapping.ts      # TypeScript interfaces
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install sharp fs-extra pdf2pic @types/fs-extra @types/sharp
```

### 2. Process PDF Images (Optional)
```bash
npm run process:pdf-images
```

### 3. Run Mathematics Seed
```bash
# Make sure main seed is run first
npm run db:seed

# Then run mathematics paper seed
npm run db:seed:math
```

## 📋 What Gets Created

### Database Entities

#### ✅ Topics
- Algebra
- Calculus  
- Coordinate Geometry
- Trigonometry
- Vectors
- 3D Geometry
- Probability
- Sequences and Series

#### ✅ Subtopics
- Complex Numbers
- Quadratic Equations
- Differentiation
- Integration
- Conic Sections
- Lines and Planes
- Binomial Theorem

#### ✅ Questions (10 Total)
**Basic Seed (5 questions):**
1. Complex Numbers - |z² - 1| calculation
2. Quadratic Equations - Real solutions with |x|
3. Differentiation - Critical points
4. Integration - Definite integral with trigonometry
5. Conic Sections - Circle equation through points

**Enhanced Seed (5 questions):**
6. 3D Geometry - Vector position problems
7. Binomial Theorem - Coefficient equality
8. Matrix Algebra - Rank calculation
9. Integration - Advanced substitution techniques
10. Probability - Conditional probability

#### ✅ Tags
- `JEE Mains` / `JEE Advanced`
- `Previous Year`
- `Evening Session`
- `2025`
- `Session 1`
- `Multiple Choice` / `Numerical Value`
- `Formula Heavy`
- `With Diagram`

## 🧮 Sample Question Structure

### Rich Text with LaTeX
```typescript
{
  stem: `<p>If <strong>z</strong> is a complex number such that |z| = 1 and arg(z) = π/3, then the value of |z² - 1| is:</p>`,
  
  explanation: `<p>Given: |z| = 1 and arg(z) = π/3</p>
               <p>We can write z = cos(π/3) + i sin(π/3) = 1/2 + i√3/2</p>
               <p>Now, z² = (1/2 + i√3/2)² = 1/4 + i√3/2 - 3/4 = -1/2 + i√3/2</p>
               <p>Therefore, z² - 1 = -3/2 + i√3/2</p>
               <p>|z² - 1| = √((-3/2)² + (√3/2)²) = √3</p>`,
  
  tip_formula: `<p><strong>Key Formula:</strong> For a complex number z = r(cos θ + i sin θ):</p>
               <ul>
                 <li>|z| = r</li>
                 <li>arg(z) = θ</li>
                 <li>z<sup>n</sup> = r<sup>n</sup>(cos(nθ) + i sin(nθ))</li>
               </ul>`,
  
  difficulty: 'MEDIUM',
  yearAppeared: 2025,
  isPreviousYear: true,
  
  options: [
    { text: '1', isCorrect: false, order: 1 },
    { text: '√2', isCorrect: false, order: 2 },
    { text: '√3', isCorrect: true, order: 3 },
    { text: '2', isCorrect: false, order: 4 }
  ]
}
```

### Advanced LaTeX Equations
```html
<!-- Inline math -->
<p>The derivative of $x^2$ is $2x$.</p>

<!-- Display math -->
<p>$$f(x) = \int_0^x t^2 dt = \frac{x^3}{3}$$</p>

<!-- Complex expressions -->
<p>$$\lim_{x \to 0} \frac{\sin x}{x} = 1$$</p>

<!-- Vectors and matrices -->
<p>$\vec{g} = \frac{\vec{a} + \vec{b} + \vec{c}}{3}$</p>

<p>$A = \begin{pmatrix} 1 & 2 & 3 \\ 4 & 5 & 6 \\ 7 & 8 & 9 \end{pmatrix}$</p>
```

### With Images
```html
<p>Consider the triangle ABC as shown in the figure:</p>
<img src="/images/questions/mathematics/2201-evening/optimized/page-1.webp" 
     alt="Triangle ABC with sides a, b, c" 
     style="max-width: 400px; height: auto;" />
<p>Find the area of triangle ABC.</p>
```

## 🎯 TinyMCE Integration

### Frontend Usage
The questions are designed to work seamlessly with your TinyMCE setup:

```typescript
// In your React component
import RichTextEditor from '@/components/RichTextEditor';

<RichTextEditor
  value={question.stem}
  onChange={handleChange}
  placeholder="Question content with math support..."
  height={400}
/>
```

### Math Rendering
Equations are automatically rendered using KaTeX/MathJax:

```typescript
// Display question content
<div 
  dangerouslySetInnerHTML={{ __html: question.stem }}
  className="math-content"
/>
```

## 📊 Database Verification

### Check Created Data
```sql
-- Verify questions were created
SELECT COUNT(*) FROM "Question" WHERE "yearAppeared" = 2025;

-- Check questions by topic
SELECT 
  t.name as topic,
  COUNT(q.id) as question_count
FROM "Question" q
JOIN "Topic" t ON q."topicId" = t.id
WHERE q."yearAppeared" = 2025
GROUP BY t.name;

-- Verify LaTeX content
SELECT 
  LEFT(stem, 100) as question_preview,
  difficulty,
  "isPreviousYear"
FROM "Question" 
WHERE stem LIKE '%$%'  -- Contains LaTeX
LIMIT 5;
```

### Question Analytics
```typescript
// Get questions by difficulty
const questionsByDifficulty = await prisma.question.groupBy({
  by: ['difficulty'],
  where: { yearAppeared: 2025 },
  _count: { id: true }
});

// Get questions with explanations
const questionsWithExplanations = await prisma.question.count({
  where: { 
    yearAppeared: 2025,
    explanation: { not: null }
  }
});
```

## 🔧 Customization

### Adding More Questions
To add more questions from the PDF:

1. **Extract content manually** or use OCR tools
2. **Follow the established pattern** in the seed files
3. **Use proper LaTeX formatting** for equations
4. **Include detailed explanations** with step-by-step solutions
5. **Add appropriate tags** for filtering

### Question Template
```typescript
{
  stem: `<p>Your question text with $LaTeX$ equations</p>`,
  explanation: `<p>Step-by-step solution...</p>`,
  tip_formula: `<p><strong>Key formulas:</strong> ...</p>`,
  difficulty: 'EASY' | 'MEDIUM' | 'HARD',
  yearAppeared: 2025,
  isPreviousYear: true,
  subtopicId: 'appropriate-subtopic-id',
  subjectId: mathematics.id,
  options: [
    { text: 'Option A', isCorrect: false, order: 1 },
    { text: 'Option B', isCorrect: true, order: 2 },
    { text: 'Option C', isCorrect: false, order: 3 },
    { text: 'Option D', isCorrect: false, order: 4 }
  ],
  tags: [tag1.id, tag2.id, ...]
}
```

### Image Processing
If you have questions with diagrams:

1. **Run the image processing script**:
   ```bash
   npm run process:pdf-images
   ```

2. **Use the generated image mapping**:
   ```typescript
   import { getPageImage } from './path/to/image-mapping';
   
   const imageSrc = getPageImage(1, 'optimized');
   ```

## 🎮 Testing

### Frontend Testing
1. **Test math rendering** in TinyMCE
2. **Verify image loading** 
3. **Check responsive design** for mobile
4. **Test equation editing** functionality

### Backend Testing
```bash
# Test the seed
npm run db:seed:math

# Reset and test again
npm run db:reset
```

## 📈 Performance Tips

### Database Optimization
- **Use transactions** for bulk inserts
- **Index frequently queried fields** (yearAppeared, difficulty, isPreviousYear)
- **Optimize image sizes** using the provided processing script

### Frontend Optimization
- **Lazy load images** for questions with diagrams
- **Cache math rendering** results
- **Use optimized WebP images** from the processing script

## 🆘 Troubleshooting

### Common Issues

#### Math Not Rendering
```typescript
// Ensure MathJax is re-rendered after content update
useEffect(() => {
  if (window.MathJax) {
    window.MathJax.typesetPromise();
  }
}, [questionContent]);
```

#### Images Not Loading
- Check file paths in `/public/images/`
- Verify image optimization completed
- Check browser console for 404 errors

#### Seed Failures
- Ensure main seed ran first
- Check database constraints
- Verify all required topics/subtopics exist

## 📚 Next Steps

### Expand to Other Papers
1. **Copy and modify** the seed structure for other papers
2. **Update file paths** and paper information
3. **Add new topics/subtopics** as needed
4. **Maintain consistent LaTeX formatting**

### Advanced Features
- **Auto-detect question types** from PDF content
- **OCR integration** for automatic text extraction
- **Duplicate question detection**
- **Difficulty assessment** based on student performance

## 🎯 Summary

You now have a complete system for seeding JEE Mathematics papers with:

- ✅ **10 sample questions** from 2201 Evening Paper
- ✅ **Rich text support** with HTML and LaTeX
- ✅ **Image processing** capabilities
- ✅ **Proper database structure** with topics/subtopics
- ✅ **TinyMCE compatibility** for editing
- ✅ **Comprehensive documentation**

The seed files provide a solid foundation that can be extended for other papers and subjects while maintaining consistency with your rich text editor and equation rendering system.

---

**Total Database Impact:**
- 📊 **8 Topics** (Algebra, Calculus, etc.)
- 📋 **7 Subtopics** (Complex Numbers, Integration, etc.)  
- ❓ **10 Questions** with full rich text and LaTeX
- 🏷️ **7 Tags** for organization
- 🖼️ **Image processing** setup for future use
