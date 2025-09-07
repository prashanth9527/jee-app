# CORS Configuration Guide

## Problem
CORS errors occur when your frontend (running on one domain) tries to make requests to your backend API (running on a different domain). This is a common issue when deploying to production.

## Solution

### 1. Backend Configuration (✅ Fixed)

The backend CORS configuration has been updated in `backend/src/main.ts` to:
- Allow specific origins based on environment
- Handle both development and production environments
- Include proper headers and methods
- Log blocked origins for debugging

### 2. Environment Variables Setup

#### For Production Deployment:

1. **Backend Environment Variables** (`backend/.env`):
```env
# Set your production frontend URL
FRONTEND_URL="https://yourdomain.com"

# Set environment to production
NODE_ENV="production"

# Other production variables...
PORT=3001
DATABASE_URL="your-production-database-url"
JWT_SECRET="your-production-jwt-secret"
```

2. **Frontend Environment Variables** (`frontend/.env.local` or production env):
```env
# Set your production API URL
NEXT_PUBLIC_API_BASE="https://api.yourdomain.com"

# Set your production site URL
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
```

### 3. Common CORS Issues and Solutions

#### Issue 1: "Access to fetch at 'X' from origin 'Y' has been blocked by CORS policy"
**Solution**: Make sure your `FRONTEND_URL` in backend environment matches your actual frontend domain.

#### Issue 2: "Credentials flag is true, but the 'Access-Control-Allow-Credentials' header is missing"
**Solution**: The updated CORS configuration includes `credentials: true` and proper headers.

#### Issue 3: "Preflight request doesn't pass access control check"
**Solution**: The configuration includes all necessary HTTP methods and headers.

### 4. Testing CORS Configuration

#### Local Testing:
```bash
# Start backend
cd backend
npm run start:dev

# Start frontend
cd frontend
npm run dev
```

#### Production Testing:
1. Deploy backend with correct `FRONTEND_URL`
2. Deploy frontend with correct `NEXT_PUBLIC_API_BASE`
3. Test API calls from browser console:
```javascript
fetch('https://your-api-domain.com/auth/me', {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  }
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('CORS Error:', error));
```

### 5. Debugging CORS Issues

1. **Check browser console** for specific CORS error messages
2. **Check backend logs** for "CORS blocked origin" messages
3. **Verify environment variables** are set correctly
4. **Test with curl** to isolate frontend vs backend issues:
```bash
curl -H "Origin: https://yourdomain.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     https://your-api-domain.com/auth/login
```

### 6. Security Considerations

- Never use `origin: '*'` in production
- Always specify exact domains in `FRONTEND_URL`
- Use HTTPS in production
- Regularly review and update allowed origins

## Quick Fix for Immediate Deployment

If you need to deploy quickly and are still getting CORS errors:

1. **Temporarily** (for testing only), you can modify the CORS origin function in `backend/src/main.ts`:
```typescript
origin: (origin, callback) => {
  // TEMPORARY: Allow all origins (REMOVE IN PRODUCTION)
  return callback(null, true);
}
```

2. **Then immediately** set up proper environment variables and revert to the secure configuration.

## Need Help?

If you're still experiencing CORS issues:
1. Share the exact error message from browser console
2. Share your current environment variables (without sensitive data)
3. Share your deployment setup (domain names, hosting platform)
