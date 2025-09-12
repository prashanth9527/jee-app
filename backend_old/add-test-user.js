const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function addTestUser() {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: 'test@example.com' },
          { phone: '+919866211858' }
        ]
      }
    });

    if (existingUser) {
      console.log('Test user already exists:', existingUser.email);
      return;
    }

    // Create test user
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        phone: '+919866211858',
        fullName: 'Test User',
        hashedPassword: await bcrypt.hash('test123', 10),
        role: 'STUDENT',
        emailVerified: true,
        phoneVerified: true,
        trialStartedAt: new Date(),
        trialEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        aiTestsUsed: 0,
        aiTestsLimit: 10,
        lastAiResetAt: new Date(),
      },
    });

    console.log('✅ Test user created successfully:');
    console.log('Email:', testUser.email);
    console.log('Phone:', testUser.phone);
    console.log('Password: test123');
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestUser();
