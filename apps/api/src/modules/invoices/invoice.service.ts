import { prisma } from '../../config/prisma.js';
import { NotFoundError } from '../../utils/errors.js';

export async function getInvoicesList(
  companyId: string,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    customerId?: string;
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

  if (options.customerId) {
    where.customerId = options.customerId;
  }

  if (options.search) {
    where.OR = [
      { invoiceNumber: { contains: options.search, mode: 'insensitive' } },
      { customerNameSnapshot: { contains: options.search, mode: 'insensitive' } },
      { customerPhoneSnapshot: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    db.invoice.findMany({
      where,
      select: {
        id: true,
        companyId: true,
        saleId: true,
        invoiceNumber: true,
        invoiceDate: true,
        customerId: true,
        customerNameSnapshot: true,
        customerPhoneSnapshot: true,
        customerEmailSnapshot: true,
        subtotal: true,
        discountAmount: true,
        taxAmount: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        sale: {
          select: {
            id: true,
            saleNumber: true,
            status: true,
            paymentStatus: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.invoice.count({ where }),
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

export async function getInvoiceDetails(companyId: string, invoiceId: string) {
  const db = prisma as any;
  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, companyId },
    include: {
      company: true,
      customer: true,
      sale: {
        include: {
          items: true,
          creator: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  return invoice;
}

export async function getPublicInvoiceDetailsByToken(token: string) {
  if (!token || typeof token !== 'string') {
    throw new NotFoundError('Invalid public invoice link');
  }

  const db = prisma as any;
  const invoice = await db.invoice.findUnique({
    where: { publicToken: token },
    select: {
      invoiceNumber: true,
      invoiceDate: true,
      customerNameSnapshot: true,
      customerPhoneSnapshot: true,
      customerEmailSnapshot: true,
      billingAddress: true,
      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      totalAmount: true,
      status: true,
      createdAt: true,
      company: {
        select: {
          name: true,
          logo: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          postalCode: true,
          gstNumber: true,
        },
      },
      sale: {
        select: {
          saleNumber: true,
          paymentStatus: true,
          paidAmount: true,
          dueAmount: true,
          items: {
            select: {
              productNameSnapshot: true,
              skuSnapshot: true,
              quantity: true,
              unitPrice: true,
              discountAmount: true,
              taxRate: true,
              taxAmount: true,
              totalAmount: true,
            },
          },
        },
      },
    },
  });

  if (!invoice) {
    throw new NotFoundError('Invoice not found or link has expired');
  }

  return invoice;
}


export async function exportInvoices(
  companyId: string,
  options: {
    search?: string;
    status?: string;
    customerId?: string;
    fromDate?: string;
    toDate?: string;
    format?: string;
  }
) {
  const db = prisma as any;
  const where: any = { companyId };

  if (options.status) {
    where.status = options.status;
  }

  if (options.customerId) {
    where.customerId = options.customerId;
  }

  if (options.fromDate || options.toDate) {
    where.createdAt = {};
    if (options.fromDate) where.createdAt.gte = new Date(options.fromDate);
    if (options.toDate) where.createdAt.lte = new Date(`${options.toDate}T23:59:59.999Z`);
  }

  if (options.search) {
    where.OR = [
      { invoiceNumber: { contains: options.search, mode: 'insensitive' } },
      { customerNameSnapshot: { contains: options.search, mode: 'insensitive' } },
      { customerPhoneSnapshot: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  const invoices = await db.invoice.findMany({
    where,
    select: {
      invoiceNumber: true,
      invoiceDate: true,
      customerNameSnapshot: true,
      customerPhoneSnapshot: true,
      customerEmailSnapshot: true,
      subtotal: true,
      discountAmount: true,
      taxAmount: true,
      totalAmount: true,
      status: true,
      createdAt: true,
      sale: {
        select: {
          saleNumber: true,
          paymentStatus: true,
          paidAmount: true,
          dueAmount: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5000,
  });

  // Generate CSV rows
  const headers = [
    'Invoice Number',
    'Date',
    'Customer Name',
    'Customer Phone',
    'Customer Email',
    'Subtotal (INR)',
    'Discount (INR)',
    'Tax (INR)',
    'Total Amount (INR)',
    'Paid Amount (INR)',
    'Due Amount (INR)',
    'Invoice Status',
    'Payment Status',
    'Related Sale Order',
  ];

  const csvRows = [headers.join(',')];

  for (const inv of invoices) {
    const row = [
      `"${inv.invoiceNumber}"`,
      `"${new Date(inv.invoiceDate || inv.createdAt).toISOString().split('T')[0]}"`,
      `"${(inv.customerNameSnapshot || '').replace(/"/g, '""')}"`,
      `"${inv.customerPhoneSnapshot || ''}"`,
      `"${inv.customerEmailSnapshot || ''}"`,
      inv.subtotal || 0,
      inv.discountAmount || 0,
      inv.taxAmount || 0,
      inv.totalAmount || 0,
      inv.sale?.paidAmount || 0,
      inv.sale?.dueAmount || 0,
      `"${inv.status}"`,
      `"${inv.sale?.paymentStatus || 'UNPAID'}"`,
      `"${inv.sale?.saleNumber || ''}"`,
    ];
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

