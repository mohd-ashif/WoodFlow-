import { prisma } from '../../config/prisma.js';

export async function generateNextPurchaseNumber(tx: any, companyId: string): Promise<string> {
  const purchaseModel = tx.purchase || tx.Purchase;
  if (!purchaseModel) {
    return `PUR-${Date.now()}`;
  }

  const lastPurchase = await purchaseModel.findFirst({
    where: { companyId },
    orderBy: { createdAt: 'desc' },
    select: { purchaseNumber: true },
  });

  if (!lastPurchase || !lastPurchase.purchaseNumber) {
    return 'PUR-000001';
  }

  const match = lastPurchase.purchaseNumber.match(/\d+$/);
  if (!match) {
    return `PUR-${Date.now()}`;
  }

  const currentNum = parseInt(match[0], 10);
  const nextNum = currentNum + 1;
  return `PUR-${String(nextNum).padStart(6, '0')}`;
}

export async function findPurchaseById(companyId: string, purchaseId: string) {
  const db = prisma as any;
  const purchaseModel = db.purchase || db.Purchase;
  if (!purchaseModel) return null;

  return purchaseModel.findFirst({
    where: { id: purchaseId, companyId },
    include: {
      supplier: {
        select: { id: true, name: true, phone: true, email: true, supplierCode: true },
      },
      creator: {
        select: { id: true, name: true, email: true },
      },
      items: {
        include: {
          product: { select: { id: true, name: true, sku: true } },
        },
      },
    },
  });
}

export async function listPurchases(
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

  if (options.supplierId) {
    where.supplierId = options.supplierId;
  }

  if (options.startDate || options.endDate) {
    where.purchaseDate = {};
    if (options.startDate) where.purchaseDate.gte = new Date(options.startDate);
    if (options.endDate) where.purchaseDate.lte = new Date(options.endDate);
  }

  if (options.search) {
    where.OR = [
      { purchaseNumber: { contains: options.search, mode: 'insensitive' } },
      { referenceNumber: { contains: options.search, mode: 'insensitive' } },
      {
        supplier: {
          OR: [
            { name: { contains: options.search, mode: 'insensitive' } },
            { phone: { contains: options.search, mode: 'insensitive' } },
            { supplierCode: { contains: options.search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  const purchaseModel = db.purchase || db.Purchase;
  if (!purchaseModel) {
    return { items: [], pagination: { page, limit, total: 0, totalPages: 1 } };
  }

  const safePage = Math.max(1, page);
  const safeLimit = Math.min(100, Math.max(1, limit));
  const safeSkip = (safePage - 1) * safeLimit;

  const [items, total] = await Promise.all([
    purchaseModel.findMany({
      where,
      select: {
        id: true,
        companyId: true,
        purchaseNumber: true,
        supplierId: true,
        status: true,
        subtotal: true,
        discountAmount: true,
        taxAmount: true,
        totalAmount: true,
        paidAmount: true,
        dueAmount: true,
        paymentStatus: true,
        notes: true,
        referenceNumber: true,
        purchaseDate: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
        supplier: {
          select: { id: true, name: true, phone: true, email: true, supplierCode: true },
        },
        creator: {
          select: { id: true, name: true },
        },
        items: {
          select: {
            id: true,
            productId: true,
            productNameSnapshot: true,
            skuSnapshot: true,
            quantity: true,
            unitCost: true,
            totalAmount: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: safeSkip,
      take: safeLimit,
    }),
    purchaseModel.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
}
