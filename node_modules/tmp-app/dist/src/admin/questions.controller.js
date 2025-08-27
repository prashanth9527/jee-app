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
exports.AdminQuestionsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_guard_1 = require("../auth/jwt.guard");
const roles_guard_1 = require("../auth/roles.guard");
const roles_decorator_1 = require("../auth/roles.decorator");
const platform_express_1 = require("@nestjs/platform-express");
const fast_csv_1 = require("fast-csv");
let AdminQuestionsController = class AdminQuestionsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    list(subjectId, topicId, subtopicId) {
        return this.prisma.question.findMany({
            where: {
                subjectId: subjectId || undefined,
                topicId: topicId || undefined,
                subtopicId: subtopicId || undefined,
            },
            include: { options: true, tags: { include: { tag: true } } },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(body) {
        const question = await this.prisma.question.create({ data: {
                stem: body.stem,
                explanation: body.explanation || null,
                difficulty: body.difficulty || 'MEDIUM',
                yearAppeared: body.yearAppeared || null,
                isPreviousYear: !!body.isPreviousYear,
                subjectId: body.subjectId || null,
                topicId: body.topicId || null,
                subtopicId: body.subtopicId || null,
                options: { create: (body.options || []).map((o) => ({ text: o.text, isCorrect: !!o.isCorrect, order: o.order ?? 0 })) },
            } });
        if (body.tagNames?.length) {
            for (const name of body.tagNames) {
                const tag = await this.prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
                await this.prisma.questionTag.create({ data: { questionId: question.id, tagId: tag.id } });
            }
        }
        return this.prisma.question.findUnique({ where: { id: question.id }, include: { options: true, tags: { include: { tag: true } } } });
    }
    async update(id, body) {
        await this.prisma.question.update({ where: { id }, data: {
                stem: body.stem,
                explanation: body.explanation,
                difficulty: body.difficulty,
                yearAppeared: body.yearAppeared,
                isPreviousYear: body.isPreviousYear,
                subjectId: body.subjectId,
                topicId: body.topicId,
                subtopicId: body.subtopicId,
            } });
        if (body.options) {
            await this.prisma.questionOption.deleteMany({ where: { questionId: id } });
            await this.prisma.questionOption.createMany({ data: body.options.map((o) => ({ questionId: id, text: o.text, isCorrect: !!o.isCorrect, order: o.order ?? 0 })) });
        }
        if (body.tagNames) {
            await this.prisma.questionTag.deleteMany({ where: { questionId: id } });
            for (const name of body.tagNames) {
                const tag = await this.prisma.tag.upsert({ where: { name }, update: {}, create: { name } });
                await this.prisma.questionTag.create({ data: { questionId: id, tagId: tag.id } });
            }
        }
        return this.prisma.question.findUnique({ where: { id }, include: { options: true, tags: { include: { tag: true } } } });
    }
    remove(id) {
        return this.prisma.question.delete({ where: { id } });
    }
    async importCsv(file) {
        if (!file || !file.buffer)
            throw new common_1.BadRequestException('File is required');
        const content = file.buffer.toString('utf8');
        const rows = [];
        await new Promise((resolve, reject) => {
            parseString(content, rows, (err) => err ? reject(err) : resolve());
        });
        for (const r of rows) {
            let options = [];
            let tagNames = [];
            try {
                options = JSON.parse(r.options || '[]');
            }
            catch { }
            try {
                tagNames = JSON.parse(r.tagNames || '[]');
            }
            catch { }
            await this.create({
                stem: r.stem,
                explanation: r.explanation,
                difficulty: r.difficulty || 'MEDIUM',
                yearAppeared: r.yearAppeared ? Number(r.yearAppeared) : undefined,
                isPreviousYear: r.isPreviousYear === 'true' || r.isPreviousYear === true,
                subjectId: r.subjectId || undefined,
                topicId: r.topicId || undefined,
                subtopicId: r.subtopicId || undefined,
                options,
                tagNames,
            });
        }
        return { ok: true, count: rows.length };
    }
    async exportCsv(res) {
        const questions = await this.prisma.question.findMany({ include: { options: true, tags: { include: { tag: true } } } });
        const header = ['stem', 'explanation', 'difficulty', 'yearAppeared', 'isPreviousYear', 'subjectId', 'topicId', 'subtopicId', 'options', 'tagNames'];
        const escape = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
        const lines = [header.join(',')];
        for (const q of questions) {
            const record = [
                escape(q.stem),
                escape(q.explanation || ''),
                escape(q.difficulty),
                escape(q.yearAppeared || ''),
                escape(q.isPreviousYear),
                escape(q.subjectId || ''),
                escape(q.topicId || ''),
                escape(q.subtopicId || ''),
                escape(JSON.stringify((q.options || []).map((o) => ({ text: o.text, isCorrect: o.isCorrect, order: o.order })))),
                escape(JSON.stringify((q.tags || []).map((t) => t.tag.name))),
            ];
            lines.push(record.join(','));
        }
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="questions.csv"');
        res.send(lines.join('\n'));
    }
};
exports.AdminQuestionsController = AdminQuestionsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('subjectId')),
    __param(1, (0, common_1.Query)('topicId')),
    __param(2, (0, common_1.Query)('subtopicId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], AdminQuestionsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminQuestionsController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminQuestionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AdminQuestionsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminQuestionsController.prototype, "importCsv", null);
__decorate([
    (0, common_1.Get)('export'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminQuestionsController.prototype, "exportCsv", null);
exports.AdminQuestionsController = AdminQuestionsController = __decorate([
    (0, common_1.Controller)('admin/questions'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminQuestionsController);
function parseString(content, rows, cb) {
    Promise.resolve().then(() => require('stream')).then(({ Readable }) => {
        const stream = Readable.from([content]);
        stream
            .pipe((0, fast_csv_1.parse)({ headers: true }))
            .on('error', (error) => cb(error))
            .on('data', (row) => rows.push(row))
            .on('end', () => cb());
    });
}
//# sourceMappingURL=questions.controller.js.map