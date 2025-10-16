# LMS Quick Reference Guide

## 🚀 Quick Start for Developers

### Understanding the LMS Structure

```
Student accesses LMS → Views Hierarchy → Selects Content → Learns → Progress Tracked
                                                           ↓
                                              AI Tools (Questions, Analysis, Summary)
```

---

## 📁 Key File Locations

### Backend
```
backend/src/
├── lms/
│   ├── lms.controller.ts              # Admin LMS endpoints
│   ├── lms.service.ts                 # Admin LMS logic
│   ├── content-learning.controller.ts # AI learning features
│   ├── content-learning.service.ts    # AI learning logic
│   ├── lesson-progress.controller.ts  # Progress tracking
│   └── lms-summary.controller.ts      # Summary generation
├── student/
│   └── lms.controller.ts              # Student LMS endpoints
└── prisma/
    └── schema.prisma                  # Database models
```

### Frontend
```
frontend/src/app/student/
├── lms/
│   ├── page.tsx                       # Main LMS page (hierarchy view)
│   ├── learn/[id]/page.tsx           # Learning page (content view)
│   └── content/[id]/page.tsx         # Content detail page
└── components/
    ├── ContentSummarySidebar.tsx      # AI summary sidebar
    ├── ContentLearningPanel.tsx       # AI learning tools
    └── StudentLayout.tsx              # Student layout wrapper
```

---

## 🔑 Common API Endpoints

### Student Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | `/student/lms/hierarchy` | Get full content tree | ✅ |
| GET | `/student/lms/content/:id` | Get single content | ✅ |
| POST | `/student/lms/content/:id/progress` | Update progress | ✅ |
| GET | `/student/lms/progress` | Get all progress | ✅ |
| POST | `/student/lms/content/:id/ai-questions` | Generate AI questions | ✅ |
| GET | `/student/lms/content/:id/summary` | Get AI summary | ✅ |
| POST | `/student/lms/content/:id/notes` | Save notes | ✅ |

### Admin Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/admin/lms/content` | Create content | Admin |
| GET | `/admin/lms/content` | List content | Admin |
| PUT | `/admin/lms/content/:id` | Update content | Admin |
| DELETE | `/admin/lms/content/:id` | Delete content | Admin |
| GET | `/admin/lms/stats` | Get statistics | Admin |

---

## 💻 Code Examples

### 1. Fetch Learning Hierarchy

```typescript
// Frontend
const response = await api.get('/student/lms/hierarchy');
const hierarchy = response.data;

// Response structure:
// Array of Subjects
//   └── lessons: Array of Lessons
//       └── topics: Array of Topics
//           └── subtopics: Array of Subtopics
//               └── lmsContent: Array of Content
```

### 2. Load Specific Content

```typescript
// Frontend
const response = await api.get(`/student/lms/content/${contentId}`);
const content = response.data;

// Content includes:
// - title, description, contentType
// - fileUrl, youtubeId, externalUrl
// - subject, lesson, topic, subtopic
// - progress array with user's progress
```

### 3. Update Progress

```typescript
// Frontend
await api.post(`/student/lms/content/${contentId}/progress`, null, {
  params: {
    status: 'COMPLETED',        // or IN_PROGRESS, REVIEW, REVISIT
    progressPercent: '100'      // 0-100
  }
});
```

### 4. Generate AI Questions

```typescript
// Frontend
const response = await api.post(`/student/lms/content/${contentId}/ai-questions`, {
  difficulty: 'MEDIUM',         // EASY, MEDIUM, HARD
  questionCount: 5,
  questionTypes: ['MCQ']
});

const examPaperId = response.data.examPaperId;
// Redirect to exam page
router.push(`/student/exam/${examPaperId}`);
```

### 5. Save Notes

```typescript
// Frontend
await api.post(`/student/lms/content/${contentId}/notes`, {
  notes: 'My learning notes here...'
});
```

### 6. Get AI Summary

```typescript
// Frontend
const response = await api.get(`/student/lms/content/${contentId}/summary`);
const summary = response.data.summary;
```

---

## 🎨 UI Components Usage

### ContentSummarySidebar

```tsx
import ContentSummarySidebar from '@/components/ContentSummarySidebar';

<ContentSummarySidebar
  contentId={selectedContentId}
  visible={summarySidebarVisible}
  onClose={() => setSummarySidebarVisible(false)}
/>
```

### ContentLearningPanel

```tsx
import ContentLearningPanel from '@/components/ContentLearningPanel';

<ContentLearningPanel
  contentId={selectedContentId}
  visible={learningSidebarVisible}
  onClose={() => setLearningSidebarVisible(false)}
/>
```

---

## 🗄️ Database Queries

### Create LMS Content (Backend)

```typescript
const content = await prisma.lMSContent.create({
  data: {
    title: 'Introduction to Physics',
    description: 'Basic concepts',
    contentType: 'VIDEO',
    status: 'PUBLISHED',
    accessType: 'FREE',
    subjectId: 'subject-id',
    lessonId: 'lesson-id',
    topicId: 'topic-id',
    youtubeId: 'abc123',
    duration: 600,
    difficulty: 'MEDIUM',
    tags: ['physics', 'mechanics'],
    order: 1
  }
});
```

### Get Content with Progress (Backend)

```typescript
const content = await prisma.lMSContent.findFirst({
  where: {
    id: contentId,
    status: 'PUBLISHED'
  },
  include: {
    subject: { select: { id: true, name: true } },
    lesson: { select: { id: true, name: true } },
    topic: { select: { id: true, name: true } },
    subtopic: { select: { id: true, name: true } },
    progress: {
      where: { userId },
      select: {
        id: true,
        status: true,
        progress: true,
        completedAt: true
      }
    }
  }
});
```

### Update Progress (Backend)

```typescript
const progress = await prisma.lMSProgress.upsert({
  where: {
    userId_contentId: { userId, contentId }
  },
  update: {
    status: 'COMPLETED',
    progress: 100,
    completedAt: new Date(),
    lastAccessedAt: new Date()
  },
  create: {
    userId,
    contentId,
    status: 'COMPLETED',
    progress: 100,
    completedAt: new Date(),
    lastAccessedAt: new Date()
  }
});
```

---

## 🔍 Common Queries

### Find all content for a subject

```typescript
const content = await prisma.lMSContent.findMany({
  where: {
    subjectId: 'subject-id',
    status: 'PUBLISHED'
  },
  orderBy: { order: 'asc' }
});
```

### Get user's incomplete content

```typescript
const incompleteContent = await prisma.lMSProgress.findMany({
  where: {
    userId,
    status: { not: 'COMPLETED' }
  },
  include: {
    content: {
      include: {
        subject: true,
        topic: true
      }
    }
  }
});
```

### Get content by difficulty

```typescript
const easyContent = await prisma.lMSContent.findMany({
  where: {
    difficulty: 'EASY',
    status: 'PUBLISHED'
  }
});
```

---

## 🎯 Common Tasks

### Task 1: Add New Content Type

1. Update `ContentType` enum in schema.prisma
2. Add rendering logic in `learn/[id]/page.tsx`
3. Update content creation form in admin panel
4. Test content display and progress tracking

### Task 2: Add New Progress Status

1. Update `ProgressStatus` enum in schema.prisma
2. Update progress update logic in `lms.controller.ts`
3. Add UI button/action in learning page
4. Update progress display components

### Task 3: Implement New AI Feature

1. Add method in `content-learning.service.ts`
2. Create endpoint in `content-learning.controller.ts`
3. Add frontend API call in learning page
4. Update AI usage tracking
5. Add UI component for feature

### Task 4: Add Progress Analytics

1. Create aggregation query in service
2. Add endpoint in controller
3. Create analytics component
4. Display charts/graphs
5. Add export functionality

---

## 🐛 Debugging Tips

### Content Not Showing

**Check:**
1. Content status is `PUBLISHED`
2. User's stream matches content's subject stream
3. Content has valid subject/lesson/topic/subtopic IDs
4. No errors in browser console

### Progress Not Updating

**Check:**
1. API call succeeds (check network tab)
2. User is authenticated
3. Content ID is valid
4. Progress status is valid enum value

### AI Features Not Working

**Check:**
1. User has AI test quota remaining
2. OpenAI API key is configured
3. Content has summary or text to analyze
4. Subscription allows AI features

---

## 📊 Progress Status Flow

```
NOT_STARTED → IN_PROGRESS → COMPLETED
                    ↓
                 REVIEW
                    ↓
                 REVISIT
                    ↓
              IN_PROGRESS
```

---

## 🔐 Access Control Logic

```typescript
// Check if user can access content
const canAccess = (user, content) => {
  // Check stream match
  if (content.subject.streamId !== user.streamId) return false;
  
  // Check access type
  if (content.accessType === 'FREE') return true;
  if (content.accessType === 'TRIAL' && user.trialEndsAt > new Date()) return true;
  if (content.accessType === 'SUBSCRIPTION' && user.hasActiveSubscription) return true;
  if (content.accessType === 'PREMIUM' && user.hasPremiumSubscription) return true;
  
  return false;
};
```

---

## 📈 Performance Optimization

### Frontend
- Use `useMemo` for expensive computations
- Implement virtual scrolling for large lists
- Lazy load content components
- Cache API responses
- Debounce search inputs

### Backend
- Use database indexes on frequently queried fields
- Implement pagination for large datasets
- Cache AI-generated content
- Use select to limit returned fields
- Batch database queries

---

## 🧪 Testing Checklist

### Content Display
- [ ] Content loads correctly
- [ ] All content types render properly
- [ ] Progress displays accurately
- [ ] Navigation works smoothly

### Progress Tracking
- [ ] Progress updates on interaction
- [ ] Completion marks correctly
- [ ] Status changes reflect immediately
- [ ] Progress persists across sessions

### AI Features
- [ ] Questions generate successfully
- [ ] Summary displays correctly
- [ ] Performance analysis shows insights
- [ ] Quota tracking works

### Access Control
- [ ] Free content accessible to all
- [ ] Subscription content restricted
- [ ] Trial content available during trial
- [ ] Stream filtering works

---

## 🔄 Common Workflows

### Student Learning Workflow
1. Login → Dashboard
2. Navigate to LMS
3. Browse hierarchy
4. Select content
5. View in learning page
6. Progress auto-tracked
7. Use AI tools as needed
8. Mark complete
9. Move to next content

### Admin Content Creation Workflow
1. Login as admin
2. Navigate to LMS management
3. Create new content
4. Set hierarchy (subject/lesson/topic/subtopic)
5. Upload/link content
6. Set access type and difficulty
7. Publish content
8. Monitor analytics

---

## 📞 Support & Resources

### Documentation
- Main README: `/README.md`
- LMS Guide: `/LMS_STUDENT_LEARNING_SYSTEM.md`
- AI Features: `/AI_IMPLEMENTATION.md`

### Key Models
- LMSContent
- LMSProgress
- SubjectProgress
- LessonProgress
- TopicProgress
- SubtopicProgress

### Key Services
- LMSService
- ContentLearningService
- LessonProgressService
- LMSSummaryService

---

**Quick Tip**: Use browser DevTools Network tab to inspect API calls and responses for debugging.

**Pro Tip**: Check `prisma/schema.prisma` for the complete data model and relationships.

**Remember**: Always test with different user roles and subscription statuses!
