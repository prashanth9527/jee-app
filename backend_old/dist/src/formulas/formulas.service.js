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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormulasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FormulasService = class FormulasService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createFormulaDto) {
        const formula = await this.prisma.formula.create({
            data: {
                ...createFormulaDto,
                tags: createFormulaDto.tags || [],
            },
        });
        return this.mapToResponseDto(formula);
    }
    async findAll(page = 1, limit = 20, subject, topicId, subtopicId, tags) {
        const skip = (page - 1) * limit;
        const where = {};
        if (subject) {
            where.subject = subject;
        }
        if (topicId) {
            where.topicId = topicId;
        }
        if (subtopicId) {
            where.subtopicId = subtopicId;
        }
        if (tags && tags.length > 0) {
            where.tags = {
                hasSome: tags,
            };
        }
        const [formulas, total] = await Promise.all([
            this.prisma.formula.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.formula.count({ where }),
        ]);
        const formulaDtos = await Promise.all(formulas.map(formula => this.mapToResponseDto(formula)));
        return {
            formulas: formulaDtos,
            total,
            page,
            limit,
        };
    }
    async findOne(id, includeSuggestedQuestions = false) {
        const formula = await this.prisma.formula.findUnique({
            where: { id },
        });
        if (!formula) {
            throw new common_1.NotFoundException(`Formula with ID ${id} not found`);
        }
        const responseDto = await this.mapToResponseDto(formula);
        if (includeSuggestedQuestions) {
            responseDto.suggestedQuestions = await this.getSuggestedQuestions(formula);
        }
        return responseDto;
    }
    async update(id, updateFormulaDto) {
        const existingFormula = await this.prisma.formula.findUnique({
            where: { id },
        });
        if (!existingFormula) {
            throw new common_1.NotFoundException(`Formula with ID ${id} not found`);
        }
        const formula = await this.prisma.formula.update({
            where: { id },
            data: updateFormulaDto,
        });
        return this.mapToResponseDto(formula);
    }
    async remove(id) {
        const existingFormula = await this.prisma.formula.findUnique({
            where: { id },
        });
        if (!existingFormula) {
            throw new common_1.NotFoundException(`Formula with ID ${id} not found`);
        }
        await this.prisma.formula.delete({
            where: { id },
        });
    }
    async getSuggestedQuestions(formula) {
        const suggestedQuestions = [];
        if (formula.tags && formula.tags.length > 0) {
            const questionsByTags = await this.prisma.question.findMany({
                where: {
                    tags: {
                        some: {
                            tag: {
                                name: {
                                    in: formula.tags,
                                },
                            },
                        },
                    },
                },
                take: 5,
                select: {
                    id: true,
                    stem: true,
                    difficulty: true,
                    subject: true,
                    topicId: true,
                    subtopicId: true,
                },
            });
            suggestedQuestions.push(...questionsByTags);
        }
        if (formula.topicId) {
            const questionsByTopic = await this.prisma.question.findMany({
                where: {
                    topicId: formula.topicId,
                },
                take: 5,
                select: {
                    id: true,
                    stem: true,
                    difficulty: true,
                    subject: true,
                    topicId: true,
                    subtopicId: true,
                },
            });
            suggestedQuestions.push(...questionsByTopic);
        }
        if (formula.subtopicId) {
            const questionsBySubtopic = await this.prisma.question.findMany({
                where: {
                    subtopicId: formula.subtopicId,
                },
                take: 5,
                select: {
                    id: true,
                    stem: true,
                    difficulty: true,
                    subject: true,
                    topicId: true,
                    subtopicId: true,
                },
            });
            suggestedQuestions.push(...questionsBySubtopic);
        }
        if (formula.subject) {
            const questionsBySubject = await this.prisma.question.findMany({
                where: {
                    subject: formula.subject,
                },
                take: 5,
                select: {
                    id: true,
                    stem: true,
                    difficulty: true,
                    subject: true,
                    topicId: true,
                    subtopicId: true,
                },
            });
            suggestedQuestions.push(...questionsBySubject);
        }
        const uniqueQuestions = suggestedQuestions.filter((question, index, self) => index === self.findIndex(q => q.id === question.id));
        return uniqueQuestions.slice(0, 10);
    }
    async mapToResponseDto(formula) {
        return {
            id: formula.id,
            title: formula.title,
            formula: formula.formula,
            description: formula.description,
            subject: formula.subject,
            tags: formula.tags || [],
            topicId: formula.topicId,
            subtopicId: formula.subtopicId,
            targetRole: formula.targetRole,
            createdAt: formula.createdAt,
            updatedAt: formula.updatedAt,
        };
    }
};
exports.FormulasService = FormulasService;
exports.FormulasService = FormulasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FormulasService);
//# sourceMappingURL=formulas.service.js.map