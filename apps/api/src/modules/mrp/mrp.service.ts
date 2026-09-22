import { prisma } from '../../config/prisma.js';
import { RunMRPInput, ReserveMaterialInput } from '@furniture-os/shared';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { explodeBOM } from '../bom/bom.service.js';
import { createAuditLog } from '../audit/audit.service.js';

export interface MaterialRequirementSummary {
  materialProductId: string;
  materialName: string;
  sku: string;
  unitCost: number;
  grossRequirement: number;
  onHandStock: number;
  reservedStock: number;
  availableStock: number;
  incomingSupply: number;
  netRequirement: number;
  status: 'READY' | 'PARTIAL' | 'SHORTAGE' | 'PURCHASE_REQUIRED';
}

export async function runMRP(companyId: string, input?: RunMRPInput) {
  const db = prisma as any;

  // 1. Gather all active demand sources (Sales Demands or Work Orders)
  const demands = await db.salesDemand.findMany({
    where: {
      companyId,
      status: { in: ['PENDING', 'MRP_PROCESSED'] },
      ...(input?.salesOrderId ? { sourceId: input.salesOrderId } : {}),
      ...(input?.productId ? { productId: input.productId } : {}),
    },
    include: {
      product: true,
      sale: { select: { saleNumber: true, customer: { select: { name: true } } } },
    },
  });

  const grossMaterialMap = new Map<
    string,
    {
      materialProductId: string;
      materialName: string;
      sku: string;
      unitCost: number;
      grossQuantity: number;
    }
  >();

  // 2. Explode BOM for each demanded finished product
  for (const demand of demands) {
    const qty = input?.quantity || demand.quantity || 1;
    const exploded = await explodeBOM(companyId, demand.productId, qty);

    for (const mat of exploded) {
      const existing = grossMaterialMap.get(mat.materialProductId);
      if (existing) {
        existing.grossQuantity += mat.totalQuantity;
      } else {
        grossMaterialMap.set(mat.materialProductId, {
          materialProductId: mat.materialProductId,
          materialName: mat.materialName,
          sku: mat.sku,
          unitCost: mat.unitCost,
          grossQuantity: mat.totalQuantity,
        });
      }
    }
  }

  // If no demands registered, fall back to checking all raw material stock against minimum stock
  if (grossMaterialMap.size === 0) {
    const lowStockRawMaterials = await db.product.findMany({
      where: {
        companyId,
        productType: 'RAW_MATERIAL',
        isActive: true,
      },
      include: { inventory: true },
    });

    for (const raw of lowStockRawMaterials) {
      if ((raw.currentStock || 0) < (raw.minimumStock || 0)) {
        grossMaterialMap.set(raw.id, {
          materialProductId: raw.id,
          materialName: raw.name,
          sku: raw.sku,
          unitCost: raw.purchasePrice || 0,
          grossQuantity: (raw.minimumStock || 0) - (raw.currentStock || 0),
        });
      }
    }
  }

  // 3. Compare with Inventory, Reservations, and Pending POs
  const requirements: MaterialRequirementSummary[] = [];

  for (const [materialId, data] of grossMaterialMap.entries()) {
    const [inventory, incomingPos] = await Promise.all([
      db.inventory.findFirst({
        where: { productId: materialId, companyId },
      }),
      db.purchaseItem.findMany({
        where: {
          productId: materialId,
          companyId,
          purchase: { status: { in: ['DRAFT', 'CONFIRMED'] } },
        },
        select: { quantity: true },
      }),
    ]);

    const onHand = (inventory?.currentQuantity as number) || 0;
    const reserved = (inventory?.reservedQuantity as number) || 0;
    const available = Math.max(0, onHand - reserved);
    const incoming = incomingPos.reduce((sum: number, po: any) => sum + (po.quantity || 0), 0);

    const netRequirement = Math.max(0, data.grossQuantity - available - incoming);

    let status: 'READY' | 'PARTIAL' | 'SHORTAGE' | 'PURCHASE_REQUIRED' = 'READY';
    if (netRequirement > 0) {
      status = available > 0 ? 'PARTIAL' : 'PURCHASE_REQUIRED';
    }

    requirements.push({
      materialProductId: materialId,
      materialName: data.materialName,
      sku: data.sku,
      unitCost: data.unitCost,
      grossRequirement: data.grossQuantity,
      onHandStock: onHand,
      reservedStock: reserved,
      availableStock: available,
      incomingSupply: incoming,
      netRequirement,
      status,
    });
  }

  // 4. Mark demand records as MRP_PROCESSED
  if (demands.length > 0) {
    await db.salesDemand.updateMany({
      where: { id: { in: demands.map((d: any) => d.id) } },
      data: { status: 'MRP_PROCESSED' },
    });
  }

  return {
    timestamp: new Date().toISOString(),
    totalDemandsProcessed: demands.length,
    materialRequirements: requirements,
    hasShortage: requirements.some((r) => r.netRequirement > 0),
  };
}

export async function reserveStock(companyId: string, input: ReserveMaterialInput, userId: string) {
  const db = prisma as any;

  return prisma.$transaction(async (tx: any) => {
    // Row lock on inventory
    const rawInventories: any[] = await tx.$queryRawUnsafe(
      `SELECT * FROM "inventories" WHERE "productId" = $1 AND "companyId" = $2 FOR UPDATE`,
      input.productId,
      companyId
    );

    let inventory = rawInventories[0];
    if (!inventory) {
      throw new NotFoundError('Inventory record not found for product');
    }

    const currentQty = (inventory.currentQuantity as number) || 0;
    const reservedQty = (inventory.reservedQuantity as number) || 0;
    const availableQty = currentQty - reservedQty;

    if (availableQty < input.quantity) {
      throw new BadRequestError(
        `Cannot reserve ${input.quantity} units. Available stock is only ${availableQty}.`,
        'INSUFFICIENT_STOCK_FOR_RESERVATION'
      );
    }

    const newReserved = reservedQty + input.quantity;
    const newAvailable = currentQty - newReserved;

    await tx.inventory.update({
      where: { id: inventory.id },
      data: {
        reservedQuantity: newReserved,
        availableQuantity: newAvailable,
      },
    });

    const reservation = await tx.inventoryReservation.create({
      data: {
        companyId,
        productId: input.productId,
        locationId: input.locationId || null,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        sourceLineId: input.sourceLineId || null,
        quantity: input.quantity,
        status: 'RESERVED',
        workOrderId: input.workOrderId || null,
        salesOrderId: input.salesOrderId || null,
      },
    });

    // If linked to WorkOrderMaterial, update its reservedQuantity
    if (input.workOrderId) {
      const woMat = await tx.workOrderMaterial.findFirst({
        where: { workOrderId: input.workOrderId, productId: input.productId },
      });
      if (woMat) {
        await tx.workOrderMaterial.update({
          where: { id: woMat.id },
          data: { reservedQuantity: woMat.reservedQuantity + input.quantity },
        });
      }
    }

    await createAuditLog({
      userId,
      companyId,
      action: 'STOCK_RESERVED',
      entity: 'InventoryReservation',
      entityId: reservation.id,
      metadata: { productId: input.productId, quantity: input.quantity, sourceType: input.sourceType },
    });

    return reservation;
  });
}

export async function releaseStockReservation(companyId: string, reservationId: string, userId: string) {
  const db = prisma as any;

  return prisma.$transaction(async (tx: any) => {
    const reservation = await tx.inventoryReservation.findFirst({
      where: { id: reservationId, companyId, status: 'RESERVED' },
    });

    if (!reservation) {
      throw new NotFoundError('Active reservation not found');
    }

    const rawInventories: any[] = await tx.$queryRawUnsafe(
      `SELECT * FROM "inventories" WHERE "productId" = $1 AND "companyId" = $2 FOR UPDATE`,
      reservation.productId,
      companyId
    );

    const inventory = rawInventories[0];
    if (inventory) {
      const currentQty = (inventory.currentQuantity as number) || 0;
      const reservedQty = (inventory.reservedQuantity as number) || 0;
      const newReserved = Math.max(0, reservedQty - reservation.quantity);
      const newAvailable = currentQty - newReserved;

      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          reservedQuantity: newReserved,
          availableQuantity: newAvailable,
        },
      });
    }

    const updated = await tx.inventoryReservation.update({
      where: { id: reservation.id },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
      },
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'STOCK_RESERVATION_RELEASED',
      entity: 'InventoryReservation',
      entityId: reservation.id,
      metadata: { productId: reservation.productId, quantity: reservation.quantity },
    });

    return updated;
  });
}
