import path from 'path';
import fs from 'fs/promises';
import https from 'https';
import crypto from 'crypto';
import { createRequire } from 'module';
import { BadRequestError } from './errors.js';
import { ImageValidator, ImageDimensions } from './imageValidator.js';
import { ImageVariant, UploadSignatureResponse } from '../modules/media/media.types.js';

const require = createRequire(import.meta.url);
const FormData = require('form-data') as typeof import('form-data');

export interface UploadedFile {
  name: string;
  data: Buffer;
  size: number;
  mimetype: string;
}

export interface StoredAssetResult {
  url: string;
  publicId?: string;
  checksum?: string;
  width?: number;
  height?: number;
}

export interface IStorageService {
  uploadFile(file: UploadedFile, folder: string): Promise<StoredAssetResult>;
  deleteFile(publicIdOrUrl: string): Promise<void>;
  validateImage(file: UploadedFile): { checksum: string; dimensions?: ImageDimensions };
  generateUploadSignature(folder: string, companyId: string): Promise<UploadSignatureResponse>;
  getVariantUrl(publicIdOrUrl: string, variant?: ImageVariant): string;
}

// ─── Local Storage (Development Fallback) ─────────────────────────────────────
export class LocalStorageService implements IStorageService {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    this.baseUrl = process.env.API_URL || 'http://localhost:4000';
  }

  validateImage(file: UploadedFile): { checksum: string; dimensions?: ImageDimensions } {
    return ImageValidator.validateImage(file);
  }

  async uploadFile(file: UploadedFile, folder: string): Promise<StoredAssetResult> {
    const { checksum, dimensions } = this.validateImage(file);

    const folderPath = path.join(this.uploadDir, folder);
    await fs.mkdir(folderPath, { recursive: true });

    const ext = path.extname(file.name).toLowerCase();
    const uniqueName = `img_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    const filePath = path.join(folderPath, uniqueName);

    await fs.writeFile(filePath, file.data);

    const url = `${this.baseUrl}/uploads/${folder}/${uniqueName}`;
    const publicId = `${folder}/${uniqueName}`;

    return {
      url,
      publicId,
      checksum,
      width: dimensions?.width,
      height: dimensions?.height,
    };
  }

  async deleteFile(publicIdOrUrl: string): Promise<void> {
    try {
      const relativePath = publicIdOrUrl.replace(`${this.baseUrl}/uploads/`, '');
      const filePath = path.join(this.uploadDir, relativePath);
      await fs.unlink(filePath);
    } catch {
      // Ignore if file already deleted
    }
  }

  async generateUploadSignature(folder: string, companyId: string): Promise<UploadSignatureResponse> {
    const timestamp = Math.round(Date.now() / 1000);
    return {
      cloudName: 'local',
      apiKey: 'local',
      timestamp,
      folder,
      signature: 'local_dev_signature',
      uploadUrl: `${this.baseUrl}/api/v1/upload/image`,
    };
  }

  getVariantUrl(publicIdOrUrl: string, variant: ImageVariant = 'original'): string {
    if (!publicIdOrUrl) return '';
    return publicIdOrUrl; // Local fallback returns main URL
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

  validateImage(file: UploadedFile): { checksum: string; dimensions?: ImageDimensions } {
    return ImageValidator.validateImage(file);
  }

  async generateUploadSignature(folder: string, companyId: string): Promise<UploadSignatureResponse> {
    const timestamp = Math.round(Date.now() / 1000);
    const params = `folder=${folder}&timestamp=${timestamp}`;

    const signature = crypto
      .createHash('sha1')
      .update(params + this.apiSecret)
      .digest('hex');

    return {
      cloudName: this.cloudName,
      apiKey: this.apiKey,
      timestamp,
      folder,
      signature,
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`,
    };
  }

  async uploadFile(file: UploadedFile, folder: string): Promise<StoredAssetResult> {
    const { checksum, dimensions } = this.validateImage(file);

    const timestamp = Math.round(Date.now() / 1000).toString();
    const params = `folder=${folder}&timestamp=${timestamp}`;

    const signature = crypto
      .createHash('sha1')
      .update(params + this.apiSecret)
      .digest('hex');

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
              const errMsg = result.error.message || 'Cloudinary upload failed';
              reject(new BadRequestError(errMsg));
            } else {
              resolve({
                url: result.secure_url,
                publicId: result.public_id,
                checksum,
                width: result.width || dimensions?.width,
                height: result.height || dimensions?.height,
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
      const timestamp = Math.round(Date.now() / 1000).toString();
      const params = `public_id=${publicId}&timestamp=${timestamp}`;
      const signature = crypto
        .createHash('sha1')
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
          res.resume();
          res.on('end', resolve);
        });
        req.on('error', reject);
        req.write(form.getBuffer());
        req.end();
      });
    } catch {
      // Resilient cleanup
    }
  }

  getVariantUrl(publicIdOrUrl: string, variant: ImageVariant = 'original'): string {
    if (!publicIdOrUrl) return '';

    // If it's a Cloudinary URL, inject variant transformation specs
    if (publicIdOrUrl.includes('res.cloudinary.com')) {
      let transformation = '';
      switch (variant) {
        case 'thumbnail':
          transformation = 'c_thumb,w_120,h_120,g_face,q_auto,f_auto';
          break;
        case 'medium':
          transformation = 'c_limit,w_800,h_800,q_auto,f_auto';
          break;
        case 'large':
          transformation = 'c_limit,w_1600,h_1600,q_auto,f_auto';
          break;
        default:
          transformation = 'q_auto,f_auto';
          break;
      }
      return publicIdOrUrl.replace('/upload/', `/upload/${transformation}/`);
    }

    return publicIdOrUrl;
  }
}

// ─── Dynamic Storage Proxy ───────────────────────────────────────────────────
export class DynamicStorageService implements IStorageService {
  private localService = new LocalStorageService();

  private getActiveService(): IStorageService {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

    if (
      CLOUDINARY_CLOUD_NAME &&
      CLOUDINARY_CLOUD_NAME.trim() !== '' &&
      CLOUDINARY_CLOUD_NAME !== 'your_cloud_name' &&
      CLOUDINARY_API_KEY &&
      CLOUDINARY_API_KEY.trim() !== '' &&
      CLOUDINARY_API_KEY !== 'your_api_key' &&
      CLOUDINARY_API_SECRET &&
      CLOUDINARY_API_SECRET.trim() !== '' &&
      CLOUDINARY_API_SECRET !== 'your_api_secret'
    ) {
      return new CloudinaryStorageService(
        CLOUDINARY_CLOUD_NAME.trim(),
        CLOUDINARY_API_KEY.trim(),
        CLOUDINARY_API_SECRET.trim()
      );
    }

    return this.localService;
  }

  async uploadFile(file: UploadedFile, folder: string): Promise<StoredAssetResult> {
    return this.getActiveService().uploadFile(file, folder);
  }

  async deleteFile(publicIdOrUrl: string): Promise<void> {
    return this.getActiveService().deleteFile(publicIdOrUrl);
  }

  validateImage(file: UploadedFile): { checksum: string; dimensions?: ImageDimensions } {
    return this.getActiveService().validateImage(file);
  }

  async generateUploadSignature(folder: string, companyId: string): Promise<UploadSignatureResponse> {
    return this.getActiveService().generateUploadSignature(folder, companyId);
  }

  getVariantUrl(publicIdOrUrl: string, variant: ImageVariant = 'original'): string {
    return this.getActiveService().getVariantUrl(publicIdOrUrl, variant);
  }
}

export const storageService = new DynamicStorageService();
