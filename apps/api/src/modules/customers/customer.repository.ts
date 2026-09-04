import { prisma } from '../../config/prisma.js';
import { CustomerStatus } from '@furniture-os/shared';

export async function generateNextCustomerCode(companyId: string): Promise<string> {
  const db = prisma as any;
  const count = await db.customer.count({
    where: { companyId },
  });

  let nextNum = count + 1;
  let code = `CUS-${String(nextNum).padStart(6, '0')}`;

  while (await db.customer.findFirst({ where: { companyId, customerCode: code } })) {
    nextNum += 1;
    code = `CUS-${String(nextNum).padStart(6, '0')}`;
  }

  return code;
}

export async function findCustomerById(companyId: string, id: string) {
  const db = prisma as any;
  return db.customer.findFirst({
    where: { id, companyId },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
      addresses: {
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      },
      notesList: {
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, name: true } },
        },
      },
      tags: {
        include: {
          tag: true,
        },
      },
    },
  });
}

export async function findDuplicateCustomers(
  companyId: string,
  params: { phone?: string; email?: string; excludeId?: string }
) {
  const db = prisma as any;
  const conditions: any[] = [];

  if (params.phone && params.phone.trim()) {
    conditions.push({ phone: { equals: params.phone.trim() } });
  }

  if (params.email && params.email.trim()) {
    conditions.push({ email: { equals: params.email.trim().toLowerCase() } });
  }

  if (conditions.length === 0) return [];

  const where: any = {
    companyId,
    OR: conditions,
  };

  if (params.excludeId) {
    where.NOT = { id: params.excludeId };
  }

  return db.customer.findMany({
    where,
    select: {
      id: true,
      customerCode: true,
      name: true,
      phone: true,
      email: true,
      status: true,
    },
  });
}

export async function listCustomers(
  companyId: string,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: CustomerStatus | 'ALL';
    sortBy?: 'name' | 'createdAt' | 'updatedAt';
    sortOrder?: 'asc' | 'desc';
  }
) {
  const db = prisma as any;
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = { companyId };

  if (options.status && options.status !== 'ALL') {
    where.status = options.status;
  }

  if (options.search && options.search.trim()) {
    const q = options.search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { customerCode: { contains: q, mode: 'insensitive' } },
      { gstNumber: { contains: q, mode: 'insensitive' } },
    ];
  }

  const validSortFields = ['name', 'createdAt', 'updatedAt'];
  const sortField = validSortFields.includes(options.sortBy || '') ? options.sortBy! : 'createdAt';
  const sortOrder = options.sortOrder === 'asc' ? 'asc' : 'desc';

  const [items, total] = await Promise.all([
    db.customer.findMany({
      where,
      select: {
        id: true,
        companyId: true,
        customerCode: true,
        name: true,
        phone: true,
        email: true,
        gstNumber: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        addresses: {
          where: { isDefault: true },
          take: 1,
          select: {
            id: true,
            addressLine1: true,
            city: true,
            state: true,
            postalCode: true,
          },
        },
        tags: {
          select: {
            tag: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limit,
    }),
    db.customer.count({ where }),
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
