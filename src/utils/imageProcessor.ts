import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

interface ImageOptions {
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

class ImageProcessor {
  private fullImagePath: string;
  private thumbImagePath: string;

  constructor() {
    this.fullImagePath = path.join(__dirname, '../../assets/full');
    this.thumbImagePath = path.join(__dirname, '../../assets/thumb');

    // Ensure directories exist
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.fullImagePath)) {
      fs.mkdirSync(this.fullImagePath, { recursive: true });
      console.log(`Created directory: ${this.fullImagePath}`);
    }
    if (!fs.existsSync(this.thumbImagePath)) {
      fs.mkdirSync(this.thumbImagePath, { recursive: true });
      console.log(`Created directory: ${this.thumbImagePath}`);
    }
  }

  /**
   * Process an image with given options
   * @param filename - Name of the image file
   * @param options - Processing options (width, height, fit)
   * @returns Path to the processed image
   */
  async processImage(filename: string, options: ImageOptions): Promise<string> {
    const { width, height, fit = 'cover' } = options;

    // Validate inputs
    if (!filename) {
      throw new Error('Filename is required');
    }

    if (!width && !height) {
      throw new Error('At least one dimension (width or height) must be provided');
    }

    // Additional validation for dimensions
    if (width !== undefined && (width <= 0 || !Number.isInteger(width))) {
      throw new Error('Width must be a positive integer');
    }

    if (height !== undefined && (height <= 0 || !Number.isInteger(height))) {
      throw new Error('Height must be a positive integer');
    }

    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const sourcePath = path.join(this.fullImagePath, sanitizedFilename);

    // Check if source image exists
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Image ${sanitizedFilename} not found`);
    }

    // Check if it's a file (not a directory)
    const stats = fs.statSync(sourcePath);
    if (!stats.isFile()) {
      throw new Error(`${sanitizedFilename} is not a valid image file`);
    }

    // Generate thumbnail filename
    const thumbFileName = this.generateThumbnailName(sanitizedFilename, width, height);
    const thumbPath = path.join(this.thumbImagePath, thumbFileName);

    // Check if thumbnail already exists
    if (fs.existsSync(thumbPath)) {
      console.log(`Cache hit: ${thumbFileName}`);
      return thumbPath;
    }

    console.log(`Cache miss: Processing ${sanitizedFilename}`);

    // Process the image
    try {
      let pipeline = sharp(sourcePath);

      if (width && height) {
        pipeline = pipeline.resize(width, height, { fit });
      } else if (width) {
        pipeline = pipeline.resize(width, null, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      } else if (height) {
        pipeline = pipeline.resize(null, height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      await pipeline.toFile(thumbPath);

      // Verify the file was created
      if (!fs.existsSync(thumbPath)) {
        const error = new Error('the file was not created');
        throw new Error('Failed to create thumbnail file', { cause: error });
      }

      return thumbPath;
    } catch (error) {
      // Clean up any partial file if it exists
      if (fs.existsSync(thumbPath)) {
        try {
          fs.unlinkSync(thumbPath);
        } catch (unlinkError) {
          console.error('Error cleaning up partial file:', unlinkError);
        }
      }
      throw new Error(`Failed to process image: ${error}`, { cause: error });
    }
  }

  /**
   * Generate a unique thumbnail filename based on original name and dimensions
   */
  private generateThumbnailName(filename: string, width?: number, height?: number): string {
    const parsed = path.parse(filename);
    const widthStr = width ? width.toString() : 'auto';
    const heightStr = height ? height.toString() : 'auto';
    return `${parsed.name}_${widthStr}x${heightStr}${parsed.ext}`;
  }

  /**
   * Get list of available images
   */
  getAvailableImages(): string[] {
    try {
      if (!fs.existsSync(this.fullImagePath)) {
        return [];
      }

      const files = fs.readdirSync(this.fullImagePath);
      return files.filter((file) => {
        const filePath = path.join(this.fullImagePath, file);
        // Check if it's a file and has an image extension
        const isFile = fs.statSync(filePath).isFile();
        const ext = path.extname(file).toLowerCase();
        const isValidImage = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        return isFile && isValidImage;
      });
    } catch (error) {
      console.error('Error reading images directory:', error);
      return [];
    }
  }

  /**
   * Clear thumbnail cache
   */
  clearCache(): void {
    try {
      if (fs.existsSync(this.thumbImagePath)) {
        const files = fs.readdirSync(this.thumbImagePath);
        files.forEach((file) => {
          const filePath = path.join(this.thumbImagePath, file);
          fs.unlinkSync(filePath);
        });
        console.log(`Cleared ${files.length} files from cache`);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw new Error('Failed to clear cache', { cause: error });
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { count: number; size: number } {
    try {
      if (!fs.existsSync(this.thumbImagePath)) {
        return { count: 0, size: 0 };
      }

      const files = fs.readdirSync(this.thumbImagePath);
      let totalSize = 0;

      files.forEach((file) => {
        const filePath = path.join(this.thumbImagePath, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      });

      return { count: files.length, size: totalSize };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { count: 0, size: 0 };
    }
  }
}

export default new ImageProcessor();
