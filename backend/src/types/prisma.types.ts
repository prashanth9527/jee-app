// Re-export Prisma types for easier imports
export { 
  UserRole, 
  NotificationPriority, 
  Difficulty, 
  PlanType, 
  PlanInterval, 
  SubscriptionStatus, 
  OtpType, 
  QuestionReportType, 
  ReportStatus, 
  ReferralStatus, 
  RewardType 
} from '@prisma/client';

// Re-export Prisma client
export { PrismaClient } from '@prisma/client';
