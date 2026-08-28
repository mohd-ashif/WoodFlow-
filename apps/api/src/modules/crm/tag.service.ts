import { prisma } from '../../config/prisma.js';
import { TagType } from '@furniture-os/shared';
import { ConflictError, NotFoundError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';

export async function createTag(
  companyId: string,
  userId: string | undefined,
  name: string,
  type: TagType
) {
  const db = prisma as any;
  const existing = await db.tag.findFirst({
    where: { companyId, name, type },
  });

  if (existing) {
    throw new ConflictError(`Tag with name '${name}' already exists for ${type.toLowerCase()}s`);
  }

  const tag = await db.tag.create({
    data: {
      companyId,
      name,
      type,
    },
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'CRM_TAG_CREATED',
    entity: 'Tag',
    entityId: tag.id,
    metadata: { name, type },
  });

  return tag;
}

export async function getTags(companyId: string, type?: TagType) {
  const db = prisma as any;
  const where: any = { companyId };
  if (type) where.type = type;

  return db.tag.findMany({
    where,
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          customers: true,
          suppliers: true,
        },
      },
    },
  });
}

export async function updateTag(
  companyId: string,
  userId: string | undefined,
  id: string,
  data: { name?: string; isActive?: boolean }
) {
  const db = prisma as any;
  const tag = await db.tag.findFirst({
    where: { id, companyId },
  });

  if (!tag) {
    throw new NotFoundError('Tag not found');
  }

  if (data.name && data.name !== tag.name) {
    const existing = await db.tag.findFirst({
      where: { companyId, name: data.name, type: tag.type, NOT: { id } },
    });

    if (existing) {
      throw new ConflictError(`Tag with name '${data.name}' already exists`);
    }
  }

  const updatedTag = await db.tag.update({
    where: { id },
    data,
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'CRM_TAG_UPDATED',
    entity: 'Tag',
    entityId: id,
    metadata: data,
  });

  return updatedTag;
}

export async function deactivateTag(companyId: string, userId: string | undefined, id: string) {
  const db = prisma as any;
  const tag = await db.tag.findFirst({
    where: { id, companyId },
    include: {
      _count: {
        select: { customers: true, suppliers: true },
      },
    },
  });

  if (!tag) {
    throw new NotFoundError('Tag not found');
  }

  const usageCount = tag._count.customers + tag._count.suppliers;

  const updated = await db.tag.update({
    where: { id },
    data: { isActive: false },
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'CRM_TAG_DEACTIVATED',
    entity: 'Tag',
    entityId: id,
    metadata: { usageCount },
  });

  return updated;
}
