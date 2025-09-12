const jwt = require('jsonwebtoken');

// Debug script to check JWT token
function debugJWT(token, secret) {
  try {
    console.log('=== JWT Debug Information ===');
    console.log('Token (first 50 chars):', token.substring(0, 50) + '...');
    console.log('Secret (first 10 chars):', secret.substring(0, 10) + '...');
    
    // Decode without verification first
    const decoded = jwt.decode(token, { complete: true });
    console.log('\n=== Decoded Token (without verification) ===');
    console.log('Header:', decoded.header);
    console.log('Payload:', decoded.payload);
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    const exp = decoded.payload.exp;
    console.log('\n=== Expiration Check ===');
    console.log('Current time:', now);
    console.log('Token expires:', exp);
    console.log('Is expired:', now > exp);
    console.log('Time until expiry (seconds):', exp - now);
    
    // Try to verify with secret
    try {
      const verified = jwt.verify(token, secret);
      console.log('\n=== Verification Result ===');
      console.log('Token is valid:', true);
      console.log('Verified payload:', verified);
    } catch (verifyError) {
      console.log('\n=== Verification Result ===');
      console.log('Token verification failed:', verifyError.message);
    }
    
  } catch (error) {
    console.error('Error debugging JWT:', error.message);
  }
}

// Example usage - you can call this with your actual token and secret
if (process.argv.length >= 4) {
  const token = process.argv[2];
  const secret = process.argv[3];
  debugJWT(token, secret);
} else {
  console.log('Usage: node debug-jwt.js <token> <secret>');
  console.log('Example: node debug-jwt.js "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." "your-secret"');
}
