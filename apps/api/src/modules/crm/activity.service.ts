import { prisma } from '../../config/prisma.js';
import { CRMEntityType, CRMActivityType } from '@furniture-os/shared';
import { NotFoundError } from '../../utils/errors.js';

export interface CreateActivityParams {
  companyId: string;
  entityType: CRMEntityType;
  entityId: string;
  activityType: CRMActivityType;
  title: string;
  description?: string | null;
  createdBy?: string | null;
}

export async function recordCRMActivity(params: CreateActivityParams) {
  const db = prisma as any;

  if (params.entityType === 'CUSTOMER') {
    const customer = await db.customer.findFirst({
      where: { id: params.entityId, companyId: params.companyId },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundError('Customer not found for this tenant');
    }
  } else if (params.entityType === 'SUPPLIER') {
    const supplier = await db.supplier.findFirst({
      where: { id: params.entityId, companyId: params.companyId },
      select: { id: true },
    });
    if (!supplier) {
      throw new NotFoundError('Supplier not found for this tenant');
    }
  }

  const activityModel = db.crmActivity || db.cRMActivity;
  return activityModel.create({
    data: {
      companyId: params.companyId,
      entityType: params.entityType,
      entityId: params.entityId,
      activityType: params.activityType,
      title: params.title,
      description: params.description,
      createdBy: params.createdBy,
    },
    include: {
      creator: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

export async function getCRMActivities(
  companyId: string,
  options: {
    entityType?: CRMEntityType;
    entityId?: string;
    page?: number;
    limit?: number;
  } = {}
) {
  const db = prisma as any;
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 20));
  const skip = (page - 1) * limit;

  const where: any = { companyId };
  if (options.entityType) where.entityType = options.entityType;
  if (options.entityId) where.entityId = options.entityId;

  const activityModel = db.crmActivity || db.cRMActivity;
  if (!activityModel) {
    return { items: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  }

  const [items, total] = await Promise.all([
    activityModel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    activityModel.count({ where }),
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
