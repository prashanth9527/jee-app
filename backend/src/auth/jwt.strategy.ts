import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';
import { SessionService } from './session.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private readonly usersService: UsersService,
		private readonly sessionService: SessionService
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_SECRET || 'dev_secret',
		});
	}

	async validate(payload: { sub: string; email: string; sessionId?: string }) {
		console.log('JWT Strategy - Validating payload:', {
			sub: payload.sub,
			email: payload.email,
			sessionId: payload.sessionId
		});

		const user = await this.usersService.findById(payload.sub);
		if (!user) {
			console.log('JWT Strategy - User not found for ID:', payload.sub);
			return null;
		}

		console.log('JWT Strategy - User found:', {
			id: user.id,
			email: user.email,
			role: user.role
		});

		// For STUDENT role, validate session
		if (user.role === 'STUDENT' && payload.sessionId) {
			console.log('JWT Strategy - Validating session for student:', payload.sessionId);
			const sessionValidation = await this.sessionService.validateSession(payload.sessionId);
			console.log('JWT Strategy - Session validation result:', sessionValidation);
			
			if (!sessionValidation.isValid || sessionValidation.userId !== user.id) {
				console.log('JWT Strategy - Session validation failed');
				throw new UnauthorizedException('Session expired or invalid. Please login again.');
			}
		}

		const result = { 
			id: user.id, 
			email: user.email, 
			fullName: user.fullName, 
			role: user.role,
			sessionId: payload.sessionId
		};

		console.log('JWT Strategy - Returning user data:', result);
		return result;
	}
} 