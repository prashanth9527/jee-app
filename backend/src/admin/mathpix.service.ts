import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as yauzl from 'yauzl';

export interface MathpixResponse {
  latex: string;
  confidence: number;
  error?: string;
}

export interface MathpixProcessResult {
  success: boolean;
  latexContent?: string;
  latexFilePath?: string;
  error?: string;
  processingTimeMs?: number;
}

@Injectable()
export class MathpixService {
  private readonly logger = new Logger(MathpixService.name);
  private readonly mathpixBaseUrl = 'https://api.mathpix.com/v3';
  private readonly mathpixUploadUrl = 'https://api.mathpix.com/v3/pdf';
  private readonly mathpixAppId = process.env.MATHPIX_APP_ID;
  private readonly mathpixAppKey = process.env.MATHPIX_APP_KEY;

  constructor(private prisma: PrismaService) {
    if (!this.mathpixAppId || !this.mathpixAppKey) {
      this.logger.warn('Mathpix credentials not configured. Set MATHPIX_APP_ID and MATHPIX_APP_KEY environment variables.');
    }
  }

  /**
   * Sanitize string data to remove null bytes and invalid UTF8 sequences
   */
  private sanitizeStringData(data: string): string {
    if (!data) return data;
    
    try {
      // Remove null bytes and other control characters that can cause UTF8 issues
      let sanitized = data
        .replace(/\0/g, '') // Remove null bytes
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove other control characters
        .trim();
      
      // Additional check for any remaining invalid UTF8 sequences
      // Convert to buffer and back to string to ensure valid UTF8
      const buffer = Buffer.from(sanitized, 'utf8');
      sanitized = buffer.toString('utf8');
      
      return sanitized;
    } catch (error) {
      this.logger.warn('Error sanitizing string data, using fallback:', error.message);
      // Fallback: return a safe string representation
      return data.replace(/[^\x20-\x7E]/g, '?').trim();
    }
  }

  /**
   * Process PDF file with Mathpix by fileName (creates cache record if needed)
   */
  async processPdfWithMathpixByFileName(fileName: string, filePath: string): Promise<MathpixProcessResult> {
    const startTime = Date.now();

    if (!this.isConfigured()) {
      throw new BadRequestException('Mathpix API credentials not configured');
    }

    try {
      // Check if PDF file exists
      if (!fs.existsSync(filePath)) {
        throw new BadRequestException('PDF file not found on disk');
      }

      this.logger.log(`Processing PDF with Mathpix: ${fileName}`);

      // Process PDF using the complete workflow
      const result = await this.processPDFComplete(filePath);
      
      let latexContent = '';
      let latexFilePath = '';
      let zipFilePath = '';

      if (result.zipFilePath) {
        // ZIP file was saved, now extract LaTeX content immediately
        zipFilePath = result.zipFilePath;
        this.logger.log('📦 ZIP file saved, extracting LaTeX content...');
        
        // Extract LaTeX content from ZIP file
        const extractedContent = await this.extractLatexFromZipFile(zipFilePath, fileName);
        if (extractedContent) {
          // Validate and clean LaTeX content
          const cleanedContent = this.validateAndCleanLatex(extractedContent);
          latexContent = this.sanitizeStringData(cleanedContent);
          latexFilePath = await this.saveLatexToFile(fileName, latexContent);
          this.logger.log('✅ LaTeX content extracted, cleaned, and saved to latex folder');
        }
      } else if (result.content) {
        // Regular text content
        latexContent = this.sanitizeStringData(result.content);
        latexFilePath = await this.saveLatexToFile(fileName, latexContent);
      }

      // Find or create cache record
      let cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { fileName: fileName }
      });

      if (!cache) {
        // Create new cache record
        const fileStats = fs.statSync(filePath);
        try {
          cache = await this.prisma.pDFProcessorCache.create({
            data: {
              fileName: this.sanitizeStringData(fileName),
              filePath: this.sanitizeStringData(filePath),
              fileSize: fileStats.size,
              processingStatus: 'PENDING',
              latexContent: latexContent,
              latexFilePath: this.sanitizeStringData(latexFilePath),
              zipFilePath: this.sanitizeStringData(zipFilePath),
              lastProcessedAt: new Date(),
              processingTimeMs: Date.now() - startTime
            }
          });
        } catch (dbError) {
          this.logger.error('Database error creating cache record:', dbError);
          // If it's still a UTF8 error, try with more aggressive sanitization
          if (dbError.message.includes('UTF8') || dbError.message.includes('byte sequence')) {
            cache = await this.prisma.pDFProcessorCache.create({
            data: {
              fileName: this.sanitizeStringData(fileName).substring(0, 255), // Limit length
              filePath: this.sanitizeStringData(filePath).substring(0, 500),
              fileSize: fileStats.size,
              processingStatus: 'PENDING',
              latexContent: latexContent.substring(0, 10000), // Limit content size
              latexFilePath: this.sanitizeStringData(latexFilePath).substring(0, 500),
              zipFilePath: this.sanitizeStringData(zipFilePath).substring(0, 500),
              lastProcessedAt: new Date(),
              processingTimeMs: Date.now() - startTime
            }
            });
          } else {
            throw dbError;
          }
        }
      } else {
        // Update existing cache record
        try {
          cache = await this.prisma.pDFProcessorCache.update({
            where: { id: cache.id },
            data: {
              latexContent: latexContent,
              latexFilePath: this.sanitizeStringData(latexFilePath),
              zipFilePath: this.sanitizeStringData(zipFilePath),
              lastProcessedAt: new Date(),
              processingTimeMs: Date.now() - startTime
            }
          });
        } catch (dbError) {
          this.logger.error('Database error updating cache record:', dbError);
          // If it's still a UTF8 error, try with more aggressive sanitization
          if (dbError.message.includes('UTF8') || dbError.message.includes('byte sequence')) {
            cache = await this.prisma.pDFProcessorCache.update({
              where: { id: cache.id },
              data: {
                latexContent: latexContent.substring(0, 10000), // Limit content size
                latexFilePath: this.sanitizeStringData(latexFilePath).substring(0, 500),
                zipFilePath: this.sanitizeStringData(zipFilePath).substring(0, 500),
                lastProcessedAt: new Date(),
                processingTimeMs: Date.now() - startTime
              }
            });
          } else {
            throw dbError;
          }
        }
      }

      this.logger.log(`Mathpix processing completed for ${fileName} in ${Date.now() - startTime}ms`);

      return {
        success: true,
        latexContent: latexContent,
        latexFilePath: latexFilePath,
        processingTimeMs: Date.now() - startTime
      };

    } catch (error) {
      this.logger.error(`Mathpix processing failed for ${fileName}:`, error);
      
      // Try to update cache with error if it exists
      try {
        const existingCache = await this.prisma.pDFProcessorCache.findUnique({
          where: { fileName: fileName }
        });
        
        if (existingCache) {
          await this.prisma.pDFProcessorCache.update({
            where: { id: existingCache.id },
            data: {
              errorMessage: error.message,
              lastProcessedAt: new Date()
            }
          });
        }
      } catch (updateError) {
        this.logger.error('Failed to update cache with error:', updateError);
      }

      return {
        success: false,
        error: error.message,
        processingTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Process PDF file with Mathpix to extract LaTeX content
   */
  async processPdfWithMathpix(cacheId: string): Promise<MathpixProcessResult> {
    const startTime = Date.now();
    
    try {
      // Get PDF cache record
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { id: cacheId }
      });

      if (!cache) {
        throw new BadRequestException('PDF cache not found');
      }

      if (!fs.existsSync(cache.filePath)) {
        throw new BadRequestException('PDF file not found on disk');
      }

      this.logger.log(`Processing PDF with Mathpix: ${cache.fileName}`);

      // Read PDF file as base64
      const pdfBuffer = fs.readFileSync(cache.filePath);
      const base64Pdf = pdfBuffer.toString('base64');

      // Process PDF using the complete workflow
      const result = await this.processPDFComplete(cache.filePath);
      
      let latexContent = '';
      let latexFilePath = '';
      let zipFilePath = '';

      if (result.zipFilePath) {
        // ZIP file was saved, now extract LaTeX content immediately
        zipFilePath = result.zipFilePath;
        this.logger.log('📦 ZIP file saved, extracting LaTeX content...');
        
        // Extract LaTeX content from ZIP file
        const extractedContent = await this.extractLatexFromZipFile(zipFilePath, cache.fileName);
        if (extractedContent) {
          // Validate and clean LaTeX content
          const cleanedContent = this.validateAndCleanLatex(extractedContent);
          latexContent = this.sanitizeStringData(cleanedContent);
          latexFilePath = await this.saveLatexToFile(cache.fileName, latexContent);
          this.logger.log('✅ LaTeX content extracted, cleaned, and saved to latex folder');
        }
      } else if (result.content) {
        // Regular text content
        latexContent = this.sanitizeStringData(result.content);
        latexFilePath = await this.saveLatexToFile(cache.fileName, latexContent);
      }

      // Update database with LaTeX content
      let updatedCache;
      try {
        updatedCache = await this.prisma.pDFProcessorCache.update({
          where: { id: cacheId },
          data: {
            latexContent: latexContent,
            latexFilePath: this.sanitizeStringData(latexFilePath),
            zipFilePath: this.sanitizeStringData(zipFilePath),
            lastProcessedAt: new Date(),
            processingTimeMs: Date.now() - startTime
          }
        });
      } catch (dbError) {
        this.logger.error('Database error updating cache record:', dbError);
        // If it's still a UTF8 error, try with more aggressive sanitization
        if (dbError.message.includes('UTF8') || dbError.message.includes('byte sequence')) {
          updatedCache = await this.prisma.pDFProcessorCache.update({
            where: { id: cacheId },
            data: {
              latexContent: latexContent.substring(0, 10000), // Limit content size
              latexFilePath: this.sanitizeStringData(latexFilePath).substring(0, 500),
              zipFilePath: this.sanitizeStringData(zipFilePath).substring(0, 500),
              lastProcessedAt: new Date(),
              processingTimeMs: Date.now() - startTime
            }
          });
        } else {
          throw dbError;
        }
      }

      // Log the processing
      await this.logEvent(cacheId, 'SUCCESS', 'PDF processed with Mathpix successfully', {
        latexContentLength: latexContent.length,
        latexFilePath: latexFilePath
      });

      this.logger.log(`Mathpix processing completed for ${cache.fileName} in ${Date.now() - startTime}ms`);

      return {
        success: true,
        latexContent: latexContent,
        latexFilePath: latexFilePath,
        processingTimeMs: Date.now() - startTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`Mathpix processing failed for cache ${cacheId}:`, error);

      // Log the error
      await this.logEvent(cacheId, 'ERROR', `Mathpix processing failed: ${error.message}`, {
        error: error.message,
        processingTimeMs: processingTime
      });

      // Update cache with error
      await this.prisma.pDFProcessorCache.update({
        where: { id: cacheId },
        data: {
          errorMessage: error.message,
          processingTimeMs: processingTime
        }
      });

      return {
        success: false,
        error: error.message,
        processingTimeMs: processingTime
      };
    }
  }

  /**
   * Upload PDF to Mathpix and get pdf_id
   */
  private async uploadPDF(pdfPath: string): Promise<{ pdf_id: string; status: string }> {
    try {
      const pdfBuffer = fs.readFileSync(pdfPath);
      
      // Create FormData for multipart upload
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', pdfBuffer, {
        filename: path.basename(pdfPath),
        contentType: 'application/pdf'
      });
      
      this.logger.log('🔑 Using Mathpix credentials:', {
        appId: this.mathpixAppId ? 'Set' : 'Not set',
        appKey: this.mathpixAppKey ? 'Set' : 'Not set',
        baseUrl: this.mathpixBaseUrl
      });

      const response = await axios.post(this.mathpixUploadUrl, form, {
        headers: {
          'app_id': this.mathpixAppId,
          'app_key': this.mathpixAppKey,
          ...form.getHeaders()
        },
        timeout: 60000
      });

      const data = response.data;
      this.logger.log('📄 PDF uploaded to Mathpix:', data);
      
      // Check if there's an error in the response
      if (data.error) {
        throw new Error(`Mathpix API error: ${data.error} - ${data.error_info?.message || 'Unknown error'}`);
      }
      
      return {
        pdf_id: data.pdf_id,
        status: data.status || 'processing'
      };
    } catch (error) {
      this.logger.error('Error uploading PDF to Mathpix:', error);
      throw new Error(`Failed to upload PDF: ${error.message}`);
    }
  }

  /**
   * Wait for PDF processing to complete
   */
  private async waitForPDFProcessing(pdfId: string, maxWaitTime: number = 300000): Promise<void> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await axios.get(`${this.mathpixBaseUrl}/pdf/${pdfId}`, {
          headers: {
            'app_id': this.mathpixAppId,
            'app_key': this.mathpixAppKey
          }
        });

        const status = response.data.status;
        this.logger.log(`PDF processing status: ${status}`);

        if (status === 'completed') {
          return;
        } else if (status === 'failed') {
          throw new Error('PDF processing failed');
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        this.logger.error('Error checking PDF processing status:', error);
        throw error;
      }
    }

    throw new Error('PDF processing timeout');
  }

  /**
   * Get processed PDF content as LaTeX (saves ZIP files directly)
   */
  private async getPDFAsLatex(pdfId: string, fileName: string): Promise<{ content: string; zipFilePath?: string }> {
    try {
      const response = await axios.get(`${this.mathpixBaseUrl}/pdf/${pdfId}.tex`, {
        headers: {
          'app_id': this.mathpixAppId,
          'app_key': this.mathpixAppKey
        },
        responseType: 'arraybuffer' // Important: Get binary data for ZIP files
      });

      const data = Buffer.from(response.data);
      
      // Check if the response is a ZIP file (starts with PK)
      if (data.toString('ascii', 0, 2) === 'PK') {
        this.logger.log('📦 Detected ZIP file from Mathpix, saving ZIP file...');
        const zipFilePath = await this.saveZipFile(fileName, data);
        return { content: '', zipFilePath };
      } else {
        // Regular text response
        const content = data.toString('utf8');
        return { content, zipFilePath: undefined };
      }
    } catch (error) {
      this.logger.error('Error getting PDF as LaTeX:', error);
      throw new Error(`Failed to get LaTeX content: ${error.message}`);
    }
  }

  /**
   * Extract LaTeX content and images from ZIP file (for immediate processing)
   */
  private async extractLatexFromZipFile(zipFilePath: string, originalFileName?: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      yauzl.open(zipFilePath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          this.logger.error('Error opening ZIP file:', err);
          resolve(null);
          return;
        }

        if (!zipfile) {
          resolve(null);
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
                resolve(null);
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
          resolve(null);
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
          subfolderName = path.basename(originalFileName, path.extname(originalFileName));
        }
        
        const subfolderPath = path.join(imagesDir, subfolderName);
        if (!fs.existsSync(subfolderPath)) {
          fs.mkdirSync(subfolderPath, { recursive: true });
        }

        // Generate unique filename to avoid conflicts
        const timestamp = Date.now();
        const extension = path.extname(fileName);
        const baseName = path.basename(fileName, extension);
        const uniqueFileName = `${baseName}_${timestamp}${extension}`;
        const imageFilePath = path.join(subfolderPath, uniqueFileName);

        // Create write stream
        const writeStream = fs.createWriteStream(imageFilePath);

        // Pipe the read stream to write stream
        readStream.pipe(writeStream);

        writeStream.on('finish', () => {
          this.logger.log(`🖼️ Image saved to: ${imageFilePath}`);
          resolve();
        });

        writeStream.on('error', (error) => {
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
   * Save ZIP file from Mathpix to local storage
   */
  private async saveZipFile(fileName: string, zipBuffer: Buffer): Promise<string> {
    try {
      // Create zip directory if it doesn't exist
      const zipDir = path.join(process.cwd(), 'content', 'zip');
      if (!fs.existsSync(zipDir)) {
        fs.mkdirSync(zipDir, { recursive: true });
      }

      // Generate ZIP file name (replace .pdf with .zip)
      const zipFileName = fileName.replace(/\.pdf$/i, '.zip');
      const zipFilePath = path.join(zipDir, zipFileName);

      // Write ZIP file
      fs.writeFileSync(zipFilePath, zipBuffer);

      this.logger.log(`📦 ZIP file saved to: ${zipFilePath}`);
      return zipFilePath;

    } catch (error) {
      this.logger.error('Error saving ZIP file:', error);
      throw new Error(`Failed to save ZIP file: ${error.message}`);
    }
  }

  /**
   * Extract LaTeX content from ZIP file
   */
  private async extractLatexFromZip(zipBuffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err, zipfile) => {
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

        zipfile.readEntry();
        
        zipfile.on('entry', (entry) => {
          // Look for .tex files
          if (entry.fileName.endsWith('.tex')) {
            this.logger.log(`📄 Found LaTeX file in ZIP: ${entry.fileName}`);
            foundLatexFile = true;
            
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                this.logger.error('Error opening read stream:', err);
                reject(new Error(`Failed to read LaTeX file from ZIP: ${err.message}`));
                return;
              }

              let content = '';
              readStream.on('data', (chunk) => {
                content += chunk.toString('utf8');
              });

              readStream.on('end', () => {
                latexContent = content;
                this.logger.log(`✅ Successfully extracted LaTeX content (${content.length} characters)`);
                resolve(latexContent);
              });

              readStream.on('error', (err) => {
                this.logger.error('Error reading LaTeX file:', err);
                reject(new Error(`Failed to read LaTeX content: ${err.message}`));
              });
            });
          } else {
            // Skip non-LaTeX files
            zipfile.readEntry();
          }
        });

        zipfile.on('end', () => {
          if (!foundLatexFile) {
            this.logger.warn('⚠️ No .tex file found in ZIP archive');
            reject(new Error('No LaTeX file found in ZIP archive'));
          }
        });

        zipfile.on('error', (err) => {
          this.logger.error('ZIP file processing error:', err);
          reject(new Error(`ZIP processing error: ${err.message}`));
        });
      });
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
   * Complete PDF processing workflow
   */
  private async processPDFComplete(pdfPath: string): Promise<{ content: string; zipFilePath?: string }> {
    try {
      this.logger.log('🚀 Starting complete PDF processing workflow...');
      
      // Step 1: Upload PDF
      this.logger.log('📤 Uploading PDF to Mathpix...');
      const uploadResult = await this.uploadPDF(pdfPath);
      const pdfId = uploadResult.pdf_id;
      
      // Step 2: Wait for processing
      this.logger.log('⏳ Waiting for PDF processing to complete...');
      await this.waitForPDFProcessing(pdfId);
      
      // Step 3: Get processed content as LaTeX (or save ZIP file)
      this.logger.log('📥 Retrieving processed content as LaTeX...');
      const fileName = path.basename(pdfPath);
      const result = await this.getPDFAsLatex(pdfId, fileName);
      
      // Step 4: If we have text content, validate and clean it
      if (result.content) {
        this.logger.log('🧹 Validating and cleaning LaTeX content...');
        const cleanedContent = this.validateAndCleanLatex(result.content);
        result.content = cleanedContent;
      }
      
      this.logger.log('✅ PDF processing completed successfully!');
      
      return result;
    } catch (error) {
      this.logger.error('❌ PDF processing workflow failed:', error);
      throw error;
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

      // Generate LaTeX file name (replace .pdf with .tex)
      const latexFileName = fileName.replace(/\.pdf$/i, '.tex');
      const latexFilePath = path.join(latexDir, latexFileName);

      // Write LaTeX content to file
      fs.writeFileSync(latexFilePath, latexContent, 'utf8');

      this.logger.log(`LaTeX content saved to: ${latexFilePath}`);
      return latexFilePath;

    } catch (error) {
      this.logger.error(`Failed to save LaTeX file:`, error);
      throw new Error(`Failed to save LaTeX file: ${error.message}`);
    }
  }

  /**
   * Get LaTeX content from database
   */
  async getLatexContent(cacheId: string): Promise<{ latexContent?: string; latexFilePath?: string }> {
    try {
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { id: cacheId },
        select: {
          latexContent: true,
          latexFilePath: true,
          fileName: true
        }
      });

      if (!cache) {
        throw new BadRequestException('PDF cache not found');
      }

      return {
        latexContent: cache.latexContent || undefined,
        latexFilePath: cache.latexFilePath || undefined
      };

    } catch (error) {
      this.logger.error(`Failed to get LaTeX content for cache ${cacheId}:`, error);
      throw error;
    }
  }

  /**
   * Get LaTeX file content from disk
   */
  async getLatexFileContent(cacheId: string): Promise<string> {
    try {
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { id: cacheId },
        select: {
          latexFilePath: true,
          fileName: true
        }
      });

      if (!cache) {
        throw new BadRequestException('PDF cache not found');
      }

      if (!cache.latexFilePath || !fs.existsSync(cache.latexFilePath)) {
        throw new BadRequestException('LaTeX file not found');
      }

      return fs.readFileSync(cache.latexFilePath, 'utf8');

    } catch (error) {
      this.logger.error(`Failed to read LaTeX file for cache ${cacheId}:`, error);
      throw error;
    }
  }

  /**
   * Log processing event
   */
  private async logEvent(cacheId: string, logType: string, message: string, data?: any) {
    try {
      await this.prisma.pDFProcessorLog.create({
        data: {
          cacheId: cacheId,
          logType: logType as any,
          message: message,
          data: data || {}
        }
      });
    } catch (error) {
      this.logger.error('Failed to log event:', error);
    }
  }

  /**
   * Check if Mathpix is configured
   */
  isConfigured(): boolean {
    return !!(this.mathpixAppId && this.mathpixAppKey);
  }

  /**
   * Get processing status for a cache
   */
  async getProcessingStatus(cacheId: string): Promise<{
    hasLatexContent: boolean;
    latexFilePath?: string;
    processingTimeMs?: number;
    lastProcessedAt?: Date;
  }> {
    try {
      const cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { id: cacheId },
        select: {
          latexContent: true,
          latexFilePath: true,
          processingTimeMs: true,
          lastProcessedAt: true
        }
      });

      if (!cache) {
        throw new BadRequestException('PDF cache not found');
      }

      return {
        hasLatexContent: !!cache.latexContent,
        latexFilePath: cache.latexFilePath || undefined,
        processingTimeMs: cache.processingTimeMs || undefined,
        lastProcessedAt: cache.lastProcessedAt || undefined
      };

    } catch (error) {
      this.logger.error(`Failed to get processing status for cache ${cacheId}:`, error);
      throw error;
    }
  }
}
