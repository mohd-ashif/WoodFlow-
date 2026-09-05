import { prisma } from '../../config/prisma.js';
import { CreateCategoryInput, UpdateCategoryInput } from '@furniture-os/shared';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';

interface CachedCategoryList {
  data: any[];
  expiresAt: number;
}

const categoryCache = new Map<string, CachedCategoryList>();
const CATEGORY_CACHE_TTL_MS = 60000; // 1 minute TTL

export function clearCategoryCache(companyId?: string) {
  if (companyId) {
    for (const key of categoryCache.keys()) {
      if (key.startsWith(`cat_${companyId}`)) {
        categoryCache.delete(key);
      }
    }
  } else {
    categoryCache.clear();
  }
}

export async function getCategories(companyId: string, search?: string, isActive?: boolean) {
  const cacheKey = `cat_${companyId}_${search || ''}_${isActive ?? ''}`;
  const cached = categoryCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const where: any = { companyId };

  if (search) {
    where.name = {
      contains: search,
      mode: 'insensitive',
    };
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const categories = await prisma.category.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  categoryCache.set(cacheKey, {
    data: categories,
    expiresAt: Date.now() + CATEGORY_CACHE_TTL_MS,
  });

  return categories;
}

export async function createCategory(companyId: string, input: CreateCategoryInput, userId: string) {
  // Check unique category name within company
  const existing = await prisma.category.findUnique({
    where: {
      companyId_name: {
        companyId,
        name: input.name,
      },
    },
  });

  if (existing) {
    throw new ConflictError('Category name already exists in this company', 'DUPLICATE_CATEGORY');
  }

  const category = await prisma.category.create({
    data: {
      companyId,
      name: input.name,
      description: input.description,
      isActive: true,
    },
  });

  clearCategoryCache(companyId);

  await createAuditLog({
    userId,
    companyId,
    action: 'CATEGORY_CREATED',
    entity: 'Category',
    entityId: category.id,
    metadata: { name: category.name },
  });

  return category;
}

export async function updateCategory(
  companyId: string,
  id: string,
  input: UpdateCategoryInput,
  userId: string
) {
  // Verify category exists and belongs to company
  const category = await prisma.category.findFirst({
    where: { id, companyId },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Check unique name if changed
  if (input.name && input.name !== category.name) {
    const existing = await prisma.category.findUnique({
      where: {
        companyId_name: {
          companyId,
          name: input.name,
        },
      },
    });

    if (existing) {
      throw new ConflictError('Category name already exists in this company', 'DUPLICATE_CATEGORY');
    }
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      name: input.name,
      description: input.description,
      isActive: input.isActive,
    },
  });

  clearCategoryCache(companyId);

  await createAuditLog({
    userId,
    companyId,
    action: 'CATEGORY_UPDATED',
    entity: 'Category',
    entityId: updated.id,
    metadata: {
      old: { name: category.name, isActive: category.isActive },
      new: { name: updated.name, isActive: updated.isActive },
    },
  });

  return updated;
}

export async function deactivateCategory(companyId: string, id: string, userId: string) {
  // Verify category exists
  const category = await prisma.category.findFirst({
    where: { id, companyId },
  });

  if (!category) {
    throw new NotFoundError('Category not found');
  }

  // Soft deactivate: just set isActive to false
  const updated = await prisma.category.update({
    where: { id },
    data: { isActive: false },
  });

  clearCategoryCache(companyId);

  await createAuditLog({
    userId,
    companyId,
    action: 'CATEGORY_DEACTIVATED',
    entity: 'Category',
    entityId: updated.id,
    metadata: { name: updated.name },
  });

  return updated;
}
