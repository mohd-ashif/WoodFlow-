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
