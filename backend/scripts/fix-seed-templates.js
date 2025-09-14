/**
 * Script to fix TypeScript errors in seed template files
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
}
`;

function fixTemplateFile(filePath) {
  console.log(`🔧 Fixing: ${path.basename(filePath)}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  
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
    'for (const questionData of questionsData) {',
    'for (const questionData of questionsData) {'
  );
  
  content = content.replace(
    'options.map(option =>',
    'options.map((option: QuestionOption) =>'
  );
  
  content = content.replace(
    'questionTags.map(tagId =>',
    'questionTags.map((tagId: string) =>'
  );
  
  fs.writeFileSync(filePath, content);
}

function fixAllTemplates() {
  console.log('🔧 Fixing TypeScript errors in seed templates...');
  
  const files = fs.readdirSync(SEEDS_PATH);
  const templateFiles = files.filter(file => 
    file.endsWith('.seed.ts') && 
    !file.includes('Evening.seed.ts') // Skip the working evening file
  );
  
  templateFiles.forEach(file => {
    const filePath = path.join(SEEDS_PATH, file);
    fixTemplateFile(filePath);
  });
  
  console.log('✅ All template files fixed!');
}

// Run if called directly
if (require.main === module) {
  fixAllTemplates();
}

module.exports = { fixAllTemplates };
