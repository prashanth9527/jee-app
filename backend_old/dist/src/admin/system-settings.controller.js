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
exports.SystemSettingsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const system_settings_service_1 = require("./system-settings.service");
let SystemSettingsController = class SystemSettingsController {
    constructor(systemSettingsService) {
        this.systemSettingsService = systemSettingsService;
    }
    async getSettings() {
        return this.systemSettingsService.getSettings();
    }
    async updateSettings(data) {
        return this.systemSettingsService.updateSettings(data);
    }
    async uploadLogo(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        return this.systemSettingsService.uploadLogo(file);
    }
    async uploadFavicon(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        return this.systemSettingsService.uploadFavicon(file);
    }
    async uploadOgImage(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        return this.systemSettingsService.uploadOgImage(file);
    }
    async deleteLogo() {
        return this.systemSettingsService.deleteLogo();
    }
    async deleteFavicon() {
        return this.systemSettingsService.deleteFavicon();
    }
    async deleteOgImage() {
        return this.systemSettingsService.deleteOgImage();
    }
};
exports.SystemSettingsController = SystemSettingsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)('upload/logo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo', {
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.startsWith('image/')) {
                return cb(new common_1.BadRequestException('Only image files are allowed'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Post)('upload/favicon'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('favicon', {
        limits: {
            fileSize: 2 * 1024 * 1024,
        },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.startsWith('image/')) {
                return cb(new common_1.BadRequestException('Only image files are allowed'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "uploadFavicon", null);
__decorate([
    (0, common_1.Post)('upload/og-image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('ogImage', {
        limits: {
            fileSize: 5 * 1024 * 1024,
        },
        fileFilter: (req, file, cb) => {
            if (!file.mimetype.startsWith('image/')) {
                return cb(new common_1.BadRequestException('Only image files are allowed'), false);
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "uploadOgImage", null);
__decorate([
    (0, common_1.Delete)('logo'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "deleteLogo", null);
__decorate([
    (0, common_1.Delete)('favicon'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "deleteFavicon", null);
__decorate([
    (0, common_1.Delete)('og-image'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SystemSettingsController.prototype, "deleteOgImage", null);
exports.SystemSettingsController = SystemSettingsController = __decorate([
    (0, common_1.Controller)('admin/system-settings'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [system_settings_service_1.SystemSettingsService])
], SystemSettingsController);
//# sourceMappingURL=system-settings.controller.js.map