import { z } from 'zod';

export const CustomerStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);
export const SupplierStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']);
export const CustomerAddressTypeEnum = z.enum(['HOME', 'OFFICE', 'DELIVERY', 'OTHER']);
export const SupplierAddressTypeEnum = z.enum(['OFFICE', 'WAREHOUSE', 'BILLING', 'OTHER']);
export const CRMEntityTypeEnum = z.enum(['CUSTOMER', 'SUPPLIER']);
export const CRMActivityTypeEnum = z.enum(['NOTE', 'CALL', 'EMAIL', 'FOLLOW_UP', 'STATUS_CHANGE', 'CREATED', 'UPDATED', 'ARCHIVED', 'RESTORED']);
export const TagTypeEnum = z.enum(['CUSTOMER', 'SUPPLIER']);

export const customerAddressSchema = z.object({
  type: CustomerAddressTypeEnum.default('HOME'),
  name: z.string().trim().max(100).optional().nullable(),
  addressLine1: z.string().trim().min(1, 'Address line 1 is required').max(255),
  addressLine2: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(100),
  postalCode: z.string().trim().min(1, 'Postal code is required').max(20),
  country: z.string().trim().max(100).default('India'),
  isDefault: z.boolean().default(false),
});

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required').max(150),
  phone: z.string().trim().min(1, 'Phone number is required').max(20),
  alternatePhone: z.string().trim().max(20).optional().nullable(),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  dateOfBirth: z.string().optional().nullable(),
  gstNumber: z.string().trim().max(50).optional().nullable(),
  taxId: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: CustomerStatusEnum.default('ACTIVE'),
  tagIds: z.array(z.string()).optional(),
  initialAddress: customerAddressSchema.optional().nullable(),
});

export const updateCustomerSchema = createCustomerSchema.partial().omit({ initialAddress: true });

export const supplierAddressSchema = z.object({
  type: SupplierAddressTypeEnum.default('OFFICE'),
  addressLine1: z.string().trim().min(1, 'Address line 1 is required').max(255),
  addressLine2: z.string().trim().max(255).optional().nullable(),
  city: z.string().trim().min(1, 'City is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(100),
  postalCode: z.string().trim().min(1, 'Postal code is required').max(20),
  country: z.string().trim().max(100).default('India'),
  isDefault: z.boolean().default(false),
});

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1, 'Supplier name is required').max(150),
  phone: z.string().trim().min(1, 'Phone number is required').max(20),
  alternatePhone: z.string().trim().max(20).optional().nullable(),
  email: z.string().trim().email('Invalid email address').optional().nullable().or(z.literal('')),
  gstNumber: z.string().trim().max(50).optional().nullable(),
  taxId: z.string().trim().max(50).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  status: SupplierStatusEnum.default('ACTIVE'),
  tagIds: z.array(z.string()).optional(),
  initialAddress: supplierAddressSchema.optional().nullable(),
});

export const updateSupplierSchema = createSupplierSchema.partial().omit({ initialAddress: true });

export const createNoteSchema = z.object({
  content: z.string().trim().min(1, 'Note content cannot be empty').max(2000),
});

export const updateNoteSchema = createNoteSchema;

export const createActivitySchema = z.object({
  entityType: CRMEntityTypeEnum,
  entityId: z.string().min(1, 'Entity ID is required'),
  activityType: CRMActivityTypeEnum,
  title: z.string().trim().min(1, 'Title is required').max(200),
  description: z.string().trim().max(2000).optional().nullable(),
});

export const createTagSchema = z.object({
  name: z.string().trim().min(1, 'Tag name is required').max(50),
  type: TagTypeEnum,
});

export const updateTagSchema = z.object({
  name: z.string().trim().min(1, 'Tag name is required').max(50).optional(),
  isActive: z.boolean().optional(),
});

export const checkCustomerDuplicateSchema = z.object({
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  excludeId: z.string().optional(),
});

export const checkSupplierDuplicateSchema = z.object({
  phone: z.string().trim().optional(),
  email: z.string().trim().optional(),
  gstNumber: z.string().trim().optional(),
  excludeId: z.string().optional(),
});
