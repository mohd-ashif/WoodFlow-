import { prisma } from '../../config/prisma.js';
import { CreateDeliveryInput, UpdateDeliveryStatusInput } from '@furniture-os/shared';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { processInventoryTransaction } from '../../services/inventory-transaction.service.js';
import { createAuditLog } from '../audit/audit.service.js';

export async function generateNextDeliveryNumber(tx: any, companyId: string): Promise<string> {
  const count = await tx.delivery.count({ where: { companyId } });
  const codeStr = String(count + 1).padStart(5, '0');
  return `DEL-${codeStr}`;
}

export async function createDelivery(companyId: string, input: CreateDeliveryInput, userId: string) {
  const db = prisma as any;

  const sale = await db.sale.findFirst({
    where: { id: input.salesOrderId, companyId },
    include: { items: true, customer: true },
  });

  if (!sale) {
    throw new NotFoundError('Sales order not found');
  }

  return prisma.$transaction(async (tx: any) => {
    const deliveryNumber = await generateNextDeliveryNumber(tx, companyId);

    const delivery = await tx.delivery.create({
      data: {
        companyId,
        deliveryNumber,
        salesOrderId: input.salesOrderId,
        customerId: input.customerId,
        status: 'DISPATCHED',
        dispatchDate: input.dispatchDate ? new Date(input.dispatchDate) : new Date(),
        deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
        trackingNumber: input.trackingNumber || null,
        notes: input.notes || null,
        createdBy: userId,
        items: {
          create: input.items.map((item) => ({
            saleItemId: item.saleItemId || null,
            productId: item.productId,
            quantity: item.quantity,
            notes: item.notes || null,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        customer: true,
        salesOrder: true,
      },
    });

    // Execute Stock Movement: SALES_DELIVERY (Stock OUT from Finished Goods)
    const stockItems = input.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      reason: `Sales Delivery #${deliveryNumber} for Order #${sale.saleNumber}`,
    }));

    await processInventoryTransaction({
      companyId,
      userId,
      movementType: 'SALES_DELIVERY',
      referenceType: 'DELIVERY',
      referenceId: delivery.id,
      items: stockItems,
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'DELIVERY_CREATED',
      entity: 'Delivery',
      entityId: delivery.id,
      metadata: { deliveryNumber, salesNumber: sale.saleNumber },
    });

    return delivery;
  });
}

export async function listDeliveries(companyId: string, salesOrderId?: string) {
  const db = prisma as any;
  const where: any = { companyId };
  if (salesOrderId) {
    where.salesOrderId = salesOrderId;
  }

  return db.delivery.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, customerCode: true, phone: true } },
      salesOrder: { select: { id: true, saleNumber: true, status: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getDeliveryById(companyId: string, id: string) {
  const db = prisma as any;
  const delivery = await db.delivery.findFirst({
    where: { id, companyId },
    include: {
      customer: true,
      salesOrder: true,
      items: { include: { product: true } },
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  if (!delivery) {
    throw new NotFoundError('Delivery record not found');
  }

  return delivery;
}

export async function updateDeliveryStatus(
  companyId: string,
  id: string,
  input: UpdateDeliveryStatusInput,
  userId: string
) {
  const db = prisma as any;

  const delivery = await db.delivery.findFirst({
    where: { id, companyId },
  });

  if (!delivery) {
    throw new NotFoundError('Delivery record not found');
  }

  const updated = await db.delivery.update({
    where: { id },
    data: {
      status: input.status,
      trackingNumber: input.trackingNumber !== undefined ? input.trackingNumber : delivery.trackingNumber,
      notes: input.notes !== undefined ? input.notes : delivery.notes,
      deliveryDate: input.status === 'DELIVERED' ? new Date() : delivery.deliveryDate,
    },
    include: {
      customer: true,
      items: { include: { product: true } },
    },
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'DELIVERY_STATUS_UPDATED',
    entity: 'Delivery',
    entityId: id,
    metadata: { deliveryNumber: delivery.deliveryNumber, newStatus: input.status },
  });

  return updated;
}
