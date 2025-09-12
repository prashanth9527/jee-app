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
exports.StreamsController = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let StreamsController = class StreamsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAllStreams() {
        const streams = await this.prisma.stream.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                description: true,
                code: true,
                _count: {
                    select: {
                        subjects: true,
                        users: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        return streams;
    }
    async getStreamSubjects(streamId) {
        const subjects = await this.prisma.subject.findMany({
            where: {
                streamId,
                stream: { isActive: true }
            },
            select: {
                id: true,
                name: true,
                description: true,
                _count: {
                    select: {
                        topics: true,
                        questions: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
        return subjects;
    }
    async getStreamById(streamId) {
        const stream = await this.prisma.stream.findUnique({
            where: {
                id: streamId,
                isActive: true
            },
            select: {
                id: true,
                name: true,
                description: true,
                code: true,
                subjects: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        _count: {
                            select: {
                                topics: true,
                                questions: true,
                            },
                        },
                    },
                    orderBy: { name: 'asc' },
                },
                _count: {
                    select: {
                        users: true,
                    },
                },
            },
        });
        if (!stream) {
            throw new common_1.NotFoundException('Stream not found');
        }
        return stream;
    }
};
exports.StreamsController = StreamsController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], StreamsController.prototype, "getAllStreams", null);
__decorate([
    (0, common_1.Get)(':id/subjects'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StreamsController.prototype, "getStreamSubjects", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StreamsController.prototype, "getStreamById", null);
exports.StreamsController = StreamsController = __decorate([
    (0, common_1.Controller)('streams'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StreamsController);
//# sourceMappingURL=streams.controller.js.map