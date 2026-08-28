import { z } from 'zod';

export const saleItemInputSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().gt(0, 'Quantity must be greater than zero'),
  unitPrice: z.number().min(0, 'Unit price cannot be negative').optional(),
  discountAmount: z.number().min(0, 'Discount amount cannot be negative').optional().default(0),
  taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%').optional().default(0),
});

export const createSaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(saleItemInputSchema).min(1, 'At least one product item is required'),
  discountAmount: z.number().min(0).optional().default(0),
  taxRate: z.number().min(0).max(100).optional().default(0),
});

export const updateSaleSchema = z.object({
  customerId: z.string().optional().nullable(),
  billingAddress: z.string().optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  items: z.array(saleItemInputSchema).optional(),
  discountAmount: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
});

export const confirmSaleSchema = z.object({
  notes: z.string().optional().nullable(),
  clientRequestId: z.string().optional(),
});

export const cancelSaleSchema = z.object({
  reason: z.string().min(1, 'Cancellation reason is required'),
});

export const saleQuerySchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED', 'RETURNED', 'PARTIALLY_RETURNED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'PARTIALLY_PAID', 'PAID']).optional(),
  customerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
export type CreateSaleInput = z.infer<typeof createSaleSchema>;
export type UpdateSaleInput = z.infer<typeof updateSaleSchema>;
export type ConfirmSaleInput = z.infer<typeof confirmSaleSchema>;
export type CancelSaleInput = z.infer<typeof cancelSaleSchema>;
export type SaleQueryInput = z.infer<typeof saleQuerySchema>;

export interface SaleItemSummary {
  id: string;
  productId: string | null;
  productNameSnapshot: string;
  skuSnapshot: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface SaleSummary {
  id: string;
  companyId: string;
  saleNumber: string;
  customerId: string | null;
  status: 'DRAFT' | 'CONFIRMED' | 'CANCELLED' | 'RETURNED' | 'PARTIALLY_RETURNED';
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  notes: string | null;
  billingAddress: string | null;
  saleDate: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    customerCode: string;
  } | null;
  items?: SaleItemSummary[];
  invoices?: InvoiceSummary[];
}

export interface InvoiceSummary {
  id: string;
  companyId: string;
  saleId: string;
  invoiceNumber: string;
  invoiceDate: string;
  customerId: string | null;
  customerNameSnapshot: string;
  customerPhoneSnapshot: string | null;
  customerEmailSnapshot: string | null;
  billingAddress: string | null;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  status: 'DRAFT' | 'ISSUED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  sale?: {
    saleNumber: string;
    items?: SaleItemSummary[];
  };
}
