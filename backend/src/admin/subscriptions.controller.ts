import { BadRequestException, Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('admin/subscriptions')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminSubscriptionsController {
	constructor(private readonly prisma: PrismaService) {}

	@Get('plans')
	async listPlans(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('search') search?: string
	) {
		const currentPage = parseInt(page || '1');
		const itemsPerPage = parseInt(limit || '10');
		const skip = (currentPage - 1) * itemsPerPage;

		// Build where clause
		const where: any = {};
		
		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } }
			];
		}

		// Get total count for pagination
		const totalItems = await this.prisma.plan.count({ where });
		const totalPages = Math.ceil(totalItems / itemsPerPage);

		// Get plans with subscription count
		const plans = await this.prisma.plan.findMany({
			where,
			include: {
				_count: {
					select: {
						subscriptions: true
					}
				}
			},
			orderBy: { createdAt: 'desc' },
			skip,
			take: itemsPerPage,
		});

		return {
			plans,
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

	@Get('plans/:id')
	async findPlan(@Param('id') id: string) {
		const plan = await this.prisma.plan.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						subscriptions: true
					}
				},
				subscriptions: {
					include: {
						user: {
							select: {
								id: true,
								fullName: true,
								email: true
							}
						}
					},
					take: 10,
					orderBy: {
						createdAt: 'desc'
					}
				}
			}
		});

		if (!plan) {
			throw new BadRequestException('Plan not found');
		}

		return plan;
	}

	@Post('plans')
	async createPlan(@Body() body: { 
		name: string; 
		description?: string; 
		priceCents: number; 
		discountPercent?: number;
		interval?: 'MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'YEAR';
		planType?: 'MANUAL' | 'AI_ENABLED'
	}) {
		if (!body.name || !body.priceCents) {
			throw new BadRequestException('Name and price are required');
		}

		// Check for duplicate plan name
		const existingPlan = await this.prisma.plan.findUnique({
			where: { name: body.name }
		});

		if (existingPlan) {
			throw new BadRequestException('A plan with this name already exists');
		}

		let priceCents = body.priceCents;
		if (body.interval === 'THREE_MONTHS') {
			priceCents = body.priceCents * 3;
		} else if (body.interval === 'SIX_MONTHS') {
			priceCents = body.priceCents * 6;
		} else if (body.interval === 'YEAR') {
			priceCents = body.priceCents * 12;
		}

		return this.prisma.plan.create({
			data: {
				name: body.name,
				description: body.description || null,
				priceCents: priceCents,
				basePriceCents: body.priceCents,
				discountPercent: body.discountPercent,
				interval: (body.interval || 'MONTH') as any,
				planType: body.planType || 'MANUAL',
			}
		});
	}

	@Put('plans/:id')
	async updatePlan(
		@Param('id') id: string, 
		@Body() body: { 
			name?: string; 
			description?: string; 
			priceCents?: number; 
			interval?: 'MONTH' | 'THREE_MONTHS' | 'SIX_MONTHS' | 'YEAR';
			planType?: 'MANUAL' | 'AI_ENABLED'; 
			isActive?: boolean 
		}
	) {
		const plan = await this.prisma.plan.findUnique({ where: { id } });
		if (!plan) {
			throw new BadRequestException('Plan not found');
		}

		// Check for duplicate plan name if name is being updated
		if (body.name && body.name !== plan.name) {
			const existingPlan = await this.prisma.plan.findUnique({
				where: { name: body.name }
			});

			if (existingPlan) {
				throw new BadRequestException('A plan with this name already exists');
			}
		}

		return this.prisma.plan.update({
			where: { id },
			data: body
		});
	}

	@Delete('plans/:id')
	async deletePlan(@Param('id') id: string) {
		const plan = await this.prisma.plan.findUnique({
			where: { id },
			include: {
				_count: {
					select: {
						subscriptions: true
					}
				}
			}
		});

		if (!plan) {
			throw new BadRequestException('Plan not found');
		}

		if (plan._count.subscriptions > 0) {
			throw new BadRequestException('Cannot delete plan with active subscriptions');
		}

		return this.prisma.plan.delete({ where: { id } });
	}

	@Get('subscriptions')
	async listSubscriptions(
		@Query('page') page?: string,
		@Query('limit') limit?: string,
		@Query('search') search?: string,
		@Query('status') status?: string,
		@Query('planId') planId?: string
	) {
		const currentPage = parseInt(page || '1');
		const itemsPerPage = parseInt(limit || '10');
		const skip = (currentPage - 1) * itemsPerPage;

		// Build where clause
		const where: any = {};
		
		if (search) {
			where.OR = [
				{ user: { fullName: { contains: search, mode: 'insensitive' } } },
				{ user: { email: { contains: search, mode: 'insensitive' } } },
				{ plan: { name: { contains: search, mode: 'insensitive' } } }
			];
		}

		if (status) {
			where.status = status;
		}

		if (planId) {
			where.planId = planId;
		}

		// Get total count for pagination
		const totalItems = await this.prisma.subscription.count({ where });
		const totalPages = Math.ceil(totalItems / itemsPerPage);

		// Get subscriptions with user and plan details
		const subscriptions = await this.prisma.subscription.findMany({
			where,
			include: {
				user: {
					select: {
						id: true,
						fullName: true,
						email: true
					}
				},
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
			orderBy: { createdAt: 'desc' },
			skip,
			take: itemsPerPage,
		});

		return {
			subscriptions,
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

	@Get('subscriptions/:id')
	async findSubscription(@Param('id') id: string) {
		const subscription = await this.prisma.subscription.findUnique({
			where: { id },
			include: {
				user: {
					select: {
						id: true,
						fullName: true,
						email: true,
						createdAt: true
					}
				},
				plan: {
					select: {
						id: true,
						name: true,
						description: true,
						priceCents: true,
						currency: true,
						interval: true
					}
				}
			}
		});

		if (!subscription) {
			throw new BadRequestException('Subscription not found');
		}

		return subscription;
	}

	@Put('subscriptions/:id')
	async updateSubscription(
		@Param('id') id: string,
		@Body() body: { status?: 'ACTIVE'|'CANCELED'|'EXPIRED'; endsAt?: string }
	) {
		const subscription = await this.prisma.subscription.findUnique({ where: { id } });
		if (!subscription) {
			throw new BadRequestException('Subscription not found');
		}

		const updateData: any = {};
		if (body.status) {
			updateData.status = body.status;
		}
		if (body.endsAt) {
			updateData.endsAt = new Date(body.endsAt);
		}

		return this.prisma.subscription.update({
			where: { id },
			data: updateData,
			include: {
				user: {
					select: {
						id: true,
						fullName: true,
						email: true
					}
				},
				plan: {
					select: {
						id: true,
						name: true,
						priceCents: true,
						currency: true,
						interval: true
					}
				}
			}
		});
	}

	@Get('analytics')
	async getAnalytics() {
		// Get total counts
		const totalPlans = await this.prisma.plan.count();
		const totalSubscriptions = await this.prisma.subscription.count();
		const activeSubscriptions = await this.prisma.subscription.count({
			where: { status: 'ACTIVE' }
		});
		const canceledSubscriptions = await this.prisma.subscription.count({
			where: { status: 'CANCELED' }
		});

		// Get revenue data
		const subscriptions = await this.prisma.subscription.findMany({
			where: { status: 'ACTIVE' },
			include: {
				plan: {
					select: {
						priceCents: true,
						currency: true,
						interval: true
					}
				}
			}
		});

		// Calculate monthly recurring revenue (MRR)
		const mrr = subscriptions.reduce((total: number, sub: any) => {
			if (sub.plan.interval === 'MONTH') {
				return total + sub.plan.priceCents;
			} else {
				// Convert yearly to monthly
				return total + Math.round(sub.plan.priceCents / 12);
			}
		}, 0);

		// Get recent subscriptions
		const recentSubscriptions = await this.prisma.subscription.findMany({
			take: 5,
			orderBy: { createdAt: 'desc' },
			include: {
				user: {
					select: {
						fullName: true,
						email: true
					}
				},
				plan: {
					select: {
						name: true
					}
				}
			}
		});

		// Get plan distribution
		const planDistribution = await this.prisma.plan.findMany({
			include: {
				_count: {
					select: {
						subscriptions: {
							where: { status: 'ACTIVE' }
						}
					}
				}
			}
		});

		return {
			overview: {
				totalPlans,
				totalSubscriptions,
				activeSubscriptions,
				canceledSubscriptions,
				mrr: mrr / 100 // Convert cents to dollars
			},
			recentSubscriptions,
			planDistribution
		};
	}
} 