import { prisma } from '../config/prisma.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';
import { createAuditLog } from '../modules/audit/audit.service.js';

export interface StockChangeItem {
  productId: string;
  quantity: number;
  locationId?: string | null;
  unitCost?: number;
  reason?: string;
  notes?: string;
}

export interface InventoryTransactionOptions {
  companyId: string;
  userId: string;
  movementType:
    | 'PURCHASE_RECEIPT'
    | 'SALES_DELIVERY'
    | 'PRODUCTION_ISSUE'
    | 'PRODUCTION_RECEIPT'
    | 'TRANSFER_OUT'
    | 'TRANSFER_IN'
    | 'STOCK_ADJUSTMENT_IN'
    | 'STOCK_ADJUSTMENT_OUT'
    | 'SCRAP'
    | 'RETURN_IN'
    | 'RETURN_OUT';
  referenceType?: string;
  referenceId?: string;
  items: StockChangeItem[];
  idempotencyKey?: string;
}

export async function processInventoryTransaction(options: InventoryTransactionOptions) {
  const { companyId, userId, movementType, referenceType, referenceId, items } = options;

  if (!items || items.length === 0) {
    throw new BadRequestError('Transaction must contain at least one product item');
  }

  return prisma.$transaction(
    async (tx: any) => {
      // 1. Fetch company negative stock settings
      const company = await tx.company.findUnique({
        where: { id: companyId },
        select: { allowNegativeStock: true },
      });

      if (!company) {
        throw new NotFoundError('Company not found');
      }

      const results = [];

      for (const item of items) {
        if (!item.productId || item.quantity <= 0) {
          continue;
        }

        // Lock Inventory row using PostgreSQL FOR UPDATE
        const rawInventories: any[] = await tx.$queryRawUnsafe(
          `SELECT * FROM "inventories" WHERE "productId" = $1 AND "companyId" = $2 FOR UPDATE`,
          item.productId,
          companyId
        );

        let inventory = rawInventories[0];

        if (!inventory) {
          inventory = await tx.inventory.create({
            data: {
              companyId,
              productId: item.productId,
              currentQuantity: 0,
              reservedQuantity: 0,
              availableQuantity: 0,
            },
          });
        }

        const currentQty = (inventory.currentQuantity as number) || 0;
        const reservedQty = (inventory.reservedQuantity as number) || 0;
        let newQty = currentQty;

        const isInflow = [
          'PURCHASE_RECEIPT',
          'PRODUCTION_RECEIPT',
          'STOCK_ADJUSTMENT_IN',
          'TRANSFER_IN',
          'RETURN_IN',
        ].includes(movementType);

        if (isInflow) {
          newQty = currentQty + item.quantity;
        } else {
          newQty = currentQty - item.quantity;
        }

        // Validate negative stock threshold
        if (newQty < 0 && !company.allowNegativeStock) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { name: true, sku: true },
          });
          throw new BadRequestError(
            `Insufficient stock for "${product?.name || item.productId}". Available: ${currentQty}, Required: ${item.quantity}`,
            'INSUFFICIENT_STOCK'
          );
        }

        // Update Inventory record
        const updatedInventory = await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            currentQuantity: newQty,
            availableQuantity: newQty - reservedQty,
          },
        });

        // Update Product cached stock & purchase price if applicable
        const productUpdateData: any = { currentStock: newQty };
        if (item.unitCost && item.unitCost > 0 && movementType === 'PURCHASE_RECEIPT') {
          productUpdateData.purchasePrice = item.unitCost;
        }

        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: productUpdateData,
          select: { name: true, sku: true },
        });

        // Record immutable StockMovement entry
        const movement = await tx.stockMovement.create({
          data: {
            companyId,
            productId: item.productId,
            movementType: movementType as any,
            quantity: isInflow ? item.quantity : -item.quantity,
            previousQuantity: currentQty,
            newQuantity: newQty,
            referenceType: referenceType || null,
            referenceId: referenceId || null,
            reason: item.reason || `${movementType} transaction`,
            notes: item.notes || null,
            createdBy: userId,
          },
        });

        results.push({ inventory: updatedInventory, product: updatedProduct, movement });
      }

      await createAuditLog(
        {
          userId,
          companyId,
          action: `INVENTORY_${movementType}`,
          entity: 'InventoryTransaction',
          entityId: referenceId || undefined,
          metadata: {
            movementType,
            referenceType,
            referenceId,
            itemCount: items.length,
          },
        },
        tx
      );

      return results;
    },
    { maxWait: 15000, timeout: 30000 }
  );
}
