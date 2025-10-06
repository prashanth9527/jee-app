import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import * as yauzl from 'yauzl';

export interface ZipProcessingResult {
  success: boolean;
  latexContent?: string;
  latexFilePath?: string;
  error?: string;
}

@Injectable()
export class ZipProcessorService {
  private readonly logger = new Logger(ZipProcessorService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Process ZIP file and extract LaTeX content
   */
  async processZipFile(cacheId: string): Promise<ZipProcessingResult> {
    try {
      // Get cache record
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { id: cacheId }
      });

      if (!cache) {
        throw new BadRequestException('PDF processing cache not found');
      }

      if (!cache.zipFilePath) {
        throw new BadRequestException('No ZIP file path found in cache');
      }

      // Check if ZIP file exists
      if (!fs.existsSync(cache.zipFilePath)) {
        throw new BadRequestException('ZIP file not found on disk');
      }

      this.logger.log(`Processing ZIP file: ${cache.zipFilePath}`);

      // Extract LaTeX content from ZIP
      const latexContent = await this.extractLatexFromZip(cache.zipFilePath, cache.fileName);

      if (!latexContent) {
        throw new BadRequestException('No LaTeX content found in ZIP file');
      }

      // Validate and clean LaTeX content
      const cleanedContent = this.validateAndCleanLatex(latexContent);

      // Save LaTeX content to file
      const latexFilePath = await this.saveLatexToFile(cache.fileName, cleanedContent);

      // Update database with extracted LaTeX content
      await this.prisma.pDFProcessorCache.update({
        where: { id: cacheId },
        data: {
          latexContent: cleanedContent,
          latexFilePath: latexFilePath,
          lastProcessedAt: new Date()
        }
      });

      this.logger.log(`✅ Successfully processed ZIP file and extracted LaTeX content`);

      return {
        success: true,
        latexContent: cleanedContent,
        latexFilePath: latexFilePath
      };

    } catch (error) {
      this.logger.error('Error processing ZIP file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Extract LaTeX content from ZIP file
   */
  private async extractLatexFromZip(zipFilePath: string, originalFileName?: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          this.logger.error('Error opening ZIP file:', err);
          reject(new Error(`Failed to open ZIP file: ${err.message}`));
          return;
        }

        if (!zipfile) {
          reject(new Error('Failed to create ZIP file object'));
          return;
        }

        let latexContent = '';
        let foundLatexFile = false;
        let pendingOperations = 0;
        let totalEntries = 0;
        let processedEntries = 0;

        zipfile.readEntry();
        
        zipfile.on('entry', (entry) => {
          totalEntries++;
          this.logger.log(`Processing entry ${totalEntries}: ${entry.fileName}`);
          
          // Look for .tex files
          if (entry.fileName.endsWith('.tex')) {
            this.logger.log(`📄 Found LaTeX file in ZIP: ${entry.fileName}`);
            foundLatexFile = true;
            pendingOperations++;
            
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                this.logger.error('Error opening read stream:', err);
                pendingOperations--;
                processedEntries++;
                if (processedEntries >= totalEntries && pendingOperations === 0) {
                  resolve(foundLatexFile ? latexContent : null);
                }
                return;
              }

              let content = '';
              readStream.on('data', (chunk) => {
                content += chunk.toString('utf8');
              });

              readStream.on('end', () => {
                latexContent = content;
                this.logger.log(`✅ Successfully extracted LaTeX content (${content.length} characters)`);
                pendingOperations--;
                processedEntries++;
                if (processedEntries >= totalEntries && pendingOperations === 0) {
                  resolve(foundLatexFile ? latexContent : null);
                }
              });

              readStream.on('error', (err) => {
                this.logger.error('Error reading LaTeX file:', err);
                pendingOperations--;
                processedEntries++;
                if (processedEntries >= totalEntries && pendingOperations === 0) {
                  resolve(foundLatexFile ? latexContent : null);
                }
              });
            });
          } 
          // Look for image files
          else if (this.isImageFile(entry.fileName)) {
            this.logger.log(`🖼️ Found image file in ZIP: ${entry.fileName}`);
            pendingOperations++;
            
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                this.logger.error('Error opening image read stream:', err);
                pendingOperations--;
                processedEntries++;
                if (processedEntries >= totalEntries && pendingOperations === 0) {
                  resolve(foundLatexFile ? latexContent : null);
                }
                return;
              }

              // Save image to content/images folder
              this.saveImageFromZip(readStream, entry.fileName, originalFileName).then(() => {
                pendingOperations--;
                processedEntries++;
                if (processedEntries >= totalEntries && pendingOperations === 0) {
                  resolve(foundLatexFile ? latexContent : null);
                }
              }).catch((error) => {
                this.logger.error('Error saving image:', error);
                pendingOperations--;
                processedEntries++;
                if (processedEntries >= totalEntries && pendingOperations === 0) {
                  resolve(foundLatexFile ? latexContent : null);
                }
              });
            });
        }
        
        // Always continue to next entry
        zipfile.readEntry();
        });

        zipfile.on('end', () => {
          this.logger.log(`📦 ZIP processing complete. Total entries: ${totalEntries}, Pending operations: ${pendingOperations}`);
          // Wait for all pending operations to complete
          const checkCompletion = () => {
            if (pendingOperations === 0) {
              if (foundLatexFile) {
                resolve(latexContent);
              } else {
                this.logger.warn('⚠️ No .tex file found in ZIP archive');
                reject(new Error('No LaTeX file found in ZIP archive'));
              }
            } else {
              // Check again in 100ms
              setTimeout(checkCompletion, 100);
            }
          };
          checkCompletion();
        });

        zipfile.on('error', (err) => {
          this.logger.error('ZIP file processing error:', err);
          reject(new Error(`ZIP processing error: ${err.message}`));
        });
      });
    });
  }

  /**
   * Check if file is an image based on extension
   */
  private isImageFile(fileName: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.tiff', '.tif'];
    const extension = path.extname(fileName).toLowerCase();
    return imageExtensions.includes(extension);
  }

  /**
   * Save image from ZIP stream to content/images folder
   */
  private async saveImageFromZip(readStream: any, fileName: string, originalFileName?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Create images directory if it doesn't exist
        const imagesDir = path.join(process.cwd(), 'content', 'images');
        if (!fs.existsSync(imagesDir)) {
          fs.mkdirSync(imagesDir, { recursive: true });
        }

        // Create subfolder with the same name as the original file (without extension)
        let subfolderName = 'default';
        if (originalFileName) {
          const originalBaseName = path.basename(originalFileName, path.extname(originalFileName));
          subfolderName = this.sanitizeFileName(originalBaseName);
        }
        
        const subfolderPath = path.join(imagesDir, subfolderName);
        if (!fs.existsSync(subfolderPath)) {
          fs.mkdirSync(subfolderPath, { recursive: true });
        }

        // Keep the original image filename from ZIP file (no sanitization)
        // Extract only the filename from the path to avoid nested directory issues
        const originalImageFileName = path.basename(fileName);
        const imageFilePath = path.join(subfolderPath, originalImageFileName);

        // Create write stream
        const writeStream = fs.createWriteStream(imageFilePath);

        // Pipe the read stream to write stream
        readStream.pipe(writeStream);

        writeStream.on('finish', () => {
          this.logger.log(`🖼️ Image saved to: ${imageFilePath}`);
          resolve();
        });

        writeStream.on('error', (error: any) => {
          this.logger.error('Error writing image file:', error);
          reject(error);
        });

        readStream.on('error', (error: any) => {
          this.logger.error('Error reading image stream:', error);
          reject(error);
        });

      } catch (error) {
        this.logger.error('Error saving image from ZIP:', error);
        reject(error);
      }
    });
  }

  /**
   * Validate and clean LaTeX content
   */
  private validateAndCleanLatex(latexContent: string): string {
    try {
      // Remove any remaining binary data or control characters
      let cleaned = latexContent
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
        .replace(/PK.*?PK/g, '') // Remove any remaining ZIP signatures
        .trim();

      // Check if it looks like valid LaTeX
      if (!cleaned.includes('\\documentclass') && !cleaned.includes('\\begin{document}')) {
        this.logger.warn('⚠️ LaTeX content may not be properly formatted');
      }

      // Ensure it has proper LaTeX structure
      if (!cleaned.includes('\\documentclass')) {
        cleaned = '\\documentclass{article}\n\\usepackage{amsmath}\n\\usepackage{amsfonts}\n\\begin{document}\n' + cleaned;
      }

      if (!cleaned.includes('\\end{document}')) {
        cleaned = cleaned + '\n\\end{document}';
      }

      this.logger.log(`✅ LaTeX content validated and cleaned (${cleaned.length} characters)`);
      return cleaned;

    } catch (error) {
      this.logger.error('Error validating LaTeX content:', error);
      return latexContent; // Return original if validation fails
    }
  }

  /**
   * Sanitize filename to remove special characters, spaces, and ensure URL-safe naming
   */
  private sanitizeFileName(fileName: string): string {
    if (!fileName) return fileName;
    
    try {
      // Get the extension first
      const extension = path.extname(fileName);
      const baseName = path.basename(fileName, extension);
      
      // Sanitize the base name:
      // 1. Replace spaces with underscores
      // 2. Remove or replace special characters that can cause URL issues
      // 3. Keep only alphanumeric characters, underscores, and hyphens
      let sanitizedBaseName = baseName
        .replace(/\s+/g, '_')                    // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9_-]/g, '_')         // Replace special chars with underscores
        .replace(/_+/g, '_')                     // Replace multiple underscores with single
        .replace(/^_|_$/g, '')                   // Remove leading/trailing underscores
        .toLowerCase();                          // Convert to lowercase for consistency
      
      // Ensure the filename is not empty
      if (!sanitizedBaseName) {
        sanitizedBaseName = 'sanitized_file';
      }
      
      // Limit filename length to prevent issues
      if (sanitizedBaseName.length > 100) {
        sanitizedBaseName = sanitizedBaseName.substring(0, 100);
      }
      
      const sanitizedFileName = sanitizedBaseName + extension;
      this.logger.log(`📝 Sanitized filename: "${fileName}" -> "${sanitizedFileName}"`);
      
      return sanitizedFileName;
    } catch (error) {
      this.logger.warn('Failed to sanitize filename:', error);
      return fileName;
    }
  }

  /**
   * Save LaTeX content to file
   */
  private async saveLatexToFile(fileName: string, latexContent: string): Promise<string> {
    try {
      // Create latex directory if it doesn't exist
      const latexDir = path.join(process.cwd(), 'content', 'latex');
      if (!fs.existsSync(latexDir)) {
        fs.mkdirSync(latexDir, { recursive: true });
      }

      // Generate LaTeX file name (replace .pdf with .tex) and sanitize it
      const originalLatexFileName = fileName.replace(/\.pdf$/i, '.tex');
      const latexFileName = this.sanitizeFileName(originalLatexFileName);
      const latexFilePath = path.join(latexDir, latexFileName);

      // Write LaTeX content to file
      fs.writeFileSync(latexFilePath, latexContent, 'utf8');

      this.logger.log(`LaTeX content saved to: ${latexFilePath}`);
      return latexFilePath;

    } catch (error) {
      this.logger.error('Error saving LaTeX file:', error);
      throw new Error(`Failed to save LaTeX file: ${error.message}`);
    }
  }

  /**
   * Get list of cache records that have ZIP files but no LaTeX content
   */
  async getPendingZipFiles(): Promise<Array<{ id: string; fileName: string; zipFilePath: string }>> {
    try {
      const caches = await this.prisma.pDFProcessorCache.findMany({
        where: {
          zipFilePath: { not: null },
          latexContent: null
        },
        select: {
          id: true,
          fileName: true,
          zipFilePath: true
        }
      });

      return caches.map(cache => ({
        id: cache.id,
        fileName: cache.fileName,
        zipFilePath: cache.zipFilePath!
      }));

    } catch (error) {
      this.logger.error('Error getting pending ZIP files:', error);
      return [];
    }
  }
}
