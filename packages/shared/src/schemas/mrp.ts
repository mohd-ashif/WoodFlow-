import { z } from 'zod';

export const runMRPSchema = z.object({
  salesOrderId: z.string().optional(),
  workOrderId: z.string().optional(),
  productId: z.string().optional(),
  quantity: z.number().optional(),
});

export const reserveMaterialSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  locationId: z.string().optional().nullable(),
  sourceType: z.enum(['SALES_ORDER', 'WORK_ORDER', 'TRANSFER', 'OTHER']),
  sourceId: z.string().min(1, 'Source ID is required'),
  sourceLineId: z.string().optional().nullable(),
  workOrderId: z.string().optional().nullable(),
  salesOrderId: z.string().optional().nullable(),
});

export const createPurchaseRequestSchema = z.object({
  supplierId: z.string().optional().nullable(),
  mrpRequirementId: z.string().optional().nullable(),
  workOrderId: z.string().optional().nullable(),
  salesOrderId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.string().min(1, 'Product is required'),
      requiredQuantity: z.number().positive(),
      estimatedUnitCost: z.number().min(0).default(0),
      notes: z.string().optional().nullable(),
    })
  ).min(1, 'At least one item is required'),
});

export const goodsReceiptSchema = z.object({
  purchaseId: z.string().min(1, 'Purchase Order ID is required'),
  supplierId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      purchaseItemId: z.string().optional().nullable(),
      productId: z.string().min(1, 'Product is required'),
      receivedQty: z.number().min(0),
      rejectedQty: z.number().min(0).default(0),
      unitCost: z.number().min(0).default(0),
      notes: z.string().optional().nullable(),
    })
  ).min(1, 'At least one receipt item is required'),
});

export type RunMRPInput = z.infer<typeof runMRPSchema>;
export type ReserveMaterialInput = z.infer<typeof reserveMaterialSchema>;
export type CreatePurchaseRequestInput = z.infer<typeof createPurchaseRequestSchema>;
export type GoodsReceiptInput = z.infer<typeof goodsReceiptSchema>;
