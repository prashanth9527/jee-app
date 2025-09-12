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
exports.LMSService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
const aws_service_1 = require("../aws/aws.service");
let LMSService = class LMSService {
    constructor(prisma, configService, awsService) {
        this.prisma = prisma;
        this.configService = configService;
        this.awsService = awsService;
    }
    async createContent(data) {
        return {
            id: 'mock-id',
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    async updateContent(id, data) {
        return {
            id,
            ...data,
            updatedAt: new Date(),
        };
    }
    async getContent(id) {
        return {
            id,
            title: 'Sample Content',
            description: 'This is sample content',
            contentType: 'TEXT',
            status: 'PUBLISHED',
            accessType: 'FREE',
            subjectId: 'mock-subject',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    async getContentList(filters) {
        return {
            content: [],
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 10,
                hasNextPage: false,
                hasPreviousPage: false,
            },
        };
    }
    async deleteContent(id) {
        return { message: 'Content deleted successfully' };
    }
    async bulkDeleteContent(contentIds) {
        return { message: contentIds.length + ' content items deleted successfully' };
    }
    async getStats() {
        return {
            totalContent: 0,
            byType: [],
            byStatus: [],
            byAccess: [],
        };
    }
    async uploadFile(file) {
        const fileName = 'lms-content/' + Date.now() + '-' + file.originalname;
        const url = await this.awsService.uploadFile(file, 'lms-content');
        return { url };
    }
    async getStudentContent(userId, filters) {
        return {
            content: [],
            pagination: {
                currentPage: 1,
                totalPages: 1,
                totalItems: 0,
                itemsPerPage: 10,
                hasNextPage: false,
                hasPreviousPage: false,
            },
        };
    }
    async trackProgress(userId, contentId, progress) {
        return {
            id: 'mock-progress-id',
            userId,
            contentId,
            progress,
            status: progress >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
            createdAt: new Date(),
            updatedAt: new Date(),
        };
    }
    async getStudentProgress(userId) {
        return [];
    }
    async getContentAnalytics(contentId) {
        return {
            content: { id: contentId, title: 'Sample Content' },
            progress: [],
            stats: {
                totalEnrollments: 0,
                completed: 0,
                inProgress: 0,
                averageProgress: 0,
            },
        };
    }
};
exports.LMSService = LMSService;
exports.LMSService = LMSService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        aws_service_1.AwsService])
], LMSService);
//# sourceMappingURL=lms.service.js.map