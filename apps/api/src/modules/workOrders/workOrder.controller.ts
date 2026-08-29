import { Request, Response, NextFunction } from 'express';
import * as workOrderService from './workOrder.service.js';
import {
  createWorkOrderSchema,
  updateWorkOrderSchema,
  createProductionTaskSchema,
  updateTaskStatusSchema,
  assignWorkerTaskSchema,
  issueMaterialSchema,
  returnMaterialSchema,
  qualityCheckSchema,
} from '@furniture-os/shared';

// DASHBOARD
export async function getProductionStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await workOrderService.getProductionDashboardStats(req.tenantId!);
    return res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
}

// WORK ORDERS
export async function getWorkOrders(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await workOrderService.listWorkOrders(req.tenantId!, {
      page: req.query.page ? Number(req.query.page) : 1,
      limit: req.query.limit ? Number(req.query.limit) : 20,
      search: req.query.search as string,
      status: req.query.status as string,
      priority: req.query.priority as string,
      customerId: req.query.customerId as string,
    });
    return res.json({ success: true, data: result.workOrders, pagination: result.pagination });
  } catch (error) {
    next(error);
  }
}

export async function getWorkOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const wo = await workOrderService.getWorkOrderById(req.tenantId!, req.params.id);
    return res.json({ success: true, data: wo });
  } catch (error) {
    next(error);
  }
}

export async function createWorkOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createWorkOrderSchema.parse(req.body);
    const wo = await workOrderService.createWorkOrder(req.tenantId!, input, req.user!.id);
    return res.status(201).json({ success: true, data: wo });
  } catch (error) {
    next(error);
  }
}

export async function updateWorkOrderStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.body;
    const wo = await workOrderService.updateWorkOrderStatus(req.tenantId!, req.params.id, status, req.user!.id);
    return res.json({ success: true, data: wo });
  } catch (error) {
    next(error);
  }
}

// PRODUCTION TASKS
export async function createProductionTask(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createProductionTaskSchema.parse(req.body);
    const task = await workOrderService.createProductionTask(req.tenantId!, input, req.user!.id);
    return res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

export async function assignWorkerTask(req: Request, res: Response, next: NextFunction) {
  try {
    const input = assignWorkerTaskSchema.parse(req.body);
    const task = await workOrderService.assignWorkerToTask(req.tenantId!, req.params.taskId, input, req.user!.id);
    return res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

export async function updateTaskStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const input = updateTaskStatusSchema.parse(req.body);
    const task = await workOrderService.updateTaskStatus(req.tenantId!, req.params.taskId, input, req.user!.id);
    return res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
}

// MATERIALS
export async function issueMaterial(req: Request, res: Response, next: NextFunction) {
  try {
    const input = issueMaterialSchema.parse(req.body);
    const material = await workOrderService.issueMaterial(req.tenantId!, req.params.id, input, req.user!.id);
    return res.json({ success: true, data: material });
  } catch (error) {
    next(error);
  }
}

export async function returnMaterial(req: Request, res: Response, next: NextFunction) {
  try {
    const input = returnMaterialSchema.parse(req.body);
    const material = await workOrderService.returnMaterial(req.tenantId!, req.params.id, req.params.materialId, input, req.user!.id);
    return res.json({ success: true, data: material });
  } catch (error) {
    next(error);
  }
}

// QUALITY CONTROL
export async function performQualityCheck(req: Request, res: Response, next: NextFunction) {
  try {
    const input = qualityCheckSchema.parse(req.body);
    const check = await workOrderService.performQualityCheck(req.tenantId!, req.params.id, input, req.user!.id);
    return res.json({ success: true, data: check });
  } catch (error) {
    next(error);
  }
}

// COMPLETE WORK ORDER
export async function completeWorkOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const completed = await workOrderService.completeWorkOrder(req.tenantId!, req.params.id, req.user!.id);
    return res.json({ success: true, data: completed });
  } catch (error) {
    next(error);
  }
}
