# LaTeX Character Cleaning Guide

## Problem: Strange Characters in Database Text

When text is retrieved from the database, it may contain strange characters like:
- `<0x0c>` (form feed character)
- `<0x0a>` (line feed character) 
- `<0x0d>` (carriage return character)
- `<0x09>` (tab character)
- Other control characters (0x00-0x1F)

## Solution: Automatic Character Cleaning

I've implemented a comprehensive character cleaning system that automatically handles these issues:

### 1. **Text Cleaner Utility** (`frontend/src/utils/textCleaner.ts`)

```typescript
import { cleanText, cleanLatex, cleanDisplayText, hasStrangeCharacters } from '@/utils/textCleaner';

// Clean any text content
const cleaned = cleanText(databaseText);

// Clean LaTeX content specifically
const cleanedLatex = cleanLatex(latexContent);

// Check if text has strange characters
const hasStrange = hasStrangeCharacters(text);
```

### 2. **Automatic LaTeX Preprocessing**

The `LatexRichTextEditor` component now automatically:
- Removes control characters
- Fixes `\rac` to `\frac`
- Fixes double backslashes (`\\sin` → `\sin`)
- Fixes integral bounds formatting
- Cleans up spacing issues

### 3. **Correct LaTeX Syntax**

**❌ Incorrect (with strange characters):**
```
$\\int_{0}^{\\pi} \rac{x \\sin x}{1+\\cos ^{2} x} d x$
```

**✅ Correct:**
```
$\int_{0}^{\pi} \frac{x \sin x}{1+\cos^{2} x} dx$
```

## Usage Examples

### In React Components:
```typescript
import { cleanText, cleanLatex } from '@/utils/textCleaner';

// Clean text from database
const cleanQuestionText = cleanText(question.stem);

// Clean LaTeX content
const cleanLatexContent = cleanLatex(question.explanation);
```

### In API Responses:
```typescript
// Clean data before sending to frontend
const cleanedData = {
  ...question,
  stem: cleanText(question.stem),
  explanation: cleanLatex(question.explanation),
  tip_formula: cleanLatex(question.tip_formula)
};
```

## What Gets Cleaned

### Control Characters Removed:
- `\x00-\x08` (null, start of heading, start of text, end of text, end of transmission, enquiry, acknowledge, bell, backspace)
- `\x0B` (vertical tab)
- `\x0C` (form feed)
- `\x0E-\x1F` (shift out, shift in, data link escape, device control 1-4, negative acknowledge, synchronous idle, end of transmission block, cancel, end of medium, substitute, escape, file separator, group separator, record separator, unit separator)
- `\x7F` (delete)

### Specific Character Representations:
- `<0x0c>` → removed
- `<0x0a>` → removed  
- `<0x0d>` → removed
- `<0x09>` → removed

### HTML Entities:
- `&amp;` → removed
- `&lt;` → removed
- `&gt;` → removed
- `&quot;` → removed

### LaTeX Fixes:
- `\rac` → `\frac`
- `\\sin` → `\sin`
- `\\cos` → `\cos`
- `\\tan` → `\tan`
- `\\int_0^\pi` → `\int_{0}^{\pi}`

## Testing

The system includes comprehensive testing to ensure all character cleaning works correctly:

```bash
# Test character cleaning
node test-character-cleaning.js
```

## Benefits

1. **Automatic Cleaning**: No manual intervention needed
2. **Comprehensive Coverage**: Handles all common strange characters
3. **LaTeX Specific**: Fixes common LaTeX syntax issues
4. **Performance**: Efficient regex-based cleaning
5. **Debugging**: Development mode logging for troubleshooting

## Implementation

The character cleaning is now automatically applied in:
- `LatexRichTextEditor` component
- All LaTeX rendering throughout the application
- Database text display
- Form inputs and outputs

This ensures that strange characters from the database are automatically cleaned and LaTeX expressions render correctly.
