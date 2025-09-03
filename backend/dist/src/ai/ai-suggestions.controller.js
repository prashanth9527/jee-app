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
exports.AISuggestionsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const ai_suggestions_service_1 = require("./ai-suggestions.service");
const subscription_validation_service_1 = require("../subscriptions/subscription-validation.service");
let AISuggestionsController = class AISuggestionsController {
    constructor(aiSuggestionsService, subscriptionValidation) {
        this.aiSuggestionsService = aiSuggestionsService;
        this.subscriptionValidation = subscriptionValidation;
    }
    async getPersonalizedSuggestions(req, limit = '10', includeWeakAreas = 'true', includeStrongAreas = 'true', focusOnRecentPerformance = 'true') {
        const userId = req.user.id;
        const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
        if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
            throw new common_1.ForbiddenException('Subscription required to access AI suggestions');
        }
        const request = {
            userId,
            limit: parseInt(limit),
            includeWeakAreas: includeWeakAreas === 'true',
            includeStrongAreas: includeStrongAreas === 'true',
            focusOnRecentPerformance: focusOnRecentPerformance === 'true'
        };
        try {
            const suggestions = await this.aiSuggestionsService.generatePersonalizedSuggestions(request);
            return {
                success: true,
                data: suggestions,
                metadata: {
                    totalSuggestions: suggestions.length,
                    generatedAt: new Date().toISOString(),
                    userId,
                    subscriptionType: subscriptionStatus.planType || 'TRIAL'
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                data: [],
                metadata: {
                    totalSuggestions: 0,
                    generatedAt: new Date().toISOString(),
                    userId,
                    subscriptionType: subscriptionStatus.planType || 'TRIAL'
                }
            };
        }
    }
    async getPerformanceAnalysis(req) {
        const userId = req.user.id;
        const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
        if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
            throw new common_1.ForbiddenException('Subscription required to access performance analysis');
        }
        try {
            const performanceData = await this.aiSuggestionsService['analyzeStudentPerformance'](userId);
            const totalQuestions = performanceData.reduce((sum, p) => sum + p.totalQuestions, 0);
            const totalCorrect = performanceData.reduce((sum, p) => sum + p.correctAnswers, 0);
            const overallScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
            const subjectBreakdown = performanceData.reduce((acc, p) => {
                if (!acc[p.subjectId]) {
                    acc[p.subjectId] = {
                        subjectId: p.subjectId,
                        subjectName: p.subjectName,
                        totalQuestions: 0,
                        correctAnswers: 0,
                        topics: []
                    };
                }
                acc[p.subjectId].totalQuestions += p.totalQuestions;
                acc[p.subjectId].correctAnswers += p.correctAnswers;
                if (p.topicId) {
                    acc[p.subjectId].topics.push({
                        topicId: p.topicId,
                        topicName: p.topicName,
                        subtopicId: p.subtopicId,
                        subtopicName: p.subtopicName,
                        totalQuestions: p.totalQuestions,
                        correctAnswers: p.correctAnswers,
                        score: p.score,
                        difficulty: p.difficulty,
                        lastAttempted: p.lastAttempted
                    });
                }
                return acc;
            }, {});
            Object.values(subjectBreakdown).forEach((subject) => {
                subject.score = subject.totalQuestions > 0
                    ? (subject.correctAnswers / subject.totalQuestions) * 100
                    : 0;
            });
            return {
                success: true,
                data: {
                    overall: {
                        totalQuestions,
                        correctAnswers: totalCorrect,
                        score: Math.round(overallScore * 100) / 100
                    },
                    subjects: Object.values(subjectBreakdown),
                    performanceData
                },
                metadata: {
                    generatedAt: new Date().toISOString(),
                    userId,
                    subscriptionType: subscriptionStatus.planType || 'TRIAL'
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                data: null,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    userId,
                    subscriptionType: subscriptionStatus.planType || 'TRIAL'
                }
            };
        }
    }
    async getSuggestionHistory(req, limit = '20') {
        const userId = req.user.id;
        const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
        if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
            throw new common_1.ForbiddenException('Subscription required to access suggestion history');
        }
        try {
            const history = await this.aiSuggestionsService.getSuggestionHistory(userId, parseInt(limit));
            return {
                success: true,
                data: history,
                metadata: {
                    totalHistory: history.length,
                    generatedAt: new Date().toISOString(),
                    userId,
                    subscriptionType: subscriptionStatus.planType || 'TRIAL'
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                data: [],
                metadata: {
                    totalHistory: 0,
                    generatedAt: new Date().toISOString(),
                    userId,
                    subscriptionType: subscriptionStatus.planType || 'TRIAL'
                }
            };
        }
    }
    async markSuggestionAsFollowed(req, body) {
        const userId = req.user.id;
        const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
        if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
            throw new common_1.ForbiddenException('Subscription required to mark suggestions');
        }
        try {
            await this.aiSuggestionsService.markSuggestionAsFollowed(body.suggestionId, userId);
            return {
                success: true,
                message: 'Suggestion marked as followed successfully',
                metadata: {
                    suggestionId: body.suggestionId,
                    userId,
                    markedAt: new Date().toISOString(),
                    subscriptionType: subscriptionStatus.planType || 'TRIAL'
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                metadata: {
                    suggestionId: body.suggestionId,
                    userId,
                    markedAt: new Date().toISOString(),
                    subscriptionType: subscriptionStatus.planType || 'TRIAL'
                }
            };
        }
    }
    async getQuickInsights(req) {
        const userId = req.user.id;
        const subscriptionStatus = await this.subscriptionValidation.validateStudentSubscription(userId);
        if (!subscriptionStatus.hasValidSubscription && !subscriptionStatus.isOnTrial) {
            throw new common_1.ForbiddenException('Subscription required to access quick insights');
        }
        try {
            const suggestions = await this.aiSuggestionsService.generatePersonalizedSuggestions({
                userId,
                limit: 3,
                includeWeakAreas: true,
                includeStrongAreas: false,
                focusOnRecentPerformance: true
            });
            const performanceData = await this.aiSuggestionsService['analyzeStudentPerformance'](userId);
            const totalQuestions = performanceData.reduce((sum, p) => sum + p.totalQuestions, 0);
            const totalCorrect = performanceData.reduce((sum, p) => sum + p.correctAnswers, 0);
            const overallScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
            const weakestArea = performanceData
                .filter(p => p.totalQuestions >= 5)
                .sort((a, b) => a.score - b.score)[0];
            const strongestArea = performanceData
                .filter(p => p.totalQuestions >= 5)
                .sort((a, b) => b.score - a.score)[0];
            return {
                success: true,
                data: {
                    topSuggestions: suggestions,
                    performanceSummary: {
                        overallScore: Math.round(overallScore * 100) / 100,
                        totalQuestions,
                        totalCorrect,
                        weakestArea: weakestArea ? {
                            subject: weakestArea.subjectName,
                            topic: weakestArea.topicName,
                            score: weakestArea.score
                        } : null,
                        strongestArea: strongestArea ? {
                            subject: strongestArea.subjectName,
                            topic: strongestArea.topicName,
                            score: strongestArea.score
                        } : null
                    }
                },
                metadata: {
                    generatedAt: new Date().toISOString(),
                    userId,
                    subscriptionType: subscriptionStatus.planType || 'TRIAL'
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error.message,
                data: null,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    userId,
                    subscriptionType: subscriptionStatus.planType || 'TRIAL'
                }
            };
        }
    }
};
exports.AISuggestionsController = AISuggestionsController;
__decorate([
    (0, common_1.Get)('personalized'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('includeWeakAreas')),
    __param(3, (0, common_1.Query)('includeStrongAreas')),
    __param(4, (0, common_1.Query)('focusOnRecentPerformance')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AISuggestionsController.prototype, "getPersonalizedSuggestions", null);
__decorate([
    (0, common_1.Get)('performance-analysis'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AISuggestionsController.prototype, "getPerformanceAnalysis", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AISuggestionsController.prototype, "getSuggestionHistory", null);
__decorate([
    (0, common_1.Post)('mark-followed'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AISuggestionsController.prototype, "markSuggestionAsFollowed", null);
__decorate([
    (0, common_1.Get)('quick-insights'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AISuggestionsController.prototype, "getQuickInsights", null);
exports.AISuggestionsController = AISuggestionsController = __decorate([
    (0, common_1.Controller)('ai-suggestions'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('STUDENT'),
    __metadata("design:paramtypes", [ai_suggestions_service_1.AISuggestionsService,
        subscription_validation_service_1.SubscriptionValidationService])
], AISuggestionsController);
//# sourceMappingURL=ai-suggestions.controller.js.map