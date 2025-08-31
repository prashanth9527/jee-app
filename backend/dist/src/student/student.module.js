"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentModule = void 0;
const common_1 = require("@nestjs/common");
const student_controller_1 = require("./student.controller");
const pyq_controller_1 = require("./pyq.controller");
const leaderboard_controller_1 = require("./leaderboard.controller");
const question_reports_controller_1 = require("./question-reports.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const subscription_validation_service_1 = require("../subscriptions/subscription-validation.service");
let StudentModule = class StudentModule {
};
exports.StudentModule = StudentModule;
exports.StudentModule = StudentModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [student_controller_1.StudentController, pyq_controller_1.PYQController, leaderboard_controller_1.StudentLeaderboardController, question_reports_controller_1.StudentQuestionReportsController],
        providers: [subscription_validation_service_1.SubscriptionValidationService],
    })
], StudentModule);
//# sourceMappingURL=student.module.js.map