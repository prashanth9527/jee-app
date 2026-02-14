import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { StudentModule } from './student/student.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { ReferralsModule } from './referrals/referrals.module';
import { AiModule } from './ai/ai.module';
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
import { BlogsModule } from './blogs/blogs.module';
import { StaticFilesModule } from './static/static-files.module';
import { PracticeModule } from './practice/practice.module';
import { PYQController } from './pyq.controller';



@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['backend/.env', '.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    AdminModule,
    StudentModule,
    SubscriptionsModule,
    PaymentsModule,
    ReferralsModule,
    AiModule,
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
    BlogsModule,
    StaticFilesModule,
    PracticeModule,
  ],
  controllers: [AppController, PYQController],
  providers: [AppService],
})
export class AppModule {}
