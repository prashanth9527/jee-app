import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(private readonly usersService: UsersService) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: process.env.JWT_SECRET || 'dev_secret',
		});
	}

	async validate(payload: { sub: string; email: string }) {
		const user = await this.usersService.findById(payload.sub);
		return user ? { id: user.id, email: user.email, fullName: user.fullName, role: user.role } : null;
	}
} 