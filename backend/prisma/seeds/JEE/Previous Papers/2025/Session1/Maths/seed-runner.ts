import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed Runner for JEE Mathematics Papers - 2025 Session 1
 * 
 * This file coordinates seeding for all mathematics papers in this session
 * Maintains exact folder structure as content directory
 */

// Import individual paper seeds (using default imports since they might have different export names)
import seed2201MathematicsEveningPaper from './2201-Mathematics Paper+With+Sol. Evening.seed';
import seed2201MathematicsPaperWithSolMorning from './2201-Mathematics Paper+With+Sol. Morning.seed';
import seed2301MathematicsPaperWithSolEvening from './2301-Mathematics Paper+With+Sol. Evening.seed';
import seed2301MathematicsPaperWithSolMorning from './2301-Mathematics Paper+With+Sol. Morning.seed';
import seed2401MathematicsPaperWithSolEvening from './2401-Mathematics Paper+With+Sol. Evening.seed';
import seed2401MathematicsPaperWithSolMorning from './2401-Mathematics Paper+With+Sol. Morning.seed';
import seed2801MathematicsPaperWithSolEvening from './2801-Mathematics Paper+With+Sol. Evening.seed';
import seed2801MathematicsPaperWithSolMorning from './2801-Mathematics Paper+With+Sol. Morning.seed';
import seed2901MathematicsPaperWithSolEvening from './2901-Mathematics Paper+With+Sol. Evening.seed';
import seed2901MathematicsPaperWithSolMorning from './2901-Mathematics Paper+With+Sol. Morning.seed';

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
    
    console.log('🔸 Processing: 2201-Mathematics Paper+With+Sol. Evening.pdf');
    await seed2201MathematicsEveningPaper();

    console.log('🔸 Processing: 2201-Mathematics Paper+With+Sol. Morning.pdf');
    await seed2201MathematicsPaperWithSolMorning();

    console.log('🔸 Processing: 2301-Mathematics Paper+With+Sol. Evening.pdf');
    await seed2301MathematicsPaperWithSolEvening();

    console.log('🔸 Processing: 2301-Mathematics Paper+With+Sol. Morning.pdf');
    await seed2301MathematicsPaperWithSolMorning();

    console.log('🔸 Processing: 2401-Mathematics Paper+With+Sol. Evening.pdf');
    await seed2401MathematicsPaperWithSolEvening();

    console.log('🔸 Processing: 2401-Mathematics Paper+With+Sol. Morning.pdf');
    await seed2401MathematicsPaperWithSolMorning();

    console.log('🔸 Processing: 2801-Mathematics Paper+With+Sol. Evening.pdf');
    await seed2801MathematicsPaperWithSolEvening();

    console.log('🔸 Processing: 2801-Mathematics Paper+With+Sol. Morning.pdf');
    await seed2801MathematicsPaperWithSolMorning();

    console.log('🔸 Processing: 2901-Mathematics Paper+With+Sol. Evening.pdf');
    await seed2901MathematicsPaperWithSolEvening();

    console.log('🔸 Processing: 2901-Mathematics Paper+With+Sol. Morning.pdf');
    await seed2901MathematicsPaperWithSolMorning();

    // Summary
    const totalQuestions = await prisma.question.count({
      where: {
        isPreviousYear: true,
        yearAppeared: 2025
      }
    });
    
    console.log(`✅ JEE Mathematics Papers 2025 Session 1 seeding completed!`);
    console.log(`📊 Total questions from 2025 Session 1: ${totalQuestions}`);
    
  } catch (error) {
    console.error('❌ Error during Mathematics 2025 Session 1 seeding:', error);
    throw error;
  }
}

export default seedMathematics2025Session1;