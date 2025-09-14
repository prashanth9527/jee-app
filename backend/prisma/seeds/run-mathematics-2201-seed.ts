import { PrismaClient } from '@prisma/client';
import seedMathematics2201Evening from './mathematics-2201-evening-seed';

const prisma = new PrismaClient();

/**
 * Main runner for Mathematics 2201 Evening Paper seed
 * 
 * Usage:
 * 1. Make sure main seed has been run first (npm run db:seed)
 * 2. Run this specific seed: npx tsx backend/prisma/seeds/run-mathematics-2201-seed.ts
 */

async function main() {
  try {
    console.log('🌱 Starting Mathematics 2201 Evening Paper seeding process...');
    
    // Verify that main seed has been run
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

    // Run the mathematics paper seed
    await seedMathematics2201Evening();
    
    console.log('✅ Mathematics 2201 Evening Paper seeding completed successfully!');
    
    // Print summary
    const totalQuestions = await prisma.question.count({
      where: {
        isPreviousYear: true,
        yearAppeared: 2025
      }
    });
    
    console.log(`📊 Summary: ${totalQuestions} total previous year questions from 2025 in database`);
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
