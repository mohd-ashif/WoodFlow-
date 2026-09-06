import { Request, Response, NextFunction } from 'express';
import { mediaService } from '../media/media.service.js';
import { BadRequestError } from '../../utils/errors.js';

/**
 * POST /api/v1/upload/image (Backward-compatibility route)
 * Delegates to MediaService
 */
export async function uploadSingleImage(req: Request, res: Response, next: NextFunction) {
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
      isPrimary === 'true' || isPrimary === true
    );

    res.status(200).json({
      success: true,
      data: {
        id: asset.id,
        url: asset.secureUrl,
        publicId: asset.publicId,
        entityType: asset.entityType,
        entityId: asset.entityId,
        isPrimary: asset.isPrimary,
        thumbnailUrl: asset.thumbnailUrl,
        mediumUrl: asset.mediumUrl,
        largeUrl: asset.largeUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/upload/image/:imageId (Backward-compatibility route)
 */
export async function deleteImage(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const { imageId } = req.params;

    await mediaService.deleteImage(companyId, imageId);

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/upload/image/:imageId/primary (Backward-compatibility route)
 */
export async function setPrimaryImage(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const { imageId } = req.params;

    const asset = await mediaService.setPrimaryImage(companyId, imageId);

    res.status(200).json({
      success: true,
      data: {
        id: asset.id,
        isPrimary: true,
        url: asset.secureUrl,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/upload/entity/:entityType/:entityId (Backward-compatibility route)
 */
export async function getEntityImages(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const { entityType, entityId } = req.params;

    const images = await mediaService.getEntityImages(companyId, entityType, entityId);

    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    next(error);
  }
}
