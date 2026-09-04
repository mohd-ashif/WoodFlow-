import { prisma } from '../../config/prisma.js';
import { SupplierStatus } from '@furniture-os/shared';

export async function generateNextSupplierCode(companyId: string): Promise<string> {
  const db = prisma as any;
  const count = await db.supplier.count({
    where: { companyId },
  });

  let nextNum = count + 1;
  let code = `SUP-${String(nextNum).padStart(6, '0')}`;

  while (await db.supplier.findFirst({ where: { companyId, supplierCode: code } })) {
    nextNum += 1;
    code = `SUP-${String(nextNum).padStart(6, '0')}`;
  }

  return code;
}

export async function findSupplierById(companyId: string, id: string) {
  const db = prisma as any;
  return db.supplier.findFirst({
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

export async function findDuplicateSuppliers(
  companyId: string,
  params: { phone?: string; email?: string; gstNumber?: string; excludeId?: string }
) {
  const db = prisma as any;
  const conditions: any[] = [];

  if (params.phone && params.phone.trim()) {
    conditions.push({ phone: { equals: params.phone.trim() } });
  }

  if (params.email && params.email.trim()) {
    conditions.push({ email: { equals: params.email.trim().toLowerCase() } });
  }

  if (params.gstNumber && params.gstNumber.trim()) {
    conditions.push({ gstNumber: { equals: params.gstNumber.trim().toUpperCase() } });
  }

  if (conditions.length === 0) return [];

  const where: any = {
    companyId,
    OR: conditions,
  };

  if (params.excludeId) {
    where.NOT = { id: params.excludeId };
  }

  return db.supplier.findMany({
    where,
    select: {
      id: true,
      supplierCode: true,
      name: true,
      phone: true,
      email: true,
      gstNumber: true,
      status: true,
    },
  });
}

export async function listSuppliers(
  companyId: string,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: SupplierStatus | 'ALL';
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
      { supplierCode: { contains: q, mode: 'insensitive' } },
      { gstNumber: { contains: q, mode: 'insensitive' } },
    ];
  }

  const validSortFields = ['name', 'createdAt', 'updatedAt'];
  const sortField = validSortFields.includes(options.sortBy || '') ? options.sortBy! : 'createdAt';
  const sortOrder = options.sortOrder === 'asc' ? 'asc' : 'desc';

  const [items, total] = await Promise.all([
    db.supplier.findMany({
      where,
      select: {
        id: true,
        companyId: true,
        supplierCode: true,
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
    db.supplier.count({ where }),
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
