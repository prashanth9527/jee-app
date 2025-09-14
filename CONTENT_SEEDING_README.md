# Content Seeding System

This system allows you to automatically extract and import questions from PDF files containing previous year JEE papers.

## Features

- **PDF Processing**: Extract text and images from PDF files
- **Question Parsing**: Automatically identify and parse questions, options, and explanations
- **LaTeX Support**: Convert mathematical expressions to LaTeX format for TinyMCE editor
- **Metadata Extraction**: Parse year, subject, session from filenames
- **Bulk Import**: Process multiple PDFs or entire folders
- **Real-time Progress**: Track processing status with job monitoring
- **Error Handling**: Comprehensive error reporting and validation

## Installation

The required dependencies have been installed:
- `pdf-parse`: For extracting text from PDFs
- `pdf2pic`: For converting PDF pages to images
- `@types/pdf-parse`: TypeScript definitions

## Usage

### 1. Access the Admin Interface

Navigate to: `http://localhost:3000/admin/content-seeding`

### 2. Upload Individual PDFs

1. Click "Choose File" and select a PDF file
2. Click "Upload and Process PDF"
3. Monitor the processing progress in real-time
4. Review extracted questions before importing

### 3. Process Entire Folders

1. Enter the folder path in the "Process Folder" section
2. Example paths:
   - `content/JEE/Previous Papers/2025/Session1/Maths`
   - `content/JEE/Previous Papers/2024/Session2/Physics`
   - `content/JEE/Previous Papers/2023/Session1/Chemistry`
3. Click "Process All PDFs in Folder"

### 4. API Endpoints

The system provides these REST API endpoints:

- `POST /admin/content-seeding/upload-pdf` - Upload and process a PDF
- `GET /admin/content-seeding/processing-status/:jobId` - Get processing status
- `GET /admin/content-seeding/extract-from-folder?folderPath=...` - Process folder
- `POST /admin/content-seeding/bulk-import` - Import processed questions
- `POST /admin/content-seeding/validate-questions` - Validate questions

## File Structure

Your PDF files should be organized as:
```
content/
└── JEE/
    └── Previous Papers/
        ├── 2025/
        │   ├── Session1/
        │   │   ├── Maths/
        │   │   ├── Physics/
        │   │   └── Chemistry/
        │   └── Session2/
        │       ├── Maths/
        │       ├── Physics/
        │       └── Chemistry/
        ├── 2024/
        └── 2023/
```

## Filename Format

The system extracts metadata from filenames. Supported formats:
- `2201-Mathematics Paper+With+Sol. Evening.pdf`
- `2401-Physics Paper Morning.pdf`
- `2301-Chemistry Paper+With+Sol. Evening.pdf`

Extracted metadata:
- **Year**: First 4 digits in filename
- **Subject**: Keywords like "Mathematics", "Physics", "Chemistry"
- **Session**: "Morning" or "Evening" keywords

## Question Parsing

The system automatically:
1. **Extracts question stems** from the main text
2. **Identifies options** (A, B, C, D format)
3. **Finds correct answers** from answer keys
4. **Extracts explanations** from solution sections
5. **Converts math expressions** to LaTeX format
6. **Determines difficulty** based on content complexity

## LaTeX Conversion

Mathematical expressions are automatically converted to LaTeX:
- Fractions: `3/4` → `\frac{3}{4}`
- Superscripts: `x^2` → `x^{2}`
- Subscripts: `H_2O` → `H_{2}O`
- Square roots: `√(x+1)` → `\sqrt{x+1}`
- Greek letters: `alpha` → `\alpha`

## Database Integration

Questions are imported with:
- **Subject/Topic mapping** based on filename and content
- **Previous year flag** set to true
- **Year appeared** extracted from filename
- **Tags** automatically generated (Previous Year, JEE Mains, etc.)
- **Difficulty levels** (EASY, MEDIUM, HARD)

## Error Handling

The system provides detailed error reporting:
- **Processing errors** for individual questions
- **Validation errors** for malformed data
- **File errors** for corrupted or unsupported PDFs
- **Database errors** for import failures

## Testing

Run the test script to verify your setup:
```bash
cd backend
node test-content-seeding.js
```

## Troubleshooting

### Common Issues

1. **PDF not processing**: Ensure the PDF contains text (not just images)
2. **Questions not extracted**: Check if the PDF follows standard question formats
3. **Math expressions not converted**: Verify LaTeX syntax in the output
4. **Import failures**: Check database connection and schema

### Performance Tips

1. **Process smaller batches** for large PDF collections
2. **Monitor memory usage** during processing
3. **Use folder processing** for better organization
4. **Review extracted questions** before bulk import

## Support

For issues or questions:
1. Check the processing logs in the admin interface
2. Review error messages in the job status
3. Validate questions before importing
4. Test with smaller PDFs first

## Future Enhancements

Planned improvements:
- **Image extraction** from PDFs for solution diagrams
- **Advanced math recognition** using OCR
- **Question type detection** (MCQ, numerical, etc.)
- **Batch editing** interface for extracted questions
- **Export functionality** for processed questions
