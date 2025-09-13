import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { StudentModule } from './student/student.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { ReferralsModule } from './referrals/referrals.module';
import { AIModule } from './ai/ai.module';
import { AISuggestionsModule } from './ai/ai-suggestions.module';
import { ExamsModule } from './exams/exams.module';
import { StreamsModule } from './streams/streams.module';
import { ExpertModule } from './expert/expert.module';
import { AwsModule } from './aws/aws.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { FormulasModule } from './formulas/formulas.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ContactModule } from './contact/contact.module';
import { LMSModule } from './lms/lms.module';



@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    AdminModule,
    StudentModule,
    SubscriptionsModule,
    ReferralsModule,
    AIModule,
    AISuggestionsModule,
    ExamsModule,
    StreamsModule,
    ExpertModule,
    AwsModule,
    BookmarksModule,
    FormulasModule,
    NotificationsModule,
    ContactModule,
    LMSModule,
    
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
