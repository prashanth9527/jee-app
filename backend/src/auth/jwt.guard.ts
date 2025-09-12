import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
	canActivate(context: ExecutionContext) {
		const request = context.switchToHttp().getRequest();
		const authHeader = request.headers.authorization;
		
		console.log('JWT Guard - Request URL:', request.url);
		console.log('JWT Guard - Authorization header:', authHeader ? 'Present' : 'Missing');
		
		if (authHeader) {
			const token = authHeader.replace('Bearer ', '');
			console.log('JWT Guard - Token (first 20 chars):', token.substring(0, 20) + '...');
		}
		
		return super.canActivate(context);
	}

	handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
		console.log('JWT Guard - Handle request:', {
			err: err ? err.message : null,
			user: user ? { id: user.id, email: user.email, role: user.role } : null,
			info: info ? info.message : null
		});

		if (err || !user) {
			console.log('JWT Guard - Authentication failed:', err?.message || info?.message || 'No user');
			throw err || new UnauthorizedException('Authentication failed');
		}

		return user;
	}
} 