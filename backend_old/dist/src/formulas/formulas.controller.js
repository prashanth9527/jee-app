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
exports.FormulasController = void 0;
const common_1 = require("@nestjs/common");
const formulas_service_1 = require("./formulas.service");
const create_formula_dto_1 = require("./dto/create-formula.dto");
const update_formula_dto_1 = require("./dto/update-formula.dto");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const client_1 = require("@prisma/client");
let FormulasController = class FormulasController {
    constructor(formulasService) {
        this.formulasService = formulasService;
    }
    create(createFormulaDto) {
        return this.formulasService.create(createFormulaDto);
    }
    findAllAdmin(page, limit, subject, topicId, subtopicId, tags) {
        const tagsArray = tags ? tags.split(',') : undefined;
        return this.formulasService.findAll(page, limit, subject, topicId, subtopicId, tagsArray);
    }
    findOneAdmin(id) {
        return this.formulasService.findOne(id);
    }
    update(id, updateFormulaDto) {
        return this.formulasService.update(id, updateFormulaDto);
    }
    remove(id) {
        return this.formulasService.remove(id);
    }
    findAll(page, limit, subject, topicId, subtopicId, tags) {
        const tagsArray = tags ? tags.split(',') : undefined;
        return this.formulasService.findAll(page, limit, subject, topicId, subtopicId, tagsArray);
    }
    findOne(id) {
        return this.formulasService.findOne(id, true);
    }
    findBySubject(subject, page, limit) {
        return this.formulasService.findAll(page, limit, subject);
    }
    findByTopic(topicId, page, limit) {
        return this.formulasService.findAll(page, limit, undefined, topicId);
    }
    findBySubtopic(subtopicId, page, limit) {
        return this.formulasService.findAll(page, limit, undefined, undefined, subtopicId);
    }
};
exports.FormulasController = FormulasController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_formula_dto_1.CreateFormulaDto]),
    __metadata("design:returntype", void 0)
], FormulasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('admin'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('subject')),
    __param(3, (0, common_1.Query)('topicId')),
    __param(4, (0, common_1.Query)('subtopicId')),
    __param(5, (0, common_1.Query)('tags')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String]),
    __metadata("design:returntype", void 0)
], FormulasController.prototype, "findAllAdmin", null);
__decorate([
    (0, common_1.Get)('admin/:id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FormulasController.prototype, "findOneAdmin", null);
__decorate([
    (0, common_1.Patch)('admin/:id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_formula_dto_1.UpdateFormulaDto]),
    __metadata("design:returntype", void 0)
], FormulasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('admin/:id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FormulasController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.STUDENT),
    __param(0, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('subject')),
    __param(3, (0, common_1.Query)('topicId')),
    __param(4, (0, common_1.Query)('subtopicId')),
    __param(5, (0, common_1.Query)('tags')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String]),
    __metadata("design:returntype", void 0)
], FormulasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.STUDENT),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], FormulasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('subject/:subject'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.STUDENT),
    __param(0, (0, common_1.Param)('subject')),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], FormulasController.prototype, "findBySubject", null);
__decorate([
    (0, common_1.Get)('topic/:topicId'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.STUDENT),
    __param(0, (0, common_1.Param)('topicId')),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], FormulasController.prototype, "findByTopic", null);
__decorate([
    (0, common_1.Get)('subtopic/:subtopicId'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRole.STUDENT),
    __param(0, (0, common_1.Param)('subtopicId')),
    __param(1, (0, common_1.Query)('page', new common_1.DefaultValuePipe(1), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('limit', new common_1.DefaultValuePipe(20), common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", void 0)
], FormulasController.prototype, "findBySubtopic", null);
exports.FormulasController = FormulasController = __decorate([
    (0, common_1.Controller)('formulas'),
    __metadata("design:paramtypes", [formulas_service_1.FormulasService])
], FormulasController);
//# sourceMappingURL=formulas.controller.js.map