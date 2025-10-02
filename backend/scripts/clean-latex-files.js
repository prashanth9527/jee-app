const fs = require('fs');
const path = require('path');
const yauzl = require('yauzl');

/**
 * Clean up corrupted LaTeX files
 */
async function cleanLatexFiles() {
  const latexDir = path.join(__dirname, '..', 'content', 'latex');
  
  if (!fs.existsSync(latexDir)) {
    console.log('No latex directory found');
    return;
  }

  const files = fs.readdirSync(latexDir);
  const texFiles = files.filter(file => file.endsWith('.tex'));

  console.log(`Found ${texFiles.length} LaTeX files to check`);

  for (const file of texFiles) {
    const filePath = path.join(latexDir, file);
    const content = fs.readFileSync(filePath);
    
    // Check if file starts with PK (ZIP signature)
    if (content.toString('ascii', 0, 2) === 'PK') {
      console.log(`\n🔍 Found corrupted ZIP file: ${file}`);
      console.log('   This file contains binary data and needs to be reprocessed');
      console.log('   Please delete this file and reprocess the PDF with Mathpix');
    } else {
      console.log(`✅ Valid LaTeX file: ${file}`);
    }
  }
}

cleanLatexFiles().catch(console.error);
