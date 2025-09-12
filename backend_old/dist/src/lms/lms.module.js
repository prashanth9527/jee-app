"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LMSModule = void 0;
const common_1 = require("@nestjs/common");
const lms_service_1 = require("./lms.service");
const lms_controller_1 = require("./lms.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const config_1 = require("@nestjs/config");
const aws_module_1 = require("../aws/aws.module");
const subscriptions_module_1 = require("../subscriptions/subscriptions.module");
let LMSModule = class LMSModule {
};
exports.LMSModule = LMSModule;
exports.LMSModule = LMSModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, config_1.ConfigModule, aws_module_1.AwsModule, subscriptions_module_1.SubscriptionsModule],
        controllers: [lms_controller_1.LMSController],
        providers: [lms_service_1.LMSService],
        exports: [lms_service_1.LMSService],
    })
], LMSModule);
//# sourceMappingURL=lms.module.js.map