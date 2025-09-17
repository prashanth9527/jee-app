import { Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
	constructor(private readonly subs: SubscriptionsService) {}

	@UseGuards(JwtAuthGuard)
	@Get('plans')
	listPlans(@Req() req: any) {
		console.log('Plans request - User:', req.user);
		return this.subs.listPlans();
	}

	@Get('plans-renewal')
	listPlansRenewal(@Req() req: any) {
		console.log('Plans request - User:', req.user);
		return this.subs.listPlansRenewal();
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Post('plans')
	createPlan(@Body() body: { name: string; description?: string; priceCents: number; currency?: string; interval?: 'MONTH'|'YEAR' }) {
		return this.subs.createPlan(body);
	}

	@UseGuards(JwtAuthGuard, RolesGuard)
	@Roles('ADMIN')
	@Put('plans/:id')
	updatePlan(@Param('id') id: string, @Body() body: { name?: string; description?: string; priceCents?: number; currency?: string; interval?: 'MONTH'|'YEAR'; isActive?: boolean }) {
		return this.subs.updatePlan(id, body);
	}

	@UseGuards(JwtAuthGuard)
	@Post('checkout')
	createCheckout(@Req() req: any, @Body() body: { planId: string; successUrl: string; cancelUrl: string }) {
		return this.subs.createCheckoutSession(req.user.id, body.planId, body.successUrl, body.cancelUrl);
	}

	@Post('webhook')
	webhook(@Body() event: any) {
		return this.subs.handleWebhook(event);
	}
} 