# Mathematics Paper Seeding Documentation

This directory contains specialized seed files for seeding JEE Mathematics papers into the database with full TinyMCE rich text editor and LaTeX equation support.

## Files Overview

### 1. `mathematics-2201-evening-seed.ts`
Basic seed file containing 5 representative questions from the JEE Mathematics Paper 2201 Evening Session (2025).

**Features:**
- HTML formatted content for TinyMCE compatibility
- LaTeX equations using proper mathematical notation
- Multiple choice questions with detailed explanations
- Proper categorization by topics and subtopics
- Tags for filtering and organization

### 2. `mathematics-2201-enhanced-seed.ts`
Enhanced version with more complex questions and advanced mathematical content.

**Features:**
- Advanced LaTeX formatting with complex equations
- 3D geometry problems with vector notation
- Matrix operations and determinants
- Integration techniques and probability
- Detailed step-by-step solutions

### 3. `run-mathematics-2201-seed.ts`
Main runner script to execute the mathematics paper seeds.

## Usage Instructions

### Prerequisites
1. Ensure the main database seed has been run first:
   ```bash
   npm run db:seed
   ```

2. Make sure you have the required dependencies:
   ```bash
   npm install
   ```

### Running the Seeds

#### Option 1: Basic Mathematics Seed
```bash
cd backend
npx tsx prisma/seeds/run-mathematics-2201-seed.ts
```

#### Option 2: Run Enhanced Version
```bash
cd backend
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import seedMathematics2201Enhanced from './prisma/seeds/mathematics-2201-enhanced-seed';

const prisma = new PrismaClient();

async function main() {
  await seedMathematics2201Enhanced();
  await prisma.\$disconnect();
}

main().catch(console.error);
"
```

#### Option 3: Add to Main Seed File
You can also integrate these seeds into your main `seed.ts` file:

```typescript
// Add to backend/prisma/seed.ts
import seedMathematics2201Evening from './seeds/mathematics-2201-evening-seed';
import seedMathematics2201Enhanced from './seeds/mathematics-2201-enhanced-seed';

// In your main() function:
await seedMathematics2201Evening();
await seedMathematics2201Enhanced();
```

## Question Structure

### Database Schema
Each question follows this structure:
```typescript
{
  id: string;
  stem: string;           // HTML content with LaTeX equations
  explanation: string;    // Detailed solution with steps
  tip_formula: string;    // Key formulas and tips
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  yearAppeared: number;   // 2025
  isPreviousYear: boolean; // true
  subjectId: string;      // Mathematics subject
  topicId?: string;       // Optional topic
  subtopicId?: string;    // Optional subtopic
  options: QuestionOption[]; // Multiple choice options
  tags: Tag[];            // Filtering tags
}
```

### LaTeX Equation Formatting

#### Inline Equations
```html
<p>The derivative of $x^2$ is $2x$.</p>
```

#### Display Equations
```html
<p>$$f(x) = \int_0^x t^2 dt = \frac{x^3}{3}$$</p>
```

#### Complex Mathematical Expressions
```html
<p>$$\lim_{x \to 0} \frac{\sin x}{x} = 1$$</p>
```

### Rich Text Features

#### Mathematical Symbols
- Greek letters: `$\alpha$`, `$\beta$`, `$\gamma$`
- Operators: `$\sum$`, `$\int$`, `$\lim$`
- Special symbols: `$\infty$`, `$\pi$`, `$\sqrt{}$`

#### Formatting Options
- **Bold text**: `<strong>Important concept</strong>`
- *Italic text*: `<em>Variable names</em>`
- Lists: `<ul><li>Point 1</li></ul>`
- Code blocks: `<code>formula</code>`

## Image Handling

For questions with diagrams or graphs:

### 1. Image Storage Structure
```
backend/public/images/questions/
├── mathematics/
│   ├── 2201-evening/
│   │   ├── question-1-diagram.png
│   │   ├── question-5-graph.png
│   │   └── solution-3-steps.png
│   └── geometry/
│       ├── triangle-abc.png
│       └── circle-properties.png
```

### 2. Image References in Content
```html
<p>Consider the triangle ABC as shown in the figure:</p>
<img src="/images/questions/mathematics/2201-evening/question-1-diagram.png" 
     alt="Triangle ABC with sides a, b, c" 
     style="max-width: 400px; height: auto;" />
<p>Find the area of triangle ABC.</p>
```

### 3. Image Processing Script
Create a script to process PDF images and save them in the correct format:

```bash
# Extract images from PDF
pdf2image convert "2201-Mathematics Paper+With+Sol. Evening.pdf" --output-dir ./images/
```

## Topics and Subtopics Coverage

### Algebra
- Complex Numbers
- Quadratic Equations
- Sequences and Series
- Binomial Theorem
- Matrices and Determinants

### Calculus
- Limits and Continuity
- Differentiation
- Integration
- Differential Equations

### Coordinate Geometry
- Straight Lines
- Circles
- Conic Sections
- 3D Geometry

### Trigonometry
- Trigonometric Functions
- Inverse Trigonometric Functions
- Trigonometric Equations

### Probability and Statistics
- Basic Probability
- Conditional Probability
- Distributions

## Tags System

### Question Type Tags
- `JEE Mains` - For JEE Main level questions
- `JEE Advanced` - For JEE Advanced level questions
- `Multiple Choice` - Standard MCQ format
- `Numerical Value` - Numerical answer type
- `Matrix Match` - Matrix matching questions

### Content Tags
- `Previous Year` - Past paper questions
- `Evening Session` - Specific session identifier
- `With Diagram` - Questions containing images
- `Formula Heavy` - Requires memorization of formulas
- `Conceptual` - Concept-based questions

### Difficulty Tags
- `Easy` - Basic level
- `Medium` - Intermediate level
- `Hard` - Advanced level

## Validation and Testing

### 1. Data Integrity Check
```typescript
// Verify all questions have required fields
const questions = await prisma.question.findMany({
  where: { yearAppeared: 2025 },
  include: { options: true, tags: true }
});

questions.forEach(q => {
  console.assert(q.options.length === 4, 'Each question should have 4 options');
  console.assert(q.options.filter(o => o.isCorrect).length === 1, 'Exactly one correct option');
});
```

### 2. LaTeX Rendering Test
Test LaTeX equations in the frontend:
```typescript
// In your React component
import { useEffect } from 'react';

useEffect(() => {
  // Re-render math equations after content load
  if (window.MathJax) {
    window.MathJax.typesetPromise();
  }
}, [content]);
```

## Troubleshooting

### Common Issues

#### 1. LaTeX Not Rendering
- Ensure MathJax/KaTeX is loaded in your HTML head
- Check for syntax errors in LaTeX code
- Verify proper escaping in database strings

#### 2. Images Not Loading
- Check file paths are correct
- Ensure images are in the public directory
- Verify image file extensions and formats

#### 3. Seed Fails to Run
- Ensure main seed has been run first
- Check database connection
- Verify all required topics/subjects exist

#### 4. Database Constraints
- Foreign key constraints may fail if related entities don't exist
- Run seeds in correct order: Stream → Subject → Topic → Subtopic → Question

### Debug Mode
Enable detailed logging:
```typescript
// Add to seed file
console.log('Creating question:', questionData.stem.substring(0, 50));
console.log('Associated tags:', questionTags);
console.log('Options:', options.map(o => ({ text: o.text, correct: o.isCorrect })));
```

## Performance Considerations

### 1. Batch Operations
Use transactions for large datasets:
```typescript
await prisma.$transaction(async (tx) => {
  for (const questionData of questions) {
    const question = await tx.question.create({ data: questionData });
    // Create related entities...
  }
});
```

### 2. Memory Management
For large question sets, process in chunks:
```typescript
const chunkSize = 50;
for (let i = 0; i < questions.length; i += chunkSize) {
  const chunk = questions.slice(i, i + chunkSize);
  await processQuestionChunk(chunk);
}
```

## Future Enhancements

### 1. Automated PDF Processing
- OCR for text extraction
- Automatic image detection and extraction
- LaTeX conversion from PDF mathematical content

### 2. Question Analytics
- Track question difficulty based on student performance
- Automatic tagging based on content analysis
- Duplicate question detection

### 3. Multi-language Support
- Hindi translations
- Regional language options
- Unicode support for mathematical symbols

## Contributing

When adding new questions:
1. Follow the established schema structure
2. Use proper LaTeX formatting
3. Include detailed explanations
4. Add appropriate tags
5. Test LaTeX rendering in frontend
6. Verify image paths are correct

## Support

For issues or questions:
1. Check this documentation first
2. Verify database schema compatibility
3. Test with a small subset of questions
4. Check TinyMCE configuration for math support
