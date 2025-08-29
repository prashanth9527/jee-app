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
exports.ExamsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const exams_service_1 = require("./exams.service");
let ExamsController = class ExamsController {
    constructor(exams) {
        this.exams = exams;
    }
    createPaper(body) {
        return this.exams.createPaper(body);
    }
    start(req, paperId) {
        return this.exams.startSubmission(req.user.id, paperId);
    }
    submit(submissionId, body) {
        return this.exams.submitAnswer(submissionId, body.questionId, body.selectedOptionId || null);
    }
    async getSubmission(req, submissionId) {
        const submission = await this.exams.getSubmission(submissionId);
        if (submission.userId !== req.user.id) {
            throw new common_1.ForbiddenException('You can only access your own exam submissions');
        }
        return submission;
    }
    async getSubmissionQuestions(req, submissionId) {
        const submission = await this.exams.getSubmission(submissionId);
        if (submission.userId !== req.user.id) {
            throw new common_1.ForbiddenException('You can only access your own exam submissions');
        }
        return this.exams.getSubmissionQuestions(submissionId);
    }
    async getExamResults(req, submissionId) {
        const submission = await this.exams.getSubmission(submissionId);
        if (submission.userId !== req.user.id) {
            throw new common_1.ForbiddenException('You can only access your own exam submissions');
        }
        return this.exams.getExamResults(submissionId);
    }
    finalize(submissionId) {
        return this.exams.finalize(submissionId);
    }
    analyticsSubjects(req) {
        return this.exams.analyticsBySubject(req.user.id);
    }
    analyticsTopics(req) {
        return this.exams.analyticsByTopic(req.user.id);
    }
    analyticsSubtopics(req) {
        return this.exams.analyticsBySubtopic(req.user.id);
    }
};
exports.ExamsController = ExamsController;
__decorate([
    (0, common_1.Post)('papers'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "createPaper", null);
__decorate([
    (0, common_1.Post)('papers/:paperId/start'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('paperId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "start", null);
__decorate([
    (0, common_1.Post)('submissions/:submissionId/answer'),
    __param(0, (0, common_1.Param)('submissionId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)('submissions/:submissionId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('submissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "getSubmission", null);
__decorate([
    (0, common_1.Get)('submissions/:submissionId/questions'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('submissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "getSubmissionQuestions", null);
__decorate([
    (0, common_1.Get)('submissions/:submissionId/results'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('submissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ExamsController.prototype, "getExamResults", null);
__decorate([
    (0, common_1.Post)('submissions/:submissionId/finalize'),
    __param(0, (0, common_1.Param)('submissionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "finalize", null);
__decorate([
    (0, common_1.Get)('analytics/subjects'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "analyticsSubjects", null);
__decorate([
    (0, common_1.Get)('analytics/topics'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "analyticsTopics", null);
__decorate([
    (0, common_1.Get)('analytics/subtopics'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ExamsController.prototype, "analyticsSubtopics", null);
exports.ExamsController = ExamsController = __decorate([
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('exams'),
    __metadata("design:paramtypes", [exams_service_1.ExamsService])
], ExamsController);
//# sourceMappingURL=exams.controller.js.map