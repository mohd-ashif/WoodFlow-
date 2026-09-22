import { prisma } from '../../config/prisma.js';
import { CreatePurchaseRequestInput } from '@furniture-os/shared';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';
import { createPurchaseDraft } from './purchase.service.js';

export async function generateNextPRNumber(tx: any, companyId: string): Promise<string> {
  const count = await tx.purchaseRequest.count({ where: { companyId } });
  const codeStr = String(count + 1).padStart(5, '0');
  return `PR-${codeStr}`;
}

export async function createPurchaseRequest(companyId: string, input: CreatePurchaseRequestInput, userId: string) {
  const db = prisma as any;

  return prisma.$transaction(async (tx: any) => {
    const requestNumber = await generateNextPRNumber(tx, companyId);

    const pr = await tx.purchaseRequest.create({
      data: {
        companyId,
        requestNumber,
        supplierId: input.supplierId || null,
        mrpRequirementId: input.mrpRequirementId || null,
        workOrderId: input.workOrderId || null,
        salesOrderId: input.salesOrderId || null,
        status: 'SUBMITTED',
        notes: input.notes || null,
        createdBy: userId,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            requiredQuantity: item.requiredQuantity,
            estimatedUnitCost: item.estimatedUnitCost || 0,
            notes: item.notes || null,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        supplier: true,
      },
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'PURCHASE_REQUEST_CREATED',
      entity: 'PurchaseRequest',
      entityId: pr.id,
      metadata: { requestNumber: pr.requestNumber, itemCount: input.items.length },
    });

    return pr;
  });
}

export async function listPurchaseRequests(companyId: string) {
  const db = prisma as any;

  return db.purchaseRequest.findMany({
    where: { companyId },
    include: {
      supplier: { select: { id: true, name: true, supplierCode: true } },
      items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      purchases: { select: { id: true, purchaseNumber: true, status: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function convertPRToPO(companyId: string, prId: string, userId: string) {
  const db = prisma as any;

  const pr = await db.purchaseRequest.findFirst({
    where: { id: prId, companyId },
    include: { items: { include: { product: true } }, supplier: true },
  });

  if (!pr) {
    throw new NotFoundError('Purchase request not found');
  }

  if (pr.status === 'PO_CREATED') {
    throw new BadRequestError('Purchase Order has already been created for this request');
  }

  const purchaseItems = pr.items.map((item: any) => ({
    productId: item.productId,
    quantity: item.requiredQuantity,
    unitCost: item.estimatedUnitCost || item.product?.purchasePrice || 0,
    discountAmount: 0,
    taxRate: 0,
  }));

  const purchase = await createPurchaseDraft(
    companyId,
    {
      supplierId: pr.supplierId || undefined,
      items: purchaseItems as any,
      discountAmount: 0,
      taxRate: 0,
      notes: `Generated from Purchase Request #${pr.requestNumber}. ${pr.notes || ''}`,
      referenceNumber: pr.requestNumber,
    },
    userId
  );

  await db.purchaseRequest.update({
    where: { id: prId },
    data: {
      status: 'PO_CREATED',
    },
  });

  await db.purchase.update({
    where: { id: purchase.id },
    data: {
      purchaseRequestId: pr.id,
      workOrderId: pr.workOrderId || null,
      salesOrderId: pr.salesOrderId || null,
    },
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'PURCHASE_REQUEST_CONVERTED_TO_PO',
    entity: 'PurchaseRequest',
    entityId: pr.id,
    metadata: { requestNumber: pr.requestNumber, purchaseId: purchase.id },
  });

  return purchase;
}
