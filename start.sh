#!/bin/bash

echo "Starting JEE Practice Platform..."
echo

echo "1. Installing dependencies..."
npm run install:all

echo
echo "2. Setting up environment files..."

if [ ! -f "backend/.env" ]; then
    echo "Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "Please edit backend/.env with your database and API keys"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "Creating frontend .env.local file..."
    echo "NEXT_PUBLIC_API_BASE=http://localhost:3001" > frontend/.env.local
    echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" >> frontend/.env.local
fi

if [ ! -f "mobile/.env" ]; then
    echo "Creating mobile .env file..."
    echo "EXPO_PUBLIC_API_BASE=http://localhost:3001" > mobile/.env
fi

echo
echo "3. Generating Prisma client..."
npm run db:generate

echo
echo "4. Seeding database with demo data..."
npm run db:seed

echo
echo "5. Starting all applications..."
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:3000"
echo "Mobile: Expo development server"
echo
echo "Press Ctrl+C to stop all apps"
echo

npm run dev 