import { prisma } from '../../config/prisma.js';
import { CreateUnitInput, UpdateUnitInput } from '@furniture-os/shared';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors.js';
import { createAuditLog } from '../audit/audit.service.js';

interface CachedUnitList {
  data: any[];
  expiresAt: number;
}

const unitCache = new Map<string, CachedUnitList>();
const UNIT_CACHE_TTL_MS = 60000;

export function clearUnitCache(companyId?: string) {
  if (companyId) {
    for (const key of unitCache.keys()) {
      if (key.startsWith(`unit_${companyId}`)) {
        unitCache.delete(key);
      }
    }
  } else {
    unitCache.clear();
  }
}

export async function getUnits(companyId: string, search?: string, isActive?: boolean) {
  const cacheKey = `unit_${companyId}_${search || ''}_${isActive ?? ''}`;
  const cached = unitCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const where: any = { companyId };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { shortCode: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  const units = await prisma.unit.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  unitCache.set(cacheKey, {
    data: units,
    expiresAt: Date.now() + UNIT_CACHE_TTL_MS,
  });

  return units;
}

export async function createUnit(companyId: string, input: CreateUnitInput, userId: string) {
  // Check unique name within company
  const nameExists = await prisma.unit.findUnique({
    where: {
      companyId_name: {
        companyId,
        name: input.name,
      },
    },
  });

  if (nameExists) {
    throw new ConflictError('Unit name already exists in this company', 'DUPLICATE_UNIT_NAME');
  }

  // Check unique shortCode within company
  const codeExists = await prisma.unit.findUnique({
    where: {
      companyId_shortCode: {
        companyId,
        shortCode: input.shortCode,
      },
    },
  });

  if (codeExists) {
    throw new ConflictError('Short code already exists in this company', 'DUPLICATE_UNIT_CODE');
  }

  const unit = await prisma.unit.create({
    data: {
      companyId,
      name: input.name,
      shortCode: input.shortCode,
      isActive: true,
    },
  });

  clearUnitCache(companyId);

  await createAuditLog({
    userId,
    companyId,
    action: 'UNIT_CREATED',
    entity: 'Unit',
    entityId: unit.id,
    metadata: { name: unit.name, shortCode: unit.shortCode },
  });

  return unit;
}

export async function updateUnit(companyId: string, id: string, input: UpdateUnitInput, userId: string) {
  // Verify unit exists
  const unit = await prisma.unit.findFirst({
    where: { id, companyId },
  });

  if (!unit) {
    throw new NotFoundError('Unit not found');
  }

  // Check unique name if changed
  if (input.name && input.name !== unit.name) {
    const nameExists = await prisma.unit.findUnique({
      where: {
        companyId_name: {
          companyId,
          name: input.name,
        },
      },
    });

    if (nameExists) {
      throw new ConflictError('Unit name already exists in this company', 'DUPLICATE_UNIT_NAME');
    }
  }

  // Check unique shortCode if changed
  if (input.shortCode && input.shortCode !== unit.shortCode) {
    const codeExists = await prisma.unit.findUnique({
      where: {
        companyId_shortCode: {
          companyId,
          shortCode: input.shortCode,
        },
      },
    });

    if (codeExists) {
      throw new ConflictError('Short code already exists in this company', 'DUPLICATE_UNIT_CODE');
    }
  }

  const updated = await prisma.unit.update({
    where: { id },
    data: {
      name: input.name,
      shortCode: input.shortCode,
      isActive: input.isActive,
    },
  });

  clearUnitCache(companyId);

  await createAuditLog({
    userId,
    companyId,
    action: 'UNIT_UPDATED',
    entity: 'Unit',
    entityId: updated.id,
    metadata: {
      old: { name: unit.name, shortCode: unit.shortCode, isActive: unit.isActive },
      new: { name: updated.name, shortCode: updated.shortCode, isActive: updated.isActive },
    },
  });

  return updated;
}

export async function deactivateUnit(companyId: string, id: string, userId: string) {
  const unit = await prisma.unit.findFirst({
    where: { id, companyId },
  });

  if (!unit) {
    throw new NotFoundError('Unit not found');
  }

  const updated = await prisma.unit.update({
    where: { id },
    data: { isActive: false },
  });

  clearUnitCache(companyId);

  await createAuditLog({
    userId,
    companyId,
    action: 'UNIT_DEACTIVATED',
    entity: 'Unit',
    entityId: updated.id,
    metadata: { name: updated.name, shortCode: updated.shortCode },
  });

  return updated;
}
