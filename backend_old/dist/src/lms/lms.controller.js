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
exports.StudentLMSController = exports.LMSController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const lms_service_1 = require("./lms.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
let LMSController = class LMSController {
    constructor(lmsService) {
        this.lmsService = lmsService;
    }
    async createContent(data) {
        return this.lmsService.createContent(data);
    }
    async getContentList(filters) {
        return this.lmsService.getContentList(filters);
    }
    async getContent(id) {
        return this.lmsService.getContent(id);
    }
    async updateContent(id, data) {
        return this.lmsService.updateContent(id, data);
    }
    async deleteContent(id) {
        return this.lmsService.deleteContent(id);
    }
    async bulkDeleteContent(body) {
        return this.lmsService.bulkDeleteContent(body.contentIds);
    }
    async getStats() {
        return this.lmsService.getStats();
    }
    async uploadFile(file) {
        return this.lmsService.uploadFile(file);
    }
    async getContentAnalytics(id) {
        return this.lmsService.getContentAnalytics(id);
    }
};
exports.LMSController = LMSController;
__decorate([
    (0, common_1.Post)('content'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LMSController.prototype, "createContent", null);
__decorate([
    (0, common_1.Get)('content'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LMSController.prototype, "getContentList", null);
__decorate([
    (0, common_1.Get)('content/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LMSController.prototype, "getContent", null);
__decorate([
    (0, common_1.Put)('content/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], LMSController.prototype, "updateContent", null);
__decorate([
    (0, common_1.Delete)('content/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LMSController.prototype, "deleteContent", null);
__decorate([
    (0, common_1.Delete)('content/bulk'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LMSController.prototype, "bulkDeleteContent", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], LMSController.prototype, "getStats", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LMSController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)('content/:id/analytics'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], LMSController.prototype, "getContentAnalytics", null);
exports.LMSController = LMSController = __decorate([
    (0, common_1.Controller)('admin/lms'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [lms_service_1.LMSService])
], LMSController);
let StudentLMSController = class StudentLMSController {
    constructor(lmsService) {
        this.lmsService = lmsService;
    }
    async getStudentContent(req, filters) {
        return this.lmsService.getStudentContent(req.user.id, filters);
    }
    async getStudentContentById(req, id) {
        const content = await this.lmsService.getContent(id);
        const user = await this.lmsService['prisma'].user.findUnique({
            where: { id: req.user.id },
            include: { subscriptions: { include: { plan: true } } },
        });
        const accessTypes = ['FREE'];
        if (user && user.subscriptions && user.subscriptions.length > 0) {
            if (user.subscriptions[0].plan.name === 'PREMIUM') {
                accessTypes.push('SUBSCRIPTION', 'PREMIUM', 'TRIAL');
            }
            else if (user.subscriptions[0].plan.name === 'BASIC') {
                accessTypes.push('SUBSCRIPTION', 'TRIAL');
            }
        }
        if (!accessTypes.includes(content.accessType)) {
            throw new Error('Access denied. Upgrade your subscription to access this content.');
        }
        return content;
    }
    async trackProgress(req, id, body) {
        return this.lmsService.trackProgress(req.user.id, id, body.progress);
    }
    async getStudentProgress(req) {
        return this.lmsService.getStudentProgress(req.user.id);
    }
};
exports.StudentLMSController = StudentLMSController;
__decorate([
    (0, common_1.Get)('content'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], StudentLMSController.prototype, "getStudentContent", null);
__decorate([
    (0, common_1.Get)('content/:id'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StudentLMSController.prototype, "getStudentContentById", null);
__decorate([
    (0, common_1.Post)('content/:id/progress'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], StudentLMSController.prototype, "trackProgress", null);
__decorate([
    (0, common_1.Get)('progress'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentLMSController.prototype, "getStudentProgress", null);
exports.StudentLMSController = StudentLMSController = __decorate([
    (0, common_1.Controller)('student/lms'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('STUDENT'),
    __metadata("design:paramtypes", [lms_service_1.LMSService])
], StudentLMSController);
//# sourceMappingURL=lms.controller.js.map