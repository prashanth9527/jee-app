import { 
  Controller, 
  Get, 
  Param, 
  Res,
  BadRequestException,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import * as fs from 'fs';

@Controller('static')
export class StaticFilesController {
  
  @Get('pdf/*')
  async viewPDF(@Param('0') filePath: string, @Res() res: Response) {
    try {
      console.log('PDF Request Debug Info:');
      console.log('- Received filePath:', filePath);
      
      // Decode the URL-encoded file path
      const decodedPath = decodeURIComponent(filePath);
      console.log('- Decoded path:', decodedPath);
      
      // Construct the full file path
      const contentDir = join(process.cwd(), '..', 'content');
      const fullPath = join(contentDir, decodedPath);
      console.log('- Content directory:', contentDir);
      console.log('- Full file path:', fullPath);
      
      // Security check: ensure the path is within the content directory
      const normalizedPath = join(contentDir, decodedPath);
      if (!normalizedPath.startsWith(contentDir)) {
        console.error('Security check failed: path outside content directory');
        throw new BadRequestException('Invalid file path');
      }
      
      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        console.error('File not found:', fullPath);
        throw new BadRequestException('PDF file not found');
      }
      
      console.log('File found, serving PDF...');

      // Extract filename from path for the Content-Disposition header
      const fileName = decodedPath.split('/').pop() || 'document.pdf';

      // Set headers for PDF viewing
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

      // Create and pipe the file stream
      const fileStream = createReadStream(fullPath);
      fileStream.pipe(res);
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: 'Failed to view PDF file',
          error: error.message
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

