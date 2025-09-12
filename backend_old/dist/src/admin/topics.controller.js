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
exports.AdminTopicsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let AdminTopicsController = class AdminTopicsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(page = '1', limit = '10', search, subjectId) {
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;
        const where = {};
        if (subjectId) {
            where.subjectId = subjectId;
        }
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { subject: { name: { contains: search, mode: 'insensitive' } } },
                { subject: { stream: { name: { contains: search, mode: 'insensitive' } } } },
                { subject: { stream: { code: { contains: search, mode: 'insensitive' } } } }
            ];
        }
        const totalItems = await this.prisma.topic.count({ where });
        const totalPages = Math.ceil(totalItems / limitNum);
        const topics = await this.prisma.topic.findMany({
            where,
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        stream: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' },
            skip,
            take: limitNum
        });
        return {
            topics,
            pagination: {
                currentPage: pageNum,
                totalPages,
                totalItems,
                itemsPerPage: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPreviousPage: pageNum > 1
            }
        };
    }
    create(body) {
        return this.prisma.topic.create({
            data: { subjectId: body.subjectId, name: body.name, description: body.description || null },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        stream: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                }
            }
        });
    }
    update(id, body) {
        return this.prisma.topic.update({
            where: { id },
            data: { name: body.name, description: body.description, subjectId: body.subjectId },
            include: {
                subject: {
                    select: {
                        id: true,
                        name: true,
                        stream: {
                            select: {
                                id: true,
                                name: true,
                                code: true
                            }
                        }
                    }
                }
            }
        });
    }
    remove(id) {
        return this.prisma.topic.delete({ where: { id } });
    }
};
exports.AdminTopicsController = AdminTopicsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('subjectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], AdminTopicsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminTopicsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AdminTopicsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminTopicsController.prototype, "remove", null);
exports.AdminTopicsController = AdminTopicsController = __decorate([
    (0, common_1.Controller)('admin/topics'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminTopicsController);
//# sourceMappingURL=topics.controller.js.map