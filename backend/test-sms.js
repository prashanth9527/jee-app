const twilio = require('twilio');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

console.log('📱 Twilio SMS Configuration Test Script');
console.log('========================================\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('TWILIO_ACCOUNT_SID:', process.env.TWILIO_ACCOUNT_SID || '❌ NOT SET');
console.log('TWILIO_AUTH_TOKEN:', process.env.TWILIO_AUTH_TOKEN ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('TWILIO_FROM:', process.env.TWILIO_FROM || '❌ NOT SET');
console.log('TWILIO_PHONE_NUMBER:', process.env.TWILIO_PHONE_NUMBER || '❌ NOT SET');
console.log('');

// Validate required environment variables
const requiredVars = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.log('❌ Missing required environment variables:', missingVars.join(', '));
    console.log('\n📝 Please add the following to your .env file:');
    console.log('TWILIO_ACCOUNT_SID=your_twilio_account_sid');
    console.log('TWILIO_AUTH_TOKEN=your_twilio_auth_token');
    console.log('TWILIO_FROM=+1234567890');
    console.log('TWILIO_PHONE_NUMBER=+1234567890');
    process.exit(1);
}

// Create Twilio client
console.log('🔧 Creating Twilio client...');
let client;
try {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio client created successfully!');
} catch (error) {
    console.log('❌ Failed to create Twilio client:');
    console.log('Error:', error.message);
    process.exit(1);
}

// Test Twilio account
async function testTwilioAccount() {
    console.log('🔍 Testing Twilio account...');
    try {
        const account = await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        console.log('✅ Twilio account verified!');
        console.log('Account SID:', account.sid);
        console.log('Account Status:', account.status);
        console.log('Account Type:', account.type);
        return true;
    } catch (error) {
        console.log('❌ Twilio account verification failed:');
        console.log('Error:', error.message);
        console.log('Code:', error.code);
        console.log('Status:', error.status);
        return false;
    }
}

// Test phone number validation
async function testPhoneNumberValidation() {
    console.log('\n📞 Testing phone number validation...');
    
    const testNumbers = [
        process.env.TWILIO_FROM,
        process.env.TWILIO_PHONE_NUMBER,
        '+919866211858', // Test number
        //'+15551234567' // Another test number
    ].filter(num => num);

    for (const phoneNumber of testNumbers) {
        try {
            const lookup = await client.lookups.v1.phoneNumbers(phoneNumber).fetch();
            console.log(`✅ ${phoneNumber}: Valid (${lookup.countryCode})`);
        } catch (error) {
            console.log(`❌ ${phoneNumber}: Invalid - ${error.message}`);
        }
    }
}

// Test SMS sending
async function testSMSSending() {
    console.log('\n📧 Testing SMS sending...');
    
    // Use a test number or the configured number
    const testNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM;
    
    if (!testNumber) {
        console.log('❌ No test phone number configured. Please set TWILIO_PHONE_NUMBER in .env');
        return false;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const messageBody = `🎓 JEE Master - Your OTP is: ${otpCode}. This code will expire in 10 minutes. Do not share this code with anyone.`;

    try {
        const message = await client.messages.create({
            from: process.env.TWILIO_FROM,
            to: testNumber,
            body: messageBody
        });

        console.log('✅ SMS sent successfully!');
        console.log('Message SID:', message.sid);
        console.log('Status:', message.status);
        console.log('To:', message.to);
        console.log('From:', message.from);
        console.log('Body:', message.body);
        console.log('OTP Code:', otpCode);
        return true;
    } catch (error) {
        console.log('❌ SMS sending failed:');
        console.log('Error:', error.message);
        console.log('Code:', error.code);
        console.log('Status:', error.status);
        console.log('More Info:', error.moreInfo);
        return false;
    }
}

// Test OTP SMS format (exact format used by the app)
async function testOTPSMS() {
    console.log('\n🔐 Testing OTP SMS format...');
    
    const testNumber = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_FROM;
    
    if (!testNumber) {
        console.log('❌ No test phone number configured. Please set TWILIO_PHONE_NUMBER in .env');
        return false;
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const messageBody = `Your OTP is ${otpCode}`; // Exact format from the app

    try {
        const message = await client.messages.create({
            from: process.env.TWILIO_FROM,
            to: testNumber,
            body: messageBody
        });

        console.log('✅ OTP SMS sent successfully!');
        console.log('Message SID:', message.sid);
        console.log('Status:', message.status);
        console.log('OTP Code:', otpCode);
        return true;
    } catch (error) {
        console.log('❌ OTP SMS sending failed:');
        console.log('Error:', error.message);
        console.log('Code:', error.code);
        return false;
    }
}

// Test message status
async function testMessageStatus(messageSid) {
    if (!messageSid) return;
    
    console.log('\n📊 Testing message status...');
    try {
        const message = await client.messages(messageSid).fetch();
        console.log('Message Status:', message.status);
        console.log('Error Code:', message.errorCode);
        console.log('Error Message:', message.errorMessage);
        console.log('Price:', message.price);
        console.log('Price Unit:', message.priceUnit);
    } catch (error) {
        console.log('❌ Failed to fetch message status:', error.message);
    }
}

// Test available phone numbers
async function testAvailableNumbers() {
    console.log('\n📞 Testing available phone numbers...');
    try {
        const numbers = await client.incomingPhoneNumbers.list({ limit: 5 });
        if (numbers.length > 0) {
            console.log('✅ Available phone numbers:');
            numbers.forEach(number => {
                console.log(`- ${number.phoneNumber} (${number.friendlyName})`);
            });
        } else {
            console.log('❌ No phone numbers found in your Twilio account');
            console.log('💡 You need to purchase a phone number from Twilio');
        }
    } catch (error) {
        console.log('❌ Failed to fetch phone numbers:', error.message);
    }
}

// Test account balance
async function testAccountBalance() {
    console.log('\n💰 Testing account balance...');
    try {
        const balance = await client.balance.fetch();
        console.log('✅ Account balance:', balance.currency, balance.balance);
        
        if (parseFloat(balance.balance) < 1.0) {
            console.log('⚠️  Low balance warning: Consider adding funds to your Twilio account');
        }
    } catch (error) {
        console.log('❌ Failed to fetch account balance:', error.message);
    }
}

// Main test function
async function runTests() {
    console.log('🚀 Starting Twilio SMS tests...\n');
    
    // Test 1: Account verification
    const accountSuccess = await testTwilioAccount();
    if (!accountSuccess) {
        console.log('\n❌ Twilio account verification failed. Please check your credentials.');
        process.exit(1);
    }
    
    // Test 2: Account balance
    await testAccountBalance();
    
    // Test 3: Available phone numbers
    await testAvailableNumbers();
    
    // Test 4: Phone number validation
    await testPhoneNumberValidation();
    
    // Test 5: Basic SMS sending
    const smsSuccess = await testSMSSending();
    if (!smsSuccess) {
        console.log('\n❌ Basic SMS sending failed.');
        process.exit(1);
    }
    
    // Test 6: OTP SMS format
    const otpSuccess = await testOTPSMS();
    if (!otpSuccess) {
        console.log('\n❌ OTP SMS sending failed.');
        process.exit(1);
    }
    
    console.log('\n🎉 All Twilio SMS tests passed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Check your phone for the test SMS messages');
    console.log('2. Verify the OTP codes are received correctly');
    console.log('3. Test the SMS functionality in your application');
    
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('- Ensure your Twilio account has sufficient balance');
    console.log('- Verify your phone number is in the correct format (+1234567890)');
    console.log('- Check if your phone number is verified in Twilio (for trial accounts)');
    console.log('- Make sure you\'re using a valid Twilio phone number as the sender');
    console.log('- Check Twilio logs at https://console.twilio.com/us1/monitor/logs/messages');
}

// Run the tests
runTests().catch(error => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
});
