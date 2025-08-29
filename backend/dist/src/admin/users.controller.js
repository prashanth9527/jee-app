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
exports.AdminUsersController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let AdminUsersController = class AdminUsersController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listUsers(page, limit, search, role, emailVerified, phoneVerified) {
        const currentPage = parseInt(page || '1');
        const itemsPerPage = parseInt(limit || '10');
        const skip = (currentPage - 1) * itemsPerPage;
        const where = {};
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
        const totalItems = await this.prisma.user.count({ where });
        const totalPages = Math.ceil(totalItems / itemsPerPage);
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
    async findUser(id) {
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
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        return user;
    }
    async updateUser(id, body) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (body.email && body.email !== user.email) {
            const existingUser = await this.prisma.user.findUnique({
                where: { email: body.email }
            });
            if (existingUser) {
                throw new common_1.BadRequestException('A user with this email already exists');
            }
        }
        if (body.phone && body.phone !== user.phone) {
            const existingUser = await this.prisma.user.findUnique({
                where: { phone: body.phone }
            });
            if (existingUser) {
                throw new common_1.BadRequestException('A user with this phone number already exists');
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
    async deleteUser(id) {
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
            throw new common_1.BadRequestException('User not found');
        }
        if (user._count.subscriptions > 0 || user._count.examSubmissions > 0) {
            throw new common_1.BadRequestException('Cannot delete user with active subscriptions or exam submissions');
        }
        return this.prisma.user.delete({ where: { id } });
    }
    async verifyEmail(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        return this.prisma.user.update({
            where: { id },
            data: { emailVerified: true }
        });
    }
    async verifyPhone(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        return this.prisma.user.update({
            where: { id },
            data: { phoneVerified: true }
        });
    }
    async startTrial(id, body) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
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
    async endTrial(id) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        return this.prisma.user.update({
            where: { id },
            data: {
                trialEndsAt: new Date()
            }
        });
    }
    async getAnalytics() {
        const totalUsers = await this.prisma.user.count();
        const adminUsers = await this.prisma.user.count({ where: { role: 'ADMIN' } });
        const studentUsers = await this.prisma.user.count({ where: { role: 'STUDENT' } });
        const emailVerifiedUsers = await this.prisma.user.count({ where: { emailVerified: true } });
        const phoneVerifiedUsers = await this.prisma.user.count({ where: { phoneVerified: true } });
        const now = new Date();
        const trialUsers = await this.prisma.user.count({
            where: {
                trialEndsAt: { gt: now }
            }
        });
        const subscribedUsers = await this.prisma.user.count({
            where: {
                subscriptions: {
                    some: {
                        status: 'ACTIVE'
                    }
                }
            }
        });
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
};
exports.AdminUsersController = AdminUsersController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('role')),
    __param(4, (0, common_1.Query)('emailVerified')),
    __param(5, (0, common_1.Query)('phoneVerified')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "findUser", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Post)(':id/verify-email'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "verifyEmail", null);
__decorate([
    (0, common_1.Post)(':id/verify-phone'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "verifyPhone", null);
__decorate([
    (0, common_1.Post)(':id/start-trial'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "startTrial", null);
__decorate([
    (0, common_1.Post)(':id/end-trial'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "endTrial", null);
__decorate([
    (0, common_1.Get)('analytics/overview'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)('analytics/roles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminUsersController.prototype, "getRoleAnalytics", null);
exports.AdminUsersController = AdminUsersController = __decorate([
    (0, common_1.Controller)('admin/users'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminUsersController);
//# sourceMappingURL=users.controller.js.map