import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtStrategy } from './jwt.strategy';
import { OtpService } from './otp.service';
import { MailerService } from './mailer.service';
import { SmsService } from './sms.service';

@Module({
	imports: [
		UsersModule,
		PrismaModule,
		PassportModule.register({ defaultStrategy: 'jwt' }),
		JwtModule.registerAsync({
			useFactory: () => ({
				secret: process.env.JWT_SECRET || 'dev_secret',
				signOptions: { expiresIn: '7d' },
			}),
		}),
	],
	providers: [AuthService, JwtStrategy, OtpService, MailerService, SmsService],
	controllers: [AuthController],
	exports: [AuthService],
})
export class AuthModule {} 