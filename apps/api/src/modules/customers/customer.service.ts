import { prisma } from '../../config/prisma.js';
import {
  generateNextCustomerCode,
  findCustomerById,
} from './customer.repository.js';
import { recordCRMActivity } from '../crm/activity.service.js';
import { createAuditLog } from '../audit/audit.service.js';
import { NotFoundError } from '../../utils/errors.js';
import { CustomerStatus, CustomerAddressType } from '@furniture-os/shared';

export interface CreateCustomerDTO {
  name: string;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  dateOfBirth?: string | null;
  gstNumber?: string | null;
  taxId?: string | null;
  notes?: string | null;
  status?: CustomerStatus;
  tagIds?: string[];
  initialAddress?: {
    type: CustomerAddressType;
    name?: string | null;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    isDefault?: boolean;
  } | null;
}

export async function createCustomer(
  companyId: string,
  userId: string | undefined,
  data: CreateCustomerDTO
) {
  const db = prisma as any;
  const customerCode = await generateNextCustomerCode(companyId);

  const customer = await db.$transaction(async (tx: any) => {
    const created = await tx.customer.create({
      data: {
        companyId,
        customerCode,
        name: data.name.trim(),
        phone: data.phone.trim(),
        alternatePhone: data.alternatePhone?.trim() || null,
        email: data.email?.trim().toLowerCase() || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gstNumber: data.gstNumber?.trim() || null,
        taxId: data.taxId?.trim() || null,
        notes: data.notes?.trim() || null,
        status: data.status || 'ACTIVE',
        createdBy: userId,
      },
    });

    if (data.initialAddress) {
      await tx.customerAddress.create({
        data: {
          customerId: created.id,
          companyId,
          type: data.initialAddress.type || 'HOME',
          name: data.initialAddress.name?.trim() || null,
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
      await tx.customerTag.createMany({
        data: data.tagIds.map((tagId) => ({
          customerId: created.id,
          tagId,
        })),
      });
    }

    return created;
  });

  await recordCRMActivity({
    companyId,
    entityType: 'CUSTOMER',
    entityId: customer.id,
    activityType: 'CREATED',
    title: 'Customer created',
    description: `Customer ${customer.name} (${customer.customerCode}) created`,
    createdBy: userId,
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'CUSTOMER_CREATED',
    entity: 'Customer',
    entityId: customer.id,
    metadata: { customerCode: customer.customerCode, name: customer.name },
  });

  return findCustomerById(companyId, customer.id);
}

export async function updateCustomer(
  companyId: string,
  userId: string | undefined,
  customerId: string,
  data: Partial<CreateCustomerDTO>
) {
  const db = prisma as any;
  const existing = await db.customer.findFirst({
    where: { id: customerId, companyId },
  });

  if (!existing) {
    throw new NotFoundError('Customer not found');
  }

  const updateData: any = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.phone !== undefined) updateData.phone = data.phone.trim();
  if (data.alternatePhone !== undefined) updateData.alternatePhone = data.alternatePhone?.trim() || null;
  if (data.email !== undefined) updateData.email = data.email?.trim().toLowerCase() || null;
  if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  if (data.gstNumber !== undefined) updateData.gstNumber = data.gstNumber?.trim() || null;
  if (data.taxId !== undefined) updateData.taxId = data.taxId?.trim() || null;
  if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;
  if (data.status !== undefined) updateData.status = data.status;

  await db.$transaction(async (tx: any) => {
    await tx.customer.update({
      where: { id: customerId },
      data: updateData,
    });

    if (data.tagIds !== undefined) {
      await tx.customerTag.deleteMany({
        where: { customerId },
      });
      if (data.tagIds.length > 0) {
        await tx.customerTag.createMany({
          data: data.tagIds.map((tagId) => ({ customerId, tagId })),
        });
      }
    }
  });

  await recordCRMActivity({
    companyId,
    entityType: 'CUSTOMER',
    entityId: customerId,
    activityType: 'UPDATED',
    title: 'Customer updated',
    description: `Customer ${existing.name} updated`,
    createdBy: userId,
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'CUSTOMER_UPDATED',
    entity: 'Customer',
    entityId: customerId,
    metadata: { customerCode: existing.customerCode },
  });

  return findCustomerById(companyId, customerId);
}

export async function archiveCustomer(companyId: string, userId: string | undefined, customerId: string) {
  const db = prisma as any;
  const existing = await db.customer.findFirst({
    where: { id: customerId, companyId },
  });

  if (!existing) {
    throw new NotFoundError('Customer not found');
  }

  const updated = await db.customer.update({
    where: { id: customerId },
    data: { status: 'ARCHIVED' },
  });

  await recordCRMActivity({
    companyId,
    entityType: 'CUSTOMER',
    entityId: customerId,
    activityType: 'ARCHIVED',
    title: 'Customer archived',
    description: `Customer ${existing.name} archived`,
    createdBy: userId,
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'CUSTOMER_ARCHIVED',
    entity: 'Customer',
    entityId: customerId,
    metadata: { customerCode: existing.customerCode },
  });

  return updated;
}

export async function restoreCustomer(companyId: string, userId: string | undefined, customerId: string) {
  const db = prisma as any;
  const existing = await db.customer.findFirst({
    where: { id: customerId, companyId },
  });

  if (!existing) {
    throw new NotFoundError('Customer not found');
  }

  const updated = await db.customer.update({
    where: { id: customerId },
    data: { status: 'ACTIVE' },
  });

  await recordCRMActivity({
    companyId,
    entityType: 'CUSTOMER',
    entityId: customerId,
    activityType: 'RESTORED',
    title: 'Customer restored',
    description: `Customer ${existing.name} restored to active status`,
    createdBy: userId,
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'CUSTOMER_RESTORED',
    entity: 'Customer',
    entityId: customerId,
    metadata: { customerCode: existing.customerCode },
  });

  return updated;
}

export async function addCustomerAddress(
  companyId: string,
  userId: string | undefined,
  customerId: string,
  addressData: any
) {
  const db = prisma as any;
  const customer = await db.customer.findFirst({
    where: { id: customerId, companyId },
  });
  if (!customer) throw new NotFoundError('Customer not found');

  if (addressData.isDefault) {
    await db.customerAddress.updateMany({
      where: { customerId, companyId },
      data: { isDefault: false },
    });
  }

  const address = await db.customerAddress.create({
    data: {
      customerId,
      companyId,
      type: addressData.type || 'HOME',
      name: addressData.name?.trim() || null,
      addressLine1: addressData.addressLine1.trim(),
      addressLine2: addressData.addressLine2?.trim() || null,
      city: addressData.city.trim(),
      state: addressData.state.trim(),
      postalCode: addressData.postalCode.trim(),
      country: addressData.country?.trim() || 'India',
      isDefault: addressData.isDefault || false,
    },
  });

  return address;
}

export async function updateCustomerAddress(
  companyId: string,
  userId: string | undefined,
  customerId: string,
  addressId: string,
  addressData: any
) {
  const db = prisma as any;
  const existing = await db.customerAddress.findFirst({
    where: { id: addressId, customerId, companyId },
  });
  if (!existing) throw new NotFoundError('Customer address not found');

  if (addressData.isDefault) {
    await db.customerAddress.updateMany({
      where: { customerId, companyId, NOT: { id: addressId } },
      data: { isDefault: false },
    });
  }

  return db.customerAddress.update({
    where: { id: addressId },
    data: addressData,
  });
}

export async function deleteCustomerAddress(
  companyId: string,
  userId: string | undefined,
  customerId: string,
  addressId: string
) {
  const db = prisma as any;
  const existing = await db.customerAddress.findFirst({
    where: { id: addressId, customerId, companyId },
  });
  if (!existing) throw new NotFoundError('Customer address not found');

  return db.customerAddress.delete({
    where: { id: addressId },
  });
}

export async function addCustomerNote(
  companyId: string,
  userId: string | undefined,
  customerId: string,
  content: string
) {
  const db = prisma as any;
  const customer = await db.customer.findFirst({
    where: { id: customerId, companyId },
  });
  if (!customer) throw new NotFoundError('Customer not found');

  const note = await db.customerNote.create({
    data: {
      companyId,
      customerId,
      content: content.trim(),
      createdBy: userId,
    },
    include: {
      creator: { select: { id: true, name: true } },
    },
  });

  await recordCRMActivity({
    companyId,
    entityType: 'CUSTOMER',
    entityId: customerId,
    activityType: 'NOTE',
    title: 'Note added',
    description: content.trim(),
    createdBy: userId,
  });

  await createAuditLog({
    userId,
    companyId,
    action: 'CUSTOMER_NOTE_CREATED',
    entity: 'CustomerNote',
    entityId: note.id,
  });

  return note;
}

export async function deleteCustomerNote(
  companyId: string,
  userId: string | undefined,
  customerId: string,
  noteId: string
) {
  const db = prisma as any;
  const existing = await db.customerNote.findFirst({
    where: { id: noteId, customerId, companyId },
  });
  if (!existing) throw new NotFoundError('Customer note not found');

  return db.customerNote.delete({
    where: { id: noteId },
  });
}
