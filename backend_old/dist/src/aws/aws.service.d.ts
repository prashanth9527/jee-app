import { ConfigService } from '@nestjs/config';
export declare class AwsService {
    private configService;
    private s3Client;
    private bucketName;
    private region;
    constructor(configService: ConfigService);
    uploadFile(file: Express.Multer.File, folder?: string): Promise<string>;
    deleteFile(fileUrl: string): Promise<void>;
    generatePresignedUrl(key: string, contentType: string): Promise<string>;
    getFileUrl(key: string): string;
}
