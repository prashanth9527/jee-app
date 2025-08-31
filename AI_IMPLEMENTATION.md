# 🤖 AI-Enabled Practice Test System

## Overview

This implementation adds AI-powered question generation and explanations to the JEE Practice platform using ChatGPT integration. The system supports two subscription tiers:

1. **Manual Plan** - Uses existing database questions
2. **AI Enabled Plan** - Generates custom questions using ChatGPT + AI explanations

## 🏗️ Architecture

### Backend Components

#### 1. Database Schema Updates
- **Plan Model**: Added `planType` enum (`MANUAL` | `AI_ENABLED`)
- **Question Model**: Added `isAIGenerated` and `aiPrompt` fields

#### 2. AI Service (`backend/src/ai/ai.service.ts`)
- **ChatGPT Integration**: Uses OpenAI API for question generation
- **Question Generation**: Creates JEE-level questions with explanations
- **Explanation Generation**: Provides detailed explanations for answers
- **Subscription Validation**: Checks AI access permissions

#### 3. Enhanced Exams Service
- **AI Question Generation**: `generateAIPracticeTest()` method
- **AI Explanation Generation**: `generateAIExplanation()` method
- **Subscription Integration**: Validates AI access before generation

#### 4. Subscription Validation
- **Plan Type Checking**: Validates AI-enabled subscriptions
- **Access Control**: Restricts AI features to premium users

### Frontend Components

#### 1. Practice Test Creation (`frontend/src/app/student/practice/page.tsx`)
- **AI Toggle**: Radio buttons for question source selection
- **Subscription Check**: Validates AI access before enabling
- **Visual Indicators**: Shows AI features for premium users

#### 2. Results Page (`frontend/src/app/student/practice/results/[submissionId]/page.tsx`)
- **AI Badges**: Shows "AI Generated" for AI questions
- **Enhanced Explanations**: Displays AI-generated explanations

## 🚀 Features

### AI Question Generation
- **Custom Prompts**: Generates questions based on subject, topic, and difficulty
- **JEE Syllabus**: Ensures questions align with JEE curriculum
- **Multiple Choice**: Creates 4-option questions with explanations
- **Difficulty Levels**: Supports Easy, Medium, and Hard questions

### AI Explanations
- **Detailed Reasoning**: Explains why answers are correct/incorrect
- **Educational Content**: Helps students understand concepts
- **Personalized Feedback**: Addresses specific student mistakes

### Subscription Management
- **Plan Types**: Manual vs AI-enabled subscription tiers
- **Access Control**: Restricts AI features to premium users
- **Upgrade Prompts**: Guides users to upgrade for AI access

## 🔧 Setup Instructions

### 1. Environment Variables
Add to `backend/.env`:
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_BASE_URL=https://api.openai.com/v1
```

### 2. Database Migration
```bash
# Generate Prisma client with new schema
npm run db:generate

# Push schema changes
npm run db:push

# Seed database with new plans
npm run db:seed
```

### 3. Backend Dependencies
The AI service uses:
- `@nestjs/config` for environment variables
- `fetch` for OpenAI API calls
- Prisma for database operations

### 4. Frontend Integration
The frontend automatically detects subscription status and shows/hides AI features accordingly.

## 📊 Subscription Plans

### Manual Plan (₹999/month)
- ✅ Access to database questions
- ✅ Practice test creation
- ✅ Performance analytics
- ❌ AI question generation
- ❌ AI explanations

### AI Enabled Plan (₹1,999/month)
- ✅ All Manual Plan features
- ✅ Unlimited AI question generation
- ✅ AI-powered explanations
- ✅ Personalized difficulty adjustment
- ✅ Real-time question creation

## 🔒 Security & Access Control

### AI Access Validation
```typescript
// Check if user has AI access
const aiAccess = await this.aiService.validateSubscription(userId);
if (!aiAccess.hasAIAccess) {
  throw new Error('AI question generation requires AI-enabled subscription');
}
```

### Subscription Validation
```typescript
// Validate subscription status
const status = await this.subscriptionValidation.validateStudentSubscription(userId);
return status.planType === 'AI_ENABLED';
```

## 🎯 API Endpoints

### AI Question Generation
```http
POST /exams/ai/generate-practice-test
{
  "subjectId": "string",
  "topicId": "string?",
  "subtopicId": "string?",
  "questionCount": number,
  "difficulty": "EASY" | "MEDIUM" | "HARD",
  "timeLimitMin": number
}
```

### AI Explanation Generation
```http
POST /exams/ai/generate-explanation
{
  "questionId": "string",
  "userAnswer": "string?"
}
```

## 🧪 Testing

### Manual Testing
1. **Create Manual Plan User**: Test database question access
2. **Create AI Plan User**: Test AI question generation
3. **Test Access Control**: Verify AI features are restricted
4. **Test Question Quality**: Review AI-generated questions

### API Testing
```bash
# Test AI question generation
curl -X POST http://localhost:3001/exams/ai/generate-practice-test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "subjectId": "subject_id",
    "questionCount": 5,
    "difficulty": "MEDIUM",
    "timeLimitMin": 30
  }'
```

## 🔄 Workflow

### AI Question Generation Flow
1. **User Request**: Student selects AI generation option
2. **Access Check**: Validate AI-enabled subscription
3. **Prompt Creation**: Build ChatGPT prompt with parameters
4. **API Call**: Generate questions via OpenAI
5. **Validation**: Verify question structure and quality
6. **Database Save**: Store AI questions with metadata
7. **Test Creation**: Create exam paper with AI questions

### AI Explanation Flow
1. **User Answer**: Student submits answer
2. **Access Check**: Validate AI subscription
3. **Context Building**: Gather question and answer context
4. **Explanation Generation**: Create personalized explanation
5. **Display**: Show AI explanation in results

## 🎨 UI/UX Features

### Visual Indicators
- **AI Badges**: Purple badges for AI-generated content
- **Premium Prompts**: Upgrade prompts for non-AI users
- **Feature Highlights**: AI features section for premium users

### User Experience
- **Seamless Integration**: AI features work alongside existing features
- **Clear Differentiation**: Obvious distinction between manual and AI content
- **Upgrade Path**: Easy upgrade flow for AI features

## 🔮 Future Enhancements

### Potential Improvements
1. **Question Quality**: Implement question validation and filtering
2. **Personalization**: AI-generated questions based on user performance
3. **Batch Generation**: Generate question banks for specific topics
4. **Explanation Enhancement**: Add diagrams and step-by-step solutions
5. **Performance Analytics**: Track AI question effectiveness

### Advanced Features
1. **Adaptive Difficulty**: AI adjusts difficulty based on performance
2. **Concept Mapping**: Generate questions for specific concepts
3. **Multi-language Support**: Generate questions in different languages
4. **Question Templates**: Customizable question generation templates

## 🛠️ Troubleshooting

### Common Issues
1. **OpenAI API Errors**: Check API key and rate limits
2. **Subscription Validation**: Verify plan type in database
3. **Question Quality**: Review prompt engineering for better results
4. **Performance**: Monitor API response times and costs

### Debug Steps
1. Check environment variables
2. Verify Prisma schema updates
3. Test subscription validation
4. Monitor OpenAI API responses
5. Review question generation prompts

## 📈 Monitoring & Analytics

### Key Metrics
- AI question generation success rate
- User engagement with AI features
- Subscription upgrade conversion
- Question quality ratings
- API usage and costs

### Logging
- AI service logs all generation attempts
- Error tracking for failed generations
- Performance monitoring for API calls
- User interaction tracking

---

This implementation provides a robust foundation for AI-powered education while maintaining clear subscription tiers and access control. The system is designed to be scalable and can be enhanced with additional AI features as needed. 