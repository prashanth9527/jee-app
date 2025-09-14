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

1. **"Unable to load blogs" error**
   - Check if `NEXT_PUBLIC_BACKEND_URL` is correct
   - Verify backend is running and accessible
   - Check CORS settings on backend

2. **Empty blog list**
   - Verify backend has blog data
   - Check if API endpoints are working
   - Review backend logs

3. **Build errors**
   - Ensure all dependencies are in `package.json`
   - Check for TypeScript errors
   - Verify environment variables are set

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
