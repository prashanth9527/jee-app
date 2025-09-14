const fs = require('fs');
const path = require('path');

// Test script for content seeding
async function testContentSeeding() {
  console.log('🧪 Testing Content Seeding System');
  console.log('=====================================');
  
  // Check if content folder exists
  const contentPath = path.join(__dirname, '..', 'content', 'JEE', 'Previous Papers');
  
  if (!fs.existsSync(contentPath)) {
    console.log('❌ Content folder not found at:', contentPath);
    console.log('Please ensure your PDF files are in the correct location.');
    return;
  }
  
  console.log('✅ Content folder found at:', contentPath);
  
  // List available PDF files
  const years = fs.readdirSync(contentPath);
  console.log('\n📁 Available years:', years);
  
  let totalPdfs = 0;
  for (const year of years) {
    const yearPath = path.join(contentPath, year);
    if (fs.statSync(yearPath).isDirectory()) {
      const sessions = fs.readdirSync(yearPath);
      for (const session of sessions) {
        const sessionPath = path.join(yearPath, session);
        if (fs.statSync(sessionPath).isDirectory()) {
          const subjects = fs.readdirSync(sessionPath);
          for (const subject of subjects) {
            const subjectPath = path.join(sessionPath, subject);
            if (fs.statSync(subjectPath).isDirectory()) {
              const pdfs = fs.readdirSync(subjectPath).filter(file => file.endsWith('.pdf'));
              if (pdfs.length > 0) {
                console.log(`📄 ${year}/${session}/${subject}: ${pdfs.length} PDFs`);
                totalPdfs += pdfs.length;
              }
            }
          }
        }
      }
    }
  }
  
  console.log(`\n📊 Total PDF files found: ${totalPdfs}`);
  
  if (totalPdfs > 0) {
    console.log('\n🚀 Ready to process! You can now:');
    console.log('1. Start your backend server: npm run start:dev');
    console.log('2. Access the admin panel: http://localhost:3000/admin/content-seeding');
    console.log('3. Upload individual PDFs or process entire folders');
    console.log('\nExample folder paths to try:');
    console.log('- content/JEE/Previous Papers/2025/Session1/Maths');
    console.log('- content/JEE/Previous Papers/2024/Session2/Physics');
    console.log('- content/JEE/Previous Papers/2023/Session1/Chemistry');
  } else {
    console.log('\n⚠️  No PDF files found. Please add some PDF files to the content folder.');
  }
}

// Run the test
testContentSeeding().catch(console.error);
