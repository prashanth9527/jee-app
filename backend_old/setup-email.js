const fs = require('fs');
const path = require('path');

console.log('🔧 Email Configuration Setup');
console.log('============================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, 'mailtrap-config.env');

if (fs.existsSync(envPath)) {
    console.log('✅ .env file already exists');
    console.log('📝 Please edit the .env file with your Mailtrap credentials:');
    console.log('   SMTP_HOST=smtp.mailtrap.io');
    console.log('   SMTP_PORT=587');
    console.log('   SMTP_USER=your_mailtrap_username');
    console.log('   SMTP_PASS=your_mailtrap_password');
    console.log('   SMTP_FROM=no-reply@jeemaster.com');
} else {
    console.log('📝 Creating .env file from template...');
    
    if (fs.existsSync(envExamplePath)) {
        // Copy the example file to .env
        const envContent = fs.readFileSync(envExamplePath, 'utf8');
        fs.writeFileSync(envPath, envContent);
        console.log('✅ .env file created successfully!');
        console.log('\n📋 Next steps:');
        console.log('1. Edit the .env file with your actual Mailtrap credentials');
        console.log('2. Get your Mailtrap credentials from: https://mailtrap.io/inboxes');
        console.log('3. Run: node test-email.js');
    } else {
        console.log('❌ Template file not found. Creating basic .env file...');
        
        const basicEnvContent = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/jee"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"

# Email Configuration (Mailtrap for local development)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=587
SMTP_USER="your_mailtrap_username"
SMTP_PASS="your_mailtrap_password"
SMTP_FROM="no-reply@jeemaster.com"

# SMS Configuration (for OTP)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="+1234567890"

# Stripe Configuration
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="whsec_your-stripe-webhook-secret"

# OpenAI Configuration
OPENAI_API_KEY="your-openai-api-key"

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OTP Configuration
OTP_TTL_MIN=10
`;
        
        fs.writeFileSync(envPath, basicEnvContent);
        console.log('✅ Basic .env file created successfully!');
    }
}

console.log('\n🔍 Mailtrap Setup Instructions:');
console.log('1. Go to https://mailtrap.io/ and sign up/login');
console.log('2. Create a new inbox or use an existing one');
console.log('3. Go to the inbox settings and copy the SMTP credentials');
console.log('4. Update your .env file with the correct credentials');
console.log('5. Run the test script: node test-email.js');

console.log('\n📧 Mailtrap Credentials Format:');
console.log('SMTP_HOST=smtp.mailtrap.io');
console.log('SMTP_PORT=587');
console.log('SMTP_USER=your_username_from_mailtrap');
console.log('SMTP_PASS=your_password_from_mailtrap');
console.log('SMTP_FROM=no-reply@jeemaster.com');
