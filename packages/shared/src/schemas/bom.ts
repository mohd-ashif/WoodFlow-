import { z } from 'zod';

export const bomItemSchema = z.object({
  materialProductId: z.string().min(1, 'Material product is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  uom: z.string().optional().default('pcs'),
  wastePercentage: z.number().min(0).default(0),
  scrapPercentage: z.number().min(0).default(0),
  operation: z.string().optional().nullable(),
  isOptional: z.boolean().default(false),
});

export const createBOMSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  name: z.string().min(1, 'BOM name is required'),
  description: z.string().optional().nullable(),
  items: z.array(bomItemSchema).min(1, 'At least one material item is required'),
});

export const createBOMVersionSchema = z.object({
  bomId: z.string().min(1, 'BOM ID is required'),
  quantity: z.number().positive().default(1),
  uom: z.string().optional().default('pcs'),
  notes: z.string().optional().nullable(),
  items: z.array(bomItemSchema).min(1, 'At least one material item is required'),
});

export type CreateBOMInput = z.infer<typeof createBOMSchema>;
export type CreateBOMVersionInput = z.infer<typeof createBOMVersionSchema>;
