import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class SubscriptionsService {
	private stripe: any;

	constructor(private readonly prisma: PrismaService) {
		// Only create Stripe client if secret key is available
		if (process.env.STRIPE_SECRET_KEY) {
			this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
		}
	}

	// Plans CRUD (admin)
	listPlans() {
		return this.prisma.plan.findMany({ orderBy: { createdAt: 'desc' } });
	}

	createPlan(data: { name: string; description?: string; priceCents: number; currency?: string; interval?: 'MONTH'|'YEAR' }) {
		return this.prisma.plan.create({ data: {
			name: data.name,
			description: data.description || null,
			priceCents: data.priceCents,
			currency: data.currency || 'usd',
			interval: (data.interval || 'MONTH') as any,
		}});
	}

	updatePlan(id: string, data: { name?: string; description?: string; priceCents?: number; currency?: string; interval?: 'MONTH'|'YEAR'; isActive?: boolean }) {
		return this.prisma.plan.update({ where: { id }, data });
	}

	// Checkout
	async createCheckoutSession(userId: string, planId: string, successUrl: string, cancelUrl: string) {
		if (!this.stripe) {
			throw new Error('Stripe not configured');
		}
		const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
		if (!plan) throw new Error('Plan not found');
		let priceId = plan.stripePriceId || undefined;
		if (!priceId) {
			const product = await this.stripe.products.create({ name: plan.name, description: plan.description || undefined });
			const price = await this.stripe.prices.create({
				unit_amount: plan.priceCents,
				currency: plan.currency,
				recurring: { interval: plan.interval === 'YEAR' ? 'year' : 'month' },
				product: product.id,
			});
			priceId = price.id;
			await this.prisma.plan.update({ where: { id: plan.id }, data: { stripePriceId: priceId } });
		}
		const session = await this.stripe.checkout.sessions.create({
			mode: 'subscription',
			line_items: [{ price: priceId, quantity: 1 }],
			success_url: successUrl,
			cancel_url: cancelUrl,
			client_reference_id: userId,
		});
		return { url: session.url };
	}

	// Webhook (stub)
	async handleWebhook(event: any) {
		switch (event.type) {
			case 'checkout.session.completed': {
				const session = event.data.object as any;
				const userId = (session.client_reference_id || '').toString();
				const subId = (session.subscription as string) || undefined;
				if (userId && subId) {
					const line = (session as any).line_items?.data?.[0];
					const priceId = line?.price?.id as string | undefined;
					if (priceId) {
						const plan = await this.prisma.plan.findFirst({ where: { stripePriceId: priceId } });
						if (plan) {
							await this.prisma.subscription.create({ data: { userId, planId: plan.id, status: 'ACTIVE', stripeSubId: subId } });
						}
					}
				}
				break;
			}
		}
		return { received: true };
	}

	// Access helper
	async userHasAccess(userId: string) {
		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user) return false;
		const now = new Date();
		if (user.trialEndsAt && now <= user.trialEndsAt) return true;
		const active = await this.prisma.subscription.findFirst({ where: { userId, status: 'ACTIVE' } });
		return !!active;
	}
} 