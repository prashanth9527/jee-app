import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentGatewayFactory } from '../payments/services/payment-gateway.factory';
import { randomUUID } from 'crypto';

@Injectable()
export class SubscriptionsService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly paymentGatewayFactory: PaymentGatewayFactory
	) {}

	// Plans CRUD (admin)
	listPlans() {
		return this.prisma.plan.findMany({ orderBy: { createdAt: 'desc' } });
	}

	listPlansRenewal() {
		return this.prisma.plan.findMany({ where: { isActive: true, priceCents: { gt: 0 } }, orderBy: { createdAt: 'desc' } });
	}

	createPlan(data: { name: string; description?: string; priceCents: number; currency?: string; interval?: any }) {
		return this.prisma.plan.create({ data: {
			name: data.name,
			description: data.description || null,
			priceCents: data.priceCents,
			currency: data.currency || 'INR',
			interval: data.interval || 'MONTHLY',
		}});
	}

	updatePlan(id: string, data: any) {
		return this.prisma.plan.update({ where: { id }, data });
	}

	// Checkout
	async createCheckoutSession(userId: string, planId: string, successUrl: string, cancelUrl: string) {
		const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
		if (!plan) throw new Error('Plan not found');
		
		const gateway = this.paymentGatewayFactory.getPaymentGateway();
		const merchantOrderId = randomUUID();
		
		// Replace {ORDER_ID} placeholder with actual order ID
		const processedSuccessUrl = successUrl.replace('{ORDER_ID}', merchantOrderId);
		const processedCancelUrl = cancelUrl.replace('{ORDER_ID}', merchantOrderId);
		
		// Debug logging
		console.log('Subscriptions Service - URL Processing:');
		console.log('Original successUrl:', successUrl);
		console.log('Processed successUrl:', processedSuccessUrl);
		console.log('Original cancelUrl:', cancelUrl);
		console.log('Processed cancelUrl:', processedCancelUrl);
		console.log('merchantOrderId:', merchantOrderId);
		
		// Convert price to appropriate currency unit
		const amount = plan.priceCents;
		const currency = plan.currency;
		
		const result = await gateway.createOrder(
			userId,
			planId,
			amount,
			currency,
			processedSuccessUrl,
			processedCancelUrl,
			merchantOrderId
		);
		
		if (!result.success) {
			throw new Error(result.error || 'Failed to create payment order');
		}
		
		return { 
			orderId: merchantOrderId,
			url: result.redirectUrl,
			deepLink: result.deepLink,
			gateway: this.paymentGatewayFactory.getGatewayName()
		};
	}

	// Webhook handler - delegates to payment gateway
	async handleWebhook(event: any) {
		const gateway = this.paymentGatewayFactory.getPaymentGateway();
		return await gateway.handleWebhook(event, {});
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