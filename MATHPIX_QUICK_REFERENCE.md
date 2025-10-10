# Mathpix PDF to LaTeX - Quick Reference Guide

## 🚀 Quick Start

### Environment Setup
```env
MATHPIX_APP_ID="your-mathpix-app-id"
MATHPIX_APP_KEY="your-mathpix-app-key"
MATHPIX_IGNORE_BACKGROUND="true"
```

### Process a PDF
```typescript
// From frontend
POST /api/admin/pdf-processor/process-mathpix-file/:fileName

// With custom options
POST /api/admin/pdf-processor/process-mathpix-file-with-options/:fileName
Body: { skipRecrop: true }
```

---

## 📁 File Structure

```
content/
├── pdf/          # Source PDFs
├── latex/        # Extracted .tex files
├── zip/          # ZIP files from Mathpix
└── images/       # Extracted images
    └── {pdf-name}/
```

---

## 🔄 Processing Workflow

```
1. Upload PDF to Mathpix
   ↓
2. Wait for processing (poll every 5s)
   ↓
3. Download LaTeX/ZIP
   ↓
4. Extract content & images
   ↓
5. Save locally + AWS S3
   ↓
6. Update database cache
   ↓
7. Process with AI (ChatGPT/DeepSeek)
   ↓
8. Extract questions to JSON
   ↓
9. Import to database
```

---

## 🎯 Key Functions

### Backend (mathpix.service.ts)

```typescript
// Main processing function
processPdfWithMathpixByFileName(fileName: string, filePath: string)

// With custom options
processPdfWithMathpixByFileNameWithOptions(fileName, filePath, { skipRecrop: true })

// Upload to Mathpix
uploadPDF(pdfPath: string, options?: { skipRecrop?: boolean })

// Wait for completion
waitForPDFProcessing(pdfId: string, maxWaitTime: 300000)

// Download result
getPDFAsLatex(pdfId: string, fileName: string)

// Extract from ZIP
extractLatexFromZipFile(zipFilePath: string, originalFileName?: string)

// Validate LaTeX
validateAndCleanLatex(latexContent: string)

// Save to file
saveLatexToFile(fileName: string, latexContent: string)
```

---

## 🔧 Configuration Options

### Background Processing (skip_recrop)

**Use `true` for:**
- PDFs with decorative backgrounds
- Scanned documents with watermarks
- Colored backgrounds
- Text-focused extraction

**Use `false` for:**
- Clean PDFs
- Layout-important documents
- Visual elements matter

---

## 📊 Database Fields

```typescript
PDFProcessorCache {
  id: string
  fileName: string
  filePath: string
  
  // Mathpix results
  latexContent: string
  latexFilePath: string    // AWS S3 URL
  zipFilePath: string      // AWS S3 URL
  
  // Status
  processingStatus: PENDING | PROCESSING | COMPLETED | FAILED
  processingTimeMs: number
  lastProcessedAt: Date
  
  // AI results
  jsonContent: string
  
  // Import status
  importedAt: Date
}
```

---

## 🎨 Frontend Components

### PDF Processor Page
- **Location**: `frontend/src/app/admin/pdf-processor/page.tsx`
- **Features**: Folder tree, PDF list, Mathpix processing, JSON editor

### PDF Processor Cache Page
- **Location**: `frontend/src/app/admin/pdf-processor-cache/page.tsx`
- **Features**: Cache management, filtering, Mathpix processing, question import

---

## 🐛 Common Issues

### 1. Credentials Not Configured
```
Error: "Mathpix API credentials not configured"
Fix: Set MATHPIX_APP_ID and MATHPIX_APP_KEY
```

### 2. Processing Timeout
```
Error: "PDF processing timeout"
Fix: Increase maxWaitTime (default: 5 minutes)
```

### 3. No LaTeX in ZIP
```
Error: "No .tex file found in ZIP archive"
Fix: Check Mathpix response, verify PDF quality
```

### 4. UTF8 Errors
```
Error: "invalid byte sequence for encoding UTF8"
Fix: sanitizeStringData() removes control characters
```

---

## 📈 Processing Stats

### Typical Processing Times
- Simple PDF (10 pages): 30-60 seconds
- Complex PDF (50 pages): 2-5 minutes
- With images: +30-60 seconds

### File Sizes
- LaTeX: 10-100 KB
- ZIP: 100 KB - 5 MB
- Images: 50-500 KB each

---

## 🔍 Testing Checklist

- [ ] Mathpix credentials configured
- [ ] AWS S3 credentials configured
- [ ] PDF file exists in content/pdf/
- [ ] Database connection working
- [ ] Frontend can access backend API
- [ ] Test with simple PDF first
- [ ] Verify LaTeX extraction
- [ ] Check image extraction
- [ ] Test AI processing
- [ ] Verify question import

---

## 📞 API Endpoints Summary

```http
# Process with Mathpix
POST /api/admin/pdf-processor/process-mathpix-file/:fileName
POST /api/admin/pdf-processor/process-mathpix-file-with-options/:fileName

# Get configuration
GET /api/admin/pdf-processor/mathpix-config

# Get LaTeX content
GET /api/admin/pdf-processor/latex-content/:cacheId

# Serve files
GET /api/admin/pdf-processor/serve-file/:fileName
GET /api/admin/pdf-processor/serve-latex/:fileName

# Process with AI
POST /api/admin/pdf-processor-cache/:cacheId/process-chatgpt

# Import questions
POST /api/admin/pdf-processor/import/:cacheId
```

---

## 💡 Pro Tips

1. **Always test with a small PDF first**
2. **Use skip_recrop=true for scanned documents**
3. **Check Mathpix dashboard for API usage**
4. **Monitor AWS S3 costs**
5. **Review extracted questions before approving**
6. **Keep original PDFs as backup**
7. **Use cache management page for bulk operations**
8. **Set up error notifications for production**

---

## 🔗 Useful Links

- Mathpix API Docs: https://docs.mathpix.com/
- Mathpix Dashboard: https://mathpix.com/dashboard
- LaTeX Documentation: https://www.latex-project.org/help/documentation/

---

## 📝 Example Usage

### Process a PDF with default settings
```typescript
// Frontend
const response = await api.post(
  '/admin/pdf-processor/process-mathpix-file/JEE_Main_2023.pdf'
);
```

### Process with custom background option
```typescript
// Frontend
const response = await api.post(
  '/admin/pdf-processor/process-mathpix-file-with-options/JEE_Main_2023.pdf',
  { skipRecrop: true }
);
```

### Get LaTeX content
```typescript
// Frontend
const response = await api.get(
  '/admin/pdf-processor/latex-content/cache-id-123'
);
console.log(response.data.latexContent);
```

### Import questions
```typescript
// Frontend
const response = await api.post(
  '/admin/pdf-processor/import/cache-id-123'
);
console.log(`Imported ${response.data.importedCount} questions`);
```

---

## 🎯 Next Steps After Reading This

1. ✅ Verify environment variables are set
2. ✅ Test with a sample PDF
3. ✅ Check LaTeX extraction quality
4. ✅ Process with AI to extract questions
5. ✅ Review and import questions
6. ✅ Set up monitoring and error handling
7. ✅ Document any custom modifications

---

**For detailed information, see: `MATHPIX_PDF_TO_LATEX_WORKFLOW.md`**
