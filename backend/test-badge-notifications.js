const { MailerService } = require('./dist/src/auth/mailer.service');

async function testBadgeNotifications() {
  console.log('🧪 Testing Badge Notification Emails...\n');

  const mailerService = new MailerService();

  // Test data for different badge types
  const testBadges = [
    {
      userName: 'John Doe',
      badgeTitle: 'Lesson Master',
      badgeDescription: 'Completed the entire lesson',
      badgeType: 'COMPLETION',
      lessonName: 'Introduction to Calculus',
      subjectName: 'Mathematics',
      earnedAt: new Date().toISOString()
    },
    {
      userName: 'Jane Smith',
      badgeTitle: 'Speed Demon',
      badgeDescription: 'Completed lesson in record time',
      badgeType: 'SPEED_DEMON',
      lessonName: 'Organic Chemistry Basics',
      subjectName: 'Chemistry',
      earnedAt: new Date().toISOString()
    },
    {
      userName: 'Alex Johnson',
      badgeTitle: 'Perfect Score',
      badgeDescription: 'Achieved 100% score in all assessments',
      badgeType: 'PERFECT_SCORE',
      lessonName: 'Physics Fundamentals',
      subjectName: 'Physics',
      earnedAt: new Date().toISOString()
    }
  ];

  // Test email (replace with your email for testing)
  const testEmail = process.env.TEST_EMAIL || 'test@example.com';

  console.log(`📧 Sending test emails to: ${testEmail}\n`);

  for (let i = 0; i < testBadges.length; i++) {
    const badge = testBadges[i];
    console.log(`🏆 Testing badge ${i + 1}: ${badge.badgeTitle}`);
    
    try {
      await mailerService.sendBadgeAchievementEmail(testEmail, badge);
      console.log(`✅ Badge notification sent successfully!`);
    } catch (error) {
      console.error(`❌ Failed to send badge notification:`, error.message);
    }
    
    console.log(''); // Empty line for readability
    
    // Wait 2 seconds between emails to avoid rate limiting
    if (i < testBadges.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('🎉 Badge notification testing completed!');
  console.log('\n📝 Check your email inbox (and spam folder) for the test emails.');
  console.log('💡 Make sure your SMTP configuration is working properly.');
}

// Run the test
testBadgeNotifications().catch(console.error);






