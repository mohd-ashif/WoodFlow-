import crypto from 'crypto';
import path from 'path';
import { BadRequestError } from './errors.js';
import { UploadedFile } from './storage.js';

export interface ImageDimensions {
  width?: number;
  height?: number;
}

export class ImageValidator {
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly MAX_WIDTH = 4096;
  private static readonly MAX_HEIGHT = 4096;
  private static readonly MAX_PIXELS = 16 * 1024 * 1024; // 16 Megapixels

  private static readonly ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
  private static readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * Validate image file size, extension, MIME type, magic bytes, and dimensions
   */
  public static validateImage(file: UploadedFile): { checksum: string; dimensions?: ImageDimensions } {
    if (!file || !file.data) {
      throw new BadRequestError('No image file data provided');
    }

    // 1. File Size Check
    if (file.size > this.MAX_FILE_SIZE || file.data.length > this.MAX_FILE_SIZE) {
      throw new BadRequestError('File size exceeds the 5 MB limit');
    }

    // 2. Extension Check
    const ext = path.extname(file.name).toLowerCase();
    if (!this.ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestError(`Invalid file extension '${ext}'. Allowed extensions: JPG, JPEG, PNG, WEBP`);
    }

    // 3. MIME Type Check
    if (!this.ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
      throw new BadRequestError(`Invalid MIME type '${file.mimetype}'. Allowed types: image/jpeg, image/png, image/webp`);
    }

    // 4. Executable / Dangerous pattern check
    const dangerousPattern = /\.(exe|bat|sh|js|ts|html|php|py|pl|cgi|jar|cmd|vbs|svg|gif)$/i;
    if (dangerousPattern.test(file.name)) {
      throw new BadRequestError('Forbidden file upload format');
    }

    // 5. Binary Magic Bytes Inspection
    const buffer = file.data;
    if (buffer.length < 12) {
      throw new BadRequestError('File content too small to be a valid image');
    }

    const detectedType = this.detectMagicBytes(buffer);
    if (!detectedType) {
      throw new BadRequestError('Image validation failed: File binary header does not match valid JPEG, PNG, or WEBP magic bytes');
    }

    // 6. Dimension Extraction & Bomb Protection
    const dimensions = this.extractDimensions(buffer, detectedType);
    if (dimensions) {
      if (dimensions.width && dimensions.width > this.MAX_WIDTH) {
        throw new BadRequestError(`Image width (${dimensions.width}px) exceeds max allowed width (${this.MAX_WIDTH}px)`);
      }
      if (dimensions.height && dimensions.height > this.MAX_HEIGHT) {
        throw new BadRequestError(`Image height (${dimensions.height}px) exceeds max allowed height (${this.MAX_HEIGHT}px)`);
      }
      if (dimensions.width && dimensions.height && dimensions.width * dimensions.height > this.MAX_PIXELS) {
        throw new BadRequestError('Image total resolution exceeds maximum allowed 16 Megapixel limit');
      }
    }

    // 7. Compute SHA-256 checksum for idempotency
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');

    return { checksum, dimensions: dimensions || undefined };
  }

  /**
   * Inspect binary header magic bytes
   */
  private static detectMagicBytes(buffer: Buffer): 'jpeg' | 'png' | 'webp' | null {
    // JPEG: FF D8 FF
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
      return 'jpeg';
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4E &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0D &&
      buffer[5] === 0x0A &&
      buffer[6] === 0x1A &&
      buffer[7] === 0x0A
    ) {
      return 'png';
    }

    // WEBP: "RIFF" .... "WEBP"
    if (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      return 'webp';
    }

    return null;
  }

  /**
   * Extract basic dimensions without heavy third-party native dependencies
   */
  private static extractDimensions(buffer: Buffer, type: 'jpeg' | 'png' | 'webp'): ImageDimensions | null {
    try {
      if (type === 'png' && buffer.length >= 24) {
        // PNG dimensions are at offset 16 (width) and 20 (height) in Big Endian
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        return { width, height };
      }

      if (type === 'jpeg') {
        let i = 2;
        while (i < buffer.length) {
          if (buffer[i] !== 0xFF) break;
          const marker = buffer[i + 1];
          // SOF0 (0xC0) to SOF3 (0xC3) or SOF5 (0xC5) to SOF15 (0xCF) except DHT (0xC4) / JPG (0xC8)
          if ((marker >= 0xC0 && marker <= 0xC3) || (marker >= 0xC5 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8)) {
            if (i + 8 < buffer.length) {
              const height = buffer.readUInt16BE(i + 5);
              const width = buffer.readUInt16BE(i + 7);
              return { width, height };
            }
          }
          const length = buffer.readUInt16BE(i + 2);
          i += 2 + length;
        }
      }

      if (type === 'webp' && buffer.length >= 30) {
        // VP8 (lossy) vs VP8L (lossless) vs VP8X (extended)
        const format = buffer.toString('ascii', 12, 16);
        if (format === 'VP8 ' && buffer.length >= 30) {
          const width = buffer.readUInt16LE(26) & 0x3FFF;
          const height = buffer.readUInt16LE(28) & 0x3FFF;
          return { width, height };
        } else if (format === 'VP8L' && buffer.length >= 25) {
          const b0 = buffer[21];
          const b1 = buffer[22];
          const b2 = buffer[23];
          const b3 = buffer[24];
          const width = 1 + (((b1 & 0x3F) << 8) | b0);
          const height = 1 + (((b3 & 0xF) << 10) | (b2 << 2) | ((b1 & 0xC0) >> 6));
          return { width, height };
        } else if (format === 'VP8X' && buffer.length >= 30) {
          const width = 1 + buffer.readUIntLE(24, 3);
          const height = 1 + buffer.readUIntLE(27, 3);
          return { width, height };
        }
      }
    } catch {
      // Ignore dimension parsing errors if non-critical
    }

    return null;
  }
}
