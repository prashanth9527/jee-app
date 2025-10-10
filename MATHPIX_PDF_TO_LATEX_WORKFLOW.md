# Mathpix PDF to LaTeX Conversion System - Complete Documentation

## Overview
Your JEE application has a comprehensive PDF to LaTeX conversion system using **Mathpix API**. This system converts PDF files containing mathematical content into LaTeX format, which is then processed by AI (OpenAI/DeepSeek) to extract questions.

---

## Architecture

### **Workflow Flow**
```
PDF File → Mathpix API → LaTeX/ZIP → Local Storage → AWS S3 → AI Processing → JSON Questions → Database
```

### **Key Components**

1. **Backend Services**
   - `mathpix.service.ts` - Core Mathpix integration
   - `pdf-processor.service.ts` - PDF processing orchestration
   - `pdf-processor-cache.service.ts` - Cache management
   - `pdf-processor.controller.ts` - API endpoints

2. **Frontend Pages**
   - `pdf-processor/page.tsx` - Main PDF processing interface
   - `pdf-processor-cache/page.tsx` - Cache management interface

3. **Storage Locations**
   - Local: `content/pdf/`, `content/latex/`, `content/zip/`, `content/images/`
   - AWS S3: Mirrors local structure
   - Database: PostgreSQL with Prisma ORM

---

## Mathpix API Integration

### **Configuration (Environment Variables)**
```env
MATHPIX_APP_ID="your-mathpix-app-id"
MATHPIX_APP_KEY="your-mathpix-app-key"
MATHPIX_IGNORE_BACKGROUND="true"  # Default background processing setting
```

### **API Endpoints Used**
1. **Upload PDF**: `POST https://api.mathpix.com/v3/pdf`
2. **Check Status**: `GET https://api.mathpix.com/v3/pdf/{pdf_id}`
3. **Get LaTeX**: `GET https://api.mathpix.com/v3/pdf/{pdf_id}.tex`

### **Processing Options**
- `skip_recrop`: When set to `true`, ignores page backgrounds and focuses on text content
- This helps Mathpix extract cleaner LaTeX by avoiding decorative elements

---

## Complete Workflow

### **Step 1: PDF Upload to Mathpix**
```typescript
// File: mathpix.service.ts - uploadPDF()
- Reads PDF file from local storage
- Creates FormData with PDF buffer
- Adds skip_recrop option if background processing is enabled
- Uploads to Mathpix API
- Returns pdf_id for tracking
```

**Key Code:**
```typescript
private async uploadPDF(pdfPath: string, options?: { skipRecrop?: boolean }) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const form = new FormData();
  form.append('file', pdfBuffer, { filename: path.basename(pdfPath) });
  
  if (options?.skipRecrop) {
    form.append('skip_recrop', 'true');
  }
  
  const response = await axios.post(this.mathpixUploadUrl, form, {
    headers: { 'app_id': this.mathpixAppId, 'app_key': this.mathpixAppKey }
  });
  
  return { pdf_id: response.data.pdf_id, status: response.data.status };
}
```

### **Step 2: Wait for Processing**
```typescript
// File: mathpix.service.ts - waitForPDFProcessing()
- Polls Mathpix API every 5 seconds
- Checks processing status
- Waits for 'completed' status
- Max wait time: 5 minutes (300000ms)
```

**Statuses:**
- `processing` - Still converting
- `completed` - Ready to download
- `failed` - Processing error

### **Step 3: Download LaTeX Content**
```typescript
// File: mathpix.service.ts - getPDFAsLatex()
- Downloads processed content from Mathpix
- Detects if response is ZIP file (starts with 'PK')
- Returns either text content or ZIP file path
```

**Two possible outputs:**
1. **Plain LaTeX text** - Simple documents
2. **ZIP file** - Complex documents with images

### **Step 4: Handle ZIP Files**
```typescript
// File: mathpix.service.ts - extractLatexFromZipFile()
- Extracts .tex file from ZIP
- Extracts images (jpg, png, svg, etc.)
- Saves images to content/images/{pdf-name}/
- Uploads images to AWS S3
- Returns LaTeX content
```

**ZIP Structure:**
```
document.zip
├── document.tex          # Main LaTeX file
├── image-001.png         # Extracted images
├── image-002.jpg
└── ...
```

### **Step 5: Validate & Clean LaTeX**
```typescript
// File: mathpix.service.ts - validateAndCleanLatex()
- Removes control characters and binary data
- Ensures proper LaTeX structure
- Adds \documentclass if missing
- Adds \begin{document} and \end{document} if missing
```

### **Step 6: Save to Local Storage**
```typescript
// File: mathpix.service.ts - saveLatexToFile()
- Sanitizes filename (removes special chars, spaces)
- Saves to content/latex/{filename}.tex
- Uploads to AWS S3
- Returns AWS S3 URL
```

### **Step 7: Update Database Cache**
```typescript
// Updates PDFProcessorCache table with:
- latexContent: Full LaTeX text
- latexFilePath: AWS S3 URL
- zipFilePath: AWS S3 URL (if ZIP)
- processingStatus: 'COMPLETED'
- processingTimeMs: Time taken
```

---

## Database Schema

### **PDFProcessorCache Table**
```prisma
model PDFProcessorCache {
  id                String           @id @default(uuid())
  fileName          String           @unique
  filePath          String
  fileSize          Int
  recordType        String           @default("pyq")
  
  // Mathpix Results
  latexContent      String?          @db.Text
  latexFilePath     String?          // AWS S3 URL
  zipFilePath       String?          // AWS S3 URL
  
  // Processing Status
  processingStatus  ProcessingStatus @default(PENDING)
  processingTimeMs  Int?
  lastProcessedAt   DateTime?
  retryCount        Int              @default(0)
  errorMessage      String?
  
  // AI Processing Results
  jsonContent       String?          @db.Text
  outputFilePath    String?
  
  // Import Status
  importedAt        DateTime?
  
  // Relations
  questions         Question[]
  logs              PDFProcessorLog[]
  
  createdAt         DateTime         @default(now())
  updatedAt         DateTime         @updatedAt
}

enum ProcessingStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  RETRYING
  UPLOADING
}
```

---

## API Endpoints

### **Backend Routes (NestJS)**

#### **1. Process PDF with Mathpix**
```http
POST /api/admin/pdf-processor/process-mathpix-file/:fileName
```
- Processes a PDF file using default Mathpix settings
- Uses `MATHPIX_IGNORE_BACKGROUND` environment variable

#### **2. Process PDF with Custom Options**
```http
POST /api/admin/pdf-processor/process-mathpix-file-with-options/:fileName
Body: { skipRecrop: boolean }
```
- Processes PDF with custom background processing option
- Allows overriding default settings per file

#### **3. Get Mathpix Configuration**
```http
GET /api/admin/pdf-processor/mathpix-config
```
- Returns current Mathpix configuration
- Shows if credentials are configured
- Shows background processing setting

#### **4. Get LaTeX Content**
```http
GET /api/admin/pdf-processor/latex-content/:cacheId
```
- Retrieves LaTeX content from database
- Returns both content and file path

#### **5. Serve PDF File**
```http
GET /api/admin/pdf-processor/serve-file/:fileName
```
- Streams PDF file for viewing
- Sets appropriate content-type headers

#### **6. Serve LaTeX File**
```http
GET /api/admin/pdf-processor/serve-latex/:fileName
```
- Streams LaTeX file for viewing
- Returns plain text content

---

## Frontend Implementation

### **PDF Processor Page** (`pdf-processor/page.tsx`)

**Features:**
1. **Folder Tree Navigation**
   - Hierarchical view of content folders
   - File count per folder
   - Expandable/collapsible nodes

2. **PDF List with Actions**
   - Process with Mathpix button
   - View LaTeX content
   - Edit JSON
   - Import questions
   - Review imported questions

3. **Status Indicators**
   - PENDING (yellow)
   - PROCESSING (blue)
   - COMPLETED (green)
   - FAILED (red)

4. **JSON Editor Modal**
   - Edit extracted questions
   - Save changes
   - Update questions in database
   - Mark as completed

### **PDF Processor Cache Page** (`pdf-processor-cache/page.tsx`)

**Features:**
1. **Cache Management**
   - View all cached PDF records
   - Filter by status, record type
   - Search by filename
   - Sort by various fields

2. **Mathpix Processing**
   - Process button with background option toggle
   - Shows processing status
   - Displays LaTeX content

3. **Question Management**
   - Import questions from JSON
   - Delete questions
   - Preview questions
   - Process with ChatGPT

4. **Statistics Dashboard**
   - Total records
   - Completed count
   - Failed count
   - Pending count

---

## File Naming & Sanitization

### **Sanitization Rules**
```typescript
// File: mathpix.service.ts - sanitizeFileName()
1. Replace spaces with underscores
2. Remove special characters (keep only alphanumeric, _, -)
3. Convert to lowercase
4. Limit length to 100 characters
5. Remove leading/trailing underscores
```

**Example:**
```
Input:  "JEE Main 2023 - Physics (Set A).pdf"
Output: "jee_main_2023_physics_set_a.pdf"
```

---

## Error Handling

### **Common Errors & Solutions**

1. **Mathpix API Credentials Not Configured**
   ```
   Error: "Mathpix API credentials not configured"
   Solution: Set MATHPIX_APP_ID and MATHPIX_APP_KEY in .env
   ```

2. **PDF Processing Timeout**
   ```
   Error: "PDF processing timeout"
   Solution: Increase maxWaitTime in waitForPDFProcessing()
   Default: 300000ms (5 minutes)
   ```

3. **No LaTeX File in ZIP**
   ```
   Error: "No .tex file found in ZIP archive"
   Solution: Check if Mathpix returned valid ZIP file
   ```

4. **UTF8 Encoding Errors**
   ```
   Error: "invalid byte sequence for encoding UTF8"
   Solution: sanitizeStringData() removes control characters
   ```

5. **File Not Found**
   ```
   Error: "PDF file not found on disk"
   Solution: Verify file exists in content/ folder
   ```

---

## Processing Options

### **Background Processing (skip_recrop)**

**When to use `skipRecrop: true`:**
- PDFs with decorative backgrounds
- Scanned documents with watermarks
- Documents with colored backgrounds
- Better for text-focused extraction

**When to use `skipRecrop: false`:**
- Clean PDFs without backgrounds
- Documents where layout matters
- PDFs with important visual elements

**Default Setting:**
```typescript
// Set in environment variable
MATHPIX_IGNORE_BACKGROUND="true"

// Or in code
private readonly ignoreBackground = process.env.MATHPIX_IGNORE_BACKGROUND === 'true' || true;
```

---

## Complete Processing Flow Example

### **Scenario: Processing "JEE_Main_2023_Physics.pdf"**

```
1. User clicks "Process with Mathpix" button
   ↓
2. Frontend sends POST request to backend
   POST /api/admin/pdf-processor/process-mathpix-file/JEE_Main_2023_Physics.pdf
   ↓
3. Backend reads PDF from content/pdf/JEE_Main_2023_Physics.pdf
   ↓
4. Upload to Mathpix API with skip_recrop=true
   Response: { pdf_id: "abc123", status: "processing" }
   ↓
5. Poll Mathpix every 5 seconds
   GET /v3/pdf/abc123
   Wait for status: "completed"
   ↓
6. Download processed content
   GET /v3/pdf/abc123.tex
   Response: ZIP file (detected by 'PK' signature)
   ↓
7. Save ZIP to content/zip/jee_main_2023_physics.zip
   Upload to AWS S3
   ↓
8. Extract ZIP contents:
   - jee_main_2023_physics.tex → content/latex/
   - image-001.png → content/images/jee_main_2023_physics/
   - image-002.jpg → content/images/jee_main_2023_physics/
   ↓
9. Upload all files to AWS S3
   ↓
10. Update database:
    - latexContent: "\\documentclass{article}..."
    - latexFilePath: "https://s3.../jee_main_2023_physics.tex"
    - zipFilePath: "https://s3.../jee_main_2023_physics.zip"
    - processingStatus: "COMPLETED"
    ↓
11. Frontend refreshes and shows "View LaTeX" button
    ↓
12. User can now:
    - View LaTeX content
    - Process with ChatGPT to extract questions
    - Edit extracted JSON
    - Import questions to database
```

---

## AI Processing (After Mathpix)

### **Step 1: Process LaTeX with AI**
```typescript
// Uses OpenAI or DeepSeek to extract questions
POST /api/admin/pdf-processor-cache/:cacheId/process-chatgpt
Body: { latexFilePath: "https://s3.../file.tex" }
```

**AI Prompt:**
- Reads LaTeX content
- Extracts questions with options
- Identifies subject, topic, subtopic
- Formats as JSON

### **Step 2: JSON Structure**
```json
{
  "questions": [
    {
      "stem": "Question text with LaTeX: $E = mc^2$",
      "options": [
        { "text": "Option A", "isCorrect": false },
        { "text": "Option B", "isCorrect": true },
        { "text": "Option C", "isCorrect": false },
        { "text": "Option D", "isCorrect": false }
      ],
      "explanation": "Detailed explanation",
      "tip_formula": "E = mc^2",
      "difficulty": "MEDIUM",
      "subject": "Physics",
      "lesson": "Modern Physics",
      "topic": "Relativity",
      "subtopic": "Mass-Energy Equivalence",
      "yearAppeared": 2023,
      "isPreviousYear": true
    }
  ]
}
```

### **Step 3: Import to Database**
```typescript
POST /api/admin/pdf-processor/import/:cacheId
```
- Creates Question records
- Creates QuestionOption records
- Links to Subject, Lesson, Topic, Subtopic
- Creates Formula records if needed
- Sets status to "UNDER_REVIEW"

---

## Best Practices

### **1. File Organization**
```
content/
├── pdf/                    # Original PDF files
│   ├── Physics/
│   ├── Chemistry/
│   └── Mathematics/
├── latex/                  # Extracted LaTeX files
├── zip/                    # ZIP files from Mathpix
├── images/                 # Extracted images
│   └── {pdf-name}/        # Subfolder per PDF
└── json/                   # Processed JSON files
```

### **2. Error Recovery**
- Retry failed processing with reset retry count
- Check logs in PDFProcessorLog table
- Verify Mathpix API quota
- Check AWS S3 permissions

### **3. Performance Optimization**
- Process PDFs in batches
- Use background processing for large files
- Cache LaTeX content in database
- Store files on AWS S3 for scalability

### **4. Quality Assurance**
- Review extracted LaTeX before AI processing
- Verify question extraction accuracy
- Use "under review" status for imported questions
- Approve questions individually or in bulk

---

## Troubleshooting Guide

### **Issue: Mathpix returns empty LaTeX**
**Cause:** PDF might be image-based or poorly formatted
**Solution:** 
- Try with `skipRecrop: false`
- Check PDF quality
- Verify PDF is not password-protected

### **Issue: Images not extracted**
**Cause:** ZIP file structure issue
**Solution:**
- Check ZIP contents manually
- Verify image file extensions
- Check AWS S3 upload permissions

### **Issue: Database UTF8 errors**
**Cause:** Special characters in LaTeX
**Solution:**
- `sanitizeStringData()` removes control characters
- Limit content size if needed
- Check database encoding settings

### **Issue: Processing takes too long**
**Cause:** Large PDF or complex content
**Solution:**
- Increase timeout in `waitForPDFProcessing()`
- Split large PDFs into smaller files
- Check Mathpix API status

---

## API Rate Limits & Costs

### **Mathpix API**
- Check your plan limits at https://mathpix.com/pricing
- Monitor API usage in Mathpix dashboard
- Implement rate limiting if needed

### **AWS S3**
- Storage costs based on file size
- Transfer costs for downloads
- Use lifecycle policies for old files

---

## Future Enhancements

1. **Batch Processing**
   - Process multiple PDFs simultaneously
   - Queue system for large batches

2. **OCR Fallback**
   - Use alternative OCR if Mathpix fails
   - Tesseract integration for backup

3. **LaTeX Preview**
   - Render LaTeX in browser
   - MathJax or KaTeX integration

4. **Version Control**
   - Track changes to extracted questions
   - Compare different processing attempts

5. **Analytics**
   - Processing success rate
   - Average processing time
   - Cost per PDF

---

## Summary

Your Mathpix PDF to LaTeX conversion system is a **comprehensive, production-ready solution** that:

✅ Converts PDF files to LaTeX using Mathpix API
✅ Handles both simple text and complex documents with images
✅ Stores files locally and on AWS S3
✅ Manages processing cache in PostgreSQL
✅ Provides user-friendly frontend interfaces
✅ Supports custom processing options
✅ Includes robust error handling
✅ Integrates with AI for question extraction
✅ Manages complete question lifecycle

**Key Strengths:**
- Modular architecture
- Comprehensive error handling
- File sanitization and validation
- Dual storage (local + AWS S3)
- Database caching
- User-friendly UI
- Flexible configuration

This system is ready for production use with proper environment configuration and API credentials.
