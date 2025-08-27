import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
	constructor(
		private readonly users: UsersService,
		private readonly jwt: JwtService,
		private readonly otp: OtpService,
	) {}

	async register(params: { email: string; password: string; fullName: string; phone?: string }) {
		const existing = await this.users.findByEmail(params.email);
		if (existing) throw new BadRequestException('Email already registered');
		const hashedPassword = await bcrypt.hash(params.password, 10);
		const user = await this.users.createUser({ email: params.email, fullName: params.fullName, hashedPassword, phone: params.phone });
		const days = Number(process.env.FREE_TRIAL_DAYS || 2);
		const started = new Date();
		const ends = new Date(started.getTime() + days * 24 * 60 * 60 * 1000);
		await this.users.updateTrial(user.id, started, ends);
		await this.otp.sendEmailOtp(user.id, user.email);
		if (user.phone) await this.otp.sendPhoneOtp(user.id, user.phone);
		return { id: user.id, email: user.email };
	}

	async login(params: { email: string; password: string }) {
		console.log('Login attempt for email:', params.email); // Debug log
		
		const user = await this.users.findByEmail(params.email);
		if (!user) {
			console.log('User not found'); // Debug log
			throw new UnauthorizedException('Invalid credentials');
		}
		
		console.log('User found:', { id: user.id, email: user.email, role: user.role }); // Debug log
		
		const ok = await bcrypt.compare(params.password, user.hashedPassword);
		console.log('Password comparison result:', ok); // Debug log
		
		if (!ok) {
			console.log('Password mismatch'); // Debug log
			throw new UnauthorizedException('Invalid credentials');
		}
		
		const token = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
		const response = { 
			access_token: token,
			user: {
				id: user.id,
				email: user.email,
				fullName: user.fullName,
				role: user.role
			}
		};
		
		console.log('Login successful, returning:', response); // Debug log
		return response;
	}

	async sendEmailOtp(userId: string, email: string) {
		await this.otp.sendEmailOtp(userId, email);
		return { ok: true };
	}

	async sendPhoneOtp(userId: string, phone: string) {
		await this.otp.sendPhoneOtp(userId, phone);
		return { ok: true };
	}

	async verifyEmail(userId: string, code: string) {
		await this.otp.verifyOtp(userId, code, 'EMAIL');
		await this.users.setEmailVerified(userId);
		return { ok: true };
	}

	async verifyPhone(userId: string, code: string) {
		await this.otp.verifyOtp(userId, code, 'PHONE');
		await this.users.setPhoneVerified(userId);
		return { ok: true };
	}
} 