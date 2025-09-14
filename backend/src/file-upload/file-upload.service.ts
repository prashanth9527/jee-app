import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class FileUploadService {
  private s3Client: S3Client;
  private bucketName: string;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION') || 'us-east-1',
      credentials: {
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
    this.bucketName = this.configService.get('AWS_S3_BUCKET_NAME') || 'default-bucket';
  }

  async uploadFile(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder: string = 'uploads'
  ): Promise<string> {
    try {
      const key = folder + '/' + Date.now() + '-' + fileName;
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName, 
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        ACL: undefined,
      });

      await this.s3Client.send(command);
      
      return 'https://' + this.bucketName + '.s3.' + (this.configService.get('AWS_REGION') || 'us-east-1') + '.amazonaws.com/' + key;
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      throw new BadRequestException('Failed to upload file');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const key = this.extractKeyFromUrl(fileUrl);
      
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      console.error('Error deleting file from S3:', error);
      throw new BadRequestException('Failed to delete file');
    }
  }

  private extractKeyFromUrl(fileUrl: string): string {
    const url = new URL(fileUrl);
    return url.pathname.substring(1);
  }

  async validateFileType(fileName: string, allowedTypes: string[]): Promise<boolean> {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return allowedTypes.includes(extension || '');
  }

  async validateFileSize(size: number, maxSize: number): Promise<boolean> {
    return size <= maxSize;
  }
}
