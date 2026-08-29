import { z } from 'zod';

export const workOrderItemSchema = z.object({
  productId: z.string().optional().nullable(),
  productNameSnapshot: z.string().min(1, 'Product name is required'),
  customProductName: z.string().optional().nullable(),
  dimensions: z.string().optional().nullable(),
  specifications: z.string().optional().nullable(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  estimatedUnitCost: z.number().nonnegative().optional().default(0),
  notes: z.string().optional().nullable(),
});

export const createWorkOrderSchema = z.object({
  title: z.string().min(1, 'Work order title is required').max(200),
  description: z.string().optional().nullable(),
  sourceType: z.enum(['SALES_ORDER', 'MANUAL', 'INTERNAL']).default('MANUAL'),
  sourceId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  startDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  items: z.array(workOrderItemSchema).min(1, 'At least one item is required'),
});

export const updateWorkOrderSchema = createWorkOrderSchema.partial().extend({
  status: z.enum(['DRAFT', 'PLANNED', 'IN_PROGRESS', 'ON_HOLD', 'QUALITY_CHECK', 'COMPLETED', 'CANCELLED']).optional(),
});

export const createProductionTaskSchema = z.object({
  workOrderId: z.string().min(1, 'Work Order ID is required'),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional().nullable(),
  stage: z.enum([
    'MATERIAL_PREPARATION',
    'CUTTING',
    'CARPENTRY',
    'ASSEMBLY',
    'SANDING',
    'PAINTING',
    'POLISHING',
    'UPHOLSTERY',
    'QUALITY_CHECK',
    'PACKAGING',
    'OTHER',
  ]).default('CARPENTRY'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  estimatedHours: z.number().positive().optional().nullable(),
});

export const updateTaskStatusSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED']),
  actualHours: z.number().nonnegative().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const assignWorkerTaskSchema = z.object({
  workerIds: z.array(z.string()).min(1, 'Select at least one worker'),
  notes: z.string().optional().nullable(),
});

export const issueMaterialSchema = z.object({
  productId: z.string().min(1, 'Product/Material ID is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  notes: z.string().optional().nullable(),
});

export const returnMaterialSchema = z.object({
  quantity: z.number().positive('Quantity must be greater than 0'),
  reason: z.string().optional().nullable(),
});

export const qualityCheckSchema = z.object({
  status: z.enum(['PASSED', 'FAILED']),
  notes: z.string().optional().nullable(),
  issuesFound: z.string().optional().nullable(),
});

export type CreateWorkOrderInput = z.infer<typeof createWorkOrderSchema>;
export type UpdateWorkOrderInput = z.infer<typeof updateWorkOrderSchema>;
export type CreateProductionTaskInput = z.infer<typeof createProductionTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type AssignWorkerTaskInput = z.infer<typeof assignWorkerTaskSchema>;
export type IssueMaterialInput = z.infer<typeof issueMaterialSchema>;
export type ReturnMaterialInput = z.infer<typeof returnMaterialSchema>;
export type QualityCheckInput = z.infer<typeof qualityCheckSchema>;
