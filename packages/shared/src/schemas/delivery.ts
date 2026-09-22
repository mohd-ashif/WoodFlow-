import { z } from 'zod';

export const deliveryItemSchema = z.object({
  saleItemId: z.string().optional().nullable(),
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  notes: z.string().optional().nullable(),
});

export const createDeliverySchema = z.object({
  salesOrderId: z.string().min(1, 'Sales Order ID is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  dispatchDate: z.string().optional().nullable(),
  deliveryDate: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(deliveryItemSchema).min(1, 'At least one delivery item is required'),
});

export const updateDeliveryStatusSchema = z.object({
  status: z.enum(['PENDING', 'DISPATCHED', 'DELIVERED', 'CANCELLED']),
  trackingNumber: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type CreateDeliveryInput = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryStatusInput = z.infer<typeof updateDeliveryStatusSchema>;
