import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
	constructor(private readonly prisma: PrismaService) {}

	@Get()
	async listUsers(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('search') search?: string,
		@Query('role') role?: string,
		@Query('emailVerified') emailVerified?: string,
		@Query('phoneVerified') phoneVerified?: string
	) {
		const currentPage = parseInt(page || '1');
		const itemsPerPage = parseInt(limit || '10');
		const skip = (currentPage - 1) * itemsPerPage;

		// Build where clause
		const where: any = {};
		
		if (search) {
			where.OR = [
				{ fullName: { contains: search, mode: 'insensitive' } },
				{ email: { contains: search, mode: 'insensitive' } },
				{ phone: { contains: search, mode: 'insensitive' } }
			];
		}

		if (role) {
			where.role = role;
		}

		if (emailVerified !== undefined) {
			where.emailVerified = emailVerified === 'true';
		}

		if (phoneVerified !== undefined) {
			where.phoneVerified = phoneVerified === 'true';
		}

		// Get total count for pagination
		const totalItems = await this.prisma.user.count({ where });
		const totalPages = Math.ceil(totalItems / itemsPerPage);

		// Get users with subscription and exam submission counts
		const users = await this.prisma.user.findMany({
			where,
			include: {
				_count: {
					select: {
						subscriptions: true,
						examSubmissions: true
					}
				},
				subscriptions: {
					where: { status: 'ACTIVE' },
					include: {
						plan: {
							select: {
								name: true,
								priceCents: true,
								currency: true,
								interval: true
							}
						}
					},
					take: 1,
					orderBy: { createdAt: 'desc' }
				}
			},
			orderBy: { createdAt: 'desc' },
			skip,
			take: itemsPerPage,
		});

		return {
			users,
			pagination: {
				currentPage,
				totalPages,
				totalItems,
				itemsPerPage,
				hasNextPage: currentPage < totalPages,
				hasPreviousPage: currentPage > 1
			}
		};
	}

	@Get(':id')
	async findUser(@Param('id') id: string) {
		const user = await this.prisma.user.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						subscriptions: true,
						examSubmissions: true
					}
				},
				subscriptions: {
					include: {
						plan: {
							select: {
								id: true,
								name: true,
								priceCents: true,
								currency: true,
								interval: true
							}
						}
					},
					orderBy: { createdAt: 'desc' }
				},
				examSubmissions: {
					include: {
						examPaper: {
							select: {
								id: true,
								title: true
							}
						}
					},
					take: 10
				}
			}
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		return user;
	}

	@Put(':id')
	async updateUser(
		@Param('id') id: string,
		@Body() body: { 
			fullName?: string; 
			email?: string; 
			phone?: string; 
			role?: 'ADMIN' | 'STUDENT';
			emailVerified?: boolean;
			phoneVerified?: boolean;
		}
	) {
		const user = await this.prisma.user.findUnique({ where: { id } });
		if (!user) {
			throw new BadRequestException('User not found');
		}

		// Check for duplicate email if email is being updated
		if (body.email && body.email !== user.email) {
			const existingUser = await this.prisma.user.findUnique({
				where: { email: body.email }
			});

			if (existingUser) {
				throw new BadRequestException('A user with this email already exists');
			}
		}

		// Check for duplicate phone if phone is being updated
		if (body.phone && body.phone !== user.phone) {
			const existingUser = await this.prisma.user.findUnique({
				where: { phone: body.phone }
			});

			if (existingUser) {
				throw new BadRequestException('A user with this phone number already exists');
			}
		}

		return this.prisma.user.update({
			where: { id },
			data: body,
			include: {
				_count: {
					select: {
						subscriptions: true,
						examSubmissions: true
					}
				}
			}
		});
	}

	@Delete(':id')
	async deleteUser(@Param('id') id: string) {
		const user = await this.prisma.user.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						subscriptions: true,
						examSubmissions: true
					}
				}
			}
		});

		if (!user) {
			throw new BadRequestException('User not found');
		}

		// Prevent deletion of users with subscriptions or exam submissions
		if (user._count.subscriptions > 0 || user._count.examSubmissions > 0) {
			throw new BadRequestException('Cannot delete user with active subscriptions or exam submissions');
		}

		return this.prisma.user.delete({ where: { id } });
	}

	@Post(':id/verify-email')
	async verifyEmail(@Param('id') id: string) {
		const user = await this.prisma.user.findUnique({ where: { id } });
		if (!user) {
			throw new BadRequestException('User not found');
		}

		return this.prisma.user.update({
			where: { id },
			data: { emailVerified: true }
		});
	}

	@Post(':id/verify-phone')
	async verifyPhone(@Param('id') id: string) {
		const user = await this.prisma.user.findUnique({ where: { id } });
		if (!user) {
			throw new BadRequestException('User not found');
		}

		return this.prisma.user.update({
			where: { id },
			data: { phoneVerified: true }
		});
	}

	@Post(':id/start-trial')
	async startTrial(
		@Param('id') id: string,
		@Body() body: { days?: number }
	) {
		const user = await this.prisma.user.findUnique({ where: { id } });
		if (!user) {
			throw new BadRequestException('User not found');
		}

		const trialDays = body.days || 7;
		const startedAt = new Date();
		const endsAt = new Date();
		endsAt.setDate(endsAt.getDate() + trialDays);

		return this.prisma.user.update({
			where: { id },
			data: { 
				trialStartedAt: startedAt,
				trialEndsAt: endsAt
			}
		});
	}

	@Post(':id/end-trial')
	async endTrial(@Param('id') id: string) {
		const user = await this.prisma.user.findUnique({ where: { id } });
		if (!user) {
			throw new BadRequestException('User not found');
		}

		return this.prisma.user.update({
			where: { id },
			data: { 
				trialEndsAt: new Date()
			}
		});
	}

	@Get('analytics/overview')
	async getAnalytics() {
		// Get total counts
		const totalUsers = await this.prisma.user.count();
		const adminUsers = await this.prisma.user.count({ where: { role: 'ADMIN' } });
		const studentUsers = await this.prisma.user.count({ where: { role: 'STUDENT' } });
		const emailVerifiedUsers = await this.prisma.user.count({ where: { emailVerified: true } });
		const phoneVerifiedUsers = await this.prisma.user.count({ where: { phoneVerified: true } });

		// Get trial users
		const now = new Date();
		const trialUsers = await this.prisma.user.count({
			where: {
				trialEndsAt: { gt: now }
			}
		});

		// Get users with active subscriptions
		const subscribedUsers = await this.prisma.user.count({
			where: {
				subscriptions: {
					some: {
						status: 'ACTIVE'
					}
				}
			}
		});

		// Get recent registrations
		const recentUsers = await this.prisma.user.findMany({
			take: 5,
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				fullName: true,
				email: true,
				role: true,
				createdAt: true,
				emailVerified: true,
				phoneVerified: true
			}
		});

		// Get users with most exam submissions (simplified query)
		const topExamUsers = await this.prisma.user.findMany({
			take: 5,
			select: {
				id: true,
				fullName: true,
				email: true,
				_count: {
					select: {
						examSubmissions: true
					}
				}
			}
		});

		return {
			overview: {
				totalUsers,
				adminUsers,
				studentUsers,
				emailVerifiedUsers,
				phoneVerifiedUsers,
				trialUsers,
				subscribedUsers
			},
			recentUsers,
			topExamUsers
		};
	}

	@Get('analytics/roles')
	async getRoleAnalytics() {
		const roleStats = await this.prisma.user.groupBy({
			by: ['role'],
			_count: true
		});

		const verificationStats = await this.prisma.user.groupBy({
			by: ['emailVerified', 'phoneVerified'],
			_count: true
		});

		return {
			roleStats,
			verificationStats
		};
	}
} 