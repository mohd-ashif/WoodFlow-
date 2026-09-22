import { z } from 'zod';

export const CustomerDesignStatusEnum = z.enum([
  'DRAFT',
  'DESIGNING',
  'APPROVAL_PENDING',
  'APPROVED',
  'REJECTED',
  'CONVERTED_TO_ORDER',
  'CANCELLED',
]);

export const createCustomerDesignSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  productTemplateId: z.string().optional().nullable(),
  name: z.string().min(1, 'Design name is required'),
  description: z.string().optional().nullable(),
  width: z.number().optional().nullable(),
  height: z.number().optional().nullable(),
  depth: z.number().optional().nullable(),
  finish: z.string().optional().nullable(),
  material: z.string().optional().nullable(),
  color: z.string().optional().nullable(),
  style: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  attachments: z.any().optional().nullable(),
  drawings: z.any().optional().nullable(),
  images: z.any().optional().nullable(),
});

export const updateCustomerDesignSchema = createCustomerDesignSchema.partial().extend({
  status: CustomerDesignStatusEnum.optional(),
});

export type CreateCustomerDesignInput = z.infer<typeof createCustomerDesignSchema>;
export type UpdateCustomerDesignInput = z.infer<typeof updateCustomerDesignSchema>;
