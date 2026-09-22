import { Request, Response, NextFunction } from 'express';
import { createDeliverySchema, updateDeliveryStatusSchema } from '@furniture-os/shared';
import * as deliveryService from './delivery.service.js';

export async function createDeliveryHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const validated = createDeliverySchema.parse(req.body);
    const delivery = await deliveryService.createDelivery(tenantId, validated, userId);
    return res.status(201).json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
}

export async function listDeliveriesHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const salesOrderId = req.query.salesOrderId as string;
    const deliveries = await deliveryService.listDeliveries(tenantId, salesOrderId);
    return res.status(200).json({ success: true, data: deliveries });
  } catch (error) {
    next(error);
  }
}

export async function getDeliveryByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const delivery = await deliveryService.getDeliveryById(tenantId, req.params.id);
    return res.status(200).json({ success: true, data: delivery });
  } catch (error) {
    next(error);
  }
}

export async function updateDeliveryStatusHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const validated = updateDeliveryStatusSchema.parse(req.body);
    const updated = await deliveryService.updateDeliveryStatus(tenantId, req.params.id, validated, userId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}
