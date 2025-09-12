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
var SessionCleanupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionCleanupService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const session_service_1 = require("./session.service");
let SessionCleanupService = SessionCleanupService_1 = class SessionCleanupService {
    constructor(sessionService) {
        this.sessionService = sessionService;
        this.logger = new common_1.Logger(SessionCleanupService_1.name);
    }
    async handleSessionCleanup() {
        try {
            const cleanedCount = await this.sessionService.cleanupExpiredSessions();
            if (cleanedCount > 0) {
                this.logger.log(`Cleaned up ${cleanedCount} expired sessions`);
            }
        }
        catch (error) {
            this.logger.error('Failed to clean up expired sessions:', error);
        }
    }
};
exports.SessionCleanupService = SessionCleanupService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SessionCleanupService.prototype, "handleSessionCleanup", null);
exports.SessionCleanupService = SessionCleanupService = SessionCleanupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [session_service_1.SessionService])
], SessionCleanupService);
//# sourceMappingURL=session-cleanup.service.js.map