import { Request, Response, NextFunction } from 'express';
import { runMRPSchema, reserveMaterialSchema } from '@furniture-os/shared';
import * as mrpService from './mrp.service.js';

export async function runMRPHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const validated = runMRPSchema.parse(req.body || {});
    const result = await mrpService.runMRP(tenantId, validated);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

export async function getMaterialRequirementsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const result = await mrpService.runMRP(tenantId);
    return res.status(200).json({ success: true, data: result.materialRequirements });
  } catch (error) {
    next(error);
  }
}

export async function reserveStockHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const validated = reserveMaterialSchema.parse(req.body);
    const reservation = await mrpService.reserveStock(tenantId, validated, userId);
    return res.status(201).json({ success: true, data: reservation });
  } catch (error) {
    next(error);
  }
}

export async function releaseReservationHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const { id } = req.params;
    const released = await mrpService.releaseStockReservation(tenantId, id, userId);
    return res.status(200).json({ success: true, data: released });
  } catch (error) {
    next(error);
  }
}
