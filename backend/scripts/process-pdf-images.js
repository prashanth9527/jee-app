/**
 * PDF Image Processing Script for JEE Question Papers
 * 
 * This script processes PDF files containing mathematical questions with solutions
 * and extracts images for use in the database seeding process.
 * 
 * Requirements:
 * - pdf2pic (for PDF to image conversion)
 * - sharp (for image processing)
 * - fs-extra (for file operations)
 */

const fs = require('fs-extra');
const path = require('path');
const { fromPath } = require('pdf2pic');
const sharp = require('sharp');

const CONFIG = {
  // Input PDF configuration
  pdfPath: '../content/JEE/Previous Papers/2025/Session1/Maths/2201-Mathematics Paper+With+Sol. Evening.pdf',
  
  // Output directory structure
  outputBaseDir: './public/images/questions',
  outputSubDir: 'mathematics/2201-evening',
  
  // Image processing options
  imageOptions: {
    density: 300,           // DPI for conversion
    saveFilename: 'page',   // Base filename
    savePath: '',          // Will be set dynamically
    format: 'png',         // Output format
    width: 1200,           // Max width
    height: 1600,          // Max height
    quality: 90            // JPEG quality (if format is jpeg)
  },
  
  // Image optimization
  optimization: {
    enabled: true,
    maxWidth: 800,
    maxHeight: 1000,
    quality: 85,
    format: 'webp'         // Modern format for web
  }
};

/**
 * Main processing function
 */
async function processPDFImages() {
  console.log('🖼️  Starting PDF image processing...');
  
  try {
    // Setup directory structure
    await setupDirectories();
    
    // Convert PDF to images
    const imageFiles = await convertPDFToImages();
    
    // Process and optimize images
    await processImages(imageFiles);
    
    // Generate image mapping for questions
    await generateImageMapping(imageFiles);
    
    console.log('✅ PDF image processing completed successfully!');
    
  } catch (error) {
    console.error('❌ Error processing PDF images:', error);
    process.exit(1);
  }
}

/**
 * Setup output directory structure
 */
async function setupDirectories() {
  console.log('📁 Setting up directories...');
  
  const fullOutputPath = path.join(CONFIG.outputBaseDir, CONFIG.outputSubDir);
  
  // Create directories if they don't exist
  await fs.ensureDir(fullOutputPath);
  await fs.ensureDir(path.join(fullOutputPath, 'pages'));
  await fs.ensureDir(path.join(fullOutputPath, 'optimized'));
  await fs.ensureDir(path.join(fullOutputPath, 'thumbnails'));
  
  console.log('✅ Directories created:', fullOutputPath);
}

/**
 * Convert PDF to individual page images
 */
async function convertPDFToImages() {
  console.log('🔄 Converting PDF to images...');
  
  const fullOutputPath = path.join(CONFIG.outputBaseDir, CONFIG.outputSubDir, 'pages');
  
  // Configure pdf2pic
  const convert = fromPath(CONFIG.pdfPath, {
    density: CONFIG.imageOptions.density,
    saveFilename: CONFIG.imageOptions.saveFilename,
    savePath: fullOutputPath,
    format: CONFIG.imageOptions.format,
    width: CONFIG.imageOptions.width,
    height: CONFIG.imageOptions.height
  });
  
  try {
    // Convert all pages
    const results = await convert.bulk(-1); // -1 means all pages
    
    console.log(`✅ Converted ${results.length} pages to images`);
    
    return results.map(result => ({
      page: result.page,
      filename: result.name,
      path: result.path
    }));
    
  } catch (error) {
    console.error('❌ PDF conversion failed:', error);
    throw error;
  }
}

/**
 * Process and optimize images
 */
async function processImages(imageFiles) {
  console.log('🎨 Processing and optimizing images...');
  
  const optimizedPath = path.join(CONFIG.outputBaseDir, CONFIG.outputSubDir, 'optimized');
  const thumbnailPath = path.join(CONFIG.outputBaseDir, CONFIG.outputSubDir, 'thumbnails');
  
  for (const imageFile of imageFiles) {
    try {
      const baseName = path.parse(imageFile.filename).name;
      
      // Create optimized version
      const optimizedFilename = `${baseName}.${CONFIG.optimization.format}`;
      const optimizedFullPath = path.join(optimizedPath, optimizedFilename);
      
      await sharp(imageFile.path)
        .resize(CONFIG.optimization.maxWidth, CONFIG.optimization.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: CONFIG.optimization.quality })
        .toFile(optimizedFullPath);
      
      // Create thumbnail
      const thumbnailFilename = `${baseName}_thumb.${CONFIG.optimization.format}`;
      const thumbnailFullPath = path.join(thumbnailPath, thumbnailFilename);
      
      await sharp(imageFile.path)
        .resize(200, 300, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality: 70 })
        .toFile(thumbnailFullPath);
      
      console.log(`✅ Processed page ${imageFile.page}: ${optimizedFilename}`);
      
    } catch (error) {
      console.error(`❌ Failed to process ${imageFile.filename}:`, error);
    }
  }
}

/**
 * Generate image mapping for question content
 */
async function generateImageMapping(imageFiles) {
  console.log('📋 Generating image mapping...');
  
  const mapping = {
    paper: {
      title: 'JEE Mathematics Paper 2201 Evening Session',
      year: 2025,
      session: 'Session 1',
      shift: 'Evening',
      subject: 'Mathematics',
      totalPages: imageFiles.length
    },
    pages: imageFiles.map(file => ({
      page: file.page,
      originalPath: `/images/questions/${CONFIG.outputSubDir}/pages/${file.filename}`,
      optimizedPath: `/images/questions/${CONFIG.outputSubDir}/optimized/${path.parse(file.filename).name}.webp`,
      thumbnailPath: `/images/questions/${CONFIG.outputSubDir}/thumbnails/${path.parse(file.filename).name}_thumb.webp`,
      description: `Page ${file.page} of JEE Mathematics Paper`,
      questions: [] // To be filled manually or via OCR
    })),
    questionMapping: {
      // Example structure for question-to-image mapping
      // This would need to be filled based on actual PDF content analysis
      "question-1": {
        type: "multiple_choice",
        images: ["page-1"],
        hasEquations: true,
        hasDiagram: false
      },
      "question-2": {
        type: "numerical",
        images: ["page-2"],
        hasEquations: true,
        hasDiagram: true
      }
      // ... more questions
    },
    instructions: {
      usage: "Use these image paths in your seed files",
      example: `
        // In your question stem:
        stem: \`<p>Consider the diagram shown below:</p>
               <img src="/images/questions/mathematics/2201-evening/optimized/page-1.webp" 
                    alt="Question diagram" 
                    style="max-width: 400px; height: auto;" />
               <p>Find the value of x.</p>\`,
      `,
      notes: [
        "Original images are high resolution for printing",
        "Optimized images are for web display",
        "Thumbnails are for preview purposes",
        "All images use modern WebP format for better compression"
      ]
    }
  };
  
  // Save mapping to JSON file
  const mappingPath = path.join(CONFIG.outputBaseDir, CONFIG.outputSubDir, 'image-mapping.json');
  await fs.writeJSON(mappingPath, mapping, { spaces: 2 });
  
  console.log('✅ Image mapping saved to:', mappingPath);
  
  // Generate TypeScript interface for type safety
  await generateTypeScriptInterface(mapping);
}

/**
 * Generate TypeScript interface for image mapping
 */
async function generateTypeScriptInterface(mapping) {
  const tsInterface = `
/**
 * Generated TypeScript interfaces for JEE Mathematics Paper Images
 * Auto-generated on ${new Date().toISOString()}
 */

export interface PaperInfo {
  title: string;
  year: number;
  session: string;
  shift: string;
  subject: string;
  totalPages: number;
}

export interface PageInfo {
  page: number;
  originalPath: string;
  optimizedPath: string;
  thumbnailPath: string;
  description: string;
  questions: string[];
}

export interface QuestionMapping {
  type: 'multiple_choice' | 'numerical' | 'matrix_match' | 'assertion_reason';
  images: string[];
  hasEquations: boolean;
  hasDiagram: boolean;
}

export interface ImageMapping {
  paper: PaperInfo;
  pages: PageInfo[];
  questionMapping: Record<string, QuestionMapping>;
  instructions: {
    usage: string;
    example: string;
    notes: string[];
  };
}

// Constants for easy access
export const IMAGE_BASE_PATH = '/images/questions/${CONFIG.outputSubDir}';
export const TOTAL_PAGES = ${mapping.pages.length};

// Helper functions
export function getPageImage(pageNumber: number, type: 'original' | 'optimized' | 'thumbnail' = 'optimized'): string {
  const page = pages.find(p => p.page === pageNumber);
  if (!page) throw new Error(\`Page \${pageNumber} not found\`);
  
  switch (type) {
    case 'original': return page.originalPath;
    case 'thumbnail': return page.thumbnailPath;
    default: return page.optimizedPath;
  }
}

export function getQuestionImages(questionId: string): string[] {
  const question = questionMapping[questionId];
  if (!question) return [];
  
  return question.images.map(pageRef => 
    getPageImage(parseInt(pageRef.replace('page-', '')))
  );
}

// Export the mapping data
export const imageMapping: ImageMapping = ${JSON.stringify(mapping, null, 2)};
`;

  const tsPath = path.join(CONFIG.outputBaseDir, CONFIG.outputSubDir, 'image-mapping.ts');
  await fs.writeFile(tsPath, tsInterface);
  
  console.log('✅ TypeScript interface saved to:', tsPath);
}

/**
 * CLI helper functions
 */
function printUsageInstructions() {
  console.log(`
📚 PDF Image Processing for JEE Questions

Usage Examples:

1. In your seed file:
   import { getPageImage, getQuestionImages } from './path/to/image-mapping';
   
   const questionStem = \`
     <p>Consider the triangle shown in the figure:</p>
     <img src="\${getPageImage(1, 'optimized')}" alt="Triangle diagram" />
     <p>Find the area of the triangle.</p>
   \`;

2. For questions with multiple images:
   const images = getQuestionImages('question-5');
   const imageHtml = images.map(src => 
     \`<img src="\${src}" alt="Question diagram" style="max-width: 400px;" />\`
   ).join('');

3. Image paths in database:
   - Original: /images/questions/mathematics/2201-evening/pages/page-1.png
   - Optimized: /images/questions/mathematics/2201-evening/optimized/page-1.webp
   - Thumbnail: /images/questions/mathematics/2201-evening/thumbnails/page-1_thumb.webp

Directory Structure Created:
├── public/images/questions/mathematics/2201-evening/
│   ├── pages/          # High-resolution original images
│   ├── optimized/      # Web-optimized images (WebP format)
│   ├── thumbnails/     # Small preview images
│   ├── image-mapping.json    # Image metadata
│   └── image-mapping.ts      # TypeScript interfaces
  `);
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
if (require.main === module) {
  console.log('🚀 Starting PDF Image Processing Script...');
  
  // Check if required packages are installed
  try {
    require('pdf2pic');
    require('sharp');
    require('fs-extra');
  } catch (error) {
    console.error('❌ Missing required packages. Please install:');
    console.error('npm install pdf2pic sharp fs-extra');
    process.exit(1);
  }
  
  // Check if PDF file exists
  if (!fs.existsSync(CONFIG.pdfPath)) {
    console.error('❌ PDF file not found:', CONFIG.pdfPath);
    console.error('Please update the CONFIG.pdfPath to point to your PDF file.');
    process.exit(1);
  }
  
  processPDFImages()
    .then(() => {
      printUsageInstructions();
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  processPDFImages,
  CONFIG
};
