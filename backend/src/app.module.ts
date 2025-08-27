import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { ExamsModule } from './exams/exams.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true }),
		PrismaModule,
		UsersModule,
		AuthModule,
		AdminModule,
		ExamsModule,
		SubscriptionsModule,
	],
	controllers: [AppController],
})
export class AppModule {}
