import { prisma } from '../../config/prisma.js';
import { CreateSaleInput, UpdateSaleInput } from '@furniture-os/shared';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { calculateSaleTotals } from './sale.calculator.js';
import { generateNextSaleNumber, generateNextInvoiceNumber, findSaleById, listSales } from './sale.repository.js';
import { createAuditLog } from '../audit/audit.service.js';

export async function createSaleDraft(companyId: string, input: CreateSaleInput, userId: string) {
  const db = prisma as any;

  // Validate Customer if provided
  let customer: any = null;
  if (input.customerId) {
    customer = await db.customer.findFirst({
      where: { id: input.customerId, companyId },
    });
    if (!customer) {
      throw new NotFoundError('Customer not found for this company');
    }
  }

  // Validate Products
  const productIds = input.items.map((i) => i.productId);
  const products = await db.product.findMany({
    where: { id: { in: productIds }, companyId, isActive: true },
    select: { id: true, name: true, sku: true, sellingPrice: true },
  });

  if (products.length !== productIds.length) {
    throw new BadRequestError('One or more selected products are invalid or inactive');
  }

  const productMap = new Map<string, { id: string; name: string; sku: string; sellingPrice: number }>(
    products.map((p: any) => [p.id, p])
  );

  const rawItems = input.items.map((item) => ({
    product: productMap.get(item.productId)!,
    quantity: item.quantity,
    overrideUnitPrice: item.unitPrice,
    discountAmount: item.discountAmount,
    taxRate: item.taxRate,
  }));

  const totals = calculateSaleTotals({
    rawItems,
    overallDiscountAmount: input.discountAmount,
    overallTaxRate: input.taxRate,
  });

  return prisma.$transaction(
    async (tx: any) => {
      const saleNumber = await generateNextSaleNumber(tx, companyId);

    const sale = await tx.sale.create({
      data: {
        companyId,
        saleNumber,
        customerId: input.customerId || null,
        status: 'DRAFT',
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        paidAmount: 0,
        dueAmount: totals.totalAmount,
        paymentStatus: 'UNPAID',
        notes: input.notes || null,
        billingAddress: input.billingAddress || (customer ? customer.notes : null),
        createdBy: userId,
        items: {
          create: totals.items.map((item) => ({
            companyId,
            productId: item.productId,
            productNameSnapshot: item.productNameSnapshot,
            skuSnapshot: item.skuSnapshot,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountAmount: item.discountAmount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            totalAmount: item.totalAmount,
          })),
        },
      },
      include: {
        items: true,
        customer: true,
      },
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'SALE_CREATED',
      entity: 'Sale',
      entityId: sale.id,
      metadata: { saleNumber: sale.saleNumber, totalAmount: sale.totalAmount, status: 'DRAFT' },
    });

    return sale;
  }, { maxWait: 15000, timeout: 30000 });
}

export async function confirmSale(companyId: string, saleId: string, userId: string) {
  const db = prisma as any;

  return prisma.$transaction(
    async (tx: any) => {
      // 1. Fetch & lock sale
    const sale = await tx.sale.findFirst({
      where: { id: saleId, companyId },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!sale) {
      throw new NotFoundError('Sale draft not found');
    }

    if (sale.status === 'CONFIRMED') {
      return findSaleById(companyId, saleId);
    }

    if (sale.status === 'CANCELLED') {
      throw new BadRequestError('Cannot confirm a cancelled sale');
    }

    // 2. Lock & verify stock for each item (Requirement 50 — Concurrency protection)
    for (const item of sale.items) {
      if (!item.productId) continue;

      const rawInventories: any[] = await tx.$queryRawUnsafe(
        `SELECT * FROM "inventories" WHERE "productId" = $1 AND "companyId" = $2 FOR UPDATE`,
        item.productId,
        companyId
      );

      const inventory = rawInventories[0];
      if (!inventory) {
        throw new BadRequestError(`Inventory record not found for product ${item.productNameSnapshot}`);
      }

      const availableQty = inventory.currentQuantity as number;
      if (availableQty < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for "${item.productNameSnapshot}". Available: ${availableQty}, Requested: ${item.quantity}`,
          'INSUFFICIENT_STOCK'
        );
      }
    }

    // 3. Deduct stock and record stock movements
    for (const item of sale.items) {
      if (!item.productId) continue;

      const inventory = await tx.inventory.findFirst({
        where: { productId: item.productId, companyId },
      });

      const currentQty = inventory.currentQuantity as number;
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
          movementType: 'SALE',
          quantity: item.quantity,
          previousQuantity: currentQty,
          newQuantity: newQty,
          referenceType: 'SALE',
          referenceId: sale.id,
          reason: `Sale Confirmation #${sale.saleNumber}`,
          createdBy: userId,
        },
      });
    }

    // 4. Generate Invoice Number & Create Invoice
    const invoiceNumber = await generateNextInvoiceNumber(tx, companyId);
    const invoice = await tx.invoice.create({
      data: {
        companyId,
        saleId: sale.id,
        invoiceNumber,
        customerId: sale.customerId || null,
        customerNameSnapshot: sale.customer ? sale.customer.name : 'Walk-in Customer',
        customerPhoneSnapshot: sale.customer ? sale.customer.phone : null,
        customerEmailSnapshot: sale.customer ? sale.customer.email : null,
        billingAddress: sale.billingAddress || null,
        subtotal: sale.subtotal,
        discountAmount: sale.discountAmount,
        taxAmount: sale.taxAmount,
        totalAmount: sale.totalAmount,
        status: 'ISSUED',
      },
    });

    // 5. Update Sale status to CONFIRMED
    const updatedSale = await tx.sale.update({
      where: { id: sale.id },
      data: {
        status: 'CONFIRMED',
      },
      include: {
        customer: true,
        items: true,
        invoices: true,
      },
    });

    // 6. Record CRM Activity if customer is linked
    if (sale.customerId) {
      const crmModel = tx.crmActivity || tx.cRMActivity;
      if (crmModel) {
        await crmModel.create({
          data: {
            companyId,
            entityType: 'CUSTOMER',
            entityId: sale.customerId,
            activityType: 'NOTE',
            title: `Completed Sale #${sale.saleNumber}`,
            description: `Invoice ${invoiceNumber} issued for total amount ₹${sale.totalAmount.toLocaleString('en-IN')}`,
            createdBy: userId,
          },
        });
      }
    }

    // 7. Record Audit Log
    await createAuditLog({
      userId,
      companyId,
      action: 'SALE_CONFIRMED',
      entity: 'Sale',
      entityId: sale.id,
      metadata: { saleNumber: sale.saleNumber, invoiceNumber, totalAmount: sale.totalAmount },
    });

    return updatedSale;
  }, { maxWait: 15000, timeout: 30000 });
}

export async function cancelSale(companyId: string, saleId: string, reason: string, userId: string) {
  return prisma.$transaction(async (tx: any) => {
    const sale = await tx.sale.findFirst({
      where: { id: saleId, companyId },
      include: { items: true, invoices: true },
    });

    if (!sale) {
      throw new NotFoundError('Sale not found');
    }

    if (sale.status === 'CANCELLED') {
      throw new BadRequestError('Sale is already cancelled');
    }

    const wasConfirmed = sale.status === 'CONFIRMED';

    // Restores stock if the sale was confirmed
    if (wasConfirmed) {
      for (const item of sale.items) {
        if (!item.productId) continue;

        const inventory = await tx.inventory.findFirst({
          where: { productId: item.productId, companyId },
        });

        if (inventory) {
          const currentQty = inventory.currentQuantity as number;
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
            data: { currentStock: newQty },
          });

          await tx.stockMovement.create({
            data: {
              companyId,
              productId: item.productId,
              movementType: 'SALES_RETURN',
              quantity: item.quantity,
              previousQuantity: currentQty,
              newQuantity: newQty,
              referenceType: 'SALE_CANCELLATION',
              referenceId: sale.id,
              reason: `Sale Cancellation #${sale.saleNumber}: ${reason}`,
              createdBy: userId,
            },
          });
        }
      }

      // Mark associated invoices as CANCELLED
      await tx.invoice.updateMany({
        where: { saleId: sale.id, companyId },
        data: { status: 'CANCELLED' },
      });
    }

    const cancelledSale = await tx.sale.update({
      where: { id: sale.id },
      data: {
        status: 'CANCELLED',
        notes: sale.notes ? `${sale.notes} | Cancelled: ${reason}` : `Cancelled: ${reason}`,
      },
      include: {
        customer: true,
        items: true,
        invoices: true,
      },
    });

    await createAuditLog({
      userId,
      companyId,
      action: 'SALE_CANCELLED',
      entity: 'Sale',
      entityId: sale.id,
      metadata: { saleNumber: sale.saleNumber, reason, stockRestored: wasConfirmed },
    });

    return cancelledSale;
  }, { maxWait: 15000, timeout: 30000 });
}

export async function getSalesList(
  companyId: string,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    paymentStatus?: string;
    customerId?: string;
    startDate?: string;
    endDate?: string;
  }
) {
  return listSales(companyId, options);
}

export async function getSaleDetails(companyId: string, saleId: string) {
  const sale = await findSaleById(companyId, saleId);
  if (!sale) {
    throw new NotFoundError('Sale not found');
  }
  return sale;
}
