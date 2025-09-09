import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleAuthController } from './google-auth.controller';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReferralsModule } from '../referrals/referrals.module';
import { JwtStrategy } from './jwt.strategy';
import { OtpService } from './otp.service';
import { MailerService } from './mailer.service';
import { SmsService } from './sms.service';
import { OAuthStateService } from './oauth-state.service';
import { SessionService } from './session.service';
import { SessionCleanupService } from './session-cleanup.service';

@Module({
	imports: [
		UsersModule,
		PrismaModule,
		ReferralsModule,
		ScheduleModule.forRoot(),
		PassportModule.register({ defaultStrategy: 'jwt' }),
		JwtModule.registerAsync({
			useFactory: () => ({
				secret: process.env.JWT_SECRET || 'dev_secret',
				signOptions: { expiresIn: '7d' },
			}),
		}),
	],
	providers: [AuthService, JwtStrategy, OtpService, MailerService, SmsService, OAuthStateService, SessionService, SessionCleanupService],
	controllers: [AuthController, GoogleAuthController],
	exports: [AuthService],
})
export class AuthModule {} 