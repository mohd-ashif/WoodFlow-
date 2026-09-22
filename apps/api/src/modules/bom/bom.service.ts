import { prisma } from '../../config/prisma.js';
import { CreateBOMInput, CreateBOMVersionInput } from '@furniture-os/shared';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';

export async function createBOM(companyId: string, input: CreateBOMInput, userId: string) {
  const db = prisma as any;

  const product = await db.product.findFirst({
    where: { id: input.productId, companyId },
  });

  if (!product) {
    throw new NotFoundError('Product not found for this company');
  }

  return prisma.$transaction(async (tx: any) => {
    const bom = await tx.bOM.create({
      data: {
        companyId,
        productId: input.productId,
        name: input.name,
        description: input.description || null,
        versions: {
          create: [
            {
              version: 1,
              status: 'ACTIVE',
              notes: 'Initial Version V1',
              items: {
                create: input.items.map((item) => ({
                  materialProductId: item.materialProductId,
                  quantity: item.quantity,
                  uom: item.uom || 'pcs',
                  wastePercentage: item.wastePercentage || 0,
                  scrapPercentage: item.scrapPercentage || 0,
                  operation: item.operation || null,
                  isOptional: item.isOptional || false,
                })),
              },
            },
          ],
        },
      },
      include: {
        versions: {
          include: {
            items: {
              include: { materialProduct: true },
            },
          },
        },
      },
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'BOM_CREATED',
      entity: 'BOM',
      entityId: bom.id,
      metadata: { bomName: bom.name, productId: bom.productId },
    });

    return bom;
  });
}

export async function listBOMs(companyId: string, productId?: string) {
  const db = prisma as any;
  const where: any = { companyId, isActive: true };
  if (productId) {
    where.productId = productId;
  }

  return db.bOM.findMany({
    where,
    include: {
      product: { select: { id: true, name: true, sku: true } },
      versions: {
        orderBy: { version: 'desc' },
        include: {
          items: {
            include: { materialProduct: { select: { id: true, name: true, sku: true, purchasePrice: true } } },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getBOMById(companyId: string, bomId: string) {
  const db = prisma as any;
  const bom = await db.bOM.findFirst({
    where: { id: bomId, companyId },
    include: {
      product: true,
      versions: {
        orderBy: { version: 'desc' },
        include: {
          items: {
            include: { materialProduct: true },
          },
        },
      },
    },
  });

  if (!bom) {
    throw new NotFoundError('BOM not found');
  }

  return bom;
}

export async function createBOMVersion(companyId: string, input: CreateBOMVersionInput, userId: string) {
  const db = prisma as any;

  const bom = await db.bOM.findFirst({
    where: { id: input.bomId, companyId },
    include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
  });

  if (!bom) {
    throw new NotFoundError('BOM not found');
  }

  const latestVersionNumber = bom.versions[0]?.version || 0;
  const newVersionNumber = latestVersionNumber + 1;

  return prisma.$transaction(async (tx: any) => {
    // Set old versions to INACTIVE if needed
    await tx.bOMVersion.updateMany({
      where: { bomId: bom.id, status: 'ACTIVE' },
      data: { status: 'SUPERSEDED', effectiveTo: new Date() },
    });

    const newVersion = await tx.bOMVersion.create({
      data: {
        bomId: bom.id,
        version: newVersionNumber,
        status: 'ACTIVE',
        quantity: input.quantity || 1,
        uom: input.uom || 'pcs',
        notes: input.notes || null,
        items: {
          create: input.items.map((item) => ({
            materialProductId: item.materialProductId,
            quantity: item.quantity,
            uom: item.uom || 'pcs',
            wastePercentage: item.wastePercentage || 0,
            scrapPercentage: item.scrapPercentage || 0,
            operation: item.operation || null,
            isOptional: item.isOptional || false,
          })),
        },
      },
      include: {
        items: {
          include: { materialProduct: true },
        },
      },
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'BOM_VERSION_CREATED',
      entity: 'BOMVersion',
      entityId: newVersion.id,
      metadata: { bomId: bom.id, version: newVersionNumber },
    });

    return newVersion;
  });
}

export interface ExplodedMaterial {
  materialProductId: string;
  materialName: string;
  sku: string;
  unitCost: number;
  requiredQuantity: number;
  wasteQuantity: number;
  totalQuantity: number;
  uom: string;
  operation?: string | null;
}

export async function explodeBOM(
  companyId: string,
  productId: string,
  targetQuantity: number = 1,
  bomVersionId?: string,
  visitedProducts: Set<string> = new Set()
): Promise<ExplodedMaterial[]> {
  const db = prisma as any;

  if (visitedProducts.has(productId)) {
    throw new BadRequestError(`Circular dependency detected in BOM explosion for product ${productId}`);
  }

  visitedProducts.add(productId);

  // Find active BOM for the product
  let version: any = null;

  if (bomVersionId) {
    version = await db.bOMVersion.findFirst({
      where: { id: bomVersionId, bom: { companyId } },
      include: {
        items: {
          include: { materialProduct: true },
        },
      },
    });
  } else {
    const bom = await db.bOM.findFirst({
      where: { productId, companyId, isActive: true },
      include: {
        versions: {
          where: { status: 'ACTIVE' },
          orderBy: { version: 'desc' },
          take: 1,
          include: {
            items: {
              include: { materialProduct: true },
            },
          },
        },
      },
    });

    version = bom?.versions[0];
  }

  if (!version || !version.items || version.items.length === 0) {
    // Product has no BOM (it is a raw material or simple item)
    return [];
  }

  const materialsMap = new Map<string, ExplodedMaterial>();
  const baseQty = version.quantity || 1;
  const multiplier = targetQuantity / baseQty;

  for (const item of version.items) {
    const rawQty = item.quantity * multiplier;
    const wasteQty = rawQty * ((item.wastePercentage || 0) / 100);
    const itemTotalQty = rawQty + wasteQty;

    // Check if material product itself has a BOM (nested BOM explosion)
    const subExplosion = await explodeBOM(
      companyId,
      item.materialProductId,
      itemTotalQty,
      undefined,
      new Set(visitedProducts)
    );

    if (subExplosion.length > 0) {
      // Add sub-materials
      for (const subItem of subExplosion) {
        const existing = materialsMap.get(subItem.materialProductId);
        if (existing) {
          existing.requiredQuantity += subItem.requiredQuantity;
          existing.wasteQuantity += subItem.wasteQuantity;
          existing.totalQuantity += subItem.totalQuantity;
        } else {
          materialsMap.set(subItem.materialProductId, { ...subItem });
        }
      }
    } else {
      // Direct raw material
      const existing = materialsMap.get(item.materialProductId);
      if (existing) {
        existing.requiredQuantity += rawQty;
        existing.wasteQuantity += wasteQty;
        existing.totalQuantity += itemTotalQty;
      } else {
        materialsMap.set(item.materialProductId, {
          materialProductId: item.materialProductId,
          materialName: item.materialProduct.name,
          sku: item.materialProduct.sku,
          unitCost: item.materialProduct.purchasePrice || 0,
          requiredQuantity: rawQty,
          wasteQuantity: wasteQty,
          totalQuantity: itemTotalQty,
          uom: item.uom || 'pcs',
          operation: item.operation || null,
        });
      }
    }
  }

  return Array.from(materialsMap.values());
}
