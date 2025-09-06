# Email Troubleshooting Guide

## 🔍 Quick Diagnosis

### Step 1: Run the Email Test Script
```bash
cd backend
node test-email.js
```

### Step 2: Check Environment Variables
Make sure your `.env` file contains:
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USER=your_mailtrap_username
SMTP_PASS=your_mailtrap_password
SMTP_FROM=no-reply@jeemaster.com
```

## 🚨 Common Issues and Solutions

### Issue 1: "SMTP not configured" Error
**Symptoms:**
- Console shows: `[MailerService] SMTP not configured, skipping email to...`
- No emails are sent

**Solution:**
1. Check if `.env` file exists in the backend directory
2. Verify all SMTP environment variables are set
3. Restart the backend server after updating `.env`

### Issue 2: Authentication Failed
**Symptoms:**
- Error: `Invalid login: 535-5.7.8 Username and Password not accepted`
- SMTP connection fails

**Solutions:**
1. **Verify Mailtrap Credentials:**
   - Go to https://mailtrap.io/inboxes
   - Select your inbox
   - Go to "SMTP Settings" tab
   - Copy the exact username and password

2. **Check Account Status:**
   - Ensure your Mailtrap account is active
   - Verify you're not using demo credentials
   - Check if you're using the correct inbox

3. **Regenerate Credentials:**
   - In Mailtrap, go to inbox settings
   - Click "Regenerate" for SMTP credentials
   - Update your `.env` file with new credentials

### Issue 3: Connection Timeout
**Symptoms:**
- Error: `Connection timeout`
- SMTP connection hangs

**Solutions:**
1. **Check Network:**
   - Ensure internet connection is stable
   - Try from a different network if possible

2. **Firewall/Proxy Issues:**
   - Check if corporate firewall blocks SMTP ports
   - Try using port 2525 instead of 587

3. **Mailtrap Server Issues:**
   - Check Mailtrap status page
   - Try again after a few minutes

### Issue 4: Emails Not Appearing in Mailtrap
**Symptoms:**
- Test script shows success
- No emails in Mailtrap inbox

**Solutions:**
1. **Check Correct Inbox:**
   - Ensure you're looking at the right inbox
   - Check if you have multiple inboxes

2. **Check Spam/Trash:**
   - Look in spam folder
   - Check trash folder

3. **Refresh Mailtrap:**
   - Hard refresh the Mailtrap page
   - Clear browser cache

### Issue 5: OTP Generation Issues
**Symptoms:**
- OTP codes are not generated
- Database errors related to OTP

**Solutions:**
1. **Check Database Connection:**
   - Ensure PostgreSQL is running
   - Verify DATABASE_URL in `.env`

2. **Check OTP Table:**
   - Run: `npx prisma studio`
   - Check if `otp` table exists
   - Verify table structure

## 🔧 Advanced Troubleshooting

### Enable Debug Logging
Add to your `.env` file:
```env
DEBUG=nodemailer:*
```

### Test with Different SMTP Settings
Try these alternative settings in your `.env`:
```env
# Alternative port
SMTP_PORT=2525

# Alternative host (if smtp.mailtrap.io fails)
SMTP_HOST=mailtrap.io
```

### Manual SMTP Test
Use a tool like `telnet` to test SMTP connection:
```bash
telnet smtp.mailtrap.io 587
```

### Check Application Logs
Look for these log messages in your backend console:
- `[MailerService] SMTP not configured...`
- `Failed to send email OTP:`
- `SMTP connection successful!`

## 📋 Mailtrap Setup Checklist

- [ ] Created Mailtrap account
- [ ] Created a new inbox (not using demo)
- [ ] Copied SMTP credentials from inbox settings
- [ ] Updated `.env` file with correct credentials
- [ ] Restarted backend server
- [ ] Ran test script successfully
- [ ] Verified emails appear in Mailtrap inbox

## 🆘 Still Having Issues?

### Contact Information
- Mailtrap Support: https://mailtrap.io/support
- Check Mailtrap Documentation: https://mailtrap.io/docs/

### Debug Information to Collect
When reporting issues, include:
1. Full error message from console
2. Environment variables (without passwords)
3. Mailtrap inbox settings screenshot
4. Test script output
5. Backend server logs

### Alternative Email Services
If Mailtrap continues to have issues, consider:
- **SendGrid** (free tier available)
- **Mailgun** (free tier available)
- **Amazon SES** (very cheap)
- **Gmail SMTP** (for development only)

## 🔄 Quick Reset
To start fresh:
1. Delete `.env` file
2. Run: `node setup-email.js`
3. Update with new Mailtrap credentials
4. Run: `node test-email.js`
5. Restart backend server
