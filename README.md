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
```

#### Frontend (.env.local)
```bash
cd frontend
echo "NEXT_PUBLIC_API_BASE=http://localhost:3001" > .env.local
echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" >> .env.local
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
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/send-email-otp` - Send email OTP
- `POST /auth/send-phone-otp` - Send SMS OTP
- `POST /auth/verify-email` - Verify email OTP
- `POST /auth/verify-phone` - Verify SMS OTP

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
- ✅ Email/SMS OTP verification
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

## 📄 License

This project is for educational purposes. 