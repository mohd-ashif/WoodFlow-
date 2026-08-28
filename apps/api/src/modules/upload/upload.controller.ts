import { Request, Response, NextFunction } from 'express';
import { storageService } from '../../utils/storage.js';
import { BadRequestError } from '../../utils/errors.js';

/**
 * POST /api/v1/upload
 * Accepts multipart/form-data with a single "image" field.
 * Proxies securely to Cloudinary (or local storage in development).
 * Returns: { url, publicId }
 *
 * Never exposes Cloudinary API secrets to the frontend.
 */
export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;

    // Extract uploaded file from express-friendly rawBody approach
    // We use express built-in multipart handling via express-fileupload or manual buffer
    const contentType = req.headers['content-type'] || '';

    if (!contentType.includes('multipart/form-data')) {
      throw new BadRequestError('Request must be multipart/form-data');
    }

    // The file is provided via the body as a Buffer (we parse multipart manually below)
    const file = (req as any).uploadedFile;
    if (!file) {
      throw new BadRequestError('No image file provided. Include a file field named "image".');
    }

    const folder = `stockrow/${companyId}/products`;
    const result = await storageService.uploadFile(file, folder);

    res.status(200).json({
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId || null,
      },
    });
  } catch (error) {
    next(error);
  }
}
