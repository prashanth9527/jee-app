const { MathpixService } = require('./dist/admin/mathpix.service');

// Test the ZIP extraction directly
async function testExtraction() {
  try {
    const mathpixService = new MathpixService();
    
    // Test with the existing ZIP file
    const zipFilePath = 'content/zip/1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION.zip';
    const originalFileName = '1-FEB-2023 SHIFT-1 JM CHEMISTRY PAPER SOLUTION.pdf';
    
    console.log('Testing ZIP extraction...');
    console.log('ZIP file:', zipFilePath);
    console.log('Original file:', originalFileName);
    
    // Call the private method using reflection (for testing only)
    const result = await mathpixService.extractLatexFromZipFile(zipFilePath, originalFileName);
    
    if (result) {
      console.log('✅ LaTeX extraction successful!');
      console.log('Content length:', result.length);
      console.log('First 200 characters:', result.substring(0, 200));
    } else {
      console.log('❌ LaTeX extraction failed');
    }
    
  } catch (error) {
    console.error('Error during extraction:', error);
  }
}

testExtraction();
