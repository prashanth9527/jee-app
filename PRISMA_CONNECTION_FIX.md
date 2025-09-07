# Prisma Connection Fix for Production

## Problem
The error `"prepared statement \"s0\" already exists"` occurs when Prisma tries to create prepared statements that already exist. This typically happens in production environments with connection pooling or when multiple Prisma client instances are created.

## Root Cause
- Multiple Prisma client instances being created
- Connection pooling conflicts
- Prepared statement caching issues in production

## Solution Applied

### 1. ✅ Created Singleton Database Connection (`backend/src/prisma/database.connection.ts`)
- Implements singleton pattern to ensure only one Prisma client instance
- Handles graceful shutdown on process termination
- Configures connection timeouts and logging

### 2. ✅ Updated Prisma Service (`backend/src/prisma/prisma.service.ts`)
- Uses singleton connection instead of creating new instances
- Delegates all Prisma methods to the singleton client
- Maintains NestJS service interface compatibility

### 3. ✅ Updated Prisma Schema (`backend/prisma/schema.prisma`)
- Added `directUrl` configuration to avoid connection pooling issues
- Maintains proper PostgreSQL configuration

## Deployment Steps

### 1. Regenerate Prisma Client
```bash
cd backend
npx prisma generate
```

### 2. Restart Your Application
```bash
# Stop the current application
pm2 stop rankora-backend

# Start the application again
pm2 start rankora-backend
```

### 3. Verify the Fix
Check your application logs for:
```
✅ Prisma connected successfully
```

Instead of the previous error:
```
prepared statement "s0" already exists
```

## Environment Variables
Make sure your production environment has:
```env
DATABASE_URL="postgresql://username:password@host:port/database"
NODE_ENV="production"
```

## Additional Production Optimizations

### 1. Database Connection Pooling
If you're using a connection pooler like PgBouncer, ensure your `DATABASE_URL` is configured for it:
```env
# For PgBouncer
DATABASE_URL="postgresql://username:password@host:port/database?pgbouncer=true&connection_limit=1"
```

### 2. Connection Limits
For high-traffic applications, consider adding connection limits:
```env
DATABASE_URL="postgresql://username:password@host:port/database?connection_limit=10"
```

### 3. SSL Configuration
For production databases, ensure SSL is properly configured:
```env
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

## Monitoring
After deployment, monitor your application for:
- ✅ No more "prepared statement already exists" errors
- ✅ Successful database connections
- ✅ Normal query execution times
- ✅ No connection timeout errors

## Troubleshooting

### If you still see connection issues:
1. **Check database connection limits**:
   ```sql
   SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
   ```

2. **Verify Prisma client generation**:
   ```bash
   cd backend
   npx prisma generate --force
   ```

3. **Check for multiple application instances**:
   ```bash
   pm2 list
   ```

4. **Review database logs** for connection patterns

### If the error persists:
1. **Temporarily disable prepared statements** by adding to your `DATABASE_URL`:
   ```env
   DATABASE_URL="postgresql://username:password@host:port/database?prepared_statements=false"
   ```

2. **Use connection pooling** with a tool like PgBouncer

3. **Contact your hosting provider** to check database connection limits

## Benefits of This Fix
- ✅ **Eliminates prepared statement conflicts**
- ✅ **Improves connection stability**
- ✅ **Reduces memory usage** (single client instance)
- ✅ **Better error handling and logging**
- ✅ **Graceful shutdown handling**

The application should now work properly in production without the Prisma connection errors.
