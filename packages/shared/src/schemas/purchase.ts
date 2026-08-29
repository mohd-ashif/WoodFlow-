import { z } from 'zod';

export const purchaseItemInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().gt(0, 'Quantity must be greater than zero'),
  unitCost: z.number().min(0, 'Unit cost cannot be negative'),
  discountAmount: z.number().min(0, 'Discount amount cannot be negative').optional().default(0),
  taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%').optional().default(0),
});

export const createPurchaseSchema = z.object({
  supplierId: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  purchaseDate: z.string().optional(),
  items: z.array(purchaseItemInputSchema).min(1, 'At least one product item is required'),
  discountAmount: z.number().min(0).optional().default(0),
  taxRate: z.number().min(0).max(100).optional().default(0),
});

export const updatePurchaseSchema = z.object({
  supplierId: z.string().optional().nullable(),
  referenceNumber: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  purchaseDate: z.string().optional(),
  items: z.array(purchaseItemInputSchema).optional(),
  discountAmount: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
});

export const confirmPurchaseSchema = z.object({
  notes: z.string().optional().nullable(),
});

export const cancelPurchaseSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
});

export const purchaseQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED', 'PARTIALLY_RECEIVED', 'RECEIVED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID']).optional(),
  supplierId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type PurchaseItemInput = z.infer<typeof purchaseItemInputSchema>;
export type CreatePurchaseInput = z.infer<typeof createPurchaseSchema>;
export type UpdatePurchaseInput = z.infer<typeof updatePurchaseSchema>;
export type ConfirmPurchaseInput = z.infer<typeof confirmPurchaseSchema>;
export type CancelPurchaseInput = z.infer<typeof cancelPurchaseSchema>;
export type PurchaseQueryInput = z.infer<typeof purchaseQuerySchema>;

export interface PurchaseItemSummary {
  id: string;
  productId: string | null;
  productNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitCost: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface PurchaseSummary {
  id: string;
  companyId: string;
  purchaseNumber: string;
  supplierId: string | null;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED' | 'PARTIALLY_RECEIVED' | 'RECEIVED';
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  notes: string | null;
  referenceNumber: string | null;
  purchaseDate: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  supplier?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    supplierCode: string;
  } | null;
  items?: PurchaseItemSummary[];
  creator?: {
    id: string;
    name: string;
  } | null;
}
