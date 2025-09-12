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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSubscriptionsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let AdminSubscriptionsController = class AdminSubscriptionsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listPlans(page, limit, search) {
        const currentPage = parseInt(page || '1');
        const itemsPerPage = parseInt(limit || '10');
        const skip = (currentPage - 1) * itemsPerPage;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ];
        }
        const totalItems = await this.prisma.plan.count({ where });
        const totalPages = Math.ceil(totalItems / itemsPerPage);
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
    async findPlan(id) {
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
            throw new common_1.BadRequestException('Plan not found');
        }
        return plan;
    }
    async createPlan(body) {
        if (!body.name || !body.priceCents) {
            throw new common_1.BadRequestException('Name and price are required');
        }
        const existingPlan = await this.prisma.plan.findUnique({
            where: { name: body.name }
        });
        if (existingPlan) {
            throw new common_1.BadRequestException('A plan with this name already exists');
        }
        return this.prisma.plan.create({
            data: {
                name: body.name,
                description: body.description || null,
                priceCents: body.priceCents,
                currency: body.currency || 'usd',
                interval: (body.interval || 'MONTH'),
            }
        });
    }
    async updatePlan(id, body) {
        const plan = await this.prisma.plan.findUnique({ where: { id } });
        if (!plan) {
            throw new common_1.BadRequestException('Plan not found');
        }
        if (body.name && body.name !== plan.name) {
            const existingPlan = await this.prisma.plan.findUnique({
                where: { name: body.name }
            });
            if (existingPlan) {
                throw new common_1.BadRequestException('A plan with this name already exists');
            }
        }
        return this.prisma.plan.update({
            where: { id },
            data: body
        });
    }
    async deletePlan(id) {
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
            throw new common_1.BadRequestException('Plan not found');
        }
        if (plan._count.subscriptions > 0) {
            throw new common_1.BadRequestException('Cannot delete plan with active subscriptions');
        }
        return this.prisma.plan.delete({ where: { id } });
    }
    async listSubscriptions(page, limit, search, status, planId) {
        const currentPage = parseInt(page || '1');
        const itemsPerPage = parseInt(limit || '10');
        const skip = (currentPage - 1) * itemsPerPage;
        const where = {};
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
        const totalItems = await this.prisma.subscription.count({ where });
        const totalPages = Math.ceil(totalItems / itemsPerPage);
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
    async findSubscription(id) {
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
            throw new common_1.BadRequestException('Subscription not found');
        }
        return subscription;
    }
    async updateSubscription(id, body) {
        const subscription = await this.prisma.subscription.findUnique({ where: { id } });
        if (!subscription) {
            throw new common_1.BadRequestException('Subscription not found');
        }
        const updateData = {};
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
    async getAnalytics() {
        const totalPlans = await this.prisma.plan.count();
        const totalSubscriptions = await this.prisma.subscription.count();
        const activeSubscriptions = await this.prisma.subscription.count({
            where: { status: 'ACTIVE' }
        });
        const canceledSubscriptions = await this.prisma.subscription.count({
            where: { status: 'CANCELED' }
        });
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
        const mrr = subscriptions.reduce((total, sub) => {
            if (sub.plan.interval === 'MONTH') {
                return total + sub.plan.priceCents;
            }
            else {
                return total + Math.round(sub.plan.priceCents / 12);
            }
        }, 0);
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
                mrr: mrr / 100
            },
            recentSubscriptions,
            planDistribution
        };
    }
};
exports.AdminSubscriptionsController = AdminSubscriptionsController;
__decorate([
    (0, common_1.Get)('plans'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "listPlans", null);
__decorate([
    (0, common_1.Get)('plans/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "findPlan", null);
__decorate([
    (0, common_1.Post)('plans'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Put)('plans/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Delete)('plans/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "deletePlan", null);
__decorate([
    (0, common_1.Get)('subscriptions'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('planId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "listSubscriptions", null);
__decorate([
    (0, common_1.Get)('subscriptions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "findSubscription", null);
__decorate([
    (0, common_1.Put)('subscriptions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "updateSubscription", null);
__decorate([
    (0, common_1.Get)('analytics'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminSubscriptionsController.prototype, "getAnalytics", null);
exports.AdminSubscriptionsController = AdminSubscriptionsController = __decorate([
    (0, common_1.Controller)('admin/subscriptions'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminSubscriptionsController);
//# sourceMappingURL=subscriptions.controller.js.map