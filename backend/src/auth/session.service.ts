import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class SessionService {
	constructor(private readonly prisma: PrismaService) {}

	/**
	 * Create a new session for a user
	 * For STUDENT role, this will invalidate all other active sessions
	 */
	async createSession(
		userId: string,
		deviceInfo?: string,
		ipAddress?: string,
		userAgent?: string
	): Promise<string> {
		// Get user to check role
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: { role: true }
		});

		if (!user) {
			throw new Error('User not found');
		}

		// For STUDENT role, invalidate all existing active sessions
		if (user.role === 'STUDENT') {
			await this.prisma.userSession.updateMany({
				where: {
					userId,
					isActive: true
				},
				data: {
					isActive: false
				}
			});
		}

		// Generate unique session ID
		const sessionId = randomBytes(32).toString('hex');
		
		// Set session expiration (24 hours from now)
		const expiresAt = new Date();
		expiresAt.setHours(expiresAt.getHours() + 24);

		// Create new session
		await this.prisma.userSession.create({
			data: {
				userId,
				sessionId,
				deviceInfo,
				ipAddress,
				userAgent,
				expiresAt
			}
		});

		return sessionId;
	}

	/**
	 * Validate a session and update last activity
	 */
	async validateSession(sessionId: string): Promise<{ userId: string; isValid: boolean }> {
		const session = await this.prisma.userSession.findUnique({
			where: { sessionId },
			select: {
				userId: true,
				isActive: true,
				expiresAt: true
			}
		});

		if (!session || !session.isActive || session.expiresAt < new Date()) {
			return { userId: '', isValid: false };
		}

		// Update last activity
		await this.prisma.userSession.update({
			where: { sessionId },
			data: { lastActivityAt: new Date() }
		});

		return { userId: session.userId, isValid: true };
	}

	/**
	 * Invalidate a specific session
	 */
	async invalidateSession(sessionId: string): Promise<void> {
		await this.prisma.userSession.update({
			where: { sessionId },
			data: { isActive: false }
		});
	}

	/**
	 * Invalidate all sessions for a user
	 */
	async invalidateAllUserSessions(userId: string): Promise<void> {
		await this.prisma.userSession.updateMany({
			where: { userId },
			data: { isActive: false }
		});
	}

	/**
	 * Clean up expired sessions
	 */
	async cleanupExpiredSessions(): Promise<number> {
		const result = await this.prisma.userSession.updateMany({
			where: {
				OR: [
					{ expiresAt: { lt: new Date() } },
					{ isActive: false }
				]
			},
			data: { isActive: false }
		});

		return result.count;
	}

	/**
	 * Get active sessions for a user
	 */
	async getUserActiveSessions(userId: string) {
		return this.prisma.userSession.findMany({
			where: {
				userId,
				isActive: true,
				expiresAt: { gt: new Date() }
			},
			select: {
				id: true,
				sessionId: true,
				deviceInfo: true,
				ipAddress: true,
				userAgent: true,
				lastActivityAt: true,
				createdAt: true
			},
			orderBy: { lastActivityAt: 'desc' }
		});
	}

	/**
	 * Check if user has any active sessions (for STUDENT role validation)
	 */
	async hasActiveSessions(userId: string): Promise<boolean> {
		const count = await this.prisma.userSession.count({
			where: {
				userId,
				isActive: true,
				expiresAt: { gt: new Date() }
			}
		});

		return count > 0;
	}
}

