# Single Login Restriction Implementation

## Overview

This implementation adds single login restriction for student accounts to improve security. When a student logs in from a new device/session, all previous sessions are automatically invalidated, ensuring only one active session per student account.

## Key Features

- **Single Session Enforcement**: Only one active session allowed per student account
- **Session Tracking**: Each login creates a unique session with device information
- **Automatic Cleanup**: Expired sessions are automatically cleaned up
- **Device Information**: Tracks IP address, user agent, and device info
- **Admin/Expert Exemption**: Admin and Expert accounts can have multiple sessions

## Database Schema

### UserSession Model

```prisma
model UserSession {
  id        String   @id @default(cuid())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  sessionId String   @unique // Unique session identifier
  deviceInfo String? // Optional device/browser info
  ipAddress String?  // Optional IP address
  userAgent String?  // Optional user agent string
  isActive  Boolean  @default(true)
  lastActivityAt DateTime @default(now())
  expiresAt DateTime // Session expiration time
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId, isActive])
  @@map("user_sessions")
}
```

## Implementation Details

### 1. Session Service (`session.service.ts`)

- **createSession()**: Creates new session and invalidates existing ones for STUDENT role
- **validateSession()**: Validates session and updates last activity
- **invalidateSession()**: Invalidates specific session
- **invalidateAllUserSessions()**: Invalidates all sessions for a user
- **cleanupExpiredSessions()**: Removes expired sessions

### 2. Authentication Service Updates

- **Login Methods**: Updated to create sessions and include sessionId in JWT
- **JWT Tokens**: Now include sessionId for validation
- **Logout Methods**: Added logout and logout-all-devices functionality

### 3. JWT Strategy Updates

- **Session Validation**: For STUDENT role, validates session on each request
- **Token Invalidation**: Throws UnauthorizedException for invalid sessions

### 4. API Endpoints

#### New Endpoints

- `POST /auth/logout` - Logout current session
- `POST /auth/logout-all-devices` - Logout from all devices
- `GET /auth/sessions` - Get user's active sessions

#### Updated Endpoints

- `POST /auth/login` - Now extracts device information and creates sessions

## Security Benefits

1. **Prevents Account Sharing**: Students cannot share accounts across multiple devices
2. **Session Hijacking Protection**: Compromised tokens are invalidated on new login
3. **Device Tracking**: Monitor suspicious login patterns
4. **Automatic Cleanup**: Prevents database bloat from expired sessions

## Usage Examples

### Login with Device Information

```javascript
const response = await fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'student@example.com',
    password: 'password123'
  })
});
```

### Logout Current Session

```javascript
const response = await fetch('/auth/logout', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Logout All Devices

```javascript
const response = await fetch('/auth/logout-all-devices', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Get Active Sessions

```javascript
const response = await fetch('/auth/sessions', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const sessions = await response.json();
```

## Configuration

### Environment Variables

- `JWT_SECRET`: Secret key for JWT signing
- `FREE_TRIAL_DAYS`: Number of free trial days (default: 2)

### Session Expiration

- Sessions expire after 24 hours
- Expired sessions are cleaned up every hour via cron job

## Testing

Run the test script to verify functionality:

```bash
node test-single-login.js
```

## Migration

To apply the database changes:

```bash
npx prisma migrate dev --name add-user-sessions
npx prisma generate
```

## Monitoring

### Session Cleanup

The system automatically cleans up expired sessions every hour. Check logs for cleanup activity:

```
SessionCleanupService - Cleaned up 5 expired sessions
```

### Session Validation

Failed session validations are logged and return 401 Unauthorized responses.

## Troubleshooting

### Common Issues

1. **Session Not Invalidated**: Check if user role is STUDENT
2. **Token Still Works**: Verify JWT strategy is properly validating sessions
3. **Database Errors**: Ensure UserSession table exists and is properly indexed

### Debug Mode

Enable debug logging by setting log level to debug in your NestJS configuration.

## Future Enhancements

1. **Session Limits**: Configurable maximum sessions per user
2. **Device Management**: Allow users to manage their devices
3. **Suspicious Activity**: Alert on unusual login patterns
4. **Session Analytics**: Track session usage patterns
