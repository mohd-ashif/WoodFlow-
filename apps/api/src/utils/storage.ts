import path from 'path';
import fs from 'fs/promises';
import https from 'https';
import { createRequire } from 'module';
import { BadRequestError } from './errors.js';

const require = createRequire(import.meta.url);
// form-data is CJS-only; imported via createRequire
const FormData = require('form-data') as typeof import('form-data');

export interface UploadedFile {
  name: string;
  data: Buffer;
  size: number;
  mimetype: string;
}

export interface IStorageService {
  uploadFile(file: UploadedFile, folder: string): Promise<{ url: string; publicId?: string }>;
  deleteFile(publicIdOrUrl: string): Promise<void>;
  validateImage(file: UploadedFile): void;
}

// ─── Local Storage (Development Fallback) ─────────────────────────────────────
export class LocalStorageService implements IStorageService {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    this.baseUrl = process.env.API_URL || 'http://localhost:4000';
  }

  async uploadFile(file: UploadedFile, folder: string): Promise<{ url: string; publicId?: string }> {
    this.validateImage(file);

    const folderPath = path.join(this.uploadDir, folder);
    await fs.mkdir(folderPath, { recursive: true });

    const ext = path.extname(file.name);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const filePath = path.join(folderPath, uniqueName);

    await fs.writeFile(filePath, file.data);

    const url = `${this.baseUrl}/uploads/${folder}/${uniqueName}`;
    return { url, publicId: `${folder}/${uniqueName}` };
  }

  async deleteFile(publicIdOrUrl: string): Promise<void> {
    try {
      const relativePath = publicIdOrUrl.replace(`${this.baseUrl}/uploads/`, '');
      const filePath = path.join(this.uploadDir, relativePath);
      await fs.unlink(filePath);
    } catch {
      // Don't fail if file not found
    }
  }

  validateImage(file: UploadedFile): void {
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new BadRequestError('File size exceeds the 5MB limit');
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestError(`Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`);
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestError('Invalid file type. Only images are allowed');
    }

    const dangerousPattern = /\.(exe|bat|sh|js|ts|html|php|py)$/i;
    if (dangerousPattern.test(file.name)) {
      throw new BadRequestError('Forbidden file upload');
    }
  }
}

// ─── Cloudinary Storage (Production) ──────────────────────────────────────────
export class CloudinaryStorageService implements IStorageService {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(cloudName: string, apiKey: string, apiSecret: string) {
    this.cloudName = cloudName;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  validateImage(file: UploadedFile): void {
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new BadRequestError('File size exceeds the 5MB limit');
    }

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const ext = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestError(`Invalid file type. Allowed: JPG, PNG, WEBP`);
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestError('Invalid file type. Only JPG, PNG, or WEBP images are allowed');
    }
  }

  async uploadFile(file: UploadedFile, folder: string): Promise<{ url: string; publicId: string }> {
    this.validateImage(file);

    // Generate SHA-1 signature for secure upload
    const timestamp = Math.round(Date.now() / 1000).toString();
    const params = `folder=${folder}&timestamp=${timestamp}`;

    // Use Node's built-in crypto for SHA-1 HMAC
    const { createHash } = await import('crypto');
    const signature = createHash('sha1')
      .update(params + this.apiSecret)
      .digest('hex');

    // Build multipart form
    const form = new FormData();
    form.append('file', file.data, {
      filename: file.name,
      contentType: file.mimetype,
    });
    form.append('api_key', this.apiKey);
    form.append('timestamp', timestamp);
    form.append('folder', folder);
    form.append('signature', signature);

    return new Promise((resolve, reject) => {
      const formBuffer = form.getBuffer();
      const options = {
        hostname: 'api.cloudinary.com',
        path: `/v1_1/${this.cloudName}/image/upload`,
        method: 'POST',
        headers: form.getHeaders(),
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (result.error) {
              reject(new BadRequestError(result.error.message || 'Cloudinary upload failed'));
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
              });
            }
          } catch {
            reject(new BadRequestError('Failed to parse Cloudinary response'));
          }
        });
      });

      req.on('error', (err) => {
        reject(new BadRequestError(`Upload failed: ${err.message}`));
      });

      req.write(formBuffer);
      req.end();
    });
  }

  async deleteFile(publicId: string): Promise<void> {
    if (!publicId) return;

    try {
      const { createHash } = await import('crypto');
      const timestamp = Math.round(Date.now() / 1000).toString();
      const params = `public_id=${publicId}&timestamp=${timestamp}`;
      const signature = createHash('sha1')
        .update(params + this.apiSecret)
        .digest('hex');

      const form = new FormData();
      form.append('public_id', publicId);
      form.append('api_key', this.apiKey);
      form.append('timestamp', timestamp);
      form.append('signature', signature);

      await new Promise<void>((resolve, reject) => {
        const options = {
          hostname: 'api.cloudinary.com',
          path: `/v1_1/${this.cloudName}/image/destroy`,
          method: 'POST',
          headers: form.getHeaders(),
        };
        const req = https.request(options, (res) => {
          res.resume(); // consume response
          res.on('end', resolve);
        });
        req.on('error', reject);
        req.write(form.getBuffer());
        req.end();
      });
    } catch {
      // Don't fail the main operation if cleanup fails
    }
  }
}

// ─── Singleton Export — auto-selects based on env vars ────────────────────────
function createStorageService(): IStorageService {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

  if (
    CLOUDINARY_CLOUD_NAME &&
    CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
    CLOUDINARY_API_KEY &&
    CLOUDINARY_API_SECRET
  ) {
    return new CloudinaryStorageService(
      CLOUDINARY_CLOUD_NAME,
      CLOUDINARY_API_KEY,
      CLOUDINARY_API_SECRET
    );
  }

  return new LocalStorageService();
}

export const storageService = createStorageService();
