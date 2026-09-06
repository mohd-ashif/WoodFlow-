import { Request, Response, NextFunction } from 'express';
import { mediaService } from './media.service.js';
import { BadRequestError } from '../../utils/errors.js';

/**
 * POST /api/v1/media/upload-signature
 * Return signed Cloudinary upload credentials for direct browser upload
 */
export async function getUploadSignature(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const { entityType = 'PRODUCT', entityId } = req.body;

    const signatureData = await mediaService.getUploadSignature(companyId, { entityType, entityId });

    res.status(200).json({
      success: true,
      data: signatureData,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/media/finalize
 * Register direct Cloudinary upload metadata in MediaAsset database table
 */
export async function finalizeUpload(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const { publicId, secureUrl, fileName, mimeType, fileSize, width, height, entityType = 'PRODUCT', entityId, isPrimary } = req.body;

    if (!publicId || !secureUrl) {
      throw new BadRequestError('publicId and secureUrl are required fields');
    }

    const asset = await mediaService.finalizeUpload(companyId, {
      publicId,
      secureUrl,
      fileName,
      mimeType,
      fileSize,
      width,
      height,
      entityType,
      entityId,
      isPrimary: isPrimary === true || isPrimary === 'true',
    });

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/media/upload
 * Direct server upload fallback (using multipart form data)
 */
export async function uploadImageProxy(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const { entityType = 'PRODUCT', entityId, isPrimary } = req.body;
    const file = (req as any).uploadedFile;

    if (!file) {
      throw new BadRequestError('No image file provided. Field name must be "image" or "file".');
    }

    const asset = await mediaService.uploadProxyImage(
      companyId,
      file,
      entityType,
      entityId,
      isPrimary === true || isPrimary === 'true'
    );

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/media/:id/primary
 * Switch primary image for an entity transactionally
 */
export async function setPrimaryImage(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const { id } = req.params;

    const asset = await mediaService.setPrimaryImage(companyId, id);

    res.status(200).json({
      success: true,
      data: asset,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/media/:id
 * Delete media asset with multi-phase lifecycle
 */
export async function deleteImage(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const { id } = req.params;

    await mediaService.deleteImage(companyId, id);

    res.status(200).json({
      success: true,
      message: 'Media asset deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/media/entity/:entityType/:entityId
 * List all active media assets for an entity
 */
export async function getEntityImages(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const { entityType, entityId } = req.params;

    const assets = await mediaService.getEntityImages(companyId, entityType, entityId);

    res.status(200).json({
      success: true,
      data: assets,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/media/cleanup-orphans
 * Trigger background orphan asset cleanup
 */
export async function cleanupOrphans(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await mediaService.cleanupOrphanAssets();

    res.status(200).json({
      success: true,
      message: `Cleaned ${result.cleanedCount} orphan assets`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
