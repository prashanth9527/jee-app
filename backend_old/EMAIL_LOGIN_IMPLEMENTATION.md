# Email Code Login Implementation

## Overview

This implementation adds email code login functionality to the JEE application. Users can now login using just their email address and a verification code sent to their email, providing an alternative to password-based login.

## Key Features

- **Email Code Login**: Users can login using email + OTP code
- **Rate Limiting**: Built-in protection against spam and abuse
- **Session Management**: Integrates with the existing single login restriction system
- **Security**: Same security features as phone OTP login
- **User-Friendly**: No need to remember passwords

## API Endpoints

### 1. Send Email Login OTP

**Endpoint**: `POST /auth/send-email-login-otp`

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response**:
```json
{
  "ok": true,
  "message": "OTP sent to your email address"
}
```

**Error Responses**:
- `400 Bad Request`: Invalid email format
- `401 Unauthorized`: No account found with this email
- `429 Too Many Requests`: Rate limit exceeded

### 2. Login with Email OTP

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "user@example.com",
  "otpCode": "123456"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "fullName": "User Name",
    "role": "STUDENT"
  }
}
```

## Implementation Details

### 1. Auth Service Methods

#### `sendEmailLoginOtp(email: string)`
- Validates email format
- Finds user by email address
- Sends OTP via email using existing OTP service
- Returns success message

#### `loginWithEmailOtp(email: string, otpCode: string, deviceInfo?, ipAddress?, userAgent?)`
- Validates email format
- Finds user by email
- Verifies OTP code
- Creates session (respects single login restriction for STUDENT role)
- Generates JWT token with session information
- Returns access token and user data

### 2. Rate Limiting

Email OTP requests are rate-limited using the existing OTP service:
- **Hourly Limit**: 5 requests per hour
- **Daily Limit**: 20 requests per day
- **Cooldown**: 1 minute between requests

### 3. Security Features

- **Session Management**: Integrates with single login restriction
- **Device Tracking**: Records IP address, user agent, and device info
- **OTP Expiration**: Codes expire after 10 minutes (configurable)
- **One-time Use**: OTP codes are consumed after successful verification

## Usage Examples

### Frontend Implementation

#### Step 1: Send Email OTP

```javascript
const sendEmailOtp = async (email) => {
  try {
    const response = await fetch('/auth/send-email-login-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('OTP sent:', data.message);
      // Redirect to OTP verification page
    } else {
      console.error('Error:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

#### Step 2: Login with Email OTP

```javascript
const loginWithEmailOtp = async (email, otpCode) => {
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode })
    });
    
    const data = await response.json();
    if (response.ok) {
      // Store token and redirect to dashboard
      localStorage.setItem('access_token', data.access_token);
      window.location.href = '/dashboard';
    } else {
      console.error('Login failed:', data.message);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

### React Component Example

```jsx
import React, { useState } from 'react';

const EmailLogin = () => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [step, setStep] = useState('email'); // 'email' or 'otp'
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      await sendEmailOtp(email);
      setStep('otp');
    } catch (error) {
      alert('Failed to send OTP');
    }
    setLoading(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      await loginWithEmailOtp(email, otpCode);
    } catch (error) {
      alert('Login failed');
    }
    setLoading(false);
  };

  return (
    <div>
      {step === 'email' ? (
        <div>
          <h2>Login with Email</h2>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
          />
          <button onClick={handleSendOtp} disabled={loading}>
            {loading ? 'Sending...' : 'Send Code'}
          </button>
        </div>
      ) : (
        <div>
          <h2>Enter Verification Code</h2>
          <p>We sent a code to {email}</p>
          <input
            type="text"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="Enter 6-digit code"
            maxLength="6"
          />
          <button onClick={handleLogin} disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <button onClick={() => setStep('email')}>
            Back to Email
          </button>
        </div>
      )}
    </div>
  );
};
```

## Testing

### Manual Testing

1. **Send OTP Test**:
   ```bash
   curl -X POST http://localhost:3001/auth/send-email-login-otp \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com"}'
   ```

2. **Login Test**:
   ```bash
   curl -X POST http://localhost:3001/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "test@example.com", "otpCode": "123456"}'
   ```

### Automated Testing

Run the test script:
```bash
node test-email-login.js
```

## Error Handling

### Common Error Scenarios

1. **Invalid Email Format**:
   ```json
   {
     "statusCode": 401,
     "message": "Please enter a valid email address"
   }
   ```

2. **User Not Found**:
   ```json
   {
     "statusCode": 401,
     "message": "No account found with this email address"
   }
   ```

3. **Invalid OTP**:
   ```json
   {
     "statusCode": 400,
     "message": "Invalid code"
   }
   ```

4. **Rate Limit Exceeded**:
   ```json
   {
     "statusCode": 429,
     "message": "Too many email OTP requests. Please wait before requesting another code."
   }
   ```

## Configuration

### Environment Variables

- `OTP_TTL_MIN`: OTP expiration time in minutes (default: 10)
- `SMTP_*`: Email configuration for sending OTPs

### Rate Limiting Configuration

Rate limits are configured in `otp.service.ts`:
```typescript
EMAIL: {
  maxPerHour: 5,
  maxPerDay: 20,
  cooldownMinutes: 1
}
```

## Security Considerations

1. **Rate Limiting**: Prevents spam and abuse
2. **OTP Expiration**: Codes expire after 10 minutes
3. **One-time Use**: OTPs are consumed after verification
4. **Session Management**: Integrates with single login restriction
5. **Device Tracking**: Records login device information

## Integration with Existing Features

- **Single Login Restriction**: Email login respects the single session policy for STUDENT accounts
- **Session Management**: Creates sessions with device tracking
- **JWT Tokens**: Generates tokens with session information
- **OTP Service**: Uses existing OTP infrastructure
- **Email Service**: Uses existing email sending capabilities

## Future Enhancements

1. **Email Templates**: Customizable email templates for different scenarios
2. **Login Analytics**: Track email login usage patterns
3. **Account Recovery**: Use email OTP for password reset
4. **Two-Factor Authentication**: Combine with password for enhanced security
5. **Remember Device**: Option to remember trusted devices
