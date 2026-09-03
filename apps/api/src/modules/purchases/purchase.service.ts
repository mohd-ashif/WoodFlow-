import { prisma } from '../../config/prisma.js';
import { CreatePurchaseInput, UpdatePurchaseInput } from '@furniture-os/shared';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { calculatePurchaseTotals } from './purchase.calculator.js';
import { generateNextPurchaseNumber, findPurchaseById, listPurchases } from './purchase.repository.js';
import { createAuditLog } from '../audit/audit.service.js';

export async function createPurchaseDraft(companyId: string, input: CreatePurchaseInput, userId: string) {
  const db = prisma as any;

  // Validate Supplier if provided
  let supplier: any = null;
  if (input.supplierId) {
    supplier = await db.supplier.findFirst({
      where: { id: input.supplierId, companyId },
    });
    if (!supplier) {
      throw new NotFoundError('Supplier not found for this company');
    }
  }

  // Validate Products
  const productIds = input.items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, companyId },
    select: { id: true, name: true, sku: true, costPrice: true },
  });

  if (products.length !== productIds.length) {
    throw new BadRequestError('One or more selected products are invalid');
  }

  const productMap = new Map<string, { id: string; name: string; sku: string; purchasePrice?: number }>(
    products.map((p: any) => [p.id, { ...p, purchasePrice: Number(p.costPrice || 0) }])
  );

  const rawItems = input.items.map((item) => ({
    product: productMap.get(item.productId)!,
    quantity: item.quantity,
    unitCost: item.unitCost,
    discountAmount: item.discountAmount,
    taxRate: item.taxRate,
  }));

  const totals = calculatePurchaseTotals({
    rawItems,
    overallDiscountAmount: input.discountAmount,
    overallTaxRate: input.taxRate,
  });

  return prisma.$transaction(
    async (tx: any) => {
      const purchaseNumber = await generateNextPurchaseNumber(tx, companyId);
      const purchaseModel = tx.purchase || tx.Purchase || db.purchase || db.Purchase;

      const purchase = await purchaseModel.create({
        data: {
          companyId,
          purchaseNumber,
          supplierId: input.supplierId || null,
          referenceNumber: input.referenceNumber || null,
          status: 'DRAFT',
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          taxAmount: totals.taxAmount,
          totalAmount: totals.totalAmount,
          paidAmount: 0,
          dueAmount: totals.totalAmount,
          paymentStatus: 'UNPAID',
          notes: input.notes || null,
          purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : new Date(),
          createdBy: userId,
          items: {
            create: totals.items.map((item) => ({
              companyId,
              productId: item.productId,
              productNameSnapshot: item.productNameSnapshot,
              skuSnapshot: item.skuSnapshot,
              quantity: item.quantity,
              unitCost: item.unitCost,
              discountAmount: item.discountAmount,
              taxRate: item.taxRate,
              taxAmount: item.taxAmount,
              totalAmount: item.totalAmount,
            })),
          },
        },
        include: {
          items: true,
          supplier: true,
        },
      });

      await createAuditLog({
        userId,
        companyId,
        action: 'PURCHASE_CREATED',
        entity: 'Purchase',
        entityId: purchase.id,
        metadata: { purchaseNumber: purchase.purchaseNumber, totalAmount: purchase.totalAmount, status: 'DRAFT' },
      });

      return purchase;
    },
    { maxWait: 15000, timeout: 30000 }
  );
}

export async function confirmPurchase(companyId: string, purchaseId: string, userId: string) {
  const db = prisma as any;

  return prisma.$transaction(
    async (tx: any) => {
      const purchaseModel = tx.purchase || tx.Purchase || db.purchase || db.Purchase;

      // 1. Fetch & lock purchase
      const purchase = await purchaseModel.findFirst({
        where: { id: purchaseId, companyId },
        include: {
          items: true,
          supplier: true,
        },
      });

      if (!purchase) {
        throw new NotFoundError('Purchase record not found');
      }

      if (purchase.status === 'CONFIRMED' || purchase.status === 'RECEIVED') {
        return findPurchaseById(companyId, purchaseId);
      }

      if (purchase.status === 'CANCELLED') {
        throw new BadRequestError('Cannot confirm a cancelled purchase');
      }

      // 2. Increase stock and create STOCK_IN movements
      for (const item of purchase.items) {
        if (!item.productId) continue;

        // Row-level lock for concurrency safety
        const rawInventories: any[] = await tx.$queryRawUnsafe(
          `SELECT * FROM "inventories" WHERE "productId" = $1 AND "companyId" = $2 FOR UPDATE`,
          item.productId,
          companyId
        );

        let inventory = rawInventories[0];
        if (!inventory) {
          // Create inventory record if it doesn't exist yet
          inventory = await tx.inventory.create({
            data: {
              companyId,
              productId: item.productId,
              currentQuantity: 0,
              availableQuantity: 0,
              reservedQuantity: 0,
            },
          });
        }

        const currentQty = (inventory.currentQuantity as number) || 0;
        const newQty = currentQty + item.quantity;

        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            currentQuantity: newQty,
            availableQuantity: newQty - (inventory.reservedQuantity || 0),
          },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: {
            currentStock: newQty,
            purchasePrice: item.unitCost, // Update last acquisition cost
          },
        });

        await tx.stockMovement.create({
          data: {
            companyId,
            productId: item.productId,
            movementType: 'PURCHASE',
            quantity: item.quantity,
            previousQuantity: currentQty,
            newQuantity: newQty,
            referenceType: 'PURCHASE',
            referenceId: purchase.id,
            reason: `Purchase Receipt #${purchase.purchaseNumber}`,
            createdBy: userId,
          },
        });
      }

      // 3. Update Purchase status to CONFIRMED / RECEIVED
      const updatedPurchase = await purchaseModel.update({
        where: { id: purchase.id },
        data: {
          status: 'CONFIRMED',
        },
        include: {
          supplier: true,
          items: true,
        },
      });

      // 4. Record Supplier CRM Activity if linked
      if (purchase.supplierId) {
        const crmModel = tx.crmActivity || tx.cRMActivity;
        if (crmModel) {
          await crmModel.create({
            data: {
              companyId,
              entityType: 'SUPPLIER',
              entityId: purchase.supplierId,
              activityType: 'NOTE',
              title: `Confirmed Purchase Order #${purchase.purchaseNumber}`,
              description: `Stock IN recorded for total value ₹${purchase.totalAmount.toLocaleString('en-IN')}`,
              createdBy: userId,
            },
          });
        }
      }

      // 5. Record Audit Log
      await createAuditLog({
        userId,
        companyId,
        action: 'PURCHASE_CONFIRMED',
        entity: 'Purchase',
        entityId: purchase.id,
        metadata: { purchaseNumber: purchase.purchaseNumber, totalAmount: purchase.totalAmount },
      });

      return updatedPurchase;
    },
    { maxWait: 15000, timeout: 30000 }
  );
}

export async function cancelPurchase(companyId: string, purchaseId: string, reason: string, userId: string) {
  const db = prisma as any;

  return prisma.$transaction(
    async (tx: any) => {
      const purchaseModel = tx.purchase || tx.Purchase || db.purchase || db.Purchase;

      const purchase = await purchaseModel.findFirst({
        where: { id: purchaseId, companyId },
        include: { items: true },
      });

      if (!purchase) {
        throw new NotFoundError('Purchase record not found');
      }

      if (purchase.status === 'CANCELLED') {
        throw new BadRequestError('Purchase is already cancelled');
      }

      const wasConfirmed = purchase.status === 'CONFIRMED' || purchase.status === 'RECEIVED';

      // Reverse stock if purchase was confirmed
      if (wasConfirmed) {
        for (const item of purchase.items) {
          if (!item.productId) continue;

          const inventory = await tx.inventory.findFirst({
            where: { productId: item.productId, companyId },
          });

          if (inventory) {
            const currentQty = inventory.currentQuantity as number;
            if (currentQty < item.quantity) {
              throw new BadRequestError(
                `Cannot cancel purchase: stock for "${item.productNameSnapshot}" has already been consumed/sold. (Current stock: ${currentQty}, Purchase qty: ${item.quantity})`,
                'INSUFFICIENT_STOCK_FOR_REVERSAL'
              );
            }
            const newQty = currentQty - item.quantity;

            await tx.inventory.update({
              where: { id: inventory.id },
              data: {
                currentQuantity: newQty,
                availableQuantity: newQty - (inventory.reservedQuantity || 0),
              },
            });

            await tx.product.update({
              where: { id: item.productId },
              data: { currentStock: newQty },
            });

            await tx.stockMovement.create({
              data: {
                companyId,
                productId: item.productId,
                movementType: 'PURCHASE_RETURN',
                quantity: -item.quantity,
                previousQuantity: currentQty,
                newQuantity: newQty,
                referenceType: 'PURCHASE_CANCELLATION',
                referenceId: purchase.id,
                reason: `Purchase Reversal #${purchase.purchaseNumber}: ${reason}`,
                createdBy: userId,
              },
            });
          }
        }
      }

      const cancelledPurchase = await purchaseModel.update({
        where: { id: purchase.id },
        data: {
          status: 'CANCELLED',
          notes: purchase.notes ? `${purchase.notes} | Cancelled: ${reason}` : `Cancelled: ${reason}`,
        },
        include: {
          supplier: true,
          items: true,
        },
      });

      await createAuditLog({
        userId,
        companyId,
        action: 'PURCHASE_CANCELLED',
        entity: 'Purchase',
        entityId: purchase.id,
        metadata: { purchaseNumber: purchase.purchaseNumber, reason, stockReversed: wasConfirmed },
      });

      return cancelledPurchase;
    },
    { maxWait: 15000, timeout: 30000 }
  );
}

export async function getPurchasesList(
  companyId: string,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    supplierId?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  return listPurchases(companyId, options);
}

export async function getPurchaseDetails(companyId: string, purchaseId: string) {
  const purchase = await findPurchaseById(companyId, purchaseId);
  if (!purchase) {
    throw new NotFoundError('Purchase not found');
  }
  return purchase;
}

export async function getPurchasesOverview(companyId: string) {
  const db = prisma as any;
  const purchaseModel = db.purchase || db.Purchase;
  if (!purchaseModel) {
    return {
      totalPurchasesCount: 0,
      totalPurchasesValue: 0,
      pendingPurchasesCount: 0,
      cancelledPurchasesCount: 0,
      topSuppliers: [],
    };
  }

  const [totalPurchases, confirmedPurchases, pendingPurchases, cancelledPurchases, topSuppliers] = await Promise.all([
    purchaseModel.count({ where: { companyId } }),
    purchaseModel.findMany({
      where: { companyId, status: { in: ['CONFIRMED', 'RECEIVED'] } },
      select: { totalAmount: true },
    }),
    purchaseModel.count({ where: { companyId, status: 'DRAFT' } }),
    purchaseModel.count({ where: { companyId, status: 'CANCELLED' } }),
    db.supplier.findMany({
      where: { companyId },
      take: 5,
      select: { id: true, name: true, phone: true, supplierCode: true },
    }),
  ]);

  const totalValue = confirmedPurchases.reduce((acc: number, p: any) => acc + (p.totalAmount || 0), 0);

  return {
    totalPurchasesCount: totalPurchases,
    totalPurchasesValue: totalValue,
    pendingPurchasesCount: pendingPurchases,
    cancelledPurchasesCount: cancelledPurchases,
    topSuppliers,
  };
}
