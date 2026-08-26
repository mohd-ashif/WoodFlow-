import path from 'path';
import fs from 'fs/promises';
import { BadRequestError } from './errors.js';

export interface UploadedFile {
  name: string;
  data: Buffer;
  size: number;
  mimetype: string;
}

export interface IStorageService {
  uploadFile(file: UploadedFile, folder: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
  validateImage(file: UploadedFile): void;
}

export class LocalStorageService implements IStorageService {
  private uploadDir: string;
  private baseUrl: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'public', 'uploads');
    this.baseUrl = process.env.API_URL || 'http://localhost:4000';
  }

  async uploadFile(file: UploadedFile, folder: string): Promise<string> {
    this.validateImage(file);

    const folderPath = path.join(this.uploadDir, folder);
    await fs.mkdir(folderPath, { recursive: true });

    // Generate unique name
    const ext = path.extname(file.name);
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
    const filePath = path.join(folderPath, uniqueName);

    await fs.writeFile(filePath, file.data);

    // Return URL path
    return `${this.baseUrl}/uploads/${folder}/${uniqueName}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    try {
      const relativePath = fileUrl.replace(`${this.baseUrl}/uploads/`, '');
      const filePath = path.join(this.uploadDir, relativePath);
      await fs.unlink(filePath);
    } catch {
      // Don't fail if file not found
    }
  }

  validateImage(file: UploadedFile): void {
    // 1. Max file size: 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new BadRequestError('File size exceeds the 5MB limit');
    }

    // 2. Allowed extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const ext = path.extname(file.name).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      throw new BadRequestError(`Invalid file extension. Allowed: ${allowedExtensions.join(', ')}`);
    }

    // 3. Allowed mimetypes
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestError('Invalid file type. Only images are allowed');
    }

    // 4. Executable/dangerous file check
    const dangerousPattern = /\.(exe|bat|sh|js|ts|html|php|py)$/i;
    if (dangerousPattern.test(file.name)) {
      throw new BadRequestError('Forbidden file upload');
    }
  }
}

// Export singleton instance. Can easily swap LocalStorageService with S3StorageService or CloudinaryStorageService here.
export const storageService = new LocalStorageService();
