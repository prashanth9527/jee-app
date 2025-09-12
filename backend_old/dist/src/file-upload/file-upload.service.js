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
exports.FileUploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
let FileUploadService = class FileUploadService {
    constructor(configService) {
        this.configService = configService;
        this.s3Client = new client_s3_1.S3Client({
            region: this.configService.get('AWS_REGION') || 'us-east-1',
            credentials: {
                accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
                secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
            },
        });
        this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME') || 'default-bucket';
    }
    async uploadFile(buffer, fileName, mimeType, folder = 'uploads') {
        try {
            const key = folder + '/' + Date.now() + '-' + fileName;
            const command = new client_s3_1.PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: mimeType,
                ACL: 'public-read',
            });
            await this.s3Client.send(command);
            return 'https://' + this.bucketName + '.s3.' + (this.configService.get('AWS_REGION') || 'us-east-1') + '.amazonaws.com/' + key;
        }
        catch (error) {
            console.error('Error uploading file to S3:', error);
            throw new common_1.BadRequestException('Failed to upload file');
        }
    }
    async deleteFile(fileUrl) {
        try {
            const key = this.extractKeyFromUrl(fileUrl);
            const command = new client_s3_1.DeleteObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            await this.s3Client.send(command);
        }
        catch (error) {
            console.error('Error deleting file from S3:', error);
            throw new common_1.BadRequestException('Failed to delete file');
        }
    }
    extractKeyFromUrl(fileUrl) {
        const url = new URL(fileUrl);
        return url.pathname.substring(1);
    }
    async validateFileType(fileName, allowedTypes) {
        const extension = fileName.split('.').pop()?.toLowerCase();
        return allowedTypes.includes(extension || '');
    }
    async validateFileSize(size, maxSize) {
        return size <= maxSize;
    }
};
exports.FileUploadService = FileUploadService;
exports.FileUploadService = FileUploadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FileUploadService);
//# sourceMappingURL=file-upload.service.js.map