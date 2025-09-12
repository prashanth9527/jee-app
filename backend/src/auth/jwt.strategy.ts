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
		const user = await this.usersService.findById(payload.sub);
		if (!user) {
			return null;
		}

		// For STUDENT role, validate session
		if (user.role === 'STUDENT' && payload.sessionId) {
			const sessionValidation = await this.sessionService.validateSession(payload.sessionId);
			if (!sessionValidation.isValid || sessionValidation.userId !== user.id) {
				throw new UnauthorizedException('Session expired or invalid. Please login again.');
			}
		}

		return { 
			id: user.id, 
			email: user.email, 
			fullName: user.fullName, 
			role: user.role,
			sessionId: payload.sessionId
		};
	}
} 