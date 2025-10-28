import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AwsService } from '../aws/aws.service';
import { ConfigService } from '@nestjs/config';
import { ImageWatermarkRemoverService } from './image-watermark-remover.service';
import axios from 'axios';
import * as yauzl from 'yauzl';
import * as path from 'path';
import * as fs from 'fs';
import { Readable } from 'stream';

/**
 * Clean, focused service for Mathpix PDF processing
 * Handles both LaTeX and HTML conversion workflows
 */
@Injectable()
export class MathpixProcessorService {
  private readonly logger = new Logger(MathpixProcessorService.name);
  private readonly mathpixBaseUrl = 'https://api.mathpix.com/v3';
  private readonly mathpixAppId: string;
  private readonly mathpixAppKey: string;
  
  // Configuration for background processing (ignore page backgrounds)
  private readonly ignoreBackground = process.env.MATHPIX_IGNORE_BACKGROUND === 'true' || true; // Default to true
  
  // Configuration for watermark removal from images
  private readonly removeWatermarkFromImages = process.env.MATHPIX_REMOVE_WATERMARK === 'true' || true; // Default to true
  
  // Configuration for multi-color watermark removal (blue, red, green, yellow, etc.)
  private readonly removeAllColorWatermarks = process.env.MATHPIX_REMOVE_ALL_COLORS === 'true' || true; // Default to true for quality

  constructor(
    private readonly prisma: PrismaService,
    private readonly awsService: AwsService,
    private readonly configService: ConfigService,
    private readonly imageWatermarkRemover: ImageWatermarkRemoverService,
  ) {
    this.mathpixAppId = this.configService.get<string>('MATHPIX_APP_ID') || '';
    this.mathpixAppKey = this.configService.get<string>('MATHPIX_APP_KEY') || '';
    
    if (!this.mathpixAppId || !this.mathpixAppKey) {
      this.logger.warn('⚠️ Mathpix credentials not configured');
    }
    
    this.logger.log(`🎯 Background removal: ${this.ignoreBackground ? 'ENABLED' : 'DISABLED'}`);
    this.logger.log(`🖼️ Image watermark removal: ${this.removeWatermarkFromImages ? 'ENABLED' : 'DISABLED'}`);
    this.logger.log(`🌈 Multi-color watermark removal: ${this.removeAllColorWatermarks ? 'ENABLED' : 'DISABLED'}`);
  }

  /**
   * Process PDF with Mathpix to get LaTeX output
   * Used by: "Process Mathpix" and "Retry Mathpix" buttons
   */
  async processToLatex(cacheId: string): Promise<{
    success: boolean;
    pdfFilePath: string;
    latexFilePath: string;
    latexContent: string;
    zipFilePath: string;
  }> {
    this.logger.log(`🚀 Starting LaTeX processing for cache ID: ${cacheId}`);

    // 1. Get cache record
    const cache = await this.prisma.pDFProcessorCache.findUnique({
      where: { id: cacheId },
    });

    if (!cache) {
      throw new BadRequestException(`Cache record not found: ${cacheId}`);
    }

    if (!cache.fileName) {
      throw new BadRequestException(`Cache record has no fileName: ${cacheId}`);
    }

    // 2. Get local PDF file path
    const pdfPath = this.getLocalPdfPath(cache.fileName, cache.filePath);
    this.logger.log(`📄 Local PDF path: ${pdfPath}`);

    // 3. Upload PDF to AWS
    this.logger.log('📤 Step 1: Uploading PDF to AWS...');
    const pdfFilePath = await this.uploadPdfToAws(cache.fileName, pdfPath);
    this.logger.log(`✅ PDF uploaded: ${pdfFilePath}`);

    // 4. Send PDF to Mathpix API (using FormData multipart upload)
    this.logger.log('📤 Step 2: Sending PDF to Mathpix API...');
    const mathpixPdfId = await this.uploadToMathpix(pdfPath);
    this.logger.log(`✅ Mathpix PDF ID: ${mathpixPdfId}`);

    // 5. Wait for Mathpix processing
    this.logger.log('⏳ Step 3: Waiting for Mathpix processing...');
    await this.waitForMathpixProcessing(mathpixPdfId);
    this.logger.log('✅ Mathpix processing completed');

    // 6. Download LaTeX ZIP from Mathpix
    this.logger.log('📥 Step 4: Downloading LaTeX ZIP from Mathpix...');
    const zipBuffer = await this.downloadLatexZip(mathpixPdfId);
    this.logger.log(`✅ ZIP downloaded: ${zipBuffer.length} bytes`);

    // 7. Extract .tex file content from ZIP
    this.logger.log('📦 Step 5: Extracting .tex file from ZIP...');
    const latexContent = await this.extractTexFileFromZip(zipBuffer);
    this.logger.log(`✅ LaTeX content extracted: ${latexContent.length} characters`);

    // 8. Upload images from ZIP to AWS
    this.logger.log('🖼️ Step 6: Uploading images to AWS...');
    await this.extractAndUploadImages(zipBuffer, cache.fileName);
    this.logger.log('✅ Images uploaded to AWS');

    // 9. Upload .tex file to AWS
    this.logger.log('📤 Step 7: Uploading .tex file to AWS...');
    const latexFilePath = await this.uploadTexFileToAws(cache.fileName, latexContent);
    this.logger.log(`✅ LaTeX file uploaded: ${latexFilePath}`);

    // 10. Upload ZIP file to AWS
    this.logger.log('📤 Step 8: Uploading ZIP file to AWS...');
    const zipFilePath = await this.uploadZipToAws(cache.fileName, zipBuffer);
    this.logger.log(`✅ ZIP uploaded: ${zipFilePath}`);

    // 11. Update database
    this.logger.log('💾 Step 9: Updating database...');
    await this.prisma.pDFProcessorCache.update({
      where: { id: cacheId },
      data: {
        pdfFilePath,
        latexContent,
        latexFilePath,
        zipFilePath,
        lastProcessedAt: new Date(),
      },
    });
    this.logger.log('✅ Database updated successfully');

    return {
      success: true,
      pdfFilePath,
      latexFilePath,
      latexContent,
      zipFilePath,
    };
  }

  /**
   * Process PDF with Mathpix to get HTML output
   * Used by: "Process HTML" and "Retry HTML" buttons
   */
  async processToHtml(cacheId: string): Promise<{
    success: boolean;
    pdfFilePath: string;
    htmlFilePath: string;
    htmlContent: string;
    zipFilePath: string;
  }> {
    this.logger.log(`🚀 Starting HTML processing for cache ID: ${cacheId}`);

    // 1. Get cache record
    const cache = await this.prisma.pDFProcessorCache.findUnique({
      where: { id: cacheId },
    });

    if (!cache) {
      throw new BadRequestException(`Cache record not found: ${cacheId}`);
    }

    if (!cache.fileName) {
      throw new BadRequestException(`Cache record has no fileName: ${cacheId}`);
    }

    // 2. Get local PDF file path
    const pdfPath = this.getLocalPdfPath(cache.fileName, cache.filePath);
    this.logger.log(`📄 Local PDF path: ${pdfPath}`);

    // 3. Upload PDF to AWS
    this.logger.log('📤 Step 1: Uploading PDF to AWS...');
    const pdfFilePath = await this.uploadPdfToAws(cache.fileName, pdfPath);
    this.logger.log(`✅ PDF uploaded: ${pdfFilePath}`);

    // 4. Send PDF to Mathpix API (using FormData multipart upload)
    this.logger.log('📤 Step 2: Sending PDF to Mathpix API...');
    const mathpixPdfId = await this.uploadToMathpix(pdfPath);
    this.logger.log(`✅ Mathpix PDF ID: ${mathpixPdfId}`);

    // 5. Wait for Mathpix processing
    this.logger.log('⏳ Step 3: Waiting for Mathpix processing...');
    await this.waitForMathpixProcessing(mathpixPdfId);
    this.logger.log('✅ Mathpix processing completed');

    // 6. Download HTML ZIP from Mathpix
    this.logger.log('📥 Step 4: Downloading HTML ZIP from Mathpix...');
    const zipBuffer = await this.downloadHtmlZip(mathpixPdfId);
    this.logger.log(`✅ ZIP downloaded: ${zipBuffer.length} bytes`);

    // 7. Extract .html file content from ZIP
    this.logger.log('📦 Step 5: Extracting .html file from ZIP...');
    const htmlContent = await this.extractHtmlFileFromZip(zipBuffer);
    this.logger.log(`✅ HTML content extracted: ${htmlContent.length} characters`);

    // 8. Upload images from ZIP to AWS
    this.logger.log('🖼️ Step 6: Uploading images to AWS...');
    await this.extractAndUploadImages(zipBuffer, cache.fileName);
    this.logger.log('✅ Images uploaded to AWS');

    // 9. Upload .html file to AWS
    this.logger.log('📤 Step 7: Uploading .html file to AWS...');
    const htmlFilePath = await this.uploadHtmlFileToAws(cache.fileName, htmlContent);
    this.logger.log(`✅ HTML file uploaded: ${htmlFilePath}`);

    // 10. Upload ZIP file to AWS
    this.logger.log('📤 Step 8: Uploading ZIP file to AWS...');
    const zipFilePath = await this.uploadZipToAws(cache.fileName, zipBuffer);
    this.logger.log(`✅ ZIP uploaded: ${zipFilePath}`);

    // 11. Update database
    this.logger.log('💾 Step 9: Updating database...');
    await this.prisma.pDFProcessorCache.update({
      where: { id: cacheId },
      data: {
        pdfFilePath,
        htmlContent,
        htmlFilePath,
        zipFilePath,
        lastProcessedAt: new Date(),
      },
    });
    this.logger.log('✅ Database updated successfully');

    return {
      success: true,
      pdfFilePath,
      htmlFilePath,
      htmlContent,
      zipFilePath,
    };
  }

  // ==================== HELPER METHODS ====================

  /**
   * Get local PDF file path
   */
  private getLocalPdfPath(fileName: string, filePath?: string): string {
    this.logger.log(`🔍 Looking for PDF file: ${fileName}`);
    this.logger.log(`📂 Received filePath: ${filePath || 'not provided'}`);
    this.logger.log(`📂 Current working directory: ${process.cwd()}`);
    
    // If filePath is provided (relative path like "content\JEE\Previous Papers\...")
    if (filePath) {
      // Try as absolute path first (if it's already absolute)
      if (fs.existsSync(filePath)) {
        this.logger.log(`✅ Found at provided path: ${filePath}`);
        return filePath;
      }

      // Try constructing absolute path from project root
      // filePath is like: content\JEE\Previous Papers\2022\Session2\file.pdf
      const absoluteFromRoot = path.join(process.cwd(), '..', filePath);
      this.logger.log(`📂 Trying absolute from root: ${absoluteFromRoot}`);
      if (fs.existsSync(absoluteFromRoot)) {
        this.logger.log(`✅ Found at: ${absoluteFromRoot}`);
        return absoluteFromRoot;
      }

      // Try with forward slashes (Windows compatibility)
      const normalizedPath = filePath.replace(/\\/g, '/');
      const absoluteNormalized = path.join(process.cwd(), '..', normalizedPath);
      this.logger.log(`📂 Trying normalized path: ${absoluteNormalized}`);
      if (fs.existsSync(absoluteNormalized)) {
        this.logger.log(`✅ Found at: ${absoluteNormalized}`);
        return absoluteNormalized;
      }
    }

    // Fallback: Try content folder with just fileName
    const contentPath = path.join(process.cwd(), '..', 'content', fileName);
    this.logger.log(`📂 Trying content folder with fileName: ${contentPath}`);
    if (fs.existsSync(contentPath)) {
      this.logger.log(`✅ Found in content folder: ${contentPath}`);
      return contentPath;
    }

    this.logger.error(`❌ PDF file not found in any location`);
    this.logger.error(`   - Tried filePath: ${filePath || 'N/A'}`);
    this.logger.error(`   - Tried fileName: ${fileName}`);
    throw new BadRequestException(`PDF file not found: ${fileName}`);
  }

  /**
   * Upload PDF to AWS
   */
  private async uploadPdfToAws(fileName: string, pdfPath: string): Promise<string> {
    const pdfBuffer = fs.readFileSync(pdfPath);
    const sanitizedFileName = this.sanitizeFileName(fileName);
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: sanitizedFileName,
      encoding: '7bit',
      mimetype: 'application/pdf',
      buffer: pdfBuffer,
      size: pdfBuffer.length,
      stream: Readable.from(pdfBuffer),
      destination: '',
      filename: sanitizedFileName,
      path: '',
    };

    return await this.awsService.uploadFileWithCustomName(mockFile, 'content/pdf', sanitizedFileName);
  }

  /**
   * Upload PDF to Mathpix API using FormData multipart upload
   */
  private async uploadToMathpix(pdfPath: string): Promise<string> {
    this.logger.log(`📤 Uploading to Mathpix API: ${this.mathpixBaseUrl}/pdf`);

    try {
      const pdfBuffer = fs.readFileSync(pdfPath);
      
      // Create FormData for multipart upload (same as working mathpix.service.ts)
      const FormData = require('form-data');
      const form = new FormData();
      form.append('file', pdfBuffer, {
        filename: path.basename(pdfPath),
        contentType: 'application/pdf'
      });

      // Add Mathpix processing options to ignore background
      if (this.ignoreBackground) {
        form.append('skip_recrop', 'true');
        this.logger.log('🎯 Background processing: skip_recrop enabled to ignore page backgrounds');
      }

      const response = await axios.post(`${this.mathpixBaseUrl}/pdf`, form, {
        headers: {
          'app_id': this.mathpixAppId,
          'app_key': this.mathpixAppKey,
          ...form.getHeaders()
        },
        timeout: 60000
      });

      this.logger.log(`✅ Mathpix API Response Status: ${response.status}`);
      this.logger.log(`📦 Mathpix API Response Data: ${JSON.stringify(response.data)}`);

      const data = response.data;
      
      // Check if there's an error in the response
      if (data.error) {
        this.logger.error(`❌ Mathpix API error: ${data.error} - ${data.error_info?.message || 'Unknown error'}`);
        throw new BadRequestException(`Mathpix API error: ${data.error}`);
      }

      if (!data.pdf_id) {
        this.logger.error(`❌ No pdf_id in response! Full response: ${JSON.stringify(data)}`);
        throw new BadRequestException('Mathpix API did not return a pdf_id');
      }

      return data.pdf_id;
    } catch (error) {
      this.logger.error(`❌ Mathpix API Error: ${error.message}`);
      if (error.response) {
        this.logger.error(`   Status: ${error.response.status}`);
        this.logger.error(`   Data: ${JSON.stringify(error.response.data)}`);
      }
      throw new BadRequestException(`Failed to upload PDF to Mathpix: ${error.message}`);
    }
  }

  /**
   * Wait for Mathpix processing to complete
   */
  private async waitForMathpixProcessing(pdfId: string): Promise<void> {
    if (!pdfId || pdfId === 'undefined') {
      this.logger.error('❌ Invalid pdfId provided to waitForMathpixProcessing');
      throw new BadRequestException('Invalid Mathpix PDF ID');
    }

    const maxAttempts = 60;
    const delayMs = 5000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${this.mathpixBaseUrl}/pdf/${pdfId}`, {
          headers: {
            app_id: this.mathpixAppId,
            app_key: this.mathpixAppKey,
          },
        });

        const status = response.data.status;
        this.logger.log(`⏳ Attempt ${attempt}/${maxAttempts}: Status = ${status}`);

        if (status === 'completed') {
          return;
        }

        if (status === 'error') {
          throw new Error(`Mathpix processing failed: ${response.data.error}`);
        }

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      } catch (error) {
        this.logger.error(`❌ Error checking Mathpix status: ${error.message}`);
        if (attempt === maxAttempts) {
          throw error;
        }
        // Continue to next attempt
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw new Error('Mathpix processing timeout');
  }

  /**
   * Download LaTeX ZIP from Mathpix
   */
  private async downloadLatexZip(pdfId: string): Promise<Buffer> {
    const response = await axios.get(`${this.mathpixBaseUrl}/pdf/${pdfId}.tex`, {
      headers: {
        app_id: this.mathpixAppId,
        app_key: this.mathpixAppKey,
      },
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  }

  /**
   * Download HTML ZIP from Mathpix
   */
  private async downloadHtmlZip(pdfId: string): Promise<Buffer> {
    const response = await axios.get(`${this.mathpixBaseUrl}/pdf/${pdfId}.html`, {
      headers: {
        app_id: this.mathpixAppId,
        app_key: this.mathpixAppKey,
      },
      responseType: 'arraybuffer',
    });

    return Buffer.from(response.data);
  }

  /**
   * Extract .tex file content from ZIP buffer
   */
  private async extractTexFileFromZip(zipBuffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(new Error(`Failed to open ZIP: ${err.message}`));
          return;
        }

        if (!zipfile) {
          reject(new Error('Failed to create ZIP file object'));
          return;
        }

        let texContent = '';
        let foundTexFile = false;

        zipfile.readEntry();

        zipfile.on('entry', (entry) => {
          this.logger.log(`📦 ZIP Entry: ${entry.fileName}`);

          // Look for .tex file (case-insensitive)
          if (entry.fileName.toLowerCase().endsWith('.tex')) {
            this.logger.log(`✅ Found .tex file: ${entry.fileName}`);
            foundTexFile = true;

            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                reject(err);
                return;
              }

              const chunks: Buffer[] = [];
              readStream.on('data', (chunk) => chunks.push(chunk));
              readStream.on('end', () => {
                texContent = Buffer.concat(chunks).toString('utf8');
                this.logger.log(`✅ Extracted .tex content: ${texContent.length} characters`);
                resolve(texContent);
              });
              readStream.on('error', reject);
            });
          } else {
            // Continue reading next entry
            zipfile.readEntry();
          }
        });

        zipfile.on('end', () => {
          if (!foundTexFile) {
            reject(new Error('No .tex file found in ZIP'));
          }
        });

        zipfile.on('error', reject);
      });
    });
  }

  /**
   * Extract .html file content from ZIP buffer
   */
  private async extractHtmlFileFromZip(zipBuffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(new Error(`Failed to open ZIP: ${err.message}`));
          return;
        }

        if (!zipfile) {
          reject(new Error('Failed to create ZIP file object'));
          return;
        }

        let htmlContent = '';
        let foundHtmlFile = false;

        zipfile.readEntry();

        zipfile.on('entry', (entry) => {
          this.logger.log(`📦 ZIP Entry: ${entry.fileName}`);

          // Look for .html file (case-insensitive)
          if (entry.fileName.toLowerCase().endsWith('.html')) {
            this.logger.log(`✅ Found .html file: ${entry.fileName}`);
            foundHtmlFile = true;

            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                reject(err);
                return;
              }

              const chunks: Buffer[] = [];
              readStream.on('data', (chunk) => chunks.push(chunk));
              readStream.on('end', () => {
                htmlContent = Buffer.concat(chunks).toString('utf8');
                this.logger.log(`✅ Extracted .html content: ${htmlContent.length} characters`);
                resolve(htmlContent);
              });
              readStream.on('error', reject);
            });
          } else {
            // Continue reading next entry
            zipfile.readEntry();
          }
        });

        zipfile.on('end', () => {
          if (!foundHtmlFile) {
            reject(new Error('No .html file found in ZIP'));
          }
        });

        zipfile.on('error', reject);
      });
    });
  }

  /**
   * Extract and upload all images from ZIP to AWS
   */
  private async extractAndUploadImages(zipBuffer: Buffer, originalFileName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      yauzl.fromBuffer(zipBuffer, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(new Error(`Failed to open ZIP: ${err.message}`));
          return;
        }

        if (!zipfile) {
          reject(new Error('Failed to create ZIP file object'));
          return;
        }

        const imagePromises: Promise<void>[] = [];
        let totalEntries = 0;
        let processedEntries = 0;

        zipfile.readEntry();

        zipfile.on('entry', (entry) => {
          totalEntries++;

          // Check if it's an image file
          if (this.isImageFile(entry.fileName)) {
            this.logger.log(`🖼️ Found image: ${entry.fileName}`);

            const imagePromise = new Promise<void>((resolveImage, rejectImage) => {
              zipfile.openReadStream(entry, (err, readStream) => {
                if (err) {
                  rejectImage(err);
                  return;
                }

                const chunks: Buffer[] = [];
                readStream.on('data', (chunk) => chunks.push(chunk));
                readStream.on('end', async () => {
                  try {
                    const imageBuffer = Buffer.concat(chunks);
                    await this.uploadImageToAws(imageBuffer, entry.fileName, originalFileName);
                    resolveImage();
                  } catch (error) {
                    rejectImage(error);
                  }
                });
                readStream.on('error', rejectImage);
              });
            });

            imagePromises.push(imagePromise);
          }

          processedEntries++;
          zipfile.readEntry();
        });

        zipfile.on('end', async () => {
          try {
            await Promise.all(imagePromises);
            this.logger.log(`✅ Uploaded ${imagePromises.length} images to AWS`);
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        zipfile.on('error', reject);
      });
    });
  }

  /**
   * Check if file is an image
   */
  private isImageFile(fileName: string): boolean {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp'];
    const ext = path.extname(fileName).toLowerCase();
    return imageExtensions.includes(ext);
  }

  /**
   * Upload image to AWS (with optional watermark removal)
   */
  private async uploadImageToAws(
    imageBuffer: Buffer,
    fileName: string,
    originalPdfFileName: string,
  ): Promise<string> {
    const imageName = path.basename(fileName);
    const pdfBaseName = path.basename(originalPdfFileName, path.extname(originalPdfFileName));
    const sanitizedPdfName = this.sanitizeFileName(pdfBaseName);

    let processedImageBuffer = imageBuffer;

    // Apply watermark removal if enabled
    if (this.removeWatermarkFromImages) {
      try {
        this.logger.log(`🧹 Removing watermarks from image: ${imageName}`);
        
        // Save image temporarily
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const tempImagePath = path.join(tempDir, `temp_${Date.now()}_${imageName}`);
        fs.writeFileSync(tempImagePath, imageBuffer);

        // Remove watermarks and background tints
        let cleanedImagePath: string;
        if (this.removeAllColorWatermarks) {
          this.logger.log('🌈 Applying multi-color watermark removal...');
          cleanedImagePath = await this.imageWatermarkRemover.removeAnyColorWatermark(tempImagePath);
        } else {
          this.logger.log('🔵 Applying blue watermark removal...');
          cleanedImagePath = await this.imageWatermarkRemover.removeBlueWatermark(tempImagePath);
        }

        // Additional step: Remove background tints for better results
        this.logger.log('🎨 Removing background tints...');
        const finalCleanedPath = await this.imageWatermarkRemover.removeBackgroundTints(cleanedImagePath);
        
        // Update the cleaned image path to use the final result
        cleanedImagePath = finalCleanedPath;

        // Read cleaned image
        processedImageBuffer = fs.readFileSync(cleanedImagePath);
        this.logger.log(`✅ Watermark removed successfully from ${imageName}`);

        // Cleanup temp files
        try {
          fs.unlinkSync(tempImagePath);
          fs.unlinkSync(cleanedImagePath);
        } catch (cleanupError) {
          this.logger.warn(`⚠️ Failed to cleanup temp files: ${cleanupError.message}`);
        }
      } catch (watermarkError) {
        this.logger.warn(`⚠️ Watermark removal failed for ${imageName}, using original: ${watermarkError.message}`);
        // Continue with original image if watermark removal fails
      }
    }

    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: imageName,
      encoding: '7bit',
      mimetype: this.getMimeType(imageName),
      buffer: processedImageBuffer,
      size: processedImageBuffer.length,
      stream: Readable.from(processedImageBuffer),
      destination: '',
      filename: imageName,
      path: '',
    };

    const awsUrl = await this.awsService.uploadFileWithCustomName(
      mockFile,
      `content/images/${sanitizedPdfName}`,
      imageName,
    );

    this.logger.log(`✅ Image uploaded: ${awsUrl}`);
    return awsUrl;
  }

  /**
   * Upload .tex file to AWS
   */
  private async uploadTexFileToAws(pdfFileName: string, texContent: string): Promise<string> {
    // Generate LaTeX file name (replace .pdf with .tex) and sanitize it
    const originalLatexFileName = pdfFileName.replace(/\.pdf$/i, '.tex');
    const texFileName = this.sanitizeFileName(originalLatexFileName);
    const texBuffer = Buffer.from(texContent, 'utf8');
    
    this.logger.log(`📤 Uploading LaTeX content to AWS: ${texFileName}`);

    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: texFileName,
      encoding: '7bit',
      mimetype: 'text/plain',
      buffer: texBuffer,
      size: texBuffer.length,
      stream: Readable.from(texBuffer),
      destination: '',
      filename: texFileName,
      path: '',
    };

    return await this.awsService.uploadFileWithCustomName(mockFile, 'content/latex', texFileName);
  }

  /**
   * Upload .html file to AWS
   */
  private async uploadHtmlFileToAws(pdfFileName: string, htmlContent: string): Promise<string> {
    // Sanitize filename for HTML
    const originalHtmlFileName = pdfFileName.replace(/\.pdf$/i, '.html');
    const htmlFileName = this.sanitizeFileName(originalHtmlFileName);
    const htmlBuffer = Buffer.from(htmlContent, 'utf8');
    
    this.logger.log(`📤 Uploading HTML content to AWS: ${htmlFileName}`);

    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: htmlFileName,
      encoding: '7bit',
      mimetype: 'text/html',
      buffer: htmlBuffer,
      size: htmlBuffer.length,
      stream: Readable.from(htmlBuffer),
      destination: '',
      filename: htmlFileName,
      path: '',
    };

    return await this.awsService.uploadFileWithCustomName(mockFile, 'content/html', htmlFileName);
  }

  /**
   * Upload ZIP file to AWS
   */
  private async uploadZipToAws(pdfFileName: string, zipBuffer: Buffer): Promise<string> {
    // Generate ZIP file name (replace .pdf with .zip) and sanitize it
    const originalZipFileName = pdfFileName.replace(/\.pdf$/i, '.zip');
    const zipFileName = this.sanitizeFileName(originalZipFileName);
    
    this.logger.log(`📤 Uploading ZIP file to AWS: ${zipFileName}`);

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
      path: '',
    };

    return await this.awsService.uploadFileWithCustomName(mockFile, 'content/zip', zipFileName);
  }

  /**
   * Sanitize filename to remove special characters, spaces, and ensure URL-safe naming
   */
  private sanitizeFileName(fileName: string): string {
    if (!fileName) return fileName;
    
    try {
      // Extract base name and extension
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
   * Get MIME type for file
   */
  private getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.svg': 'image/svg+xml',
      '.webp': 'image/webp',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
