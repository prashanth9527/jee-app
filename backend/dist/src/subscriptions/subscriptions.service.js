"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const stripe_1 = require("stripe");
let SubscriptionsService = class SubscriptionsService {
    constructor(prisma) {
        this.prisma = prisma;
        if (process.env.STRIPE_SECRET_KEY) {
            this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY);
        }
    }
    listPlans() {
        return this.prisma.plan.findMany({ orderBy: { createdAt: 'desc' } });
    }
    createPlan(data) {
        return this.prisma.plan.create({ data: {
                name: data.name,
                description: data.description || null,
                priceCents: data.priceCents,
                currency: data.currency || 'INR',
                interval: data.interval || 'MONTHLY',
            } });
    }
    updatePlan(id, data) {
        return this.prisma.plan.update({ where: { id }, data });
    }
    async createCheckoutSession(userId, planId, successUrl, cancelUrl) {
        if (!this.stripe) {
            throw new Error('Stripe not configured');
        }
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new Error('Plan not found');
        const product = await this.stripe.products.create({ name: plan.name, description: plan.description || undefined });
        const price = await this.stripe.prices.create({
            unit_amount: plan.priceCents,
            currency: plan.currency,
            recurring: { interval: plan.interval === 'YEARLY' ? 'year' : 'month' },
            product: product.id,
        });
        const priceId = price.id;
        const session = await this.stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: successUrl,
            cancel_url: cancelUrl,
            client_reference_id: userId,
        });
        return { url: session.url };
    }
    async handleWebhook(event) {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const userId = (session.client_reference_id || '').toString();
                const subId = session.subscription || undefined;
                if (userId && subId) {
                    const plans = await this.prisma.plan.findMany({ where: { isActive: true } });
                    if (plans.length > 0) {
                        await this.prisma.subscription.create({
                            data: {
                                userId,
                                planId: plans[0].id,
                                status: 'ACTIVE',
                                startedAt: new Date(),
                                endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            }
                        });
                    }
                }
                break;
            }
        }
        return { received: true };
    }
    async userHasAccess(userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return false;
        const now = new Date();
        if (user.trialEndsAt && now <= user.trialEndsAt)
            return true;
        const active = await this.prisma.subscription.findFirst({ where: { userId, status: 'ACTIVE' } });
        return !!active;
    }
};
exports.SubscriptionsService = SubscriptionsService;
exports.SubscriptionsService = SubscriptionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionsService);
//# sourceMappingURL=subscriptions.service.js.map