# Twilio SMS Troubleshooting Guide

## 🔍 Quick Diagnosis

### Step 1: Run the SMS Test Script
```bash
cd backend
node test-sms.js
```

### Step 2: Check Environment Variables
Make sure your `.env` file contains:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM=+1234567890
TWILIO_PHONE_NUMBER=+1234567890
```

## 🚨 Common Issues and Solutions

### Issue 1: "Twilio not configured" Error
**Symptoms:**
- Console shows: `[SmsService] Twilio not configured, skipping SMS to...`
- No SMS messages are sent

**Solution:**
1. Check if `.env` file exists in the backend directory
2. Verify all Twilio environment variables are set
3. Restart the backend server after updating `.env`

### Issue 2: Authentication Failed
**Symptoms:**
- Error: `Authentication Error - invalid username`
- Error: `Authentication Error - invalid password`

**Solutions:**
1. **Verify Twilio Credentials:**
   - Go to https://console.twilio.com/
   - Copy Account SID and Auth Token from dashboard
   - Ensure no extra spaces or characters

2. **Check Account Status:**
   - Ensure your Twilio account is active
   - Verify you're not using demo credentials
   - Check if account is suspended

3. **Regenerate Auth Token:**
   - In Twilio console, go to Account Settings
   - Click "Regenerate" for Auth Token
   - Update your `.env` file with new token

### Issue 3: Invalid Phone Number
**Symptoms:**
- Error: `The 'To' number +1234567890 is not a valid phone number`
- Error: `Phone number is not verified`

**Solutions:**
1. **Check Phone Number Format:**
   - Use international format: +[country code][number]
   - Examples: +1234567890, +919876543210
   - No spaces, dashes, or parentheses

2. **Verify Phone Number (Trial Accounts):**
   - Go to https://console.twilio.com/phone-numbers/verified
   - Add and verify your phone number
   - Only verified numbers can receive SMS on trial accounts

3. **Check Country Code:**
   - US: +1
   - India: +91
   - UK: +44
   - Use correct country code for your region

### Issue 4: Insufficient Balance
**Symptoms:**
- Error: `Account balance is insufficient`
- SMS sending fails

**Solutions:**
1. **Check Account Balance:**
   - Go to https://console.twilio.com/console/billing/overview
   - Add funds to your account
   - Minimum balance required for SMS

2. **Check Pricing:**
   - SMS costs vary by country
   - Check Twilio pricing page for your region
   - Ensure sufficient balance for multiple SMS

### Issue 5: Trial Account Limitations
**Symptoms:**
- SMS includes "Sent from your Twilio trial account"
- Cannot send to unverified numbers
- Limited number of messages

**Solutions:**
1. **Verify Phone Numbers:**
   - Add all test phone numbers to verified list
   - Go to Phone Numbers > Verified Caller IDs

2. **Upgrade Account:**
   - Add payment method to remove trial limitations
   - Upgrade to paid account for production use

### Issue 6: FROM Number Issues
**Symptoms:**
- Error: `The 'From' number +1234567890 is not a valid phone number`
- Error: `Phone number is not verified`

**Solutions:**
1. **Purchase Phone Number:**
   - Go to https://console.twilio.com/phone-numbers/manage/incoming
   - Purchase a phone number for your region
   - Use this number as TWILIO_FROM

2. **Check Number Capabilities:**
   - Ensure purchased number supports SMS
   - Check number configuration in Twilio console

### Issue 7: Network/Connection Issues
**Symptoms:**
- Error: `Connection timeout`
- Error: `Network error`

**Solutions:**
1. **Check Internet Connection:**
   - Ensure stable internet connection
   - Try from different network if possible

2. **Firewall/Proxy Issues:**
   - Check if corporate firewall blocks Twilio API
   - Configure proxy settings if needed

3. **Twilio Service Status:**
   - Check https://status.twilio.com/
   - Try again after service restoration

## 🔧 Advanced Troubleshooting

### Enable Debug Logging
Add to your `.env` file:
```env
DEBUG=twilio:*
```

### Test with Twilio CLI
Install Twilio CLI and test:
```bash
npm install -g twilio-cli
twilio login
twilio phone-numbers:list
twilio api:core:messages:create --from="+1234567890" --to="+1234567890" --body="Test message"
```

### Check Twilio Logs
1. Go to https://console.twilio.com/us1/monitor/logs/messages
2. Look for failed message attempts
3. Check error codes and messages

### Manual API Test
Use curl to test Twilio API directly:
```bash
curl -X POST https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json \
  --data-urlencode "From=+1234567890" \
  --data-urlencode "To=+1234567890" \
  --data-urlencode "Body=Test message" \
  -u YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN
```

## 📋 Twilio Setup Checklist

- [ ] Created Twilio account
- [ ] Got Account SID and Auth Token
- [ ] Purchased a phone number (or using trial)
- [ ] Verified test phone numbers (for trial accounts)
- [ ] Updated `.env` file with correct credentials
- [ ] Restarted backend server
- [ ] Ran test script successfully
- [ ] Verified SMS received on phone

## 🆘 Still Having Issues?

### Contact Information
- Twilio Support: https://support.twilio.com/
- Twilio Documentation: https://www.twilio.com/docs/sms

### Debug Information to Collect
When reporting issues, include:
1. Full error message from console
2. Environment variables (without sensitive data)
3. Twilio account status
4. Test script output
5. Backend server logs
6. Phone number format being used

### Alternative SMS Services
If Twilio continues to have issues, consider:
- **AWS SNS** (Simple Notification Service)
- **SendGrid** (SMS API)
- **MessageBird** (SMS API)
- **Vonage** (formerly Nexmo)

## 🔄 Quick Reset
To start fresh:
1. Delete `.env` file
2. Run: `node setup-twilio.js`
3. Update with new Twilio credentials
4. Run: `node test-sms.js`
5. Restart backend server

## 📞 Phone Number Format Examples

### Correct Formats:
- US: `+1234567890`
- India: `+919876543210`
- UK: `+441234567890`
- Australia: `+61412345678`

### Incorrect Formats:
- `1234567890` (missing country code)
- `+1 234 567 890` (spaces)
- `+1-234-567-890` (dashes)
- `(123) 456-7890` (parentheses)

## 💰 Cost Considerations

### SMS Pricing (approximate):
- US: ~$0.0075 per SMS
- India: ~$0.02 per SMS
- UK: ~$0.05 per SMS
- International: varies by country

### Tips to Reduce Costs:
- Use trial account for development
- Verify phone numbers to avoid charges
- Monitor usage in Twilio console
- Set up billing alerts
