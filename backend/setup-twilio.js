const fs = require('fs');
const path = require('path');

console.log('📱 Twilio SMS Configuration Setup');
console.log('==================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');

if (fs.existsSync(envPath)) {
    console.log('✅ .env file exists');
    
    // Read current .env content
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Check if Twilio variables are already set
    const hasTwilioSid = envContent.includes('TWILIO_ACCOUNT_SID=');
    const hasTwilioToken = envContent.includes('TWILIO_AUTH_TOKEN=');
    const hasTwilioFrom = envContent.includes('TWILIO_FROM=');
    
    if (hasTwilioSid && hasTwilioToken && hasTwilioFrom) {
        console.log('✅ Twilio configuration already exists in .env file');
        console.log('📝 If you need to update the credentials, edit the .env file manually');
    } else {
        console.log('⚠️  Twilio configuration is incomplete in .env file');
        console.log('📝 Please add the following to your .env file:');
        console.log('TWILIO_ACCOUNT_SID=your_twilio_account_sid');
        console.log('TWILIO_AUTH_TOKEN=your_twilio_auth_token');
        console.log('TWILIO_FROM=+1234567890');
        console.log('TWILIO_PHONE_NUMBER=+1234567890');
    }
} else {
    console.log('❌ .env file not found');
    console.log('📝 Please create a .env file with the following Twilio configuration:');
    console.log('TWILIO_ACCOUNT_SID=your_twilio_account_sid');
    console.log('TWILIO_AUTH_TOKEN=your_twilio_auth_token');
    console.log('TWILIO_FROM=+1234567890');
    console.log('TWILIO_PHONE_NUMBER=+1234567890');
}

console.log('\n🔍 Twilio Setup Instructions:');
console.log('1. Go to https://console.twilio.com/ and sign up/login');
console.log('2. Get your Account SID and Auth Token from the dashboard');
console.log('3. Purchase a phone number from Twilio (or use trial number)');
console.log('4. Update your .env file with the correct credentials');
console.log('5. Run the test script: node test-sms.js');

console.log('\n📧 Twilio Credentials Format:');
console.log('TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
console.log('TWILIO_AUTH_TOKEN=your_auth_token_here');
console.log('TWILIO_FROM=+1234567890');
console.log('TWILIO_PHONE_NUMBER=+1234567890');

console.log('\n💡 Important Notes:');
console.log('- TWILIO_FROM: The phone number you purchased from Twilio (sender)');
console.log('- TWILIO_PHONE_NUMBER: Your personal phone number (receiver for testing)');
console.log('- For trial accounts, you can only send SMS to verified phone numbers');
console.log('- Make sure your Twilio account has sufficient balance');

console.log('\n🔧 Trial Account Limitations:');
console.log('- Can only send SMS to verified phone numbers');
console.log('- SMS will include "Sent from your Twilio trial account"');
console.log('- Limited number of messages per month');
console.log('- To remove limitations, upgrade to a paid account');

console.log('\n📞 Phone Number Format:');
console.log('- Always include country code (e.g., +1 for US, +91 for India)');
console.log('- Format: +[country code][phone number]');
console.log('- Examples: +1234567890, +919876543210');
