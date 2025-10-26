import { Injectable, Logger } from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ImageWatermarkRemoverService {
  private readonly logger = new Logger(ImageWatermarkRemoverService.name);

  /**
   * Remove blue watermark from image
   * This removes semi-transparent blue overlays like "ALLEN" watermarks
   */
  async removeBlueWatermark(imagePath: string): Promise<string> {
    try {
      this.logger.log(`Processing image to remove watermark: ${imagePath}`);

      // Read the image
      const imageBuffer = fs.readFileSync(imagePath);
      const image = sharp(imageBuffer);
      const metadata = await image.metadata();

      // Get raw pixel data
      const { data, info } = await image
        .raw()
        .toBuffer({ resolveWithObject: true });

      // Process pixels to remove blue tint
      const processedData = this.removeBlueOverlay(data, info.channels);

      // Create output path
      const ext = path.extname(imagePath);
      const baseName = path.basename(imagePath, ext);
      const dirName = path.dirname(imagePath);
      const outputPath = path.join(dirName, `${baseName}_cleaned${ext}`);

      // Save processed image
      await sharp(processedData, {
        raw: {
          width: info.width,
          height: info.height,
          channels: info.channels,
        },
      })
        .toFile(outputPath);

      this.logger.log(`✅ Watermark removed: ${outputPath}`);
      return outputPath;
    } catch (error) {
      this.logger.error(`Failed to remove watermark from ${imagePath}:`, error);
      throw error;
    }
  }

  /**
   * Remove blue overlay from pixel data
   */
  private removeBlueOverlay(data: Buffer, channels: number): Buffer {
    const processedData = Buffer.from(data);

    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Detect blue tint (blue channel is significantly higher than red/green)
      // Typical ALLEN watermark: semi-transparent blue overlay
      if (b > r + 30 && b > g + 30 && b > 150) {
        // This pixel is likely part of the blue watermark
        // Reduce blue channel and increase red/green to neutralize
        const avgRG = (r + g) / 2;
        processedData[i] = Math.min(255, r + 20); // Slightly increase red
        processedData[i + 1] = Math.min(255, g + 20); // Slightly increase green
        processedData[i + 2] = Math.min(255, avgRG); // Reduce blue to average of R/G
      }
    }

    return processedData;
  }

  /**
   * Remove any colored watermark overlay (multi-color support)
   */
  async removeAnyColorWatermark(imagePath: string): Promise<string> {
    try {
      this.logger.log(`Processing image to remove any colored watermark: ${imagePath}`);

      const imageBuffer = fs.readFileSync(imagePath);
      const image = sharp(imageBuffer);

      const { data, info } = await image
        .raw()
        .toBuffer({ resolveWithObject: true });

      const processedData = this.removeAllColoredOverlays(data, info.channels);

      const ext = path.extname(imagePath);
      const baseName = path.basename(imagePath, ext);
      const dirName = path.dirname(imagePath);
      const outputPath = path.join(dirName, `${baseName}_cleaned${ext}`);

      await sharp(processedData, {
        raw: {
          width: info.width,
          height: info.height,
          channels: info.channels,
        },
      }).toFile(outputPath);

      this.logger.log(`✅ Multi-color watermark removed: ${outputPath}`);
      return outputPath;
    } catch (error) {
      this.logger.error(`Failed to remove multi-color watermark:`, error);
      throw error;
    }
  }

  /**
   * Remove all colored overlays (blue, red, green, yellow, etc.)
   */
  private removeAllColoredOverlays(data: Buffer, channels: number): Buffer {
    const processedData = Buffer.from(data);

    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      let isWatermark = false;
      let neutralR = r;
      let neutralG = g;
      let neutralB = b;

      // Detect BLUE watermark (ALLEN, etc.)
      if (b > r + 30 && b > g + 30 && b > 150) {
        isWatermark = true;
        const avgRG = (r + g) / 2;
        neutralR = Math.min(255, r + 20);
        neutralG = Math.min(255, g + 20);
        neutralB = Math.min(255, avgRG);
      }
      // Detect RED watermark
      else if (r > g + 30 && r > b + 30 && r > 150) {
        isWatermark = true;
        const avgGB = (g + b) / 2;
        neutralR = Math.min(255, avgGB);
        neutralG = Math.min(255, g + 20);
        neutralB = Math.min(255, b + 20);
      }
      // Detect GREEN watermark
      else if (g > r + 30 && g > b + 30 && g > 150) {
        isWatermark = true;
        const avgRB = (r + b) / 2;
        neutralR = Math.min(255, r + 20);
        neutralG = Math.min(255, avgRB);
        neutralB = Math.min(255, b + 20);
      }
      // Detect YELLOW watermark (high red + green, low blue)
      else if (r > 150 && g > 150 && b < 100 && Math.abs(r - g) < 50) {
        isWatermark = true;
        const avg = (r + g + b) / 3;
        neutralR = Math.min(255, avg + 30);
        neutralG = Math.min(255, avg + 30);
        neutralB = Math.min(255, avg + 30);
      }
      // Detect CYAN watermark (high green + blue, low red)
      else if (g > 150 && b > 150 && r < 100 && Math.abs(g - b) < 50) {
        isWatermark = true;
        const avg = (r + g + b) / 3;
        neutralR = Math.min(255, avg + 30);
        neutralG = Math.min(255, avg + 30);
        neutralB = Math.min(255, avg + 30);
      }
      // Detect MAGENTA watermark (high red + blue, low green)
      else if (r > 150 && b > 150 && g < 100 && Math.abs(r - b) < 50) {
        isWatermark = true;
        const avg = (r + g + b) / 3;
        neutralR = Math.min(255, avg + 30);
        neutralG = Math.min(255, avg + 30);
        neutralB = Math.min(255, avg + 30);
      }
      // Enhanced detection for LIGHT YELLOW/BEIGE backgrounds (like in your screenshot)
      else if (this.isLightBackgroundTint(r, g, b)) {
        isWatermark = true;
        // Convert to pure white or very light gray
        const brightness = Math.max(r, g, b);
        if (brightness > 200) {
          // Very light background - make it pure white
          neutralR = 255;
          neutralG = 255;
          neutralB = 255;
        } else {
          // Light tint - neutralize to light gray
          const avg = (r + g + b) / 3;
          neutralR = Math.min(255, avg + 40);
          neutralG = Math.min(255, avg + 40);
          neutralB = Math.min(255, avg + 40);
        }
      }
      // Detect SEMI-TRANSPARENT overlays (any color with similar RGB but biased)
      else if (r > 120 || g > 120 || b > 120) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;

        // If one channel is significantly higher, it's likely a colored overlay
        if (diff > 40 && max > 160) {
          isWatermark = true;
          const avg = (r + g + b) / 3;
          neutralR = Math.min(255, avg + 20);
          neutralG = Math.min(255, avg + 20);
          neutralB = Math.min(255, avg + 20);
        }
      }

      if (isWatermark) {
        processedData[i] = neutralR;
        processedData[i + 1] = neutralG;
        processedData[i + 2] = neutralB;
      }
    }

    return processedData;
  }

  /**
   * Detect light background tints (yellow, beige, cream, etc.)
   * This handles the specific case shown in your screenshot
   */
  private isLightBackgroundTint(r: number, g: number, b: number): boolean {
    // Check for light yellow/beige tints
    const isLightYellow = r > 200 && g > 200 && b < 180 && Math.abs(r - g) < 30;
    const isLightBeige = r > 180 && g > 180 && b > 150 && r > b + 20 && g > b + 20;
    const isLightCream = r > 220 && g > 220 && b > 200 && Math.abs(r - g) < 20 && Math.abs(g - b) < 30;
    
    // Check for very light tints with subtle color bias
    const isVeryLightTint = (r > 200 || g > 200 || b > 200) && 
                           Math.abs(r - g) < 40 && 
                           Math.abs(g - b) < 40 && 
                           Math.abs(r - b) < 40;
    
    return isLightYellow || isLightBeige || isLightCream || isVeryLightTint;
  }

  /**
   * Remove watermark from all images in a directory
   */
  async processImagesInDirectory(directoryPath: string): Promise<{
    processed: number;
    failed: number;
    cleanedImages: string[];
  }> {
    try {
      this.logger.log(`Processing all images in directory: ${directoryPath}`);

      if (!fs.existsSync(directoryPath)) {
        throw new Error(`Directory does not exist: ${directoryPath}`);
      }

      const files = fs.readdirSync(directoryPath);
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.tif'];
      
      const imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return imageExtensions.includes(ext) && !file.includes('_cleaned');
      });

      let processed = 0;
      let failed = 0;
      const cleanedImages: string[] = [];

      for (const imageFile of imageFiles) {
        try {
          const imagePath = path.join(directoryPath, imageFile);
          const cleanedPath = await this.removeBlueWatermark(imagePath);
          cleanedImages.push(cleanedPath);
          processed++;
        } catch (error) {
          this.logger.error(`Failed to process ${imageFile}:`, error);
          failed++;
        }
      }

      this.logger.log(`✅ Processed ${processed} images, ${failed} failed`);

      return {
        processed,
        failed,
        cleanedImages,
      };
    } catch (error) {
      this.logger.error('Error processing images in directory:', error);
      throw error;
    }
  }

  /**
   * Replace original images with cleaned versions
   */
  async replaceOriginalImages(directoryPath: string): Promise<void> {
    try {
      const files = fs.readdirSync(directoryPath);
      const cleanedFiles = files.filter(file => file.includes('_cleaned'));

      for (const cleanedFile of cleanedFiles) {
        const cleanedPath = path.join(directoryPath, cleanedFile);
        const originalName = cleanedFile.replace('_cleaned', '');
        const originalPath = path.join(directoryPath, originalName);

        // Backup original
        const backupPath = path.join(directoryPath, `${originalName}.backup`);
        if (fs.existsSync(originalPath)) {
          fs.renameSync(originalPath, backupPath);
        }

        // Replace with cleaned version
        fs.renameSync(cleanedPath, originalPath);
        this.logger.log(`✅ Replaced ${originalName} with cleaned version`);
      }
    } catch (error) {
      this.logger.error('Error replacing original images:', error);
      throw error;
    }
  }

  /**
   * Advanced watermark removal using color threshold
   */
  async removeWatermarkAdvanced(
    imagePath: string,
    options?: {
      colorThreshold?: { r: number; g: number; b: number };
      tolerance?: number;
    }
  ): Promise<string> {
    try {
      const imageBuffer = fs.readFileSync(imagePath);
      const image = sharp(imageBuffer);

      // Default: Remove blue colors (ALLEN watermark is typically blue)
      const threshold = options?.colorThreshold || { r: 100, g: 100, b: 200 };
      const tolerance = options?.tolerance || 50;

      const { data, info } = await image
        .raw()
        .toBuffer({ resolveWithObject: true });

      const processedData = Buffer.from(data);

      for (let i = 0; i < data.length; i += info.channels) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if pixel matches watermark color
        const isWatermark =
          Math.abs(b - threshold.b) < tolerance &&
          b > r + 30 &&
          b > g + 30;

        if (isWatermark) {
          // Make watermark pixels more neutral (white/gray)
          const brightness = (r + g + b) / 3;
          processedData[i] = Math.min(255, brightness + 30);
          processedData[i + 1] = Math.min(255, brightness + 30);
          processedData[i + 2] = Math.min(255, brightness + 30);
        }
      }

      const ext = path.extname(imagePath);
      const baseName = path.basename(imagePath, ext);
      const dirName = path.dirname(imagePath);
      const outputPath = path.join(dirName, `${baseName}_cleaned${ext}`);

      await sharp(processedData, {
        raw: {
          width: info.width,
          height: info.height,
          channels: info.channels,
        },
      }).toFile(outputPath);

      this.logger.log(`✅ Advanced watermark removal completed: ${outputPath}`);
      return outputPath;
    } catch (error) {
      this.logger.error('Advanced watermark removal failed:', error);
      throw error;
    }
  }

  /**
   * Remove background tints and make them pure white
   * Specifically designed for circuit diagrams and technical images
   */
  async removeBackgroundTints(imagePath: string): Promise<string> {
    try {
      this.logger.log(`Removing background tints from: ${imagePath}`);

      const imageBuffer = fs.readFileSync(imagePath);
      const image = sharp(imageBuffer);

      const { data, info } = await image
        .raw()
        .toBuffer({ resolveWithObject: true });

      const processedData = this.removeBackgroundTintsFromPixels(data, info.channels);

      const ext = path.extname(imagePath);
      const baseName = path.basename(imagePath, ext);
      const dirName = path.dirname(imagePath);
      const outputPath = path.join(dirName, `${baseName}_background_removed${ext}`);

      await sharp(processedData, {
        raw: {
          width: info.width,
          height: info.height,
          channels: info.channels,
        },
      }).toFile(outputPath);

      this.logger.log(`✅ Background tints removed: ${outputPath}`);
      return outputPath;
    } catch (error) {
      this.logger.error('Background tint removal failed:', error);
      throw error;
    }
  }

  /**
   * Remove background tints from pixel data
   */
  private removeBackgroundTintsFromPixels(data: Buffer, channels: number): Buffer {
    const processedData = Buffer.from(data);

    for (let i = 0; i < data.length; i += channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Check if this is a background pixel (light tint)
      if (this.isBackgroundTint(r, g, b)) {
        // Convert to pure white
        processedData[i] = 255;
        processedData[i + 1] = 255;
        processedData[i + 2] = 255;
      }
    }

    return processedData;
  }

  /**
   * Detect if a pixel is a background tint that should be removed
   */
  private isBackgroundTint(r: number, g: number, b: number): boolean {
    // Very light pixels that are likely background
    const isVeryLight = r > 240 && g > 240 && b > 240;
    
    // Light yellow/beige tints
    const isLightTint = (r > 200 && g > 200 && b < 200) || 
                      (r > 180 && g > 180 && b > 150 && r > b + 10 && g > b + 10);
    
    // Cream/off-white tints
    const isCreamTint = r > 220 && g > 220 && b > 200 && 
                       Math.abs(r - g) < 30 && Math.abs(g - b) < 40;
    
    return isVeryLight || isLightTint || isCreamTint;
  }
}
