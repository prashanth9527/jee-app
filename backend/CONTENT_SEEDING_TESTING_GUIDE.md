# Content Seeding Testing Guide

## 🎯 Testing Specific Folders

You can now test the content seeding system on specific folders instead of processing all content. This is perfect for testing with the 2025 folder or any other specific directory.

## 📁 Available Commands

### **Quick Test Commands:**

```bash
# Test 2025 folder specifically
npm run content:test-2025

# Test with custom path (examples)
node scripts/content-seeding-master.js --full --path "../content/JEE/Previous Papers/2025"
node scripts/content-seeding-master.js --convert-only --path "../content/JEE/Previous Papers/2025/Session1"
node scripts/content-seeding-master.js --seed-only --path "../content/JEE/Previous Papers/2025/Session1/Maths"
```

### **Command Structure:**

```bash
node scripts/content-seeding-master.js [COMMAND] --path [FOLDER_PATH]
```

**Commands:**
- `--convert-only` - Convert PDF/Image files to JSON only
- `--seed-only` - Seed database from existing JSON files only  
- `--full` - Run complete process: convert files + seed database
- `--help` - Show help information

**Path Options:**
- `--path` or `-p` - Specify custom content directory path (relative to backend/)

## 🗂️ Example Folder Paths

### **Test 2025 Papers Only:**
```bash
npm run content:test-2025
# OR
node scripts/content-seeding-master.js --full --path "../content/JEE/Previous Papers/2025"
```

### **Test Specific Session:**
```bash
# Session 1 only
node scripts/content-seeding-master.js --full --path "../content/JEE/Previous Papers/2025/Session1"

# Session 2 only  
node scripts/content-seeding-master.js --full --path "../content/JEE/Previous Papers/2025/Session2"
```

### **Test Specific Subject:**
```bash
# Mathematics only
node scripts/content-seeding-master.js --full --path "../content/JEE/Previous Papers/2025/Session1/Maths"

# Physics only
node scripts/content-seeding-master.js --full --path "../content/JEE/Previous Papers/2025/Session1/Physics"

# Chemistry only
node scripts/content-seeding-master.js --full --path "../content/JEE/Previous Papers/2025/Session1/Chemistry"
```

### **Test Specific Shift:**
```bash
# Morning shift only
node scripts/content-seeding-master.js --full --path "../content/JEE/Previous Papers/2025/Session1/Morning"

# Evening shift only
node scripts/content-seeding-master.js --full --path "../content/JEE/Previous Papers/2025/Session1/Evening"
```

## 🔄 Two-Phase Testing

### **Phase 1: Convert Only (Safe Testing)**
```bash
# Convert 2025 papers to JSON without database changes
node scripts/content-seeding-master.js --convert-only --path "../content/JEE/Previous Papers/2025"
```

This will:
- ✅ Process all PDFs and images in the 2025 folder
- ✅ Generate JSON files with extracted content
- ✅ Create conversion reports
- ❌ **No database changes** - completely safe

### **Phase 2: Seed Database**
```bash
# Seed the converted JSON files to database
node scripts/content-seeding-master.js --seed-only
```

This will:
- ✅ Read the generated JSON files
- ✅ Create questions, topics, subtopics, and LMS content
- ✅ Handle duplicates intelligently
- ✅ Generate seeding reports

## 📊 What Gets Created

### **For Each PDF File:**
1. **Individual Questions** - MCQ questions with options
2. **Main LMS Content** - Complete paper as study material
3. **Topic LMS Content** - Each topic as separate learning unit
4. **Supporting Structure** - Topics, subtopics, tags, lessons

### **Example for "Mathematics - 2025 Session1 Morning":**
```
📚 LMS Content Created:
├── "Mathematics - 2025 Session1 Morning Paper" (Main Content)
├── "Algebra - 2025 Paper" (Topic Content)
├── "Calculus - 2025 Paper" (Topic Content)
├── "Geometry - 2025 Paper" (Topic Content)
└── [25 Individual Questions with options and explanations]
```

## 📈 Expected Results for 2025 Folder

Based on your folder structure, testing 2025 should create:

```
📊 Expected Results:
  - Files processed: ~25-30 (all 2025 papers)
  - Questions created: ~625-750 (25 questions per paper)
  - Topics created: ~15-20 (new topics)
  - Subtopics created: ~45-60 (topic-specific subtopics)
  - LMS Content created: ~75-90 (main + topic content)
  - Tags created: ~20-25 (subject and year tags)
  - Processing time: ~10-15 minutes
```

## 🛡️ Safety Features

### **Duplicate Prevention:**
- ✅ Questions with similar text are skipped
- ✅ Topics with similar names are merged
- ✅ Subtopics are checked for duplicates
- ✅ Tags are deduplicated automatically

### **Error Handling:**
- ✅ Failed files don't stop the process
- ✅ Detailed error reporting
- ✅ Progress tracking with logs
- ✅ Rollback capability (database transactions)

### **Data Validation:**
- ✅ Content structure validation
- ✅ Required fields checking
- ✅ Relationship integrity
- ✅ Metadata validation

## 🚀 Quick Start Testing

### **Step 1: Test 2025 Folder (Recommended)**
```bash
# Navigate to backend directory
cd backend

# Run the test
npm run content:test-2025
```

### **Step 2: Check Results**
```bash
# View generated files
ls -la json-output/

# Check reports
cat json-output/reports/conversion-summary.json
cat json-output/seeding-report.json
```

### **Step 3: Verify Database**
```bash
# Check database content
npx prisma studio
# OR
# Check specific tables in your database client
```

## 📝 Logs and Reports

### **Generated Files:**
- `json-output/pdfs/` - Individual PDF JSON files
- `json-output/images/` - Individual image JSON files  
- `json-output/reports/conversion-summary.json` - Conversion report
- `json-output/seeding-report.json` - Database seeding report

### **Console Output:**
```
🚀 JEE Content Seeding Master Script
====================================
Command: --full
Target Path: ../content/JEE/Previous Papers/2025
Started at: 2025-01-21T10:30:00.000Z

📄 Phase 1: Converting PDF/Image files to JSON...

📁 Processing content from: ../content/JEE/Previous Papers/2025
Found 25 PDF files
Processing: 2201-Mathematics Paper+With+Sol. Morning.pdf
  📄 Extracting text from 2201-Mathematics Paper+With+Sol. Morning.pdf...
  🔬 Processing text content (pdf)...
  🖼️ Extracting images from 2201-Mathematics Paper+With+Sol. Morning.pdf...
✅ Processed 25/25 PDF files

🌱 Phase 2: Seeding JSON files to database...
  ✅ Created 625 questions, 15 topics, 45 subtopics, 20 tags, 75 LMS content
  ⏭️ Skipped 45 duplicates

🎉 Full content seeding process completed successfully!
⏱️ Total duration: 12 minutes
```

## 🔧 Troubleshooting

### **Path Issues:**
```bash
# Make sure path is relative to backend/ directory
# Correct: "../content/JEE/Previous Papers/2025"
# Wrong: "/absolute/path/to/content"
```

### **Permission Issues:**
```bash
# Make sure you have read access to content folder
# Make sure you have write access to json-output folder
```

### **Database Issues:**
```bash
# Check database connection
npm run db:seed

# Reset database if needed (WARNING: deletes all data)
npm run db:reset
```

## 🎯 Next Steps After Testing

1. **Review Results** - Check the generated questions and content
2. **Test Frontend** - Verify content appears correctly in your app
3. **Scale Up** - Run on larger folders once satisfied
4. **Automate** - Set up regular content updates

## 📞 Support

If you encounter issues:
1. Check the console logs for specific error messages
2. Review the generated reports in `json-output/reports/`
3. Verify file permissions and paths
4. Check database connectivity

Happy testing! 🚀
