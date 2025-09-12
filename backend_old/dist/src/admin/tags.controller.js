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
exports.AdminTagsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let AdminTagsController = class AdminTagsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async list(page, limit, search) {
        const currentPage = parseInt(page || '1');
        const itemsPerPage = parseInt(limit || '50');
        const skip = (currentPage - 1) * itemsPerPage;
        const where = {};
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }
        const totalItems = await this.prisma.tag.count({ where });
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        const tags = await this.prisma.tag.findMany({
            where,
            include: {
                _count: {
                    select: {
                        questions: true
                    }
                }
            },
            orderBy: { name: 'asc' },
            skip,
            take: itemsPerPage,
        });
        return {
            tags,
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
    async findOne(id) {
        const tag = await this.prisma.tag.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        questions: true
                    }
                },
                questions: {
                    include: {
                        question: {
                            include: {
                                subject: true,
                                topic: true,
                                subtopic: true
                            }
                        }
                    },
                    take: 10,
                    orderBy: {
                        question: {
                            createdAt: 'desc'
                        }
                    }
                }
            }
        });
        if (!tag) {
            throw new common_1.BadRequestException('Tag not found');
        }
        return tag;
    }
    async create(body) {
        if (!body.name || !body.name.trim()) {
            throw new common_1.BadRequestException('Tag name is required');
        }
        const trimmedName = body.name.trim();
        const existingTag = await this.prisma.tag.findUnique({
            where: { name: trimmedName }
        });
        if (existingTag) {
            throw new common_1.BadRequestException('Tag with this name already exists');
        }
        return this.prisma.tag.create({
            data: { name: trimmedName },
            include: {
                _count: {
                    select: {
                        questions: true
                    }
                }
            }
        });
    }
    async update(id, body) {
        if (!body.name || !body.name.trim()) {
            throw new common_1.BadRequestException('Tag name is required');
        }
        const trimmedName = body.name.trim();
        const existingTag = await this.prisma.tag.findFirst({
            where: {
                name: trimmedName,
                id: { not: id }
            }
        });
        if (existingTag) {
            throw new common_1.BadRequestException('Tag with this name already exists');
        }
        return this.prisma.tag.update({
            where: { id },
            data: { name: trimmedName },
            include: {
                _count: {
                    select: {
                        questions: true
                    }
                }
            }
        });
    }
    async remove(id) {
        const tag = await this.prisma.tag.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        questions: true
                    }
                }
            }
        });
        if (!tag) {
            throw new common_1.BadRequestException('Tag not found');
        }
        if (tag._count.questions > 0) {
            throw new common_1.BadRequestException(`Cannot delete tag "${tag.name}" as it is used by ${tag._count.questions} question${tag._count.questions !== 1 ? 's' : ''}. Please remove the tag from all questions first.`);
        }
        return this.prisma.tag.delete({ where: { id } });
    }
    async bulkDelete(body) {
        if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
            throw new common_1.BadRequestException('Tag IDs array is required');
        }
        const tagsWithQuestions = await this.prisma.tag.findMany({
            where: {
                id: { in: body.ids }
            },
            include: {
                _count: {
                    select: {
                        questions: true
                    }
                }
            }
        });
        const tagsWithQuestionsList = tagsWithQuestions.filter(tag => tag._count.questions > 0);
        if (tagsWithQuestionsList.length > 0) {
            const tagNames = tagsWithQuestionsList.map(tag => `"${tag.name}"`).join(', ');
            throw new common_1.BadRequestException(`Cannot delete the following tags as they are used by questions: ${tagNames}. Please remove them from all questions first.`);
        }
        const result = await this.prisma.tag.deleteMany({
            where: {
                id: {
                    in: body.ids
                }
            }
        });
        return {
            ok: true,
            deletedCount: result.count,
            message: `Successfully deleted ${result.count} tag${result.count !== 1 ? 's' : ''}`
        };
    }
};
exports.AdminTagsController = AdminTagsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminTagsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminTagsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminTagsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminTagsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminTagsController.prototype, "remove", null);
__decorate([
    (0, common_1.Delete)('bulk'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminTagsController.prototype, "bulkDelete", null);
exports.AdminTagsController = AdminTagsController = __decorate([
    (0, common_1.Controller)('admin/tags'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminTagsController);
//# sourceMappingURL=tags.controller.js.map