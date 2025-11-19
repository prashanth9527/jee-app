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
	async createCheckoutSession(userId: string, planId: string, successUrl: string, cancelUrl: string, referralCode?: string) {
		const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
		if (!plan) throw new Error('Plan not found');
		
		const gateway = this.paymentGatewayFactory.getPaymentGateway();
		const merchantOrderId = randomUUID();
		
		// Replace {ORDER_ID} placeholder with actual order ID
		const processedSuccessUrl = successUrl.replace('{ORDER_ID}', merchantOrderId);
		const processedCancelUrl = cancelUrl.replace('{ORDER_ID}', merchantOrderId);
		
		// Calculate discounts
		let originalAmount = plan.priceCents;
		let planDiscount = 0;
		let referralDiscount = 0;
		let referralCodeId = null;
		
		// Apply plan discount for multi-month plans
		if (plan.discountPercent && plan.discountPercent > 0) {
			planDiscount = Math.floor(originalAmount * (plan.discountPercent / 100));
		}
		
		// Apply referral discount if provided
		if (referralCode) {
			const referralValidation = await this.validateAndApplyReferralCode(referralCode, userId);
			if (referralValidation.valid && referralValidation.discountPercent) {
				referralDiscount = Math.floor((originalAmount - planDiscount) * (referralValidation.discountPercent / 100));
				referralCodeId = referralValidation.referralCodeId;
			}
		}
		
		const finalAmount = originalAmount - planDiscount - referralDiscount;
		
		// Convert price to appropriate currency unit
		const amount = finalAmount;
		const currency = plan.currency;
		
		// Create payment order with discount tracking
		const paymentOrder = await this.prisma.paymentOrder.create({
			data: {
				userId,
				planId,
				merchantOrderId,
				amount: finalAmount,
				originalAmount,
				currency,
				successUrl: processedSuccessUrl,
				cancelUrl: processedCancelUrl,
				gateway: 'STRIPE', // Default gateway, can be made dynamic
				referralCodeId,
				referralDiscount,
				planDiscount,
			}
		});
		
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

	// Referral code validation and discount application
	private async validateAndApplyReferralCode(referralCode: string, userId: string) {
		const referralCodeData = await this.prisma.referralCode.findUnique({
			where: { code: referralCode },
			include: {
				user: {
					select: {
						id: true,
						fullName: true,
						email: true
					}
				}
			}
		});

		if (!referralCodeData) {
			return { valid: false, message: 'Invalid referral code' };
		}

		if (!referralCodeData.isActive) {
			return { valid: false, message: 'Referral code is inactive' };
		}

		if (referralCodeData.maxUsage && referralCodeData.usageCount >= referralCodeData.maxUsage) {
			return { valid: false, message: 'Referral code has reached maximum usage' };
		}

		// Check if user already has a referral
		const existingReferral = await this.prisma.referral.findUnique({
			where: { refereeId: userId }
		});

		if (existingReferral) {
			return { valid: false, message: 'User already has a referral' };
		}

		// Check if user is referring themselves
		if (referralCodeData.userId === userId) {
			return { valid: false, message: 'Cannot refer yourself' };
		}

		return {
			valid: true,
			referralCodeId: referralCodeData.id,
			discountPercent: referralCodeData.discountPercent || 50,
			referrer: referralCodeData.user
		};
	}
}