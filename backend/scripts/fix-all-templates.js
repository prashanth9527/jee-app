/**
 * Comprehensive script to fix all TypeScript errors in seed template files
 */

const fs = require('fs');
const path = require('path');

const SEEDS_PATH = './prisma/seeds/JEE/Previous Papers/2025/Session1/Maths';

// Define the interface for question data
const questionInterface = `
interface QuestionOption {
  text: string;
  isCorrect: boolean;
  order: number;
}

interface QuestionData {
  stem: string;
  explanation?: string;
  tip_formula?: string;
  difficulty: Difficulty;
  yearAppeared: number;
  isPreviousYear: boolean;
  subjectId: string;
  topicId?: string;
  subtopicId?: string;
  options: QuestionOption[];
  tags: string[];
}`;

function fixTemplateFile(filePath) {
  console.log(`🔧 Fixing: ${path.basename(filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check if already has interfaces
  if (content.includes('interface QuestionOption')) {
    console.log(`⏭️  Skipping ${path.basename(filePath)} - already has interfaces`);
    return;
  }
  
  // Add the interface after imports
  content = content.replace(
    'const prisma = new PrismaClient();',
    `const prisma = new PrismaClient();
${questionInterface}`
  );
  
  // Fix the questionsData type annotation
  content = content.replace(
    'const questionsData = [',
    'const questionsData: QuestionData[] = ['
  );
  
  // Fix the loop parameter types
  content = content.replace(
    /options\.map\(option =>/g,
    'options.map((option: QuestionOption) =>'
  );
  
  content = content.replace(
    /questionTags\.map\(tagId =>/g,
    'questionTags.map((tagId: string) =>'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Fixed: ${path.basename(filePath)}`);
}

function fixAllTemplates() {
  console.log('🔧 Fixing TypeScript errors in ALL seed templates...');
  
  const files = fs.readdirSync(SEEDS_PATH);
  const templateFiles = files.filter(file => 
    file.endsWith('.seed.ts') && 
    file !== '2201-Mathematics Paper+With+Sol. Evening.seed.ts' // Skip the working evening file
  );
  
  templateFiles.forEach(file => {
    const filePath = path.join(SEEDS_PATH, file);
    try {
      fixTemplateFile(filePath);
    } catch (error) {
      console.error(`❌ Error fixing ${file}:`, error.message);
    }
  });
  
  console.log('✅ All template files processed!');
}

// Run if called directly
if (require.main === module) {
  fixAllTemplates();
}

module.exports = { fixAllTemplates };
