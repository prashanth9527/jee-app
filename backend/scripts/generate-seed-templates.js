/**
 * Script to generate seed file templates for all PDF files in content directory
 * Maintains exact folder structure and naming conventions
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONTENT_BASE = '../content';
const SEEDS_BASE = './prisma/seeds';

/**
 * Generate a seed file template for a specific PDF
 */
function generateSeedTemplate(pdfFileName, relativePath, sessionInfo) {
  const functionName = pdfFileName
    .replace(/\.pdf$/, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/^(\d+)/, 'seed$1');

  const template = `import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed file for JEE Mathematics Paper - ${sessionInfo}
 * Source: content/${relativePath}/${pdfFileName}
 * 
 * TODO: Extract content from PDF and populate questions
 * This file contains questions from the JEE Mathematics paper with:
 * - Rich text content (HTML) for TinyMCE editor compatibility
 * - LaTeX equations properly formatted for math rendering
 * - Image references for solutions containing diagrams
 * - Proper categorization by topics and subtopics
 */

export async function ${functionName}() {
  console.log('🧮 Starting ${sessionInfo} Paper seeding...');

  // Find required entities
  const jeeStream = await prisma.stream.findUnique({
    where: { code: 'JEE' }
  });

  if (!jeeStream) {
    throw new Error('JEE Stream not found. Please run main seed first.');
  }

  const mathematics = await prisma.subject.findFirst({
    where: { 
      name: 'Mathematics',
      streamId: jeeStream.id 
    }
  });

  if (!mathematics) {
    throw new Error('Mathematics subject not found. Please run main seed first.');
  }

  // TODO: Add questions from ${pdfFileName}
  console.log('⚠️  ${sessionInfo} Paper questions not yet implemented');
  console.log('📄 Please extract questions from: ${pdfFileName}');
  
  // Placeholder for questions data
  const questionsData = [
    // TODO: Add questions extracted from PDF
    /*
    Example question structure:
    {
      stem: \`<p>Question text with <strong>formatting</strong> and $LaTeX$ equations</p>\`,
      explanation: \`<p>Step-by-step solution with $math$ notation</p>\`,
      tip_formula: \`<p><strong>Key formulas:</strong> Important formulas here</p>\`,
      difficulty: 'MEDIUM' as Difficulty,
      yearAppeared: 2025,
      isPreviousYear: true,
      subjectId: mathematics.id,
      // Add topicId, subtopicId as needed
      options: [
        { text: 'Option A', isCorrect: false, order: 1 },
        { text: 'Option B', isCorrect: true, order: 2 },
        { text: 'Option C', isCorrect: false, order: 3 },
        { text: 'Option D', isCorrect: false, order: 4 }
      ],
      tags: [] // Add relevant tag IDs
    }
    */
  ];

  if (questionsData.length > 0) {
    // Create questions with options and tags
    console.log('📝 Creating mathematics questions...');
    
    for (const questionData of questionsData) {
      const { options, tags: questionTags, ...questionFields } = questionData;
      
      const question = await prisma.question.create({
        data: questionFields
      });

      // Create options
      if (options && options.length > 0) {
        await Promise.all(
          options.map(option => 
            prisma.questionOption.create({
              data: {
                questionId: question.id,
                text: option.text,
                isCorrect: option.isCorrect,
                order: option.order
              }
            })
          )
        );
      }

      // Create question-tag relationships
      if (questionTags && questionTags.length > 0) {
        await Promise.all(
          questionTags.map(tagId => 
            prisma.questionTag.create({
              data: {
                questionId: question.id,
                tagId: tagId
              }
            })
          )
        );
      }

      console.log(\`✅ Created question: \${question.stem.substring(0, 50)}...\`);
    }

    console.log(\`🎉 Successfully seeded \${questionsData.length} mathematics questions from ${sessionInfo} Paper\`);
  } else {
    console.log('📝 No questions to seed - PDF content extraction pending');
  }
}

export default ${functionName};`;

  return template;
}

/**
 * Scan content directory and generate templates
 */
function generateTemplates() {
  console.log('🔧 Generating seed file templates...');

  // Mathematics papers for 2025 Session 1
  const mathsPath = 'JEE/Previous Papers/2025/Session1/Maths';
  const fullMathsPath = path.join(CONTENT_BASE, mathsPath);
  
  if (fs.existsSync(fullMathsPath)) {
    const pdfFiles = fs.readdirSync(fullMathsPath).filter(file => file.endsWith('.pdf'));
    
    console.log(`📁 Found ${pdfFiles.length} PDF files in ${mathsPath}`);
    
    // Create seeds directory structure
    const seedsPath = path.join(SEEDS_BASE, mathsPath);
    fs.mkdirSync(seedsPath, { recursive: true });
    
    pdfFiles.forEach(pdfFile => {
      const seedFileName = pdfFile.replace('.pdf', '.seed.ts');
      const seedFilePath = path.join(seedsPath, seedFileName);
      
      // Skip if already exists and has content
      if (fs.existsSync(seedFilePath)) {
        const existingContent = fs.readFileSync(seedFilePath, 'utf8');
        if (existingContent.includes('questionsData = [') && !existingContent.includes('// TODO: Add questions extracted from PDF')) {
          console.log(`⏭️  Skipping ${seedFileName} - already has content`);
          return;
        }
      }
      
      // Extract session info from filename
      const sessionInfo = pdfFile.replace('.pdf', '').replace(/[+]/g, ' ');
      
      // Generate template
      const template = generateSeedTemplate(pdfFile, mathsPath, sessionInfo);
      
      // Write file
      fs.writeFileSync(seedFilePath, template);
      console.log(`✅ Generated: ${seedFileName}`);
    });
    
    // Generate or update seed runner
    generateSeedRunner(mathsPath, pdfFiles);
  }
  
  console.log('🎉 Template generation completed!');
}

/**
 * Generate seed runner file
 */
function generateSeedRunner(mathsPath, pdfFiles) {
  const runnerPath = path.join(SEEDS_BASE, mathsPath, 'seed-runner.ts');
  
  const imports = pdfFiles.map(pdfFile => {
    const functionName = pdfFile
      .replace(/\.pdf$/, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^(\d+)/, 'seed$1');
    const fileName = pdfFile.replace('.pdf', '.seed');
    return `import { ${functionName} } from './${fileName}';`;
  }).join('\n');
  
  const seedCalls = pdfFiles.map(pdfFile => {
    const functionName = pdfFile
      .replace(/\.pdf$/, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .replace(/^(\d+)/, 'seed$1');
    return `    console.log('🔸 Processing: ${pdfFile}');
    await ${functionName}();`;
  }).join('\n\n');

  const runnerContent = `import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Runner for JEE Mathematics Papers - 2025 Session 1
 * 
 * This file coordinates seeding for all mathematics papers in this session
 * Maintains exact folder structure as content directory
 */

// Import individual paper seeds
${imports}

export async function seedMathematics2025Session1() {
  console.log('🧮 Starting JEE Mathematics Papers seeding - 2025 Session 1...');
  
  try {
    // Verify main seed has been run
    const streamCount = await prisma.stream.count();
    if (streamCount === 0) {
      throw new Error('Main seed not found. Please run "npm run db:seed" first.');
    }

    const mathematicsSubject = await prisma.subject.findFirst({
      where: { name: 'Mathematics' }
    });

    if (!mathematicsSubject) {
      throw new Error('Mathematics subject not found. Please run main seed first.');
    }

    console.log('📄 Seeding individual paper files...');
    
${seedCalls}

    // Summary
    const totalQuestions = await prisma.question.count({
      where: {
        isPreviousYear: true,
        yearAppeared: 2025
      }
    });
    
    console.log(\`✅ JEE Mathematics Papers 2025 Session 1 seeding completed!\`);
    console.log(\`📊 Total questions from 2025 Session 1: \${totalQuestions}\`);
    
  } catch (error) {
    console.error('❌ Error during Mathematics 2025 Session 1 seeding:', error);
    throw error;
  }
}

export default seedMathematics2025Session1;`;

  fs.writeFileSync(runnerPath, runnerContent);
  console.log('✅ Generated: seed-runner.ts');
}

// Run the generator
if (require.main === module) {
  generateTemplates();
}

module.exports = { generateTemplates };
