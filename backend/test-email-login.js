/**
 * Test script for email code login functionality
 * This script demonstrates how the email code login works
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001'; // Backend URL

async function testEmailLogin() {
    console.log('🧪 Testing Email Code Login Functionality\n');

    try {
        // Test data - you'll need to replace with actual test user credentials
        const testEmail = 'test@example.com'; // Replace with a registered email

        console.log('1. Sending email login OTP...');
        const sendOtpResponse = await axios.post(`${BASE_URL}/auth/send-email-login-otp`, {
            email: testEmail
        });

        console.log('✅ Email OTP sent successfully');
        console.log('   Response:', sendOtpResponse.data);

        // In a real scenario, the user would check their email and enter the code
        // For testing, you would need to manually enter the OTP from the email
        const testOtpCode = '123456'; // Replace with actual OTP from email

        console.log('\n2. Attempting login with email OTP...');
        console.log('   Note: Replace testOtpCode with actual OTP from email');
        
        try {
            const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
                email: testEmail,
                otpCode: testOtpCode
            });

            console.log('✅ Email OTP login successful');
            console.log('   Token:', loginResponse.data.access_token.substring(0, 50) + '...');
            console.log('   User:', loginResponse.data.user);

            const token = loginResponse.data.access_token;

            console.log('\n3. Testing authenticated request...');
            const meResponse = await axios.get(`${BASE_URL}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Authenticated request successful');
            console.log('   User data:', meResponse.data);

        } catch (loginError) {
            if (loginError.response?.status === 401) {
                console.log('❌ Login failed - Invalid OTP or email');
                console.log('   Error:', loginError.response.data);
            } else {
                console.log('❌ Login failed with unexpected error:', loginError.response?.data);
            }
        }

        console.log('\n🎉 Email login test completed!');
        console.log('\n📝 Manual Testing Steps:');
        console.log('1. Replace testEmail with a registered email address');
        console.log('2. Run the script to send OTP');
        console.log('3. Check the email for the OTP code');
        console.log('4. Replace testOtpCode with the actual OTP');
        console.log('5. Run the script again to test login');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
    }
}

// Run the test
testEmailLogin();
