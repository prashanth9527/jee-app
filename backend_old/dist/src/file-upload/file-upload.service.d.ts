import { ConfigService } from '@nestjs/config';
export declare class FileUploadService {
    private configService;
    private s3Client;
    private bucketName;
    constructor(configService: ConfigService);
    uploadFile(buffer: Buffer, fileName: string, mimeType: string, folder?: string): Promise<string>;
    deleteFile(fileUrl: string): Promise<void>;
    private extractKeyFromUrl;
    validateFileType(fileName: string, allowedTypes: string[]): Promise<boolean>;
    validateFileSize(size: number, maxSize: number): Promise<boolean>;
}
