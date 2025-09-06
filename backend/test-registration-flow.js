const { AuthService } = require('./dist/src/auth/auth.service');
const { UsersService } = require('./dist/src/users/users.service');
const { JwtService } = require('./dist/src/auth/jwt.service');
const { OtpService } = require('./dist/src/auth/otp.service');
const { ReferralsService } = require('./dist/src/referrals/referrals.service');
const { PrismaService } = require('./dist/src/prisma/prisma.service');
require('dotenv').config();

console.log('🔍 Testing Registration Flow');
console.log('============================\n');

async function testRegistrationFlow() {
    try {
        console.log('🔧 Initializing services...');
        
        // Initialize services
        const prismaService = new PrismaService();
        const usersService = new UsersService(prismaService);
        const jwtService = new JwtService();
        const otpService = new OtpService(prismaService, null, null); // We'll test mailer separately
        const referralsService = new ReferralsService(prismaService);
        const authService = new AuthService(usersService, jwtService, otpService, referralsService, prismaService);
        
        console.log('✅ Services initialized');
        
        // Test registration data
        const testUser = {
            email: 'test-registration@example.com',
            password: 'TestPassword123!',
            fullName: 'Test User',
            phone: '+919866211858',
            streamId: '1' // Assuming stream ID 1 exists
        };
        
        console.log('\n📧 Testing registration with email:', testUser.email);
        
        try {
            const result = await authService.register(testUser);
            console.log('✅ Registration successful!');
            console.log('User ID:', result.id);
            console.log('Email:', result.email);
        } catch (error) {
            console.log('❌ Registration failed:');
            console.log('Error:', error.message);
            console.log('Stack:', error.stack);
        }
        
    } catch (error) {
        console.log('❌ Test setup failed:');
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
    }
}

// Test OTP generation separately
async function testOTPGeneration() {
    console.log('\n🔐 Testing OTP Generation...');
    
    try {
        const { OtpService } = require('./dist/src/auth/otp.service');
        const { PrismaService } = require('./dist/src/prisma/prisma.service');
        const { MailerService } = require('./dist/src/auth/mailer.service');
        const { SmsService } = require('./dist/src/auth/sms.service');
        
        const prismaService = new PrismaService();
        const mailerService = new MailerService();
        const smsService = new SmsService();
        const otpService = new OtpService(prismaService, mailerService, smsService);
        
        console.log('📧 Testing email OTP...');
        await otpService.sendEmailOtp('test-user-id', 'test@example.com');
        console.log('✅ Email OTP sent successfully!');
        
    } catch (error) {
        console.log('❌ OTP test failed:');
        console.log('Error:', error.message);
        console.log('Stack:', error.stack);
    }
}

// Run the tests
async function runTests() {
    await testOTPGeneration();
    await testRegistrationFlow();
}

runTests().catch(error => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
});

