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
exports.AdminReferralsController = exports.ReferralsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const referrals_service_1 = require("./referrals.service");
let ReferralsController = class ReferralsController {
    constructor(referralsService) {
        this.referralsService = referralsService;
    }
    async generateReferralCode(req) {
        return this.referralsService.generateReferralCode(req.user.id);
    }
    async getMyReferrals(req) {
        return this.referralsService.getUserReferralInfo(req.user.id);
    }
    async validateReferralCode(code) {
        return this.referralsService.validateReferralCode(code);
    }
    async applyReferralCode(req, body) {
        return this.referralsService.applyReferralCode(req.user.id, body.code);
    }
    async claimReward(req, rewardId) {
        return this.referralsService.claimReward(req.user.id, rewardId);
    }
    async getLeaderboard(limit) {
        const limitNum = limit ? parseInt(limit) : 10;
        return this.referralsService.getReferralLeaderboard(limitNum);
    }
};
exports.ReferralsController = ReferralsController;
__decorate([
    (0, common_1.Post)('generate-code'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "generateReferralCode", null);
__decorate([
    (0, common_1.Get)('my-referrals'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "getMyReferrals", null);
__decorate([
    (0, common_1.Get)('validate/:code'),
    __param(0, (0, common_1.Param)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "validateReferralCode", null);
__decorate([
    (0, common_1.Post)('apply-code'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "applyReferralCode", null);
__decorate([
    (0, common_1.Post)('claim-reward/:rewardId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('rewardId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "claimReward", null);
__decorate([
    (0, common_1.Get)('leaderboard'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReferralsController.prototype, "getLeaderboard", null);
exports.ReferralsController = ReferralsController = __decorate([
    (0, common_1.Controller)('referrals'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [referrals_service_1.ReferralsService])
], ReferralsController);
let AdminReferralsController = class AdminReferralsController {
    constructor(referralsService) {
        this.referralsService = referralsService;
    }
    async getAllReferrals() {
        return { message: 'Admin referrals endpoint' };
    }
    async getReferralStats() {
        return { message: 'Referral statistics endpoint' };
    }
};
exports.AdminReferralsController = AdminReferralsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminReferralsController.prototype, "getAllReferrals", null);
__decorate([
    (0, common_1.Get)('stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminReferralsController.prototype, "getReferralStats", null);
exports.AdminReferralsController = AdminReferralsController = __decorate([
    (0, common_1.Controller)('admin/referrals'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [referrals_service_1.ReferralsService])
], AdminReferralsController);
//# sourceMappingURL=referrals.controller.js.map