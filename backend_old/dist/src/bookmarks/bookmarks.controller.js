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
exports.BookmarksController = void 0;
const common_1 = require("@nestjs/common");
const bookmarks_service_1 = require("./bookmarks.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
let BookmarksController = class BookmarksController {
    constructor(bookmarksService) {
        this.bookmarksService = bookmarksService;
    }
    async createBookmark(questionId, req) {
        return this.bookmarksService.createBookmark(req.user.id, questionId);
    }
    async removeBookmark(questionId, req) {
        return this.bookmarksService.removeBookmark(req.user.id, questionId);
    }
    async getUserBookmarks(req, page, limit) {
        return this.bookmarksService.getUserBookmarks(req.user.id, page, limit);
    }
    async isBookmarked(questionId, req) {
        const isBookmarked = await this.bookmarksService.isBookmarked(req.user.id, questionId);
        return { questionId, isBookmarked };
    }
    async getBookmarkStatus(body, req) {
        return this.bookmarksService.getBookmarkStatus(req.user.id, body.questionIds);
    }
    async getBookmarksBySubject(subjectId, req) {
        return this.bookmarksService.getBookmarksBySubject(req.user.id, subjectId);
    }
    async getBookmarksByTopic(topicId, req) {
        return this.bookmarksService.getBookmarksByTopic(req.user.id, topicId);
    }
};
exports.BookmarksController = BookmarksController;
__decorate([
    (0, common_1.Post)(':questionId'),
    __param(0, (0, common_1.Param)('questionId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookmarksController.prototype, "createBookmark", null);
__decorate([
    (0, common_1.Delete)(':questionId'),
    __param(0, (0, common_1.Param)('questionId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookmarksController.prototype, "removeBookmark", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], BookmarksController.prototype, "getUserBookmarks", null);
__decorate([
    (0, common_1.Get)('status/:questionId'),
    __param(0, (0, common_1.Param)('questionId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookmarksController.prototype, "isBookmarked", null);
__decorate([
    (0, common_1.Post)('status/batch'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], BookmarksController.prototype, "getBookmarkStatus", null);
__decorate([
    (0, common_1.Get)('subject/:subjectId'),
    __param(0, (0, common_1.Param)('subjectId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookmarksController.prototype, "getBookmarksBySubject", null);
__decorate([
    (0, common_1.Get)('topic/:topicId'),
    __param(0, (0, common_1.Param)('topicId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookmarksController.prototype, "getBookmarksByTopic", null);
exports.BookmarksController = BookmarksController = __decorate([
    (0, common_1.Controller)('bookmarks'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.STUDENT),
    __metadata("design:paramtypes", [bookmarks_service_1.BookmarksService])
], BookmarksController);
//# sourceMappingURL=bookmarks.controller.js.map