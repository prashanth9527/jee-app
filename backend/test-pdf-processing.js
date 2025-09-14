const fs = require('fs');
const path = require('path');

// Test PDF processing
async function testPdfProcessing() {
  console.log('🧪 Testing PDF Processing Libraries');
  console.log('=====================================');
  
  try {
    // Test pdf-parse
    console.log('Testing pdf-parse...');
    const pdfParse = require('pdf-parse');
    console.log('✅ pdf-parse loaded successfully');
    
    // Test pdf2pic
    console.log('Testing pdf2pic...');
    const pdf2pic = require('pdf2pic');
    console.log('✅ pdf2pic loaded successfully');
    
    // Test with a sample PDF file
    const contentPath = path.join(__dirname, '..', 'content', 'JEE', 'Previous Papers', '2025', 'Session1', 'Maths');
    
    if (fs.existsSync(contentPath)) {
      const files = fs.readdirSync(contentPath).filter(file => file.endsWith('.pdf'));
      
      if (files.length > 0) {
        const testFile = path.join(contentPath, files[0]);
        console.log(`\n📄 Testing with file: ${files[0]}`);
        
        try {
          const fileBuffer = fs.readFileSync(testFile);
          console.log(`File size: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);
          
          // Test PDF parsing
          const pdfData = await pdfParse(fileBuffer);
          console.log(`✅ PDF parsed successfully`);
          console.log(`Text length: ${pdfData.text.length} characters`);
          console.log(`Pages: ${pdfData.numpages}`);
          
          // Show first 200 characters of text
          console.log(`\nFirst 200 characters:`);
          console.log(pdfData.text.substring(0, 200) + '...');
          
        } catch (error) {
          console.log(`❌ Error processing PDF: ${error.message}`);
        }
      } else {
        console.log('❌ No PDF files found in test directory');
      }
    } else {
      console.log('❌ Content directory not found');
    }
    
  } catch (error) {
    console.log(`❌ Error loading libraries: ${error.message}`);
  }
}

// Run the test
testPdfProcessing().catch(console.error);
