import { z } from 'zod';

export const ProductTypeEnum = z.enum(['FINISHED_PRODUCT', 'RAW_MATERIAL']);
export type ProductType = z.infer<typeof ProductTypeEnum>;

export const StockMovementTypeEnum = z.enum([
  'OPENING_STOCK',
  'STOCK_ADJUSTMENT_IN',
  'STOCK_ADJUSTMENT_OUT',
  'STOCK_CORRECTION',
  'DAMAGE',
  'LOST',
  'INITIAL_IMPORT',
  'PURCHASE',
  'SALE',
  'SALES_RETURN',
  'PURCHASE_RETURN',
  'PRODUCTION_IN',
  'MATERIAL_CONSUMPTION',
]);
export type StockMovementType = z.infer<typeof StockMovementTypeEnum>;

// Category Validation
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional().nullable(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Unit Validation
export const createUnitSchema = z.object({
  name: z.string().min(1, 'Unit name is required'),
  shortCode: z.string().min(1, 'Short code is required'),
});

export const updateUnitSchema = createUnitSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// Product Validation
export const createProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(2, 'SKU must be at least 2 characters').regex(/^[a-zA-Z0-9-_]+$/, 'SKU can only contain alphanumeric characters, hyphens, and underscores'),
  productType: ProductTypeEnum,
  categoryId: z.string().min(1, 'Category is required'),
  unitId: z.string().min(1, 'Unit is required'),
  purchasePrice: z.number().min(0, 'Purchase price must be greater than or equal to 0'),
  sellingPrice: z.number().min(0, 'Selling price must be greater than or equal to 0'),
  minimumStock: z.number().min(0, 'Minimum stock must be greater than or equal to 0'),
  openingStock: z.number().min(0, 'Opening stock must be greater than or equal to 0').optional().default(0),
  description: z.string().optional().nullable(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable().or(z.literal('')),
});

export const updateProductSchema = createProductSchema
  .omit({ sku: true, productType: true, openingStock: true })
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

// Stock Adjustment Validation
export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  type: z.enum(['IN', 'OUT']), // Map "Add Stock" to "IN" and "Remove Stock" to "OUT"
  quantity: z.number().positive('Quantity must be greater than 0'),
  reason: z.string().min(2, 'Reason is required'),
  notes: z.string().optional().nullable(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
