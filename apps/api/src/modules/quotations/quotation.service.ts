import { prisma } from '../../config/prisma.js';
import { CreateQuotationInput, UpdateQuotationInput } from '@furniture-os/shared';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';
import { createSaleDraft } from '../sales/sale.service.js';

export async function generateNextQuotationNumber(tx: any, companyId: string): Promise<string> {
  const count = await tx.quotation.count({ where: { companyId } });
  const codeStr = String(count + 1).padStart(5, '0');
  return `QTN-${codeStr}`;
}

export async function createQuotation(companyId: string, input: CreateQuotationInput, userId: string) {
  const db = prisma as any;

  const customer = await db.customer.findFirst({
    where: { id: input.customerId, companyId },
  });

  if (!customer) {
    throw new NotFoundError('Customer not found');
  }

  return prisma.$transaction(async (tx: any) => {
    const quotationNumber = await generateNextQuotationNumber(tx, companyId);

    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = 0;

    const itemsData = input.items.map((item) => {
      const itemSubtotal = item.unitPrice * item.quantity;
      const itemDiscount = item.discountAmount || 0;
      const taxable = Math.max(0, itemSubtotal - itemDiscount);
      const itemTax = taxable * ((item.taxRate || 0) / 100);
      const itemTotal = taxable + itemTax;

      subtotal += itemSubtotal;
      discountAmount += itemDiscount;
      taxAmount += itemTax;

      return {
        productId: item.productId || null,
        productName: item.productName,
        description: item.description || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: itemDiscount,
        taxRate: item.taxRate || 0,
        taxAmount: itemTax,
        totalAmount: itemTotal,
      };
    });

    const totalAmount = Math.max(0, subtotal - discountAmount + taxAmount);

    const quotation = await tx.quotation.create({
      data: {
        companyId,
        quotationNumber,
        customerId: input.customerId,
        designId: input.designId || null,
        status: 'DRAFT',
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        subtotal,
        discountAmount,
        taxAmount,
        totalAmount,
        notes: input.notes || null,
        createdBy: userId,
        items: {
          create: itemsData,
        },
      },
      include: {
        customer: true,
        design: true,
        items: true,
      },
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'QUOTATION_CREATED',
      entity: 'Quotation',
      entityId: quotation.id,
      metadata: { quotationNumber: quotation.quotationNumber, totalAmount: quotation.totalAmount },
    });

    return quotation;
  });
}

export async function listQuotations(companyId: string, customerId?: string) {
  const db = prisma as any;
  const where: any = { companyId };
  if (customerId) {
    where.customerId = customerId;
  }

  return db.quotation.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true, customerCode: true, phone: true } },
      design: { select: { id: true, designNumber: true, name: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getQuotationById(companyId: string, id: string) {
  const db = prisma as any;
  const qtn = await db.quotation.findFirst({
    where: { id, companyId },
    include: {
      customer: true,
      design: true,
      items: true,
      sale: true,
      creator: { select: { id: true, name: true, email: true } },
    },
  });

  if (!qtn) {
    throw new NotFoundError('Quotation not found');
  }

  return qtn;
}

export async function convertQuotationToSalesOrder(companyId: string, quotationId: string, userId: string) {
  const db = prisma as any;

  const quotation = await db.quotation.findFirst({
    where: { id: quotationId, companyId },
    include: { items: true, customer: true, design: true },
  });

  if (!quotation) {
    throw new NotFoundError('Quotation not found');
  }

  if (quotation.status === 'CONVERTED') {
    throw new BadRequestError('Quotation has already been converted to a Sales Order');
  }

  // Create Sale items from Quotation items
  const saleItems = quotation.items.map((item: any) => ({
    productId: item.productId || undefined,
    productNameSnapshot: item.productName,
    skuSnapshot: item.productId ? 'PROD-ITEM' : 'CUSTOM-ITEM',
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountAmount: item.discountAmount,
    taxRate: item.taxRate,
  }));

  const sale = await createSaleDraft(
    companyId,
    {
      customerId: quotation.customerId,
      items: saleItems as any,
      discountAmount: quotation.discountAmount || 0,
      taxRate: quotation.taxRate || 0,
      notes: `Converted from Quotation #${quotation.quotationNumber}. ${quotation.notes || ''}`,
    },
    userId
  );

  // Link quotation to sale and update status
  await db.quotation.update({
    where: { id: quotationId },
    data: {
      status: 'CONVERTED',
    },
  });

  await db.sale.update({
    where: { id: sale.id },
    data: {
      quotationId: quotation.id,
      customerDesignId: quotation.designId || null,
    },
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'QUOTATION_CONVERTED_TO_SALE',
    entity: 'Quotation',
    entityId: quotation.id,
    metadata: { quotationNumber: quotation.quotationNumber, saleId: sale.id },
  });

  return sale;
}
