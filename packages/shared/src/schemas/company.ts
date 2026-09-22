import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  ownerId: z.string().min(1, 'Owner ID is required'),
  displayName: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().nullable(),
  alternatePhone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  addressLine2: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  postalCode: z.string().optional().nullable(),
  website: z.string().url('Invalid website URL').optional().nullable().or(z.literal('')),
  gstNumber: z.string().optional().nullable(),
  taxId: z.string().optional().nullable(),
  businessRegistrationNumber: z.string().optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial().omit({ ownerId: true });

export const updateBrandingSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be a valid hex color code (e.g. #2563eb)')
    .optional()
    .nullable(),
  secondaryColor: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Must be a valid hex color code (e.g. #1e293b)')
    .optional()
    .nullable(),
  faviconUrl: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type UpdateBrandingInput = z.infer<typeof updateBrandingSchema>;
