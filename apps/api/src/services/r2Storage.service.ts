import crypto from 'crypto';
import https from 'https';
import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { BadRequestError } from '../utils/errors.js';

export interface R2UploadResult {
  url: string;
  objectKey: string;
  etag?: string;
  size: number;
  contentType: string;
}

export class R2StorageService {
  private accountId?: string;
  private accessKeyId?: string;
  private secretAccessKey?: string;
  private bucketName?: string;
  private publicUrl?: string;
  private isConfigured: boolean;

  constructor() {
    this.accountId = env.CLOUDFLARE_ACCOUNT_ID || process.env.CLOUDFLARE_ACCOUNT_ID;
    this.accessKeyId = env.CLOUDFLARE_R2_ACCESS_KEY_ID || process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    this.secretAccessKey = env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    this.bucketName = env.CLOUDFLARE_R2_BUCKET_NAME || process.env.CLOUDFLARE_R2_BUCKET_NAME;
    this.publicUrl = env.CLOUDFLARE_R2_PUBLIC_URL || process.env.CLOUDFLARE_R2_PUBLIC_URL;

    this.isConfigured = Boolean(
      this.accountId &&
      this.accessKeyId &&
      this.secretAccessKey &&
      this.bucketName &&
      !this.accessKeyId.includes('your_') &&
      !this.secretAccessKey.includes('your_')
    );
  }

  /**
   * Upload an object into Cloudflare R2 (or local fallback if unconfigured)
   */
  async uploadObject(
    tenantId: string,
    category: 'logo' | 'invoice_logo' | 'favicon',
    fileName: string,
    data: Buffer,
    contentType: string
  ): Promise<R2UploadResult> {
    if (!tenantId || typeof tenantId !== 'string') {
      throw new BadRequestError('Invalid tenant identifier for image upload');
    }

    // Sanitize filename & create safe, unique tenant-scoped key
    const sanitizedExt = path.extname(fileName).toLowerCase() || '.webp';
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const safeBaseName = `${category}-${timestamp}-${randomSuffix}${sanitizedExt}`;
    const objectKey = `tenants/${tenantId}/branding/${category}/${safeBaseName}`;

    if (this.isConfigured) {
      return this.uploadToR2(objectKey, data, contentType);
    } else {
      return this.uploadToLocalStorage(objectKey, data, contentType);
    }
  }

  /**
   * Delete an object from Cloudflare R2 (or local fallback)
   */
  async deleteObject(tenantId: string, objectKey: string): Promise<void> {
    if (!objectKey) return;

    // Strict Tenant Isolation Defense: Ensure key belongs to the current tenant
    const expectedPrefix = `tenants/${tenantId}/`;
    if (!objectKey.startsWith(expectedPrefix)) {
      logger.warn({ tenantId, objectKey }, 'Blocked attempt to delete object outside tenant namespace');
      throw new BadRequestError('Cannot delete object: Key does not belong to your tenant');
    }

    if (this.isConfigured) {
      await this.deleteFromR2(objectKey);
    } else {
      await this.deleteFromLocalStorage(objectKey);
    }
  }

  /**
   * Get public CDN or local URL for an object key
   */
  getPublicUrl(objectKey: string): string {
    if (!objectKey) return '';
    if (this.publicUrl) {
      return `${this.publicUrl.replace(/\/$/, '')}/${objectKey}`;
    }
    const host = process.env.API_URL || `http://localhost:${env.PORT || 4000}`;
    return `${host}/uploads/${objectKey}`;
  }

  // ─── Private Cloudflare R2 SigV4 REST Implementation ──────────────────────────

  private async uploadToR2(objectKey: string, data: Buffer, contentType: string): Promise<R2UploadResult> {
    const host = `${this.accountId}.r2.cloudflarestorage.com`;
    const canonicalUri = `/${this.bucketName}/${objectKey}`;
    const method = 'PUT';
    const region = 'auto';
    const service = 's3';

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);

    const payloadHash = crypto.createHash('sha256').update(data).digest('hex');

    const headers: Record<string, string> = {
      'content-type': contentType,
      'content-length': data.length.toString(),
      host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };

    const canonicalHeaders =
      `content-length:${headers['content-length']}\n` +
      `content-type:${headers['content-type']}\n` +
      `host:${headers['host']}\n` +
      `x-amz-content-sha256:${headers['x-amz-content-sha256']}\n` +
      `x-amz-date:${headers['x-amz-date']}\n`;

    const signedHeaders = 'content-length;content-type;host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = `${method}\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${crypto
      .createHash('sha256')
      .update(canonicalRequest)
      .digest('hex')}`;

    const signingKey = this.getSignatureKey(this.secretAccessKey!, dateStamp, region, service);
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    const authHeader = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    headers['authorization'] = authHeader;

    return new Promise((resolve, reject) => {
      const options = {
        hostname: host,
        port: 443,
        path: canonicalUri,
        method: 'PUT',
        headers,
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => { responseBody += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve({
              url: this.getPublicUrl(objectKey),
              objectKey,
              etag: res.headers.etag,
              size: data.length,
              contentType,
            });
          } else {
            logger.error({ status: res.statusCode, body: responseBody }, 'Cloudflare R2 upload error');
            reject(new BadRequestError(`Cloudflare R2 upload failed with status ${res.statusCode}`));
          }
        });
      });

      req.on('error', (err) => {
        logger.error({ err }, 'Network error during Cloudflare R2 upload');
        reject(new BadRequestError(`R2 connection error: ${err.message}`));
      });

      req.write(data);
      req.end();
    });
  }

  private async deleteFromR2(objectKey: string): Promise<void> {
    const host = `${this.accountId}.r2.cloudflarestorage.com`;
    const canonicalUri = `/${this.bucketName}/${objectKey}`;
    const method = 'DELETE';
    const region = 'auto';
    const service = 's3';

    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.substring(0, 8);
    const payloadHash = crypto.createHash('sha256').update('').digest('hex');

    const headers: Record<string, string> = {
      host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };

    const canonicalHeaders =
      `host:${headers['host']}\n` +
      `x-amz-content-sha256:${headers['x-amz-content-sha256']}\n` +
      `x-amz-date:${headers['x-amz-date']}\n`;

    const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';

    const canonicalRequest = `${method}\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${crypto
      .createHash('sha256')
      .update(canonicalRequest)
      .digest('hex')}`;

    const signingKey = this.getSignatureKey(this.secretAccessKey!, dateStamp, region, service);
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

    headers['authorization'] = `AWS4-HMAC-SHA256 Credential=${this.accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return new Promise((resolve) => {
      const options = {
        hostname: host,
        port: 443,
        path: canonicalUri,
        method: 'DELETE',
        headers,
      };

      const req = https.request(options, () => {
        resolve();
      });

      req.on('error', (err) => {
        logger.warn({ err }, 'Non-fatal error deleting object from Cloudflare R2');
        resolve();
      });

      req.end();
    });
  }

  private getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
    const kDate = crypto.createHmac('sha256', 'AWS4' + key).update(dateStamp).digest();
    const kRegion = crypto.createHmac('sha256', kDate).update(regionName).digest();
    const kService = crypto.createHmac('sha256', kRegion).update(serviceName).digest();
    return crypto.createHmac('sha256', kService).update('aws4_request').digest();
  }

  // ─── Private Local Fallback Implementation (Dev & Offline Testing) ───────────

  private async uploadToLocalStorage(objectKey: string, data: Buffer, contentType: string): Promise<R2UploadResult> {
    const localRoot = path.join(process.cwd(), 'public', 'uploads');
    const fullPath = path.join(localRoot, objectKey);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, data);

    return {
      url: this.getPublicUrl(objectKey),
      objectKey,
      size: data.length,
      contentType,
    };
  }

  private async deleteFromLocalStorage(objectKey: string): Promise<void> {
    try {
      const localRoot = path.join(process.cwd(), 'public', 'uploads');
      const fullPath = path.join(localRoot, objectKey);
      await fs.unlink(fullPath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

export const r2StorageService = new R2StorageService();
