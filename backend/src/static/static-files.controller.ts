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
  
  @Get('pdf/:fileName')
  async viewPDF(@Param('fileName') fileName: string, @Res() res: Response) {
    try {
      // Construct the file path
      const contentDir = join(process.cwd(), '..', 'content', 'JEE', 'Previous Papers');
      
      // First, try to find the file by scanning the directory
      let fullPath: string | null = null;
      
      const findFile = (dir: string, targetFileName: string): string | null => {
        try {
          const items = fs.readdirSync(dir);
          
          for (const item of items) {
            const itemPath = join(dir, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
              const found = findFile(itemPath, targetFileName);
              if (found) return found;
            } else if (item === targetFileName) {
              return itemPath;
            }
          }
        } catch (error) {
          // Directory doesn't exist or can't be read
        }
        return null;
      };
      
      fullPath = findFile(contentDir, fileName);
      
      if (!fullPath) {
        throw new BadRequestException('PDF file not found');
      }

      // Check if file exists
      if (!fs.existsSync(fullPath)) {
        throw new BadRequestException('PDF file not found on disk');
      }

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
