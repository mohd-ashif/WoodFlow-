import { prisma } from '../../config/prisma.js';
import {
  generateNextSupplierCode,
  findSupplierById,
} from './supplier.repository.js';
import { recordCRMActivity } from '../crm/activity.service.js';
import { createAuditLog } from '../audit/audit.service.js';
import { NotFoundError } from '../../utils/errors.js';
import { SupplierStatus, SupplierAddressType } from '@furniture-os/shared';

export interface CreateSupplierDTO {
  name: string;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  gstNumber?: string | null;
  taxId?: string | null;
  notes?: string | null;
  status?: SupplierStatus;
  tagIds?: string[];
  initialAddress?: {
    type: SupplierAddressType;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    isDefault?: boolean;
  } | null;
}

export async function createSupplier(
  companyId: string,
  userId: string | undefined,
  data: CreateSupplierDTO
) {
  const db = prisma as any;
  const supplierCode = await generateNextSupplierCode(companyId);

  const supplier = await db.$transaction(async (tx: any) => {
    const created = await tx.supplier.create({
      data: {
        companyId,
        supplierCode,
        name: data.name.trim(),
        phone: data.phone.trim(),
        alternatePhone: data.alternatePhone?.trim() || null,
        email: data.email?.trim().toLowerCase() || null,
        gstNumber: data.gstNumber?.trim().toUpperCase() || null,
        taxId: data.taxId?.trim() || null,
        notes: data.notes?.trim() || null,
        status: data.status || 'ACTIVE',
        createdBy: userId,
      },
    });

    if (data.initialAddress) {
      await tx.supplierAddress.create({
        data: {
          supplierId: created.id,
          companyId,
          type: data.initialAddress.type || 'OFFICE',
          addressLine1: data.initialAddress.addressLine1.trim(),
          addressLine2: data.initialAddress.addressLine2?.trim() || null,
          city: data.initialAddress.city.trim(),
          state: data.initialAddress.state.trim(),
          postalCode: data.initialAddress.postalCode.trim(),
          country: data.initialAddress.country?.trim() || 'India',
          isDefault: true,
        },
      });
    }

    if (data.tagIds && data.tagIds.length > 0) {
      await tx.supplierTag.createMany({
        data: data.tagIds.map((tagId) => ({
          supplierId: created.id,
          tagId,
        })),
      });
    }

    return created;
  });

  await recordCRMActivity({
    companyId,
    entityType: 'SUPPLIER',
    entityId: supplier.id,
    activityType: 'CREATED',
    title: 'Supplier created',
    description: `Supplier ${supplier.name} (${supplier.supplierCode}) created`,
    createdBy: userId,
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'SUPPLIER_CREATED',
    entity: 'Supplier',
    entityId: supplier.id,
    metadata: { supplierCode: supplier.supplierCode, name: supplier.name },
  });

  return findSupplierById(companyId, supplier.id);
}

export async function updateSupplier(
  companyId: string,
  userId: string | undefined,
  supplierId: string,
  data: Partial<CreateSupplierDTO>
) {
  const db = prisma as any;
  const existing = await db.supplier.findFirst({
    where: { id: supplierId, companyId },
  });

  if (!existing) {
    throw new NotFoundError('Supplier not found');
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.phone !== undefined) updateData.phone = data.phone.trim();
  if (data.alternatePhone !== undefined) updateData.alternatePhone = data.alternatePhone?.trim() || null;
  if (data.email !== undefined) updateData.email = data.email?.trim().toLowerCase() || null;
  if (data.gstNumber !== undefined) updateData.gstNumber = data.gstNumber?.trim().toUpperCase() || null;
  if (data.taxId !== undefined) updateData.taxId = data.taxId?.trim() || null;
  if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;
  if (data.status !== undefined) updateData.status = data.status;

  await db.$transaction(async (tx: any) => {
    await tx.supplier.update({
      where: { id: supplierId },
      data: updateData,
    });

    if (data.tagIds !== undefined) {
      await tx.supplierTag.deleteMany({
        where: { supplierId },
      });
      if (data.tagIds.length > 0) {
        await tx.supplierTag.createMany({
          data: data.tagIds.map((tagId) => ({ supplierId, tagId })),
        });
      }
    }
  });

  await recordCRMActivity({
    companyId,
    entityType: 'SUPPLIER',
    entityId: supplierId,
    activityType: 'UPDATED',
    title: 'Supplier updated',
    description: `Supplier ${existing.name} updated`,
    createdBy: userId,
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'SUPPLIER_UPDATED',
    entity: 'Supplier',
    entityId: supplierId,
    metadata: { supplierCode: existing.supplierCode },
  });

  return findSupplierById(companyId, supplierId);
}

export async function archiveSupplier(companyId: string, userId: string | undefined, supplierId: string) {
  const db = prisma as any;
  const existing = await db.supplier.findFirst({
    where: { id: supplierId, companyId },
  });

  if (!existing) {
    throw new NotFoundError('Supplier not found');
  }

  const updated = await db.supplier.update({
    where: { id: supplierId },
    data: { status: 'ARCHIVED' },
  });

  await recordCRMActivity({
    companyId,
    entityType: 'SUPPLIER',
    entityId: supplierId,
    activityType: 'ARCHIVED',
    title: 'Supplier archived',
    description: `Supplier ${existing.name} archived`,
    createdBy: userId,
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'SUPPLIER_ARCHIVED',
    entity: 'Supplier',
    entityId: supplierId,
    metadata: { supplierCode: existing.supplierCode },
  });

  return updated;
}

export async function restoreSupplier(companyId: string, userId: string | undefined, supplierId: string) {
  const db = prisma as any;
  const existing = await db.supplier.findFirst({
    where: { id: supplierId, companyId },
  });

  if (!existing) {
    throw new NotFoundError('Supplier not found');
  }

  const updated = await db.supplier.update({
    where: { id: supplierId },
    data: { status: 'ACTIVE' },
  });

  await recordCRMActivity({
    companyId,
    entityType: 'SUPPLIER',
    entityId: supplierId,
    activityType: 'RESTORED',
    title: 'Supplier restored',
    description: `Supplier ${existing.name} restored to active status`,
    createdBy: userId,
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'SUPPLIER_RESTORED',
    entity: 'Supplier',
    entityId: supplierId,
    metadata: { supplierCode: existing.supplierCode },
  });

  return updated;
}

export async function addSupplierAddress(
  companyId: string,
  userId: string | undefined,
  supplierId: string,
  addressData: any
) {
  const db = prisma as any;
  const supplier = await db.supplier.findFirst({
    where: { id: supplierId, companyId },
  });
  if (!supplier) throw new NotFoundError('Supplier not found');

  if (addressData.isDefault) {
    await db.supplierAddress.updateMany({
      where: { supplierId, companyId },
      data: { isDefault: false },
    });
  }

  return db.supplierAddress.create({
    data: {
      supplierId,
      companyId,
      type: addressData.type || 'OFFICE',
      addressLine1: addressData.addressLine1.trim(),
      addressLine2: addressData.addressLine2?.trim() || null,
      city: addressData.city.trim(),
      state: addressData.state.trim(),
      postalCode: addressData.postalCode.trim(),
      country: addressData.country?.trim() || 'India',
      isDefault: addressData.isDefault || false,
    },
  });
}

export async function updateSupplierAddress(
  companyId: string,
  userId: string | undefined,
  supplierId: string,
  addressId: string,
  addressData: any
) {
  const db = prisma as any;
  const existing = await db.supplierAddress.findFirst({
    where: { id: addressId, supplierId, companyId },
  });
  if (!existing) throw new NotFoundError('Supplier address not found');

  if (addressData.isDefault) {
    await db.supplierAddress.updateMany({
      where: { supplierId, companyId, NOT: { id: addressId } },
      data: { isDefault: false },
    });
  }

  return db.supplierAddress.update({
    where: { id: addressId },
    data: addressData,
  });
}

export async function deleteSupplierAddress(
  companyId: string,
  userId: string | undefined,
  supplierId: string,
  addressId: string
) {
  const db = prisma as any;
  const existing = await db.supplierAddress.findFirst({
    where: { id: addressId, supplierId, companyId },
  });
  if (!existing) throw new NotFoundError('Supplier address not found');

  return db.supplierAddress.delete({
    where: { id: addressId },
  });
}

export async function addSupplierNote(
  companyId: string,
  userId: string | undefined,
  supplierId: string,
  content: string
) {
  const db = prisma as any;
  const supplier = await db.supplier.findFirst({
    where: { id: supplierId, companyId },
  });
  if (!supplier) throw new NotFoundError('Supplier not found');

  const note = await db.supplierNote.create({
    data: {
      companyId,
      supplierId,
      content: content.trim(),
      createdBy: userId,
    },
    include: {
      creator: { select: { id: true, name: true } },
    },
  });

  await recordCRMActivity({
    companyId,
    entityType: 'SUPPLIER',
    entityId: supplierId,
    activityType: 'NOTE',
    title: 'Note added',
    description: content.trim(),
    createdBy: userId,
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'SUPPLIER_NOTE_CREATED',
    entity: 'SupplierNote',
    entityId: note.id,
  });

  return note;
}

export async function deleteSupplierNote(
  companyId: string,
  userId: string | undefined,
  supplierId: string,
  noteId: string
) {
  const db = prisma as any;
  const existing = await db.supplierNote.findFirst({
    where: { id: noteId, supplierId, companyId },
  });
  if (!existing) throw new NotFoundError('Supplier note not found');

  return db.supplierNote.delete({
    where: { id: noteId },
  });
}
