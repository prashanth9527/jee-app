# LMS Hierarchical Seeding Guide

This guide explains how to seed the database with comprehensive LMS content to showcase the hierarchical learning structure.

## Overview

The LMS seeding creates a complete hierarchical learning structure with:
- **Subjects**: Physics, Chemistry, Mathematics, Biology
- **Lessons**: Organized by subject (e.g., Mechanics, Thermodynamics, Algebra)
- **Topics**: Specific areas within lessons (e.g., Kinematics, Hydrocarbons)
- **Subtopics**: Detailed focus areas (e.g., Motion in One Dimension, Alkanes)
- **Content**: Various types of learning materials
- **Progress**: Sample student progress data

## Prerequisites

1. **Database Migration**: Run the database migration first to create the new progress tables:
   ```bash
   cd backend
   npx prisma migrate dev --name add-hierarchical-progress
   npx prisma generate
   ```

2. **Dependencies**: Ensure all required packages are installed:
   ```bash
   npm install
   ```

## Running the LMS Seed

### Option 1: Using npm script (Recommended)
```bash
cd backend
npm run seed:lms
```

### Option 2: Direct execution
```bash
cd backend
npx ts-node prisma/lms-seed.ts
```

## What Gets Created

### 1. **Streams**
- JEE (Joint Entrance Examination)
- NEET (National Eligibility cum Entrance Test)

### 2. **Subjects**
- **Physics**: Mechanics, Electricity & Magnetism, Modern Physics
- **Chemistry**: Physical Chemistry, Organic Chemistry, Inorganic Chemistry
- **Mathematics**: Algebra, Calculus, Coordinate Geometry
- **Biology**: Cell Biology, Genetics

### 3. **Lessons** (3 per subject)
- **Physics**: Mechanics, Electricity & Magnetism, Modern Physics
- **Chemistry**: Physical Chemistry, Organic Chemistry, Inorganic Chemistry
- **Mathematics**: Algebra, Calculus, Coordinate Geometry
- **Biology**: Cell Biology, Genetics

### 4. **Topics** (2-3 per lesson)
- **Mechanics**: Kinematics, Dynamics, Work Energy & Power
- **Electricity**: Electrostatics, Current Electricity, Magnetism
- **Physical Chemistry**: Thermodynamics, Chemical Kinetics
- **Organic Chemistry**: Hydrocarbons, Functional Groups
- **Algebra**: Quadratic Equations, Sequences & Series
- **Calculus**: Limits & Continuity, Differentiation
- **Cell Biology**: Cell Structure, Cell Division

### 5. **Subtopics** (2 per topic)
- **Kinematics**: Motion in One Dimension, Motion in Two Dimensions
- **Dynamics**: Newton's Laws, Friction
- **Electrostatics**: Electric Charges, Electric Potential
- **Thermodynamics**: First Law, Second Law
- **Hydrocarbons**: Alkanes, Alkenes and Alkynes
- **Quadratic Equations**: Solving, Nature of Roots
- **Limits**: Basic Limits, L'Hôpital's Rule
- **Cell Structure**: Prokaryotic Cells, Eukaryotic Cells

### 6. **LMS Content** (10+ items)
Various content types including:
- **Videos**: With transcripts and chapter markers
- **Text**: With sections and formulas
- **Quizzes**: Interactive problem-solving
- **Images**: With labels and descriptions
- **Interactive**: Simulations and virtual labs
- **Audio**: Lectures with transcripts

### 7. **Demo Students**
- **Student 1 (JEE)**: `student1@example.com` / `student123`
- **Student 2 (NEET)**: `student2@example.com` / `student123`

### 8. **Progress Data**
Sample progress with different statuses:
- **COMPLETED**: Fully finished content
- **IN_PROGRESS**: Partially completed content
- **REVIEW**: Completed but marked for review
- **REVISIT**: Completed but needs revisiting
- **NOT_STARTED**: Not yet attempted

## Content Types Showcased

### 1. **Video Content**
- Introduction to Motion (Physics)
- Projectile Motion (Physics)
- Quadratic Formula (Mathematics)

### 2. **Text Content**
- Equations of Motion (Physics)
- Energy and Work in Chemical Systems (Chemistry)

### 3. **Interactive Content**
- Newton's Laws Simulation (Physics)
- Chemical Bonding Virtual Lab (Chemistry)

### 4. **Quiz Content**
- Motion in One Dimension Practice Problems (Physics)

### 5. **Image Content**
- Bacterial Cell Structure (Biology)

### 6. **Audio Content**
- Calculus Fundamentals Lecture (Mathematics)

## Progress Tracking Features

### 1. **Individual Content Progress**
- Time spent on each content item
- Completion percentage
- Last accessed timestamp
- Status tracking (Completed, In Progress, Review, Revisit, Not Started)

### 2. **Hierarchical Progress** (After Migration)
- Subject-level progress
- Lesson-level progress
- Topic-level progress
- Subtopic-level progress

### 3. **Student Learning Paths**
- **JEE Student**: Focuses on Physics, Chemistry, Mathematics
- **NEET Student**: Focuses on Biology, Physics, Chemistry

## Testing the LMS

### 1. **Student Login**
```bash
# JEE Student
Email: student1@example.com
Password: student123

# NEET Student
Email: student2@example.com
Password: student123
```

### 2. **Navigation Flow**
1. Visit `/student/lms`
2. Select a subject (Physics, Chemistry, Mathematics, Biology)
3. Choose a lesson within that subject
4. Select a topic within that lesson
5. Pick a subtopic (optional)
6. View and interact with content
7. Track progress at each level

### 3. **Progress Tracking**
- Mark content as Complete, Review, or Revisit
- See progress percentages at each level
- Track time spent on content
- View completion status

## Content Structure Example

```
Physics
├── Mechanics
│   ├── Kinematics
│   │   ├── Motion in One Dimension
│   │   │   ├── Introduction to Motion (Video)
│   │   │   ├── Equations of Motion (Text)
│   │   │   └── Practice Problems (Quiz)
│   │   └── Motion in Two Dimensions
│   │       └── Projectile Motion (Video)
│   ├── Dynamics
│   │   ├── Newton's Laws
│   │   └── Friction
│   └── Work, Energy & Power
├── Electricity & Magnetism
│   ├── Electrostatics
│   ├── Current Electricity
│   └── Magnetism
└── Modern Physics
```

## Troubleshooting

### 1. **Migration Issues**
If you get errors about missing tables:
```bash
npx prisma migrate reset
npx prisma migrate dev --name add-hierarchical-progress
npx prisma generate
```

### 2. **Seed Script Issues**
If the seed script fails:
```bash
# Check if all dependencies are installed
npm install

# Run with verbose output
npx ts-node prisma/lms-seed.ts --verbose
```

### 3. **Database Connection**
Ensure your database is running and the connection string in `.env` is correct.

## Next Steps

After running the seed:

1. **Test the Student Interface**: Login as a student and navigate through the hierarchical structure
2. **Check Progress Tracking**: Verify that progress is being tracked correctly
3. **Add More Content**: Use the admin interface to add more content to the existing structure
4. **Run Migration**: Uncomment the progress tracking methods in the backend after running the migration

## File Structure

```
backend/
├── prisma/
│   ├── lms-seed.ts          # Main seeding script
│   └── schema.prisma        # Database schema
├── scripts/
│   └── seed-lms.js          # NPM script runner
└── LMS_SEEDING_GUIDE.md     # This guide
```

## Support

If you encounter any issues:
1. Check the console output for specific error messages
2. Ensure all prerequisites are met
3. Verify database connectivity
4. Check that the migration has been run successfully
