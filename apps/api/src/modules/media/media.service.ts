import { prisma } from '../../config/prisma.js';
import { storageService, UploadedFile } from '../../utils/storage.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors.js';
import {
  UploadSignatureInput,
  UploadSignatureResponse,
  FinalizeUploadInput,
  MediaAssetDTO,
} from './media.types.js';

export class MediaService {
  /**
   * Generate secure direct-upload signature for browser-to-Cloudinary upload
   */
  async getUploadSignature(
    companyId: string,
    input: UploadSignatureInput
  ): Promise<UploadSignatureResponse> {
    const entityType = (input.entityType || 'PRODUCT').toUpperCase();

    // Entity authorization check
    if (input.entityId && entityType === 'PRODUCT') {
      const product = await prisma.product.findUnique({
        where: { id: input.entityId },
      });
      if (!product || product.companyId !== companyId) {
        throw new ForbiddenError('Access denied. Product does not belong to your company.');
      }
    }

    const folder = `stockrow/${companyId}/${entityType.toLowerCase()}`;
    return storageService.generateUploadSignature(folder, companyId);
  }

  /**
   * Finalize browser direct upload metadata registration in MediaAsset
   */
  async finalizeUpload(
    companyId: string,
    input: FinalizeUploadInput
  ): Promise<MediaAssetDTO> {
    const {
      publicId,
      secureUrl,
      fileName,
      mimeType,
      fileSize,
      width,
      height,
      entityType = 'PRODUCT',
      entityId,
      isPrimary = false,
    } = input;

    if (!publicId || !secureUrl) {
      throw new BadRequestError('publicId and secureUrl are required to finalize upload');
    }

    const normalizedEntityType = entityType.toUpperCase() as any;

    // Verify entity ownership
    if (entityId && normalizedEntityType === 'PRODUCT') {
      const product = await prisma.product.findUnique({ where: { id: entityId } });
      if (!product || product.companyId !== companyId) {
        throw new ForbiddenError('Access denied. Product does not belong to your company.');
      }
    }

    // Check for existing identical asset to avoid duplicate uploads
    const existing = await (prisma as any).mediaAsset.findFirst({
      where: {
        companyId,
        publicId,
        status: { in: ['ACTIVE', 'TEMP'] },
      },
    });

    if (existing) {
      return this.formatMediaDTO(existing);
    }

    // Determine primary status if no existing images exist for entity
    let shouldBePrimary = isPrimary;
    if (entityId) {
      const count = await (prisma as any).mediaAsset.count({
        where: {
          companyId,
          entityType: normalizedEntityType,
          entityId,
          status: 'ACTIVE',
        },
      });
      if (count === 0) {
        shouldBePrimary = true;
      }
    }

    // Create asset
    const mediaAsset = await (prisma as any).mediaAsset.create({
      data: {
        companyId,
        entityType: normalizedEntityType,
        entityId: entityId || null,
        publicId,
        secureUrl,
        fileName: fileName || null,
        mimeType: mimeType || null,
        fileSize: fileSize || null,
        width: width || null,
        height: height || null,
        isPrimary: shouldBePrimary,
        status: entityId ? 'ACTIVE' : 'TEMP',
      },
    });

    // If marked primary, execute transactional primary switch
    if (shouldBePrimary && entityId) {
      await this.setPrimaryImage(companyId, mediaAsset.id);
    }

    return this.formatMediaDTO(mediaAsset);
  }

  /**
   * Backend proxy image upload (Development fallback & direct server uploads)
   */
  async uploadProxyImage(
    companyId: string,
    file: UploadedFile,
    entityType: string = 'PRODUCT',
    entityId?: string,
    isPrimary?: boolean
  ): Promise<MediaAssetDTO> {
    const normalizedEntityType = (entityType || 'PRODUCT').toUpperCase() as any;

    // Verify entity ownership
    if (entityId && normalizedEntityType === 'PRODUCT') {
      const product = await prisma.product.findUnique({ where: { id: entityId } });
      if (!product || product.companyId !== companyId) {
        throw new ForbiddenError('Access denied. Product does not belong to your company.');
      }
    }

    // Validate file & compute checksum
    const { checksum, dimensions } = storageService.validateImage(file);

    // Check idempotency (duplicate check within same tenant)
    if (entityId) {
      const duplicate = await (prisma as any).mediaAsset.findFirst({
        where: {
          companyId,
          checksum,
          entityType: normalizedEntityType,
          entityId,
          status: 'ACTIVE',
        },
      });
      if (duplicate) {
        return this.formatMediaDTO(duplicate);
      }
    }

    const folder = `stockrow/${companyId}/${normalizedEntityType.toLowerCase()}`;
    const result = await storageService.uploadFile(file, folder);

    // Determine primary state
    let shouldBePrimary = isPrimary === true;
    if (entityId && !shouldBePrimary) {
      const activeCount = await (prisma as any).mediaAsset.count({
        where: {
          companyId,
          entityType: normalizedEntityType,
          entityId,
          status: 'ACTIVE',
        },
      });
      if (activeCount === 0) shouldBePrimary = true;
    }

    // Save to database
    const mediaAsset = await (prisma as any).mediaAsset.create({
      data: {
        companyId,
        entityType: normalizedEntityType,
        entityId: entityId || null,
        publicId: result.publicId || '',
        secureUrl: result.url,
        fileName: file.name,
        mimeType: file.mimetype,
        fileSize: file.size,
        width: result.width || dimensions?.width || null,
        height: result.height || dimensions?.height || null,
        checksum,
        isPrimary: shouldBePrimary,
        status: entityId ? 'ACTIVE' : 'TEMP',
      },
    });

    if (shouldBePrimary && entityId) {
      await this.setPrimaryImage(companyId, mediaAsset.id);
    }

    return this.formatMediaDTO(mediaAsset);
  }

  /**
   * Set primary image transactionally and update derived Product.imageUrl
   */
  async setPrimaryImage(companyId: string, imageId: string): Promise<MediaAssetDTO> {
    const asset = await (prisma as any).mediaAsset.findUnique({ where: { id: imageId } });

    if (!asset) {
      throw new NotFoundError('Media asset not found');
    }
    if (asset.companyId !== companyId) {
      throw new ForbiddenError('Access denied. You cannot modify images for another company.');
    }

    if (!asset.entityId) {
      throw new BadRequestError('Cannot set primary image for unattached media asset');
    }

    // Atomic transaction for primary flag switch & legacy Product.imageUrl update
    const updatedAsset = await prisma.$transaction(async (tx) => {
      // 1. Reset all other entity assets to non-primary
      await (tx as any).mediaAsset.updateMany({
        where: {
          companyId,
          entityType: asset.entityType,
          entityId: asset.entityId,
        },
        data: { isPrimary: false },
      });

      // 2. Mark selected asset as primary & active
      const primary = await (tx as any).mediaAsset.update({
        where: { id: asset.id },
        data: { isPrimary: true, status: 'ACTIVE' },
      });

      // 3. Update legacy Product.imageUrl derived field if entity is PRODUCT
      if (asset.entityType === 'PRODUCT') {
        await tx.product.update({
          where: { id: asset.entityId! },
          data: { imageUrl: primary.secureUrl },
        });
      }

      return primary;
    });

    return this.formatMediaDTO(updatedAsset);
  }

  /**
   * Delete image with reliable multi-phase lifecycle (ACTIVE -> DELETE_PENDING -> Delete Storage -> Delete DB)
   */
  async deleteImage(companyId: string, imageId: string): Promise<{ success: boolean }> {
    const asset = await (prisma as any).mediaAsset.findUnique({ where: { id: imageId } });

    if (!asset) {
      return { success: true };
    }

    if (asset.companyId !== companyId) {
      throw new ForbiddenError('Access denied. You cannot delete images belonging to another company.');
    }

    // Phase 1: Mark as DELETE_PENDING in DB
    await (prisma as any).mediaAsset.update({
      where: { id: asset.id },
      data: { status: 'DELETE_PENDING', deletedAt: new Date() },
    });

    // Phase 2: Delete from storage provider
    if (asset.publicId) {
      await storageService.deleteFile(asset.publicId);
    }

    // Phase 3: Finalize DB deletion
    await prisma.$transaction(async (tx) => {
      await (tx as any).mediaAsset.delete({ where: { id: asset.id } });

      // If deleted asset was primary for a product, switch primary to next remaining image
      if (asset.isPrimary && asset.entityId && asset.entityType === 'PRODUCT') {
        const nextAsset = await (tx as any).mediaAsset.findFirst({
          where: {
            companyId,
            entityType: 'PRODUCT',
            entityId: asset.entityId,
            status: 'ACTIVE',
          },
          orderBy: { createdAt: 'asc' },
        });

        if (nextAsset) {
          await (tx as any).mediaAsset.update({
            where: { id: nextAsset.id },
            data: { isPrimary: true },
          });
          await tx.product.update({
            where: { id: asset.entityId },
            data: { imageUrl: nextAsset.secureUrl },
          });
        } else {
          // No remaining images
          await tx.product.update({
            where: { id: asset.entityId },
            data: { imageUrl: null },
          });
        }
      }
    });

    return { success: true };
  }

  /**
   * List images for a given entity
   */
  async getEntityImages(
    companyId: string,
    entityType: string,
    entityId: string
  ): Promise<MediaAssetDTO[]> {
    const normalizedEntityType = entityType.toUpperCase() as any;

    const assets = await (prisma as any).mediaAsset.findMany({
      where: {
        companyId,
        entityType: normalizedEntityType,
        entityId,
        status: 'ACTIVE',
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    return assets.map((a: any) => this.formatMediaDTO(a));
  }

  /**
   * Attach temporary uploaded assets to a newly created entity
   */
  async attachAssetsToEntity(
    companyId: string,
    assetIds: string[],
    entityType: string,
    entityId: string
  ): Promise<void> {
    if (!assetIds || assetIds.length === 0) return;

    const normalizedEntityType = entityType.toUpperCase() as any;

    await prisma.$transaction(async (tx) => {
      await (tx as any).mediaAsset.updateMany({
        where: {
          id: { in: assetIds },
          companyId,
        },
        data: {
          entityType: normalizedEntityType,
          entityId,
          status: 'ACTIVE',
        },
      });

      // Ensure at least one image is primary
      const primaryCount = await (tx as any).mediaAsset.count({
        where: {
          companyId,
          entityType: normalizedEntityType,
          entityId,
          isPrimary: true,
          status: 'ACTIVE',
        },
      });

      if (primaryCount === 0) {
        const first = await (tx as any).mediaAsset.findFirst({
          where: {
            companyId,
            entityType: normalizedEntityType,
            entityId,
            status: 'ACTIVE',
          },
          orderBy: { createdAt: 'asc' },
        });

        if (first) {
          await (tx as any).mediaAsset.update({
            where: { id: first.id },
            data: { isPrimary: true },
          });
          if (normalizedEntityType === 'PRODUCT') {
            await tx.product.update({
              where: { id: entityId },
              data: { imageUrl: first.secureUrl },
            });
          }
        }
      }
    });
  }

  /**
   * Orphan Cleanup Job: delete temporary unattached assets > 24h old & DELETE_PENDING assets > 1h old
   */
  async cleanupOrphanAssets(): Promise<{ cleanedCount: number }> {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const orphans = await (prisma as any).mediaAsset.findMany({
      where: {
        OR: [
          { status: 'TEMP', createdAt: { lt: twentyFourHoursAgo } },
          { status: 'DELETE_PENDING', updatedAt: { lt: oneHourAgo } },
        ],
      },
      take: 100,
    });

    let cleanedCount = 0;

    for (const orphan of orphans) {
      try {
        if (orphan.publicId) {
          await storageService.deleteFile(orphan.publicId);
        }
        await (prisma as any).mediaAsset.delete({ where: { id: orphan.id } });
        cleanedCount++;
      } catch {
        // Continue cleaning remaining orphans
      }
    }

    return { cleanedCount };
  }

  /**
   * Format DB model into standardized MediaAssetDTO with variant URLs
   */
  private formatMediaDTO(asset: any): MediaAssetDTO {
    const url = asset.secureUrl;
    return {
      id: asset.id,
      companyId: asset.companyId,
      entityType: asset.entityType,
      entityId: asset.entityId,
      publicId: asset.publicId,
      secureUrl: url,
      url,
      thumbnailUrl: storageService.getVariantUrl(url, 'thumbnail'),
      mediumUrl: storageService.getVariantUrl(url, 'medium'),
      largeUrl: storageService.getVariantUrl(url, 'large'),
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      fileSize: asset.fileSize,
      width: asset.width,
      height: asset.height,
      isPrimary: asset.isPrimary,
      status: asset.status,
      createdAt: asset.createdAt,
    };
  }
}

export const mediaService = new MediaService();
