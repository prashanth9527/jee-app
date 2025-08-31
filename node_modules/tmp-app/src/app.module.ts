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
import { ExamsModule } from './exams/exams.module';
import { StreamsModule } from './streams/streams.module';

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
    ExamsModule,
    StreamsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
