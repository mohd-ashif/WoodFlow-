import { prisma } from '../../config/prisma.js';
import { GoodsReceiptInput } from '@furniture-os/shared';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { processInventoryTransaction } from '../../services/inventory-transaction.service.js';
import { createAuditLog } from '../audit/audit.service.js';

export async function generateNextGRNNumber(tx: any, companyId: string): Promise<string> {
  const count = await tx.goodsReceipt.count({ where: { companyId } });
  const codeStr = String(count + 1).padStart(5, '0');
  return `GRN-${codeStr}`;
}

export async function createGoodsReceipt(companyId: string, input: GoodsReceiptInput, userId: string) {
  const db = prisma as any;

  const purchase = await db.purchase.findFirst({
    where: { id: input.purchaseId, companyId },
    include: { items: true, supplier: true },
  });

  if (!purchase) {
    throw new NotFoundError('Purchase Order not found');
  }

  return prisma.$transaction(async (tx: any) => {
    const grnNumber = await generateNextGRNNumber(tx, companyId);

    const grn = await tx.goodsReceipt.create({
      data: {
        companyId,
        grnNumber,
        purchaseId: input.purchaseId,
        supplierId: input.supplierId || purchase.supplierId || null,
        status: 'RECEIVED',
        receivedDate: new Date(),
        notes: input.notes || null,
        createdBy: userId,
        items: {
          create: input.items.map((item) => ({
            purchaseItemId: item.purchaseItemId || null,
            productId: item.productId,
            receivedQty: item.receivedQty,
            rejectedQty: item.rejectedQty || 0,
            unitCost: item.unitCost || 0,
            notes: item.notes || null,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    // Process Stock Movement for valid received items (RAW_MATERIAL_STORE IN)
    const stockItems = input.items
      .filter((i) => i.receivedQty > 0)
      .map((i) => ({
        productId: i.productId,
        quantity: i.receivedQty,
        unitCost: i.unitCost,
        reason: `Goods Receipt #${grnNumber} for PO #${purchase.purchaseNumber}`,
      }));

    if (stockItems.length > 0) {
      await processInventoryTransaction({
        companyId,
        userId,
        movementType: 'PURCHASE_RECEIPT',
        referenceType: 'GOODS_RECEIPT',
        referenceId: grn.id,
        items: stockItems,
      });
    }

    // Update Purchase Order status to RECEIVED
    await tx.purchase.update({
      where: { id: purchase.id },
      data: {
        status: 'RECEIVED',
      },
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'GOODS_RECEIPT_POSTED',
      entity: 'GoodsReceipt',
      entityId: grn.id,
      metadata: { grnNumber, purchaseNumber: purchase.purchaseNumber },
    });

    return grn;
  });
}

export async function listGoodsReceipts(companyId: string) {
  const db = prisma as any;

  return db.goodsReceipt.findMany({
    where: { companyId },
    include: {
      purchase: { select: { id: true, purchaseNumber: true } },
      supplier: { select: { id: true, name: true, supplierCode: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
}
