const axios = require('axios');

async function testSendLoginOtp() {
  try {
    console.log('Testing send-login-otp endpoint...');
    
    const response = await axios.post('http://localhost:3001/auth/send-login-otp', {
      phone: '9866211858'
    });
    
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.data || error.message);
  }
}

testSendLoginOtp();
