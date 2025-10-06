import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AwsService } from '../aws/aws.service';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as yauzl from 'yauzl';
import { Readable } from 'stream';

export interface MathpixResponse {
  latex: string;
  confidence: number;
  error?: string;
}

export interface MathpixProcessResult {
  success: boolean;
  latexContent?: string;
  latexFilePath?: string;
  zipFilePath?: string;
  error?: string;
  processingTimeMs?: number;
  cacheId?: string;
  message?: string;
}

@Injectable()
export class MathpixService {
  private readonly logger = new Logger(MathpixService.name);
  private readonly mathpixBaseUrl = 'https://api.mathpix.com/v3';
  private readonly mathpixUploadUrl = 'https://api.mathpix.com/v3/pdf';
  private readonly mathpixAppId = process.env.MATHPIX_APP_ID;
  private readonly mathpixAppKey = process.env.MATHPIX_APP_KEY;
  
  // Configuration for background processing
  private readonly ignoreBackground = process.env.MATHPIX_IGNORE_BACKGROUND === 'true' || true; // Default to true

  constructor(
    private prisma: PrismaService,
    private awsService: AwsService,
  ) {
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

      // Check if LaTeX file already exists in content/latex folder
      const latexFileName = fileName.replace('.pdf', '.tex');
      const existingLatexFilePath = path.join(process.cwd(), 'content', 'latex', latexFileName);
      
      if (fs.existsSync(existingLatexFilePath)) {
        this.logger.log(`✅ LaTeX file already exists: ${latexFileName}`);
        
        // Read existing LaTeX content
        const existingLatexContent = fs.readFileSync(existingLatexFilePath, 'utf8');
        
        // Check if we have a cache entry for this file
        const existingCache = await this.prisma.pDFProcessorCache.findFirst({
          where: {
            filePath: filePath,
            fileName: fileName
          }
        });

        if (existingCache) {
          // Upload existing LaTeX file to AWS and get AWS URL
          const awsLatexFilePath = await this.saveLatexToFile(fileName, existingLatexContent);
          
          // Update existing cache with LaTeX content and AWS URL if missing
          if (!existingCache.latexContent || !existingCache.latexFilePath?.includes('s3.')) {
            await this.prisma.pDFProcessorCache.update({
              where: { id: existingCache.id },
              data: {
                latexContent: this.sanitizeStringData(existingLatexContent),
                latexFilePath: awsLatexFilePath
              }
            });
            this.logger.log(`✅ Updated cache with existing LaTeX content and AWS URL: ${fileName}`);
          }
          
          return {
            success: true,
            cacheId: existingCache.id,
            latexContent: existingLatexContent,
            latexFilePath: awsLatexFilePath,
            processingTimeMs: Date.now() - startTime
          };
        } else {
          // Upload existing LaTeX file to AWS and get AWS URL
          const awsLatexFilePath = await this.saveLatexToFile(fileName, existingLatexContent);
          
          // Create or update cache entry for existing LaTeX file
          const newCache = await this.prisma.pDFProcessorCache.upsert({
            where: { fileName: this.sanitizeStringData(fileName) },
            update: {
              latexContent: this.sanitizeStringData(existingLatexContent),
              latexFilePath: awsLatexFilePath,
              processingStatus: 'COMPLETED',
              lastProcessedAt: new Date()
            },
            create: {
              fileName: this.sanitizeStringData(fileName),
              filePath: this.sanitizeStringData(filePath),
              fileSize: 0, // We don't have the file size here
              processingStatus: 'COMPLETED',
              latexContent: this.sanitizeStringData(existingLatexContent),
              latexFilePath: awsLatexFilePath
            }
          });
          
          return {
            success: true,
            cacheId: newCache.id,
            latexContent: existingLatexContent,
            latexFilePath: awsLatexFilePath,
            processingTimeMs: Date.now() - startTime
          };
        }
      }

      this.logger.log(`Processing PDF with Mathpix: ${fileName}`);

      // Process PDF using the complete workflow with background ignore option
      const result = await this.processPDFComplete(filePath, { skipRecrop: this.ignoreBackground });
      
      let latexContent = '';
      let latexFilePath = '';
      let zipFilePath = '';

      if (result.zipFilePath) {
        // ZIP file was saved, now extract LaTeX content immediately
        zipFilePath = result.zipFilePath;
        this.logger.log('📦 ZIP file saved, extracting LaTeX content...');
        
        // Determine local ZIP file path for extraction
        let localZipFilePath = zipFilePath;
        if (zipFilePath.includes('s3.') || zipFilePath.includes('amazonaws.com')) {
          // If it's an AWS URL, construct the local path with sanitized filename
          const originalZipFileName = fileName.replace(/\.pdf$/i, '.zip');
          const zipFileName = this.sanitizeFileName(originalZipFileName);
          localZipFilePath = path.join(process.cwd(), 'content', 'zip', zipFileName);
        }
        
        // Extract LaTeX content from local ZIP file
        const extractedContent = await this.extractLatexFromZipFile(localZipFilePath, fileName);
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

      // Find or create cache record using original filename
      let cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { fileName: fileName }
      });

      if (!cache) {
        // Create new cache record
        const fileStats = fs.statSync(filePath);
        try {
          cache = await this.prisma.pDFProcessorCache.upsert({
            where: { fileName: this.sanitizeStringData(fileName) },
            update: {
              latexContent: latexContent,
              latexFilePath: this.sanitizeStringData(latexFilePath),
              zipFilePath: this.sanitizeStringData(zipFilePath),
              processingStatus: 'PENDING',
              lastProcessedAt: new Date(),
              processingTimeMs: Date.now() - startTime
            },
            create: {
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
            cache = await this.prisma.pDFProcessorCache.upsert({
            where: { fileName: this.sanitizeStringData(fileName).substring(0, 255) },
            update: {
              latexContent: latexContent.substring(0, 10000), // Limit content size
              latexFilePath: this.sanitizeStringData(latexFilePath).substring(0, 500),
              zipFilePath: this.sanitizeStringData(zipFilePath).substring(0, 500),
              processingStatus: 'PENDING',
              lastProcessedAt: new Date(),
              processingTimeMs: Date.now() - startTime
            },
            create: {
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
      this.logger.log(`Returning zipFilePath: ${zipFilePath}`);

      return {
        success: true,
        latexContent: latexContent,
        latexFilePath: latexFilePath,
        zipFilePath: zipFilePath,
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

      // Check if LaTeX file already exists in content/latex folder
      const latexFileName = cache.fileName.replace('.pdf', '.tex');
      const existingLatexFilePath = path.join(process.cwd(), 'content', 'latex', latexFileName);
      
      if (fs.existsSync(existingLatexFilePath)) {
        this.logger.log(`✅ LaTeX file already exists: ${latexFileName}`);
        
        // Read existing LaTeX content
        const existingLatexContent = fs.readFileSync(existingLatexFilePath, 'utf8');
        
        // Upload existing LaTeX file to AWS and get AWS URL
        const awsLatexFilePath = await this.saveLatexToFile(cache.fileName, existingLatexContent);
        
        // Update cache with existing LaTeX content and AWS URL
        if (!cache.latexContent || !cache.latexFilePath?.includes('s3.')) {
          await this.prisma.pDFProcessorCache.update({
            where: { id: cacheId },
            data: {
              latexContent: this.sanitizeStringData(existingLatexContent),
              latexFilePath: awsLatexFilePath
            }
          });
          this.logger.log(`✅ Updated cache with existing LaTeX content and AWS URL: ${cache.fileName}`);
        }
        
        return {
          success: true,
          cacheId: cacheId,
          latexContent: existingLatexContent,
          latexFilePath: awsLatexFilePath,
          processingTimeMs: Date.now() - startTime
        };
      }

      this.logger.log(`Processing PDF with Mathpix: ${cache.fileName}`);

      // Read PDF file as base64
      const pdfBuffer = fs.readFileSync(cache.filePath);
      const base64Pdf = pdfBuffer.toString('base64');

      // Process PDF using the complete workflow with background ignore option
      const result = await this.processPDFComplete(cache.filePath, { skipRecrop: this.ignoreBackground });
      
      let latexContent = '';
      let latexFilePath = '';
      let zipFilePath = '';

      if (result.zipFilePath) {
        // ZIP file was saved, now extract LaTeX content immediately
        zipFilePath = result.zipFilePath;
        this.logger.log('📦 ZIP file saved, extracting LaTeX content...');
        
        // Determine local ZIP file path for extraction
        let localZipFilePath = zipFilePath;
        if (zipFilePath.includes('s3.') || zipFilePath.includes('amazonaws.com')) {
          // If it's an AWS URL, construct the local path with sanitized filename
          const originalZipFileName = cache.fileName.replace(/\.pdf$/i, '.zip');
          const zipFileName = this.sanitizeFileName(originalZipFileName);
          localZipFilePath = path.join(process.cwd(), 'content', 'zip', zipFileName);
        }
        
        // Extract LaTeX content from local ZIP file
        const extractedContent = await this.extractLatexFromZipFile(localZipFilePath, cache.fileName);
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
  private async uploadPDF(pdfPath: string, options?: { skipRecrop?: boolean }): Promise<{ pdf_id: string; status: string }> {
    try {
      const pdfBuffer = fs.readFileSync(pdfPath);
      
      // Create FormData for multipart upload
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', pdfBuffer, {
        filename: path.basename(pdfPath),
        contentType: 'application/pdf'
      });

      // Add Mathpix processing options to ignore background
      if (options?.skipRecrop) {
        form.append('skip_recrop', 'true');
        this.logger.log('🎯 Background processing: skip_recrop enabled to ignore page backgrounds');
      }
      
      this.logger.log('🔑 Using Mathpix credentials:', {
        appId: this.mathpixAppId ? 'Set' : 'Not set',
        appKey: this.mathpixAppKey ? 'Set' : 'Not set',
        baseUrl: this.mathpixBaseUrl,
        skipRecrop: options?.skipRecrop || false
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
   * Get MIME type based on file extension
   */
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
      '.tiff': 'image/tiff',
      '.tif': 'image/tiff',
    };
    return mimeTypes[ext] || 'application/octet-stream';
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

        writeStream.on('finish', async () => {
          this.logger.log(`🖼️ Image saved locally to: ${imageFilePath}`);
          
          // Upload to AWS
          try {
            const fileBuffer = fs.readFileSync(imageFilePath);
            const mockFile: Express.Multer.File = {
              fieldname: 'file',
              originalname: originalImageFileName,
              encoding: '7bit',
              mimetype: this.getMimeType(originalImageFileName),
              buffer: fileBuffer,
              size: fileBuffer.length,
              stream: Readable.from(fileBuffer),
              destination: '',
              filename: originalImageFileName,
              path: imageFilePath,
            };

            const awsUrl = await this.awsService.uploadFileWithCustomName(
              mockFile,
              `content/images/${subfolderName}`,
              originalImageFileName
            );
            this.logger.log(`☁️ Image uploaded to AWS: ${awsUrl}`);
          } catch (awsError) {
            this.logger.error(`❌ Failed to upload image to AWS: ${awsError.message}`);
          }
          
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

      // Generate ZIP file name (replace .pdf with .zip) and sanitize it
      const originalZipFileName = fileName.replace(/\.pdf$/i, '.zip');
      const zipFileName = this.sanitizeFileName(originalZipFileName);
      const zipFilePath = path.join(zipDir, zipFileName);

      // Write ZIP file
      fs.writeFileSync(zipFilePath, zipBuffer);

      this.logger.log(`📦 ZIP file saved locally to: ${zipFilePath}`);

      // Upload to AWS and return AWS URL
      try {
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: zipFileName,
          encoding: '7bit',
          mimetype: 'application/zip',
          buffer: zipBuffer,
          size: zipBuffer.length,
          stream: Readable.from(zipBuffer),
          destination: '',
          filename: zipFileName,
          path: zipFilePath,
        };

        const awsUrl = await this.awsService.uploadFileWithCustomName(mockFile, 'content/zip', zipFileName);
        this.logger.log(`☁️ ZIP file uploaded to AWS: ${awsUrl}`);
        
        // Return AWS URL for serving
        return awsUrl;
      } catch (awsError) {
        this.logger.error(`❌ Failed to upload ZIP file to AWS: ${awsError.message}`);
        // Return local path as fallback
        return zipFilePath;
      }

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
  private async processPDFComplete(pdfPath: string, options?: { skipRecrop?: boolean }): Promise<{ content: string; zipFilePath?: string }> {
    try {
      this.logger.log('🚀 Starting complete PDF processing workflow...');
      
      // Step 1: Upload PDF
      this.logger.log('📤 Uploading PDF to Mathpix...');
      const uploadResult = await this.uploadPDF(pdfPath, options);
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

      // Generate LaTeX file name (replace .pdf with .tex) and sanitize it
      const originalLatexFileName = fileName.replace(/\.pdf$/i, '.tex');
      const latexFileName = this.sanitizeFileName(originalLatexFileName);
      const latexFilePath = path.join(latexDir, latexFileName);

      // Write LaTeX content to file
      fs.writeFileSync(latexFilePath, latexContent, 'utf8');

      this.logger.log(`📄 LaTeX content saved locally to: ${latexFilePath}`);

      // Upload to AWS
      try {
        const fileBuffer = Buffer.from(latexContent, 'utf8');
        const mockFile: Express.Multer.File = {
          fieldname: 'file',
          originalname: latexFileName,
          encoding: '7bit',
          mimetype: 'text/plain',
          buffer: fileBuffer,
          size: fileBuffer.length,
          stream: Readable.from(fileBuffer),
          destination: '',
          filename: latexFileName,
          path: latexFilePath,
        };

        const awsUrl = await this.awsService.uploadFileWithCustomName(mockFile, 'content/latex', latexFileName);
        this.logger.log(`☁️ LaTeX file uploaded to AWS: ${awsUrl}`);
        
        // Return AWS URL instead of local path
        return awsUrl;
      } catch (awsError) {
        this.logger.error(`❌ Failed to upload LaTeX file to AWS: ${awsError.message}`);
        // Return local path as fallback
        return latexFilePath;
      }

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
   * Get current background processing configuration
   */
  getBackgroundProcessingConfig(): { ignoreBackground: boolean } {
    return {
      ignoreBackground: this.ignoreBackground
    };
  }

  /**
   * Process PDF with custom background processing options
   */
  async processPdfWithMathpixByFileNameWithOptions(
    fileName: string, 
    filePath: string, 
    options?: { skipRecrop?: boolean }
  ): Promise<MathpixProcessResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Processing PDF with Mathpix (custom options): ${fileName}`);
      
      // Use custom options or fall back to default configuration
      const processingOptions = {
        skipRecrop: options?.skipRecrop ?? this.ignoreBackground
      };

      // Process PDF using the complete workflow with custom options
      const result = await this.processPDFComplete(filePath, processingOptions);
      
      let latexContent = '';
      let latexFilePath = '';
      let zipFilePath = '';

      if (result.zipFilePath) {
        // ZIP file was saved, now extract LaTeX content immediately
        zipFilePath = result.zipFilePath;
        this.logger.log('📦 ZIP file saved, extracting LaTeX content...');
        
        // Determine local ZIP file path for extraction
        let localZipFilePath = zipFilePath;
        if (zipFilePath.includes('s3.') || zipFilePath.includes('amazonaws.com')) {
          // If it's an AWS URL, construct the local path with sanitized filename
          const originalZipFileName = fileName.replace(/\.pdf$/i, '.zip');
          const zipFileName = this.sanitizeFileName(originalZipFileName);
          localZipFilePath = path.join(process.cwd(), 'content', 'zip', zipFileName);
        }
        
        // Extract LaTeX content from local ZIP file
        const extractedContent = await this.extractLatexFromZipFile(localZipFilePath, fileName);
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

      // Update or create cache record
      let cache = await this.prisma.pDFProcessorCache.findUnique({
        where: { fileName: fileName }
      });

      if (!cache) {
        // Create new cache record
        const fileStats = fs.statSync(filePath);
        try {
          cache = await this.prisma.pDFProcessorCache.upsert({
            where: { fileName: this.sanitizeStringData(fileName) },
            update: {
              latexContent: latexContent,
              latexFilePath: this.sanitizeStringData(latexFilePath),
              zipFilePath: this.sanitizeStringData(zipFilePath),
              processingStatus: 'COMPLETED',
              lastProcessedAt: new Date(),
              processingTimeMs: Date.now() - startTime
            },
            create: {
              fileName: this.sanitizeStringData(fileName),
              filePath: this.sanitizeStringData(filePath),
              fileSize: fileStats.size,
              processingStatus: 'COMPLETED',
              latexContent: latexContent,
              latexFilePath: this.sanitizeStringData(latexFilePath),
              zipFilePath: this.sanitizeStringData(zipFilePath),
              lastProcessedAt: new Date(),
              processingTimeMs: Date.now() - startTime
            }
          });
        } catch (dbError) {
          this.logger.error('Database error creating cache record:', dbError);
          // Continue without database update
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
              processingStatus: 'COMPLETED',
              lastProcessedAt: new Date(),
              processingTimeMs: Date.now() - startTime
            }
          });
        } catch (dbError) {
          this.logger.error('Database error updating cache record:', dbError);
          // Continue without database update
        }
      }

      const processingTime = Date.now() - startTime;
      this.logger.log(`✅ PDF processing completed in ${processingTime}ms`);

      return {
        success: true,
        latexContent: latexContent,
        latexFilePath: latexFilePath,
        zipFilePath: zipFilePath,
        processingTimeMs: processingTime,
        cacheId: cache?.id,
        message: 'PDF processed successfully with custom background options'
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error('❌ PDF processing failed:', error);
      
      return {
        success: false,
        error: error.message,
        processingTimeMs: processingTime
      };
    }
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
