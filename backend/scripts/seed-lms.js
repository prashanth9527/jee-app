const { execSync } = require('child_process');
const path = require('path');

console.log('🌱 Starting LMS hierarchical seeding...');

try {
  // Run the LMS seed script
  execSync('npx ts-node prisma/lms-seed.ts', {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit'
  });
  
  console.log('✅ LMS seeding completed successfully!');
} catch (error) {
  console.error('❌ Error during LMS seeding:', error.message);
  process.exit(1);
}
