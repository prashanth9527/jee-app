import { PrismaClient, Difficulty } from '@prisma/client';

const prisma = new PrismaClient();

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


/**
 * Seed file for JEE Mathematics Paper - 2801-Mathematics Paper With Sol. Morning
 * Source: content/JEE/Previous Papers/2025/Session1/Maths/2801-Mathematics Paper+With+Sol. Morning.pdf
 * 
 * TODO: Extract content from PDF and populate questions
 * This file contains questions from the JEE Mathematics paper with:
 * - Rich text content (HTML) for TinyMCE editor compatibility
 * - LaTeX equations properly formatted for math rendering
 * - Image references for solutions containing diagrams
 * - Proper categorization by topics and subtopics
 */

export async function seed2801MathematicsPaperWithSolMorning() {
  console.log('🧮 Starting 2801-Mathematics Paper With Sol. Morning Paper seeding...');

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

  // TODO: Add questions from 2801-Mathematics Paper+With+Sol. Morning.pdf
  console.log('⚠️  2801-Mathematics Paper With Sol. Morning Paper questions not yet implemented');
  console.log('📄 Please extract questions from: 2801-Mathematics Paper+With+Sol. Morning.pdf');
  
  // Placeholder for questions data
  const questionsData: QuestionData[] = [
    // TODO: Add questions extracted from PDF
    /*
    Example question structure:
    {
      stem: `<p>Question text with <strong>formatting</strong> and $LaTeX$ equations</p>`,
      explanation: `<p>Step-by-step solution with $math$ notation</p>`,
      tip_formula: `<p><strong>Key formulas:</strong> Important formulas here</p>`,
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
          options.map((option: QuestionOption) => 
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
          questionTags.map((tagId: string) => 
            prisma.questionTag.create({
              data: {
                questionId: question.id,
                tagId: tagId
              }
            })
          )
        );
      }

      console.log(`✅ Created question: ${question.stem.substring(0, 50)}...`);
    }

    console.log(`🎉 Successfully seeded ${questionsData.length} mathematics questions from 2801-Mathematics Paper With Sol. Morning Paper`);
  } else {
    console.log('📝 No questions to seed - PDF content extraction pending');
  }
}

export default seed2801MathematicsPaperWithSolMorning;