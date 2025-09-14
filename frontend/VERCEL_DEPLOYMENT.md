# Vercel Deployment Guide for Blogs Page

## Environment Variables Required

Set these environment variables in your Vercel dashboard:

### Required Variables:
```
NEXT_PUBLIC_FRONTEND_URL=https://your-app.vercel.app
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

### Optional Variables:
```
# If you have a database URL
DATABASE_URL=your-database-connection-string

# If you have other API keys
OPENAI_API_KEY=your-openai-key
```

## Deployment Steps

1. **Connect your repository to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Set the root directory to `frontend`

2. **Configure Environment Variables**
   - In your Vercel project dashboard
   - Go to Settings → Environment Variables
   - Add the required variables listed above

3. **Deploy**
   - Vercel will automatically deploy when you push to your main branch
   - Or trigger a manual deployment from the dashboard

## Backend Requirements

Make sure your backend is deployed and accessible at the `NEXT_PUBLIC_BACKEND_URL` you set. The blogs page will gracefully handle:

- Backend connection failures
- API errors
- Missing data

## Error Handling

The blogs page now includes comprehensive error handling:

- **Server-side errors**: Graceful fallback page
- **API failures**: Error messages with retry options
- **Empty data**: Proper empty state display
- **Loading states**: Visual loading indicators

## Troubleshooting

### Common Issues:

1. **500 Error on API calls (works locally but not on server)**
   - **Most likely cause**: `NEXT_PUBLIC_BACKEND_URL` environment variable not set on server
   - **Debug steps**:
     - Visit `/api/debug` on your deployed site to check environment variables
     - Check Vercel dashboard → Settings → Environment Variables
     - Ensure `NEXT_PUBLIC_BACKEND_URL` is set to your backend URL
     - Check server logs in Vercel dashboard for detailed error messages
   - **Common solutions**:
     - Set `NEXT_PUBLIC_BACKEND_URL=https://your-backend-domain.com` in Vercel
     - Verify backend is accessible from the internet (not localhost)
     - Check CORS settings on backend to allow your Vercel domain

2. **"Unable to load blogs" error**
   - Check if `NEXT_PUBLIC_BACKEND_URL` is correct
   - Verify backend is running and accessible
   - Check CORS settings on backend

3. **Empty blog list**
   - Verify backend has blog data
   - Check if API endpoints are working
   - Review backend logs

4. **Build errors**
   - Ensure all dependencies are in `package.json`
   - Check for TypeScript errors
   - Verify environment variables are set

5. **"Accessing client-only APIs in a Server Component" error**
   - ✅ **FIXED**: Removed `window.location.origin` access from server-side functions
   - Server Components should only use environment variables for URLs
   - Client-side APIs (`window`, `localStorage`, `navigator`) should only be used in Client Components

6. **"Dynamic server usage" warning during build**
   - ✅ **EXPECTED**: This is normal for pages using `searchParams`
   - The page will be server-rendered on demand (marked with ƒ)
   - This provides better SEO and performance than static generation

### Debugging Steps:

1. **Check Environment Variables**:
   - Visit `https://your-app.vercel.app/api/debug` to see all environment variables
   - Verify `NEXT_PUBLIC_BACKEND_URL` is set correctly

2. **Check Server Logs**:
   - Go to Vercel dashboard → Functions → View Function Logs
   - Look for the detailed error messages we added to the API routes

3. **Test Backend Connectivity**:
   - The debug endpoint will test your backend connectivity
   - Check if the backend responds correctly

4. **Common Environment Variable Issues**:
   - Missing `NEXT_PUBLIC_BACKEND_URL` (defaults to localhost)
   - Incorrect URL format (should include https://)
   - Backend not accessible from internet
   - CORS not configured for your Vercel domain

## Production Checklist

- [ ] Environment variables configured
- [ ] Backend deployed and accessible
- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate active
- [ ] Analytics configured (if needed)
- [ ] Error monitoring set up (if needed)

## Performance Tips

- The blogs page uses dynamic rendering for better SEO
- Images are optimized with Next.js Image component
- Static assets are cached by Vercel
- API calls include proper error handling and fallbacks
