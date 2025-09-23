/**
 * Comprehensive PDF/Image to JSON Converter for JEE Content Seeding
 * 
 * This script processes PDF files and JPEG images containing mathematical equations,
 * chemical equations, and question content, converting them to structured JSON format
 * for database seeding.
 * 
 * Features:
 * - PDF text extraction and image conversion
 * - JPEG image OCR processing
 * - Mathematical equation detection and LaTeX conversion
 * - Chemical formula processing
 * - Question structure parsing
 * - Automatic categorization and tagging
 * - Batch processing of entire content directories
 */

const fs = require('fs-extra');
const path = require('path');
const pdfParse = require('pdf-parse');
const { fromPath } = require('pdf2pic');
const sharp = require('sharp');
const Tesseract = require('tesseract.js');
const { enhancedMathToLaTeX, enhancedFormatForRichTextEditor } = require('./enhanced-equation-processor');

const CONFIG = {
  // Input configuration
  contentBaseDir: '../content',
  outputBaseDir: './json-output',
  
  // Processing options
  pdfProcessing: {
    density: 300,
    format: 'png',
    quality: 90,
    extractImages: true,
    extractText: true
  },
  
  imageProcessing: {
    ocrLanguage: 'eng',
    ocrConfig: {
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-=()[]{}.,;:!?@#$%^&*_|\\/"\'<>`~ ',
      preserve_interword_spaces: '1'
    },
    imageOptimization: {
      maxWidth: 1200,
      maxHeight: 1600,
      quality: 85,
      format: 'webp'
    }
  },
  
  // JSON structure configuration
  jsonStructure: {
    includeMetadata: true,
    includeImages: true,
    includeRawText: false,
    prettify: true
  },
  
  // File handling options
  fileHandling: {
    preserveFolderStructure: true,
    skipExistingFiles: false,  // Set to true to skip existing JSON files
    backupExistingFiles: true  // Create backup before overwriting
  }
};

/**
 * Main conversion function
 */
async function convertContentToJson() {
  console.log('🚀 Starting PDF/Image to JSON conversion...');
  
  try {
    // Setup output directories
    await setupOutputDirectories();
    
    // Process all PDF files
    await processAllPDFs();
    
    // Process all JPEG images
    await processAllImages();
    
    // Generate summary report
    await generateSummaryReport();
    
    console.log('✅ Conversion completed successfully!');
    
  } catch (error) {
    console.error('❌ Conversion failed:', error);
    process.exit(1);
  }
}

/**
 * Setup output directory structure
 */
async function setupOutputDirectories() {
  console.log('📁 Setting up output directories...');
  
  const outputDir = CONFIG.outputBaseDir;
  await fs.ensureDir(outputDir);
  await fs.ensureDir(path.join(outputDir, 'pdfs'));
  await fs.ensureDir(path.join(outputDir, 'images'));
  await fs.ensureDir(path.join(outputDir, 'processed-images'));
  await fs.ensureDir(path.join(outputDir, 'reports'));
  
  console.log('✅ Output directories created');
}

/**
 * Process all PDF files in content directory
 */
async function processAllPDFs() {
  console.log('📄 Processing PDF files...');
  
  const pdfFiles = await findFiles(CONFIG.contentBaseDir, '.pdf');
  console.log(`Found ${pdfFiles.length} PDF files`);
  
  const results = [];
  
  for (const pdfFile of pdfFiles) {
    try {
      console.log(`Processing: ${path.basename(pdfFile)}`);
      const result = await processPDF(pdfFile);
      results.push(result);
      
      // Save individual JSON file
      await savePDFJson(result);
      
    } catch (error) {
      console.error(`❌ Failed to process ${pdfFile}:`, error.message);
      results.push({
        file: pdfFile,
        success: false,
        error: error.message
      });
    }
  }
  
  // Save consolidated results
  await fs.writeJSON(
    path.join(CONFIG.outputBaseDir, 'pdfs', 'all-pdfs-processed.json'),
    results,
    { spaces: 2 }
  );
  
  console.log(`✅ Processed ${results.filter(r => r.success).length}/${results.length} PDF files`);
}

/**
 * Process all JPEG images in content directory
 */
async function processAllImages() {
  console.log('🖼️ Processing JPEG images...');
  
  const imageFiles = await findFiles(CONFIG.contentBaseDir, '.jpeg');
  const jpgFiles = await findFiles(CONFIG.contentBaseDir, '.jpg');
  const allImages = [...imageFiles, ...jpgFiles];
  
  console.log(`Found ${allImages.length} image files`);
  
  const results = [];
  
  for (const imageFile of allImages) {
    try {
      console.log(`Processing: ${path.basename(imageFile)}`);
      const result = await processImage(imageFile);
      results.push(result);
      
      // Save individual JSON file
      await saveImageJson(result);
      
    } catch (error) {
      console.error(`❌ Failed to process ${imageFile}:`, error.message);
      results.push({
        file: imageFile,
        success: false,
        error: error.message
      });
    }
  }
  
  // Save consolidated results
  await fs.writeJSON(
    path.join(CONFIG.outputBaseDir, 'images', 'all-images-processed.json'),
    results,
    { spaces: 2 }
  );
  
  console.log(`✅ Processed ${results.filter(r => r.success).length}/${results.length} image files`);
}

/**
 * Process individual PDF file
 */
async function processPDF(pdfPath) {
  const fileName = path.basename(pdfPath);
  
  // Always calculate relative path from the original content directory, not the custom path
  const originalContentDir = '../content';
  const relativePath = path.relative(originalContentDir, pdfPath);
  
  console.log(`  📄 Extracting text from ${fileName}...`);
  
  // Extract text content
  const pdfBuffer = await fs.readFile(pdfPath);
  const pdfData = await pdfParse(pdfBuffer);
  
  // Extract metadata from filename first
  const filenameMetadata = extractMetadataFromFilename(fileName);
  
  // Process text content
  const processedContent = await processTextContent(pdfData.text, 'pdf');
  
  // Extract metadata from PDF content (overrides filename metadata)
  const pdfMetadata = extractMetadataFromPDFContent(pdfData.text);
  
  // Merge metadata (PDF content takes precedence)
  const metadata = {
    ...filenameMetadata,
    ...pdfMetadata
  };
  
  // Extract images if enabled
  let images = [];
  if (CONFIG.pdfProcessing.extractImages) {
    console.log(`  🖼️ Extracting images from ${fileName}...`);
    images = await extractPDFImages(pdfPath, fileName);
  }
  
  return {
    success: true,
    file: pdfPath,
    relativePath,
    metadata: {
      ...metadata,
      fileType: 'pdf',
      totalPages: pdfData.numpages,
      fileSize: pdfBuffer.length,
      processedAt: new Date().toISOString()
    },
    content: processedContent,
    images: images,
    rawText: CONFIG.jsonStructure.includeRawText ? pdfData.text : undefined
  };
}

/**
 * Process individual image file
 */
async function processImage(imagePath) {
  const fileName = path.basename(imagePath);
  
  // Always calculate relative path from the original content directory, not the custom path
  const originalContentDir = '../content';
  const relativePath = path.relative(originalContentDir, imagePath);
  
  console.log(`  🖼️ Processing image ${fileName}...`);
  
  // Extract metadata from filename first
  const filenameMetadata = extractMetadataFromFilename(fileName);
  
  // Perform OCR on image
  console.log(`  🔍 Performing OCR on ${fileName}...`);
  const ocrResult = await performOCR(imagePath);
  
  // Extract metadata from OCR content (overrides filename metadata)
  const ocrMetadata = extractMetadataFromPDFContent(ocrResult.text);
  
  // Merge metadata (OCR content takes precedence)
  const metadata = {
    ...filenameMetadata,
    ...ocrMetadata
  };
  
  // Process extracted text
  const processedContent = await processTextContent(ocrResult.text, 'image');
  
  // Process and optimize image
  const processedImagePath = await processAndOptimizeImage(imagePath, fileName);
  
  return {
    success: true,
    file: imagePath,
    relativePath,
    metadata: {
      ...metadata,
      fileType: 'image',
      imageType: path.extname(fileName).toLowerCase(),
      ocrConfidence: ocrResult.confidence,
      processedAt: new Date().toISOString()
    },
    content: processedContent,
    processedImagePath,
    ocrResult: {
      text: ocrResult.text,
      confidence: ocrResult.confidence,
      words: ocrResult.words
    }
  };
}

/**
 * Extract metadata from PDF content
 */
function extractMetadataFromPDFContent(text) {
  const metadata = {
    year: null,
    session: null,
    shift: null,
    subject: null,
    paperType: null,
    date: null
  };
  
  // Extract year from PDF content (look for patterns like "2025", "JANUARY 2025", etc.)
  const yearPatterns = [
    /JEE-MAIN EXAMINATION - JANUARY (\d{4})/i,
    /JEE-Main Exam Session-1 \(January (\d{4})\)/i,
    /JEE-Main Exam Session-2 \(January (\d{4})\)/i,
    /HELD ON.*?(\d{4})/i,
    /(\d{4})\/\d{2}-\d{2}-\d{4}/i,  // 2025/22-01-2025
    /January (\d{4})/i,
    /(\d{4})/i  // Fallback: any 4-digit year
  ];
  
  for (const pattern of yearPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const year = parseInt(match[1]);
      // Validate year (should be between 2000 and 2030)
      if (year >= 2000 && year <= 2030) {
        metadata.year = year;
        break;
      }
    }
  }
  
  // Extract session from PDF content
  const sessionPatterns = [
    /Session-1/i,
    /Session-2/i,
    /Session 1/i,
    /Session 2/i
  ];
  
  for (const pattern of sessionPatterns) {
    if (pattern.test(text)) {
      if (text.match(/Session-?1/i)) {
        metadata.session = 'Session1';
      } else if (text.match(/Session-?2/i)) {
        metadata.session = 'Session2';
      }
      break;
    }
  }
  
  // Extract shift from PDF content
  const shiftPatterns = [
    /Morning Shift/i,
    /Evening Shift/i,
    /Morning/i,
    /Evening/i
  ];
  
  for (const pattern of shiftPatterns) {
    if (pattern.test(text)) {
      if (text.match(/Morning/i)) {
        metadata.shift = 'Morning';
      } else if (text.match(/Evening/i)) {
        metadata.shift = 'Evening';
      }
      break;
    }
  }
  
  // Extract subject from PDF content
  const subjectPatterns = [
    /MATHEMATICS SECTION/i,
    /PHYSICS SECTION/i,
    /CHEMISTRY SECTION/i,
    /Mathematics/i,
    /Physics/i,
    /Chemistry/i
  ];
  
  for (const pattern of subjectPatterns) {
    if (pattern.test(text)) {
      if (text.match(/MATHEMATICS|Mathematics/i)) {
        metadata.subject = 'Mathematics';
      } else if (text.match(/PHYSICS|Physics/i)) {
        metadata.subject = 'Physics';
      } else if (text.match(/CHEMISTRY|Chemistry/i)) {
        metadata.subject = 'Chemistry';
      }
      break;
    }
  }
  
  // Extract date from PDF content
  const datePatterns = [
    /(\d{2}-\d{2}-\d{4})/i,  // 22-01-2025
    /(\d{2}\/\d{2}\/\d{4})/i,  // 22/01/2025
    /(\d{1,2}(st|nd|rd|th) \w+ \d{4})/i  // 22nd January 2025
  ];
  
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      metadata.date = match[1];
      break;
    }
  }
  
  // Determine paper type
  if (text.match(/SOLUTION|Solution/i)) {
    metadata.paperType = 'With Solution';
  } else {
    metadata.paperType = 'Question Paper';
  }
  
  return metadata;
}

/**
 * Extract metadata from filename
 */
function extractMetadataFromFilename(fileName) {
  const metadata = {
    originalFileName: fileName,
    subject: 'Unknown',
    year: null,
    session: null,
    shift: null,
    paperType: null
  };
  
  // Extract year (first 4 digits)
  const yearMatch = fileName.match(/(\d{4})/);
  if (yearMatch) {
    metadata.year = parseInt(yearMatch[1]);
  }
  
  // Extract subject
  if (fileName.toLowerCase().includes('mathematics') || fileName.toLowerCase().includes('math')) {
    metadata.subject = 'Mathematics';
  } else if (fileName.toLowerCase().includes('physics')) {
    metadata.subject = 'Physics';
  } else if (fileName.toLowerCase().includes('chemistry')) {
    metadata.subject = 'Chemistry';
  }
  
  // Extract session and shift
  if (fileName.toLowerCase().includes('session1')) {
    metadata.session = 'Session1';
  } else if (fileName.toLowerCase().includes('session2')) {
    metadata.session = 'Session2';
  }
  
  if (fileName.toLowerCase().includes('morning')) {
    metadata.shift = 'Morning';
  } else if (fileName.toLowerCase().includes('evening')) {
    metadata.shift = 'Evening';
  }
  
  // Extract paper type
  if (fileName.toLowerCase().includes('solution') || fileName.toLowerCase().includes('sol')) {
    metadata.paperType = 'With Solution';
  } else {
    metadata.paperType = 'Question Paper';
  }
  
  return metadata;
}

/**
 * Process text content for mathematical and chemical equations
 */
async function processTextContent(text, sourceType) {
  console.log(`  🔬 Processing text content (${sourceType})...`);
  
  // Clean and normalize text
  const cleanedText = cleanText(text);
  
  // Extract questions
  const questions = extractQuestions(cleanedText);
  
  // Process mathematical equations
  const mathEquations = extractMathEquations(cleanedText);
  
  // Process chemical equations (for chemistry content)
  const chemicalEquations = extractChemicalEquations(cleanedText);
  
  // Extract topics and subtopics following hierarchy
  const topics = extractTopics(cleanedText);
  const subtopics = extractSubtopics(cleanedText, topics);
  
  // Extract tags
  const tags = extractTags(cleanedText);
  
  return {
    originalText: cleanedText,
    questions: questions,
    mathEquations: mathEquations,
    chemicalEquations: chemicalEquations,
    topics: topics,
    subtopics: subtopics,
    tags: tags,
    wordCount: cleanedText.split(/\s+/).length,
    characterCount: cleanedText.length
  };
}

/**
 * Clean and normalize text content
 */
function cleanText(text) {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Extract questions from text
 */
function extractQuestions(text) {
  const questions = [];
  
  // Split text into potential question blocks by looking for question numbers
  // Look for patterns like "1. ", "2. ", "3. " etc. in the text
  const questionMatches = [];
  
  // Find all question number positions
  const questionNumberPattern = /\b(\d+)[:.]\s+/g;
  let match;
  while ((match = questionNumberPattern.exec(text)) !== null) {
    questionMatches.push({
      number: match[1],
      position: match.index,
      fullMatch: match[0]
    });
  }
  
  // Process each question
  for (let i = 0; i < questionMatches.length; i++) {
    const currentMatch = questionMatches[i];
    const nextMatch = questionMatches[i + 1];
    
    // Extract text between current question and next question
    const startPos = currentMatch.position + currentMatch.fullMatch.length;
    const endPos = nextMatch ? nextMatch.position : text.length;
    let questionText = text.substring(startPos, endPos).trim();
    
    // Skip if this looks like a header or non-question content
    if (isQuestionHeader(questionText) || !isActualQuestion(questionText)) {
      continue;
    }
    
    // Clean up question text - remove answer and solution parts
    questionText = cleanQuestionText(questionText);
    
    if (questionText.length > 20 && hasQuestionContent(questionText)) {
      const options = extractOptions(questionText);
      
      questions.push({
        number: currentMatch.number,
        text: questionText,
        formattedText: convertMathToTinyMathBlock(questionText),
        latexText: formatForLaTeX(questionText),
        options: options,
        formattedOptions: options.map(opt => ({
          ...opt,
          formattedText: convertMathToTinyMathBlock(opt.text),
          latexText: formatForLaTeX(opt.text)
        })),
        hasMath: /[+\-*/=<>(){}[\]^_|\\]/.test(questionText),
        hasChemistry: /[A-Z][a-z]?\d*|→|⇌|↑|↓|\(s\)|\(l\)|\(g\)|\(aq\)/.test(questionText),
        equations: extractEquationsForKaTeX(questionText)
      });
    }
  }
  
  return questions;
}

/**
 * Check if text is a question header (not an actual question)
 */
function isQuestionHeader(text) {
  const headerPatterns = [
    /JEE.*EXAMINATION/i,
    /TEST PAPER/i,
    /SECTION/i,
    /TIME.*PM.*TO.*PM/i,
    /HELD ON/i,
    /ALLEN/i
  ];
  
  return headerPatterns.some(pattern => pattern.test(text));
}

/**
 * Check if text is an actual question
 */
function isActualQuestion(text) {
  const questionIndicators = [
    /find/i,
    /calculate/i,
    /determine/i,
    /choose/i,
    /select/i,
    /arrange/i,
    /identify/i,
    /which/i,
    /what/i,
    /how/i,
    /when/i,
    /where/i,
    /if.*then/i,
    /given.*find/i,
    /the value of/i,
    /the number of/i
  ];
  
  return questionIndicators.some(pattern => pattern.test(text));
}

/**
 * Check if text has question content (not just options or answers)
 */
function hasQuestionContent(text) {
  // Must have some question words and not just be options
  const hasQuestionWords = /find|calculate|determine|choose|select|arrange|identify|which|what|how|if|given|value|number/i.test(text);
  const isJustOptions = /^\(\d+\)|^\([A-D]\)/i.test(text.trim());
  
  return hasQuestionWords && !isJustOptions;
}

/**
 * Clean question text by removing answer and solution parts
 */
function cleanQuestionText(text) {
  // Remove answer patterns
  text = text.replace(/Ans\.\s*\([^)]+\)[^]*$/i, '');
  text = text.replace(/Answer:\s*[^]*$/i, '');
  
  // Remove solution patterns
  text = text.replace(/Sol\.\s*[^]*$/i, '');
  text = text.replace(/Solution:\s*[^]*$/i, '');
  
  // Remove explanation patterns
  text = text.replace(/Explanation:\s*[^]*$/i, '');
  
  // Remove common ending patterns that indicate solution start
  const solutionStarters = [
    /Explanation[\s\S]*$/i,
    /Working[\s\S]*$/i,
    /Method[\s\S]*$/i,
    /Approach[\s\S]*$/i
  ];
  
  solutionStarters.forEach(pattern => {
    text = text.replace(pattern, '');
  });
  
  return text.trim();
}

/**
 * Extract options from question text
 */
function extractOptions(text) {
  const options = [];
  
  // Stop extracting options when we hit answer patterns
  const stopPatterns = [
    /Ans\.\s*\(/i,
    /Answer:\s*/i,
    /Sol\.\s*/i,
    /Solution:\s*/i
  ];
  
  // Find where to stop extracting options
  let stopIndex = text.length;
  stopPatterns.forEach(pattern => {
    const match = text.match(pattern);
    if (match && match.index < stopIndex) {
      stopIndex = match.index;
    }
  });
  
  // Only extract options before the answer/solution
  const optionText = text.substring(0, stopIndex);
  
  // First, try to find all options in sequence using a comprehensive pattern
  const comprehensivePattern = /\(([A-D1-4])\)\s*([^\(]*?)(?=\([A-D1-4]\)|$)/g;
  let match;
  
  while ((match = comprehensivePattern.exec(optionText)) !== null) {
    const optionLetter = match[1];
    let optionTextContent = match[2].trim();
    
    // Clean up the option text
    optionTextContent = optionTextContent.replace(/\s+/g, ' ').trim();
    
    // Filter out very short options and invalid patterns
    if (optionTextContent.length > 3 && !optionTextContent.match(/^[A-D1-4]\)/)) {
      options.push({
        letter: optionLetter,
        text: optionTextContent
      });
    }
  }
  
  // If no options found with comprehensive pattern, try alternative approaches
  if (options.length === 0) {
    // Try letter format specifically
    const letterPattern = /\(([A-D])\)\s*([^\(]*?)(?=\([A-D]\)|$)/g;
    while ((match = letterPattern.exec(text)) !== null) {
      const optionLetter = match[1];
      let optionText = match[2].trim();
      
      if (optionText.length > 3) {
        options.push({
          letter: optionLetter,
          text: optionText
        });
      }
    }
  }
  
  // If still no options, try number format specifically
  if (options.length === 0) {
    const numberPattern = /\(([1-4])\)\s*([^\(]*?)(?=\([1-4]\)|$)/g;
    while ((match = numberPattern.exec(text)) !== null) {
      const optionNumber = match[1];
      let optionText = match[2].trim();
      
      if (optionText.length > 3) {
        options.push({
          letter: optionNumber,
          text: optionText
        });
      }
    }
  }
  
  // Sort options by letter/number for consistency
  options.sort((a, b) => {
    const aIsNumber = /^\d$/.test(a.letter);
    const bIsNumber = /^\d$/.test(b.letter);
    
    if (aIsNumber && bIsNumber) {
      return parseInt(a.letter) - parseInt(b.letter);
    } else if (!aIsNumber && !bIsNumber) {
      return a.letter.localeCompare(b.letter);
    } else {
      return aIsNumber ? -1 : 1;
    }
  });
  
  return options;
}

/**
 * Format text for rich text editor (TinyMCE/Quill)
 * Enhanced version with proper LaTeX handling
 */
function formatForRichTextEditor(text) {
  return enhancedFormatForRichTextEditor(text);
}

/**
 * Format text for LaTeX rendering (separate from HTML formatting)
 */
function formatForLaTeX(text) {
  if (!text) return '';
  
  let formatted = text;
  
  // Convert mathematical expressions to LaTeX format
  formatted = convertMathToLaTeX(formatted);
  
  // Convert chemical equations to proper format
  formatted = convertChemistryToFormatted(formatted);
  
  return formatted;
}

/**
 * Convert mathematical expressions to LaTeX format
 * Enhanced version with better OCR artifact handling
 */
function convertMathToLaTeX(text) {
  return enhancedMathToLaTeX(text);
}

/**
 * Convert mathematical expressions to tiny-math-block format
 * This creates the HTML structure that works well with the frontend
 */
function convertMathToTinyMathBlock(text) {
  if (!text) return '';

  let result = text;

  // Handle $...$ expressions directly
  result = result.replace(/\$([^$]+)\$/g, (match, content) => {
    const cleanContent = content.trim();
    // Convert LaTeX to MathML for the content
    const mathml = convertLaTeXToMathML(cleanContent);
    return `<tiny-math-block formula="${cleanContent}"><math><mrow>${mathml}</mrow></math></tiny-math-block>`;
  });

  // Handle inline math expressions \(...\) - handle the case where the entire text is wrapped
  if (result.startsWith('\\(') && result.endsWith('\\)')) {
    const content = result.slice(2, -2).trim();
    const mathml = convertLaTeXToMathML(content);
    return `<tiny-math-block formula="${content}"><math><mrow>${mathml}</mrow></math></tiny-math-block>`;
  }

  // Handle inline math expressions \(...\) - handle partial matches
  result = result.replace(/\\\(([^)]+)\\\)/g, (match, content) => {
    const cleanContent = content.trim();
    const mathml = convertLaTeXToMathML(cleanContent);
    return `<tiny-math-block formula="${cleanContent}"><math><mrow>${mathml}</mrow></math></tiny-math-block>`;
  });

  // Handle display math expressions \[...\]
  result = result.replace(/\\\[([^\]]+)\\\]/g, (match, content) => {
    const cleanContent = content.trim();
    const mathml = convertLaTeXToMathML(cleanContent);
    return `<tiny-math-block formula="${cleanContent}"><math><mrow>${mathml}</mrow></math></tiny-math-block>`;
  });

  // Handle mathematical expressions without delimiters (Greek letters, operators, etc.)
  // Look for patterns that contain mathematical symbols
  const mathPattern = /([αβγδεζηθικλμνξοπρστυφχψω][αβγδεζηθικλμνξοπρστυφχψωa-zA-Z0-9+\-*/=<>(){}[\]^_|\\\s]*)/g;
  result = result.replace(mathPattern, (match) => {
    // Only convert if it looks like a mathematical expression and contains Greek letters
    if (match.length > 1 && /[αβγδεζηθικλμνξοπρστυφχψω]/.test(match)) {
      const mathml = convertLaTeXToMathML(match);
      return `<tiny-math-block formula="${match}"><math><mrow>${mathml}</mrow></math></tiny-math-block>`;
    }
    return match;
  });

  return result;
}

/**
 * Convert LaTeX expressions to tiny-math-block HTML format
 */
function convertLaTeXToTinyMathBlock(text) {
  if (!text) return '';
  
  let result = text;
  
  // Handle inline math expressions \(...\)
  result = result.replace(/\\\(([^)]+)\\\)/g, (match, content) => {
    const cleanContent = content.trim();
    return `<tiny-math-block formula="${cleanContent}"><math><mrow>${convertLaTeXToMathML(cleanContent)}</mrow></math></tiny-math-block>`;
  });
  
  // Handle display math expressions \[...\]
  result = result.replace(/\\\[([^\]]+)\\\]/g, (match, content) => {
    const cleanContent = content.trim();
    return `<tiny-math-block formula="${cleanContent}"><math><mrow>${convertLaTeXToMathML(cleanContent)}</mrow></math></tiny-math-block>`;
  });
  
  // Handle $...$ expressions
  result = result.replace(/\$([^$]+)\$/g, (match, content) => {
    const cleanContent = content.trim();
    return `<tiny-math-block formula="${cleanContent}"><math><mrow>${convertLaTeXToMathML(cleanContent)}</mrow></math></tiny-math-block>`;
  });
  
  return result;
}

/**
 * Convert LaTeX to MathML (simplified version)
 * This is a basic converter for common mathematical expressions
 */
function convertLaTeXToMathML(latex) {
  if (!latex) return '';

  // For now, let's use a simple approach that just returns the original text
  // The frontend can handle the rendering with MathJax
  return latex;
}

/**
 * Convert chemical equations to formatted text
 */
function convertChemistryToFormatted(text) {
  let formatted = text;
  
  // Chemical formulas with subscripts
  formatted = formatted.replace(/([A-Z][a-z]?)(\d+)/g, '$1<sub>$2</sub>');
  
  // Chemical states: (s), (l), (g), (aq)
  formatted = formatted.replace(/\(([slgaq])\)/g, '<sub>($1)</sub>');
  
  // Arrows in chemical equations
  formatted = formatted
    .replace(/→/g, '→')
    .replace(/⇌/g, '⇌');
  
  return formatted;
}

/**
 * Extract equations for KaTeX rendering
 */
function extractEquationsForKaTeX(text) {
  const equations = [];
  
  // Find mathematical expressions
  const mathPatterns = [
    // Fractions
    /(\w+\/\w+)/g,
    // Powers
    /(\w+\^\d+)/g,
    // Square roots
    /(√[^√\s]+)/g,
    // Integrals
    /(∫[^∫]*)/g,
    // Chemical formulas
    /([A-Z][a-z]?\d*[A-Z][a-z]?\d*)/g
  ];
  
  mathPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const equation = match[1];
      const latex = convertMathToLaTeX(equation);
      
      equations.push({
        original: equation,
        latex: latex,
        type: getEquationType(equation)
      });
    }
  });
  
  return equations;
}

/**
 * Determine equation type
 */
function getEquationType(equation) {
  if (equation.includes('/')) return 'fraction';
  if (equation.includes('^')) return 'power';
  if (equation.includes('√')) return 'square_root';
  if (equation.includes('∫')) return 'integral';
  if (/[A-Z][a-z]?\d*/.test(equation)) return 'chemical_formula';
  return 'mathematical';
}

/**
 * Extract mathematical equations
 */
function extractMathEquations(text) {
  const equations = [];
  
  // Common math patterns
  const mathPatterns = [
    /[a-zA-Z]\s*[+\-*/=]\s*[a-zA-Z0-9\s+\-*/=()^]+/g,
    /∫[^∫]*?dx/g,
    /∑[^∑]*?/g,
    /√[^√\s]+/g,
    /[a-zA-Z]²|[a-zA-Z]³|[a-zA-Z]\^[0-9]+/g,
    /sin|cos|tan|log|ln|exp/g
  ];
  
  mathPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      equations.push({
        equation: match[0],
        type: 'mathematical',
        position: match.index
      });
    }
  });
  
  return equations;
}

/**
 * Extract chemical equations
 */
function extractChemicalEquations(text) {
  const equations = [];
  
  // Chemical equation patterns
  const chemPatterns = [
    /[A-Z][a-z]?\d*\s*\+\s*[A-Z][a-z]?\d*\s*→\s*[A-Z][a-z]?\d*/g,
    /[A-Z][a-z]?\d*\s*⇌\s*[A-Z][a-z]?\d*/g,
    /[A-Z][a-z]?\d*\s*\([slgaq]\)/g
  ];
  
  chemPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      equations.push({
        equation: match[0],
        type: 'chemical',
        position: match.index
      });
    }
  });
  
  return equations;
}

/**
 * Extract topics and subtopics from text following JEE hierarchy
 */
function extractTopics(text) {
  const topics = [];
  
  // JEE topic and subtopic keywords following the proper hierarchy
  const topicSubtopicMappings = {
    // Mathematics
    'Algebra': {
      keywords: ['algebra', 'polynomial', 'quadratic', 'linear equation', 'matrix', 'determinant'],
      subtopics: ['Quadratic Equations', 'Matrices', 'Complex Numbers', 'Sequences and Series']
    },
    'Calculus': {
      keywords: ['calculus', 'derivative', 'integral', 'limit', 'differentiation', 'integration'],
      subtopics: ['Differentiation', 'Integration', 'Limits', 'Applications of Derivatives']
    },
    'Geometry': {
      keywords: ['geometry', 'triangle', 'circle', 'rectangle', 'area', 'perimeter', 'coordinate'],
      subtopics: ['Coordinate Geometry', 'Conic Sections', '3D Geometry', 'Lines and Planes']
    },
    'Trigonometry': {
      keywords: ['trigonometry', 'sin', 'cos', 'tan', 'trigonometric', 'angle'],
      subtopics: ['Trigonometric Functions', 'Trigonometric Identities', 'Inverse Trigonometric Functions']
    },
    
    // Physics
    'Mechanics': {
      keywords: ['mechanics', 'motion', 'force', 'acceleration', 'velocity', 'momentum'],
      subtopics: ['Kinematics', 'Dynamics', 'Work & Energy', 'Rotational Motion']
    },
    'Electricity & Magnetism': {
      keywords: ['electricity', 'magnetism', 'electric', 'magnetic', 'current', 'voltage'],
      subtopics: ['Electrostatics', 'Current Electricity', 'Magnetic Effects', 'Electromagnetic Induction']
    },
    'Waves & Optics': {
      keywords: ['waves', 'optics', 'light', 'sound', 'reflection', 'refraction'],
      subtopics: ['Wave Motion', 'Sound Waves', 'Light Waves', 'Optical Instruments']
    },
    'Thermodynamics': {
      keywords: ['thermodynamics', 'heat', 'temperature', 'entropy', 'gas laws'],
      subtopics: ['Heat Transfer', 'Thermodynamic Laws', 'Kinetic Theory', 'Thermal Properties']
    },
    
    // Chemistry
    'Physical Chemistry': {
      keywords: ['physical chemistry', 'thermodynamics', 'kinetics', 'equilibrium', 'mole'],
      subtopics: ['Thermodynamics', 'Chemical Kinetics', 'Chemical Equilibrium', 'Atomic Structure']
    },
    'Organic Chemistry': {
      keywords: ['organic', 'carbon', 'hydrocarbon', 'reaction', 'synthesis'],
      subtopics: ['Hydrocarbons', 'Functional Groups', 'Reaction Mechanisms', 'Biomolecules']
    },
    'Inorganic Chemistry': {
      keywords: ['inorganic', 'periodic table', 'coordination', 'metals', 'non-metals'],
      subtopics: ['Periodic Properties', 'Chemical Bonding', 'Coordination Compounds', 's-Block Elements']
    }
  };
  
  Object.entries(topicSubtopicMappings).forEach(([topic, data]) => {
    const matches = data.keywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    if (matches.length > 0) {
      topics.push({
        name: topic,
        confidence: matches.length / data.keywords.length,
        matchedKeywords: matches,
        possibleSubtopics: data.subtopics
      });
    }
  });
  
  return topics;
}

/**
 * Extract subtopics from text
 */
function extractSubtopics(text, topics) {
  const subtopics = [];
  
  for (const topic of topics) {
    if (topic.possibleSubtopics) {
      for (const subtopicName of topic.possibleSubtopics) {
        const subtopicKeywords = getSubtopicKeywords(subtopicName);
        const matches = subtopicKeywords.filter(keyword => 
          text.toLowerCase().includes(keyword.toLowerCase())
        );
        if (matches.length > 0) {
          subtopics.push({
            name: subtopicName,
            parentTopic: topic.name,
            confidence: matches.length / subtopicKeywords.length,
            matchedKeywords: matches
          });
        }
      }
    }
  }
  
  return subtopics;
}

/**
 * Get keywords for specific subtopics
 */
function getSubtopicKeywords(subtopicName) {
  const subtopicKeywords = {
    'Kinematics': ['velocity', 'acceleration', 'displacement', 'motion', 'kinematics'],
    'Dynamics': ['force', 'newton', 'friction', 'dynamics', 'momentum'],
    'Electrostatics': ['charge', 'electric field', 'coulomb', 'electrostatic', 'potential'],
    'Current Electricity': ['current', 'resistance', 'circuit', 'ohm', 'power'],
    'Quadratic Equations': ['quadratic', 'discriminant', 'roots', 'equation'],
    'Integration': ['integral', 'integration', 'antiderivative', 'definite integral'],
    'Differentiation': ['derivative', 'differentiation', 'rate of change', 'slope'],
    'Coordinate Geometry': ['coordinates', 'distance', 'midpoint', 'slope', 'equation of line'],
    'Chemical Bonding': ['bond', 'ionic', 'covalent', 'electronegativity', 'hybridization'],
    'Organic Reactions': ['reaction', 'mechanism', 'substitution', 'elimination', 'addition']
  };
  
  return subtopicKeywords[subtopicName] || [subtopicName.toLowerCase()];
}

/**
 * Extract tags from text
 */
function extractTags(text) {
  const tags = [];
  
  // Common JEE tags
  const tagKeywords = {
    'Previous Year': ['previous year', 'pyq'],
    'JEE Mains': ['jee mains', 'mains'],
    'JEE Advanced': ['jee advanced', 'advanced'],
    'Multiple Choice': ['multiple choice', 'mcq'],
    'Numerical': ['numerical', 'numerical value'],
    'Conceptual': ['concept', 'conceptual'],
    'Formula Based': ['formula', 'formulae']
  };
  
  Object.entries(tagKeywords).forEach(([tag, keywords]) => {
    const matches = keywords.filter(keyword => 
      text.toLowerCase().includes(keyword.toLowerCase())
    );
    if (matches.length > 0) {
      tags.push(tag);
    }
  });
  
  return tags;
}

/**
 * Extract images from PDF
 */
async function extractPDFImages(pdfPath, fileName) {
  try {
    const baseFileName = path.parse(fileName).name;
    const outputDir = path.join(CONFIG.outputBaseDir, 'processed-images', baseFileName);
    await fs.ensureDir(outputDir);
    
    const convert = fromPath(pdfPath, {
      density: CONFIG.pdfProcessing.density,
      saveFilename: 'page',
      savePath: outputDir,
      format: CONFIG.pdfProcessing.format,
      quality: CONFIG.pdfProcessing.quality
    });
    
    const results = await convert.bulk(-1);
    
    return results.map(result => ({
      page: result.page,
      filename: result.name,
      path: result.path,
      relativePath: path.relative(CONFIG.outputBaseDir, result.path)
    }));
    
  } catch (error) {
    console.error(`❌ Failed to extract images from ${fileName}:`, error.message);
    return [];
  }
}

/**
 * Perform OCR on image
 */
async function performOCR(imagePath) {
  try {
    const result = await Tesseract.recognize(imagePath, CONFIG.imageProcessing.ocrLanguage, {
      logger: m => {
        if (m.status === 'recognizing text') {
          console.log(`    OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      }
    });
    
    return {
      text: result.data.text,
      confidence: result.data.confidence,
      words: result.data.words
    };
    
  } catch (error) {
    console.error(`❌ OCR failed for ${imagePath}:`, error.message);
    return {
      text: '',
      confidence: 0,
      words: []
    };
  }
}

/**
 * Process and optimize image
 */
async function processAndOptimizeImage(imagePath, fileName) {
  try {
    const baseFileName = path.parse(fileName).name;
    const outputDir = path.join(CONFIG.outputBaseDir, 'processed-images');
    await fs.ensureDir(outputDir);
    
    const outputPath = path.join(outputDir, `${baseFileName}.webp`);
    
    await sharp(imagePath)
      .resize(CONFIG.imageProcessing.imageOptimization.maxWidth, 
              CONFIG.imageProcessing.imageOptimization.maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: CONFIG.imageProcessing.imageOptimization.quality })
      .toFile(outputPath);
    
    return path.relative(CONFIG.outputBaseDir, outputPath);
    
  } catch (error) {
    console.error(`❌ Image processing failed for ${fileName}:`, error.message);
    return null;
  }
}

/**
 * Find files with specific extension
 */
async function findFiles(dir, extension) {
  const files = [];
  
  async function searchDirectory(currentDir) {
    try {
      const items = await fs.readdir(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await searchDirectory(fullPath);
        } else if (path.extname(item).toLowerCase() === extension.toLowerCase()) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`⚠️ Cannot read directory ${currentDir}:`, error.message);
    }
  }
  
  await searchDirectory(dir);
  return files;
}

/**
 * Save PDF JSON result
 */
async function savePDFJson(result) {
  const fileName = path.parse(result.relativePath).name;
  const fileExtension = '.json';
  
  // Determine output path based on folder structure preservation
  let outputPath;
  if (CONFIG.fileHandling.preserveFolderStructure) {
    // Preserve the original folder structure
    const relativeDir = path.dirname(result.relativePath);
    const outputDir = path.join(CONFIG.outputBaseDir, 'pdfs', relativeDir);
    await fs.ensureDir(outputDir);
    outputPath = path.join(outputDir, `${fileName}${fileExtension}`);
  } else {
    // Flatten structure (original behavior)
    outputPath = path.join(CONFIG.outputBaseDir, 'pdfs', `${fileName}${fileExtension}`);
  }
  
  // Handle existing files
  if (await fs.pathExists(outputPath)) {
    if (CONFIG.fileHandling.skipExistingFiles) {
      console.log(`  ⏭️ Skipping existing file: ${path.relative(CONFIG.outputBaseDir, outputPath)}`);
      return;
    }
    
    if (CONFIG.fileHandling.backupExistingFiles) {
      const backupPath = outputPath.replace(fileExtension, `.backup${Date.now()}${fileExtension}`);
      await fs.move(outputPath, backupPath);
      console.log(`  💾 Backed up existing file: ${path.relative(CONFIG.outputBaseDir, backupPath)}`);
    }
  }
  
  await fs.writeJSON(outputPath, result, { spaces: CONFIG.jsonStructure.prettify ? 2 : 0 });
  console.log(`  💾 Saved: ${path.relative(CONFIG.outputBaseDir, outputPath)}`);
}

/**
 * Save Image JSON result
 */
async function saveImageJson(result) {
  const fileName = path.parse(result.relativePath).name;
  const fileExtension = '.json';
  
  // Determine output path based on folder structure preservation
  let outputPath;
  if (CONFIG.fileHandling.preserveFolderStructure) {
    // Preserve the original folder structure
    const relativeDir = path.dirname(result.relativePath);
    const outputDir = path.join(CONFIG.outputBaseDir, 'images', relativeDir);
    await fs.ensureDir(outputDir);
    outputPath = path.join(outputDir, `${fileName}${fileExtension}`);
  } else {
    // Flatten structure (original behavior)
    outputPath = path.join(CONFIG.outputBaseDir, 'images', `${fileName}${fileExtension}`);
  }
  
  // Handle existing files
  if (await fs.pathExists(outputPath)) {
    if (CONFIG.fileHandling.skipExistingFiles) {
      console.log(`  ⏭️ Skipping existing file: ${path.relative(CONFIG.outputBaseDir, outputPath)}`);
      return;
    }
    
    if (CONFIG.fileHandling.backupExistingFiles) {
      const backupPath = outputPath.replace(fileExtension, `.backup${Date.now()}${fileExtension}`);
      await fs.move(outputPath, backupPath);
      console.log(`  💾 Backed up existing file: ${path.relative(CONFIG.outputBaseDir, backupPath)}`);
    }
  }
  
  await fs.writeJSON(outputPath, result, { spaces: CONFIG.jsonStructure.prettify ? 2 : 0 });
  console.log(`  💾 Saved: ${path.relative(CONFIG.outputBaseDir, outputPath)}`);
}

/**
 * Generate summary report
 */
async function generateSummaryReport() {
  console.log('📊 Generating summary report...');
  
  const pdfResults = await fs.readJSON(path.join(CONFIG.outputBaseDir, 'pdfs', 'all-pdfs-processed.json'));
  const imageResults = await fs.readJSON(path.join(CONFIG.outputBaseDir, 'images', 'all-images-processed.json'));
  
  const report = {
    generatedAt: new Date().toISOString(),
    summary: {
      totalPDFs: pdfResults.length,
      successfulPDFs: pdfResults.filter(r => r.success).length,
      failedPDFs: pdfResults.filter(r => !r.success).length,
      totalImages: imageResults.length,
      successfulImages: imageResults.filter(r => r.success).length,
      failedImages: imageResults.filter(r => !r.success).length
    },
    subjectBreakdown: {
      Mathematics: pdfResults.filter(r => r.success && r.metadata?.subject === 'Mathematics').length,
      Physics: pdfResults.filter(r => r.success && r.metadata?.subject === 'Physics').length,
      Chemistry: pdfResults.filter(r => r.success && r.metadata?.subject === 'Chemistry').length,
      Unknown: pdfResults.filter(r => r.success && r.metadata?.subject === 'Unknown').length
    },
    yearBreakdown: {},
    errors: [
      ...pdfResults.filter(r => !r.success).map(r => ({ type: 'PDF', file: r.file, error: r.error })),
      ...imageResults.filter(r => !r.success).map(r => ({ type: 'Image', file: r.file, error: r.error }))
    ]
  };
  
  // Year breakdown
  pdfResults.forEach(result => {
    if (result.success && result.metadata?.year) {
      const year = result.metadata.year;
      report.yearBreakdown[year] = (report.yearBreakdown[year] || 0) + 1;
    }
  });
  
  await fs.writeJSON(
    path.join(CONFIG.outputBaseDir, 'reports', 'conversion-summary.json'),
    report,
    { spaces: 2 }
  );
  
  console.log('✅ Summary report generated');
  console.log(`📊 Processed ${report.summary.successfulPDFs} PDFs and ${report.summary.successfulImages} images`);
  console.log(`📁 Output directory: ${CONFIG.outputBaseDir}`);
}

// CLI execution
if (require.main === module) {
  console.log('🚀 PDF/Image to JSON Converter for JEE Content');
  console.log('================================================');
  
  // Parse command line arguments
  const args = process.argv.slice(2);
  
  // Parse content path
  const pathIndex = args.findIndex(arg => arg === '--content-path');
  if (pathIndex !== -1 && args[pathIndex + 1]) {
    CONFIG.contentBaseDir = args[pathIndex + 1];
    console.log(`📁 Using custom content path: ${CONFIG.contentBaseDir}`);
  }
  
  // Parse file handling options
  const skipExistingIndex = args.findIndex(arg => arg === '--skip-existing');
  if (skipExistingIndex !== -1) {
    CONFIG.fileHandling.skipExistingFiles = true;
    console.log(`⏭️ Will skip existing JSON files`);
  }
  
  const noBackupIndex = args.findIndex(arg => arg === '--no-backup');
  if (noBackupIndex !== -1) {
    CONFIG.fileHandling.backupExistingFiles = false;
    console.log(`⚠️ Will overwrite existing files without backup`);
  }
  
  const flattenIndex = args.findIndex(arg => arg === '--flatten-structure');
  if (flattenIndex !== -1) {
    CONFIG.fileHandling.preserveFolderStructure = false;
    console.log(`📁 Will flatten folder structure (legacy mode)`);
  }
  
  // Check required packages
  try {
    require('pdf-parse');
    require('pdf2pic');
    require('sharp');
    require('tesseract.js');
    require('fs-extra');
  } catch (error) {
    console.error('❌ Missing required packages. Please install:');
    console.error('npm install pdf-parse pdf2pic sharp tesseract.js fs-extra');
    process.exit(1);
  }
  
  convertContentToJson()
    .then(() => {
      console.log('🎉 Conversion completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Conversion failed:', error);
      process.exit(1);
    });
}

module.exports = {
  convertContentToJson,
  processPDF,
  processImage,
  convertMathToTinyMathBlock,
  convertLaTeXToTinyMathBlock,
  convertLaTeXToMathML,
  CONFIG
};
