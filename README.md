# JEE Practice Platform

A comprehensive JEE (Joint Entrance Examination) practice platform with web admin panel, student portal, and mobile app.

## 🏗️ Architecture

- **Backend**: NestJS + Prisma + PostgreSQL
- **Frontend**: Next.js 15 + TypeScript + Tailwind CSS
- **Mobile**: React Native + Expo + TypeScript

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Expo CLI (for mobile development)

### 1. Install Dependencies

```bash
# Install all dependencies for all apps
npm run install:all
```

### 2. Environment Setup

#### Backend (.env)
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=3001
DATABASE_URL="postgresql://username:password@localhost:5432/jee_app?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
FREE_TRIAL_DAYS=2

# SMTP for email OTP
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=587
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="no-reply@example.com"

# Twilio for SMS OTP
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_FROM="+10000000000"

# Stripe for subscriptions
STRIPE_PUBLIC_KEY="pk_test_xxx"
STRIPE_SECRET_KEY="sk_test_xxx"
STRIPE_WEBHOOK_SECRET="whsec_xxx"

# Google OAuth for social login
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### Frontend (.env.local)
```bash
cd frontend
echo "NEXT_PUBLIC_API_BASE=http://localhost:3001" > .env.local
echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" >> .env.local
echo "NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com" >> .env.local
echo "NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=your-google-client-secret" >> .env.local
```

#### Mobile (.env)
```bash
cd mobile
echo "EXPO_PUBLIC_API_BASE=http://localhost:3001" > .env
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with demo data
npm run db:seed

# (Optional) Open Prisma Studio
npm run db:studio
```

### 4. Start All Apps

```bash
# Start backend, frontend, and mobile concurrently
npm run dev
```

This will start:
- **Backend**: http://localhost:3001
- **Frontend**: http://localhost:3000  
- **Mobile**: Expo development server

## 📱 Individual App Commands

### Backend Only
```bash
npm run dev:backend
# or
cd backend && npm run start:dev
```

### Frontend Only
```bash
npm run dev:frontend
# or
cd frontend && npm run dev
```

### Mobile Only
```bash
npm run dev:mobile
# or
cd mobile && npm run start
```

## 🔧 Build Commands

```bash
# Build all apps
npm run build:all

# Build individual apps
npm run build:backend
npm run build:frontend
```

## 📋 API Endpoints

### Auth
- `POST /auth/register` - User registration (legacy)
- `POST /auth/start-registration` - Start registration with email OTP verification
- `POST /auth/complete-registration` - Complete registration with OTP verification
- `POST /auth/login` - User login (supports email/password or phone/OTP)
- `POST /auth/send-login-otp` - Send OTP for phone login
- `POST /auth/complete-profile` - Complete user profile (phone, stream)
- `POST /auth/send-email-otp` - Send email OTP (authenticated)
- `POST /auth/send-phone-otp` - Send SMS OTP (authenticated)
- `POST /auth/verify-email` - Verify email OTP
- `POST /auth/verify-phone` - Verify SMS OTP
- `POST /auth/google/login` - Google OAuth login
- `POST /auth/google/register` - Google OAuth registration
- `POST /auth/google/token` - Exchange Google auth code for token

### Admin (ADMIN role required)
- `GET /admin/subjects` - List subjects
- `POST /admin/subjects` - Create subject
- `GET /admin/topics` - List topics
- `POST /admin/topics` - Create topic
- `GET /admin/subtopics` - List subtopics
- `POST /admin/subtopics` - Create subtopic
- `GET /admin/tags` - List tags
- `POST /admin/tags` - Create tag
- `GET /admin/questions` - List questions
- `POST /admin/questions` - Create question
- `POST /admin/questions/import` - Import CSV
- `GET /admin/questions/export` - Export CSV

### Exams
- `POST /exams/papers` - Create exam paper
- `POST /exams/papers/:id/start` - Start exam
- `POST /exams/submissions/:id/answer` - Submit answer
- `POST /exams/submissions/:id/finalize` - Finish exam
- `GET /exams/analytics/subjects` - Subject analytics
- `GET /exams/analytics/topics` - Topic analytics
- `GET /exams/analytics/subtopics` - Subtopic analytics

### Subscriptions
- `GET /subscriptions/plans` - List plans (ADMIN)
- `POST /subscriptions/plans` - Create plan (ADMIN)
- `POST /subscriptions/checkout` - Create checkout session
- `POST /subscriptions/webhook` - Stripe webhook

## 🎯 Features

### Backend
- ✅ JWT authentication with role-based access
- ✅ Multiple login methods (Email/Password, Phone OTP, Google OAuth)
- ✅ Email/SMS OTP verification with Twilio integration
- ✅ Content hierarchy (Subject → Topic → Subtopic)
- ✅ Question management with options and tags
- ✅ CSV import/export for bulk question management
- ✅ Exam creation and submission system
- ✅ Performance analytics by subject/topic/subtopic
- ✅ Subscription management with Stripe
- ✅ Free trial system (configurable days)

### Frontend (Web)
- ✅ SEO optimized with metadata, JSON-LD, sitemap
- ✅ Admin panel for content management
- ✅ Student portal for practice exams
- ✅ Responsive design with Tailwind CSS
- ✅ CSV import/export functionality

### Mobile App
- ✅ Cross-platform (iOS/Android)
- ✅ Authentication with token persistence
- ✅ Practice exam dashboard
- ✅ Performance analytics display
- ✅ Native navigation and UI

## 🗂️ Project Structure

```
jee-app/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/           # Authentication & OTP
│   │   ├── admin/          # Admin CRUD endpoints
│   │   ├── exams/          # Exam & analytics
│   │   ├── subscriptions/  # Stripe integration
│   │   └── prisma/         # Database service
│   └── prisma/
│       └── schema.prisma   # Database schema
├── frontend/               # Next.js web app
│   ├── src/
│   │   ├── app/
│   │   │   ├── (auth)/     # Login/Register pages
│   │   │   ├── admin/      # Admin panel
│   │   │   └── student/    # Student portal
│   │   └── lib/
│   │       └── api.ts      # API client
│   └── public/
├── mobile/                 # React Native app
│   ├── src/
│   │   ├── screens/        # App screens
│   │   ├── navigation/     # Navigation setup
│   │   └── lib/
│   │       └── api.ts      # API client
│   └── assets/
└── package.json            # Root scripts
```

## 🔐 Authentication Methods

The platform supports multiple authentication methods for user convenience:

### 1. Email & Password Login
- Traditional login with email and password
- Secure password hashing with bcrypt
- Remember me functionality

### 2. Phone OTP Login
- Login using phone number and SMS OTP
- Powered by Twilio SMS service
- Two-step process: Send OTP → Verify OTP
- Automatic user lookup by phone number

### 3. Google OAuth Login
- One-click login with Google account
- Automatic account creation for new users
- Profile picture and email sync
- Secure token exchange on backend

### Registration Flow
1. **Email Registration**: Fill form → Send email OTP → Verify OTP → Account created → Redirect to login
2. **Google Registration**: Click Google button → Authorize → Create account → Redirect to profile completion → Fill phone/stream → Redirect to dashboard

### Login Flow
1. **Email/Password**: Enter credentials → Authenticate → Check profile completion → Redirect to dashboard
2. **Phone OTP**: Enter phone → Send OTP → Enter OTP → Authenticate → Check profile completion → Redirect
3. **Google OAuth**: Click Google button → Authorize → Authenticate → Check profile completion → Redirect

### Profile Completion
- **Required for**: Users without phone number or stream selection
- **Blocks access to**: All protected pages until completed
- **Information needed**: Phone number and stream selection

## 🔐 Google OAuth Setup

### 1. Create Google OAuth Application

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - `http://localhost:3000/auth/google/callback` (development)
     - `https://yourdomain.com/auth/google/callback` (production)

### 2. Configure Environment Variables

#### Backend (.env)
```env
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
```

### 3. Google OAuth Flow

The application supports two Google OAuth flows:

#### Login Flow
1. User clicks "Continue with Google" on login page
2. Redirects to Google OAuth consent screen
3. User authorizes the application
4. Google redirects to `/auth/google/callback` with authorization code
5. Backend exchanges code for access token
6. Backend fetches user info from Google
7. User is logged in and redirected to appropriate dashboard

#### Registration Flow
1. User clicks "Continue with Google" on registration page
2. Same OAuth flow as login
3. If user doesn't exist, creates new account with selected stream
4. If user exists, logs them in directly

### 4. Security Features

- **Secure Token Exchange**: Client secret is kept on backend only
- **State Parameter**: Prevents CSRF attacks during OAuth flow
- **Email Verification**: Google emails are automatically verified
- **Profile Picture**: Automatically syncs Google profile picture
- **Stream Selection**: New users must select a stream during registration

## 🚨 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in backend/.env
- Run `npm run db:push` to sync schema
- Run `npm run db:seed` to populate demo data

### Demo Data
The seeder creates:
- **Users**: 1 admin + 2 students with trial access
- **Subjects**: Physics, Chemistry, Mathematics
- **Topics**: 9 topics across all subjects
- **Subtopics**: 9 subtopics with detailed descriptions
- **Questions**: 8 sample questions with explanations and multiple choice options
- **Tags**: 8 tags (Previous Year, JEE Mains/Advanced, Easy/Medium/Hard, Formula Based, Conceptual)
- **Plans**: 3 subscription plans (Basic ₹999, Premium ₹1,999, Yearly ₹9,999)
- **Exam Papers**: 3 practice tests with time limits
- **Submissions**: Sample exam results with scores and analytics

**Login Credentials:**
- Admin: `admin@jeeapp.com` / `admin123`
- Student 1: `student1@example.com` / `student123`
- Student 2: `student2@example.com` / `student123`

### Port Conflicts
- Backend: Change PORT in backend/.env
- Frontend: Change port in frontend/package.json scripts
- Update API_BASE URLs accordingly

### Mobile Development
- Install Expo Go app on your device
- Ensure device and computer are on same network
- Use `npm run dev:mobile` to start Expo server

### Google OAuth Issues
- **"Invalid redirect URI"**: Ensure redirect URI in Google Console matches your callback URL
- **"Client ID not configured"**: Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in frontend `.env.local`
- **"Client secret not configured"**: Check that `GOOGLE_CLIENT_SECRET` is set in backend `.env`
- **"Access blocked"**: Ensure Google+ API is enabled in Google Cloud Console
- **"State parameter mismatch"**: Clear browser cache and try again

## 📄 License

This project is for educational purposes. 