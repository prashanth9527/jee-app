const { MailerService } = require('./dist/src/auth/mailer.service');
require('dotenv').config();

console.log('📧 Testing Application Email Service');
console.log('====================================\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('SMTP_HOST:', process.env.SMTP_HOST || '❌ NOT SET');
console.log('SMTP_PORT:', process.env.SMTP_PORT || '❌ NOT SET');
console.log('SMTP_USER:', process.env.SMTP_USER || '❌ NOT SET');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('SMTP_FROM:', process.env.SMTP_FROM || '❌ NOT SET');
console.log('');

async function testApplicationEmail() {
    try {
        console.log('🔧 Creating MailerService instance...');
        const mailerService = new MailerService();
        
        console.log('📧 Testing OTP email sending...');
        const testEmail = 'test@example.com'; // This will be caught by Mailtrap
        const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
        
        console.log(`Sending OTP email to: ${testEmail}`);
        console.log(`OTP Code: ${testOTP}`);
        
        await mailerService.sendOtpEmail(testEmail, testOTP);
        
        console.log('✅ Application email service working correctly!');
        console.log('📋 Check your Mailtrap inbox for the email');
        
    } catch (error) {
        console.log('❌ Application email service failed:');
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
    }
}

// Run the test
testApplicationEmail().catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
});

