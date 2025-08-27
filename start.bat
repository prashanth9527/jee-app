@echo off
echo Starting JEE Practice Platform...
echo.

echo 1. Installing dependencies...
call npm run install:all

echo.
echo 2. Setting up environment files...
if not exist "backend\.env" (
    echo Creating backend .env file...
    copy "backend\.env.example" "backend\.env"
    echo Please edit backend\.env with your database and API keys
)

if not exist "frontend\.env.local" (
    echo Creating frontend .env.local file...
    echo NEXT_PUBLIC_API_BASE=http://localhost:3001 > frontend\.env.local
    echo NEXT_PUBLIC_SITE_URL=http://localhost:3000 >> frontend\.env.local
)

if not exist "mobile\.env" (
    echo Creating mobile .env file...
    echo EXPO_PUBLIC_API_BASE=http://localhost:3001 > mobile\.env
)

echo.
echo 3. Generating Prisma client...
call npm run db:generate

echo.
echo 4. Seeding database with demo data...
call npm run db:seed

echo.
echo 5. Starting all applications...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo Mobile: Expo development server
echo.
echo Press Ctrl+C to stop all apps
echo.

call npm run dev 