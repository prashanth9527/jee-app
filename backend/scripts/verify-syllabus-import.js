/**
 * Verify Syllabus Import Script
 * 
 * This script verifies that the JEE 2025 syllabus was imported correctly
 * into the database by checking the hierarchy and relationships.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySyllabusImport() {
  console.log('🔍 Verifying JEE 2025 Syllabus Import...');
  console.log('=====================================');
  
  try {
    // Check stream
    const jeeStream = await prisma.stream.findFirst({
      where: { name: { contains: 'JEE' } },
      include: {
        subjects: {
          include: {
            lessons: {
              include: {
                topics: {
                  include: {
                    subtopics: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!jeeStream) {
      console.log('❌ JEE stream not found');
      return;
    }
    
    console.log(`✅ Found JEE stream: ${jeeStream.name}`);
    console.log(`📚 Subjects: ${jeeStream.subjects.length}`);
    
    // Check subjects
    for (const subject of jeeStream.subjects) {
      console.log(`\n📖 Subject: ${subject.name}`);
      console.log(`  📝 Lessons: ${subject.lessons.length}`);
      
      let totalTopics = 0;
      let totalSubtopics = 0;
      
      for (const lesson of subject.lessons) {
        totalTopics += lesson.topics.length;
        totalSubtopics += lesson.topics.reduce((sum, topic) => sum + topic.subtopics.length, 0);
      }
      
      console.log(`  🏷️ Topics: ${totalTopics}`);
      console.log(`  📋 Subtopics: ${totalSubtopics}`);
    }
    
    // Check for specific units
    const physicsSubject = jeeStream.subjects.find(s => s.name === 'PHYSICS');
    if (physicsSubject) {
      console.log('\n🔬 Physics Units Found:');
      const physicsTopics = physicsSubject.lessons.flatMap(l => l.topics);
      const units = physicsTopics.filter(t => t.name.includes('UNIT'));
      units.forEach(unit => {
        console.log(`  - ${unit.name}`);
      });
    }
    
    const chemistrySubject = jeeStream.subjects.find(s => s.name === 'CHEMISTRY');
    if (chemistrySubject) {
      console.log('\n🧪 Chemistry Units Found:');
      const chemistryTopics = chemistrySubject.lessons.flatMap(l => l.topics);
      const units = chemistryTopics.filter(t => t.name.includes('UNIT'));
      units.forEach(unit => {
        console.log(`  - ${unit.name}`);
      });
    }
    
    // Summary
    const totalLessons = jeeStream.subjects.reduce((sum, s) => sum + s.lessons.length, 0);
    const totalTopics = jeeStream.subjects.reduce((sum, s) => 
      sum + s.lessons.reduce((sum2, l) => sum2 + l.topics.length, 0), 0);
    const totalSubtopics = jeeStream.subjects.reduce((sum, s) => 
      sum + s.lessons.reduce((sum2, l) => 
        sum2 + l.topics.reduce((sum3, t) => sum3 + t.subtopics.length, 0), 0), 0);
    
    console.log('\n📊 Import Summary:');
    console.log(`  📚 Stream: 1 (${jeeStream.name})`);
    console.log(`  📖 Subjects: ${jeeStream.subjects.length}`);
    console.log(`  📝 Lessons: ${totalLessons}`);
    console.log(`  🏷️ Topics: ${totalTopics}`);
    console.log(`  📋 Subtopics: ${totalSubtopics}`);
    
    console.log('\n✅ Syllabus import verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run verification
if (require.main === module) {
  verifySyllabusImport().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { verifySyllabusImport };
