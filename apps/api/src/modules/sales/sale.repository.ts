import { prisma } from '../../config/prisma.js';

export async function generateNextSaleNumber(tx: any, companyId: string): Promise<string> {
  const lastSale = await tx.sale.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    select: { saleNumber: true },
  });

  if (!lastSale || !lastSale.saleNumber) {
    return 'SALE-000001';
  }

  const match = lastSale.saleNumber.match(/\d+$/);
  if (!match) {
    return `SALE-${Date.now()}`;
  }

  const currentNum = parseInt(match[0], 10);
  const nextNum = currentNum + 1;
  return `SALE-${String(nextNum).padStart(6, '0')}`;
}

export async function generateNextInvoiceNumber(tx: any, companyId: string): Promise<string> {
  const lastInvoice = await tx.invoice.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    select: { invoiceNumber: true },
  });

  if (!lastInvoice || !lastInvoice.invoiceNumber) {
    return 'INV-000001';
  }

  const match = lastInvoice.invoiceNumber.match(/\d+$/);
  if (!match) {
    return `INV-${Date.now()}`;
  }

  const currentNum = parseInt(match[0], 10);
  const nextNum = currentNum + 1;
  return `INV-${String(nextNum).padStart(6, '0')}`;
}

export async function findSaleById(companyId: string, saleId: string) {
  const db = prisma as any;
  return db.sale.findFirst({
    where: { id: saleId, companyId },
    include: {
      customer: {
        select: { id: true, name: true, phone: true, email: true, customerCode: true },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      },
      invoices: true,
    },
  });
}

export async function listSales(
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
  const db = prisma as any;
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = { companyId };

  if (options.status) {
    where.status = options.status;
  }

  if (options.paymentStatus) {
    where.paymentStatus = options.paymentStatus;
  }

  if (options.customerId) {
    where.customerId = options.customerId;
  }

  if (options.startDate || options.endDate) {
    where.saleDate = {};
    if (options.startDate) where.saleDate.gte = new Date(options.startDate);
    if (options.endDate) where.saleDate.lte = new Date(options.endDate);
  }

  if (options.search) {
    where.OR = [
      { saleNumber: { contains: options.search, mode: 'insensitive' } },
      {
        customer: {
          OR: [
            { name: { contains: options.search, mode: 'insensitive' } },
            { phone: { contains: options.search, mode: 'insensitive' } },
            { customerCode: { contains: options.search, mode: 'insensitive' } },
          ],
        },
      },
      {
        invoices: {
          some: {
            invoiceNumber: { contains: options.search, mode: 'insensitive' },
          },
        },
      },
    ];
  }

  const [items, total] = await Promise.all([
    db.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        customer: {
          select: { id: true, name: true, phone: true, email: true, customerCode: true },
        },
        creator: {
          select: { id: true, name: true },
        },
        items: true,
        invoices: {
          select: { id: true, invoiceNumber: true, status: true, totalAmount: true },
        },
      },
    }),
    db.sale.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
