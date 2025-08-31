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
exports.AdminStreamsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let AdminStreamsController = class AdminStreamsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    list() {
        return this.prisma.stream.findMany({
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: {
                        subjects: true,
                        users: true,
                    }
                }
            }
        });
    }
    create(body) {
        return this.prisma.stream.create({
            data: {
                name: body.name,
                description: body.description || null,
                code: body.code.toUpperCase(),
                isActive: true
            }
        });
    }
    async update(id, body) {
        console.log('Updating stream:', id, 'with data:', body);
        try {
            const updatedStream = await this.prisma.stream.update({
                where: { id },
                data: {
                    name: body.name,
                    description: body.description,
                    code: body.code?.toUpperCase(),
                    isActive: body.isActive
                }
            });
            console.log('Stream updated successfully:', updatedStream);
            return updatedStream;
        }
        catch (error) {
            console.error('Error updating stream:', error);
            throw error;
        }
    }
    async remove(id) {
        const stream = await this.prisma.stream.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        subjects: true,
                        users: true,
                    }
                }
            }
        });
        if (!stream) {
            throw new Error('Stream not found');
        }
        if (stream._count.subjects > 0 || stream._count.users > 0) {
            throw new Error(`Cannot delete stream with ${stream._count.subjects} subjects and ${stream._count.users} users`);
        }
        return this.prisma.stream.delete({ where: { id } });
    }
};
exports.AdminStreamsController = AdminStreamsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AdminStreamsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminStreamsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminStreamsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminStreamsController.prototype, "remove", null);
exports.AdminStreamsController = AdminStreamsController = __decorate([
    (0, common_1.Controller)('admin/streams'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminStreamsController);
//# sourceMappingURL=streams.controller.js.map