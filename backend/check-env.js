// Environment check script
console.log('=== Environment Variables Check ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
console.log('JWT_SECRET (first 10 chars):', process.env.JWT_SECRET ? process.env.JWT_SECRET.substring(0, 10) + '...' : 'Not set');
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

// Check if we're in production
if (process.env.NODE_ENV === 'production') {
  console.log('\n=== Production Environment ===');
  console.log('Running in production mode');
} else {
  console.log('\n=== Development Environment ===');
  console.log('Running in development mode');
  console.log('Default JWT_SECRET will be used if not set');
}
