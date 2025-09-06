const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

console.log('🔍 Email Configuration Test Script');
console.log('=====================================\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('SMTP_HOST:', process.env.SMTP_HOST || '❌ NOT SET');
console.log('SMTP_PORT:', process.env.SMTP_PORT || '❌ NOT SET');
console.log('SMTP_USER:', process.env.SMTP_USER || '❌ NOT SET');
console.log('SMTP_PASS:', process.env.SMTP_PASS ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('SMTP_FROM:', process.env.SMTP_FROM || '❌ NOT SET');
console.log('');

// Validate required environment variables
const requiredVars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:', missingVars.join(', '));
    console.log('\n📝 Please create a .env file in the backend directory with the following:');
    console.log('SMTP_HOST=smtp.mailtrap.io');
    console.log('SMTP_PORT=587');
    console.log('SMTP_USER=your_mailtrap_username');
    console.log('SMTP_PASS=your_mailtrap_password');
    console.log('SMTP_FROM=no-reply@jeemaster.com');
    process.exit(1);
}

// Create transporter
console.log('🔧 Creating SMTP transporter...');
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false // Allow self-signed certificates in development
    }
});

// Test SMTP connection
async function testSMTPConnection() {
    console.log('🔌 Testing SMTP connection...');
    try {
        await transporter.verify();
        console.log('✅ SMTP connection successful!');
        return true;
    } catch (error) {
        console.log('❌ SMTP connection failed:');
        console.log('Error:', error.message);
        console.log('Code:', error.code);
        console.log('Command:', error.command);
        return false;
    }
}

// Test email sending
async function testEmailSending() {
    console.log('\n📧 Testing email sending...');
    
    const testEmail = {
        from: process.env.SMTP_FROM || 'no-reply@jeemaster.com',
        to: 'test@example.com', // This will be caught by Mailtrap
        subject: 'JEE Master - Email Test',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Test</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f97316, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 JEE Master</h1>
                        <p>Email Configuration Test</p>
                    </div>
                    <div class="content">
                        <h2>✅ Email Test Successful!</h2>
                        <p>This is a test email to verify that your email configuration is working correctly.</p>
                        <p><strong>Test Details:</strong></p>
                        <ul>
                            <li>SMTP Host: ${process.env.SMTP_HOST}</li>
                            <li>SMTP Port: ${process.env.SMTP_PORT}</li>
                            <li>From: ${process.env.SMTP_FROM || 'no-reply@jeemaster.com'}</li>
                            <li>Timestamp: ${new Date().toISOString()}</li>
                        </ul>
                        <p>If you can see this email, your Mailtrap configuration is working correctly!</p>
                    </div>
                    <div class="footer">
                        <p>This is a test email from JEE Master application.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            JEE Master - Email Test
            
            This is a test email to verify that your email configuration is working correctly.
            
            Test Details:
            - SMTP Host: ${process.env.SMTP_HOST}
            - SMTP Port: ${process.env.SMTP_PORT}
            - From: ${process.env.SMTP_FROM || 'no-reply@jeemaster.com'}
            - Timestamp: ${new Date().toISOString()}
            
            If you can see this email, your Mailtrap configuration is working correctly!
        `
    };

    try {
        const info = await transporter.sendMail(testEmail);
        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
        return true;
    } catch (error) {
        console.log('❌ Email sending failed:');
        console.log('Error:', error.message);
        console.log('Code:', error.code);
        console.log('Command:', error.command);
        return false;
    }
}

// Test OTP email (similar to the actual application)
async function testOTPEmail() {
    console.log('\n🔐 Testing OTP email format...');
    
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const otpEmail = {
        from: process.env.SMTP_FROM || 'no-reply@jeemaster.com',
        to: 'test@example.com',
        subject: 'Email Verification Code - JEE Master',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Email Verification</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #f97316, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; }
                    .otp-code { background: #f3f4f6; border: 2px solid #f97316; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                    .otp-digits { font-size: 32px; font-weight: bold; color: #f97316; letter-spacing: 8px; font-family: monospace; }
                    .footer { background: #f9fafb; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 14px; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎓 JEE Master</h1>
                        <p>Email Verification Required</p>
                    </div>
                    <div class="content">
                        <h2>Welcome to JEE Master!</h2>
                        <p>Thank you for registering with JEE Master. To complete your account setup and start your JEE preparation journey, please verify your email address using the code below:</p>
                        
                        <div class="otp-code">
                            <p style="margin: 0 0 10px 0; font-size: 16px; color: #6b7280;">Your verification code:</p>
                            <div class="otp-digits">${otpCode}</div>
                        </div>
                        
                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>This code will expire in 10 minutes</li>
                            <li>Do not share this code with anyone</li>
                            <li>If you didn't request this code, please ignore this email</li>
                        </ul>
                        
                        <p>Once verified, you'll have access to:</p>
                        <ul>
                            <li>📚 Comprehensive JEE practice questions</li>
                            <li>📊 Detailed performance analytics</li>
                            <li>🎯 Personalized study recommendations</li>
                            <li>🏆 Leaderboards and competitions</li>
                        </ul>
                    </div>
                    <div class="footer">
                        <p>This email was sent from JEE Master. If you have any questions, please contact our support team.</p>
                        <p>© 2024 JEE Master. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `,
        text: `
            JEE Master - Email Verification
            
            Welcome to JEE Master!
            
            Thank you for registering with JEE Master. To complete your account setup and start your JEE preparation journey, please verify your email address using the code below:
            
            Your verification code: ${otpCode}
            
            Important:
            - This code will expire in 10 minutes
            - Do not share this code with anyone
            - If you didn't request this code, please ignore this email
            
            Once verified, you'll have access to:
            - Comprehensive JEE practice questions
            - Detailed performance analytics
            - Personalized study recommendations
            - Leaderboards and competitions
            
            This email was sent from JEE Master. If you have any questions, please contact our support team.
            
            © 2024 JEE Master. All rights reserved.
        `
    };

    try {
        const info = await transporter.sendMail(otpEmail);
        console.log('✅ OTP email sent successfully!');
        console.log('OTP Code:', otpCode);
        console.log('Message ID:', info.messageId);
        return true;
    } catch (error) {
        console.log('❌ OTP email sending failed:');
        console.log('Error:', error.message);
        return false;
    }
}

// Main test function
async function runTests() {
    console.log('🚀 Starting email tests...\n');
    
    // Test 1: SMTP Connection
    const connectionSuccess = await testSMTPConnection();
    if (!connectionSuccess) {
        console.log('\n❌ SMTP connection failed. Please check your Mailtrap credentials.');
        process.exit(1);
    }
    
    // Test 2: Basic Email Sending
    const emailSuccess = await testEmailSending();
    if (!emailSuccess) {
        console.log('\n❌ Basic email sending failed.');
        process.exit(1);
    }
    
    // Test 3: OTP Email Format
    const otpSuccess = await testOTPEmail();
    if (!otpSuccess) {
        console.log('\n❌ OTP email sending failed.');
        process.exit(1);
    }
    
    console.log('\n🎉 All email tests passed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Check your Mailtrap inbox at https://mailtrap.io/inboxes');
    console.log('2. You should see 2 test emails in your inbox');
    console.log('3. If emails are not visible, check your Mailtrap project settings');
    console.log('4. Make sure you\'re using the correct inbox credentials');
    
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('- Verify your Mailtrap username and password are correct');
    console.log('- Check if you\'re using the right inbox (not the demo inbox)');
    console.log('- Ensure your Mailtrap account is active and not suspended');
    console.log('- Try regenerating your Mailtrap credentials');
}

// Run the tests
runTests().catch(error => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
});
