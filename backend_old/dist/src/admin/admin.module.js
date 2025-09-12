"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../prisma/prisma.module");
const aws_module_1 = require("../aws/aws.module");
const subjects_controller_1 = require("./subjects.controller");
const streams_controller_1 = require("./streams.controller");
const topics_controller_1 = require("./topics.controller");
const subtopics_controller_1 = require("./subtopics.controller");
const tags_controller_1 = require("./tags.controller");
const questions_controller_1 = require("./questions.controller");
const pyq_controller_1 = require("./pyq.controller");
const exam_papers_controller_1 = require("./exam-papers.controller");
const subscriptions_controller_1 = require("./subscriptions.controller");
const users_controller_1 = require("./users.controller");
const analytics_controller_1 = require("./analytics.controller");
const question_reports_controller_1 = require("./question-reports.controller");
const notifications_controller_1 = require("./notifications.controller");
const system_settings_controller_1 = require("./system-settings.controller");
const system_settings_service_1 = require("./system-settings.service");
const notifications_module_1 = require("../notifications/notifications.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, aws_module_1.AwsModule, notifications_module_1.NotificationsModule],
        controllers: [
            subjects_controller_1.AdminSubjectsController, streams_controller_1.AdminStreamsController, topics_controller_1.AdminTopicsController, subtopics_controller_1.AdminSubtopicsController,
            tags_controller_1.AdminTagsController, questions_controller_1.AdminQuestionsController, pyq_controller_1.AdminPYQController,
            exam_papers_controller_1.AdminExamPapersController, subscriptions_controller_1.AdminSubscriptionsController, users_controller_1.AdminUsersController,
            analytics_controller_1.AdminAnalyticsController, question_reports_controller_1.AdminQuestionReportsController, notifications_controller_1.AdminNotificationsController, system_settings_controller_1.SystemSettingsController
        ],
        providers: [system_settings_service_1.SystemSettingsService],
        exports: [system_settings_service_1.SystemSettingsService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map