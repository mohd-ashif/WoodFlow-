import { Request, Response, NextFunction } from 'express';
import { createPurchaseRequestSchema } from '@furniture-os/shared';
import * as prService from './purchase-request.service.js';

export async function createPRHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const validated = createPurchaseRequestSchema.parse(req.body);
    const pr = await prService.createPurchaseRequest(tenantId, validated, userId);
    return res.status(201).json({ success: true, data: pr });
  } catch (error) {
    next(error);
  }
}

export async function listPRsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const prs = await prService.listPurchaseRequests(tenantId);
    return res.status(200).json({ success: true, data: prs });
  } catch (error) {
    next(error);
  }
}

export async function convertPRHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const po = await prService.convertPRToPO(tenantId, req.params.id, userId);
    return res.status(200).json({ success: true, data: po, message: 'Purchase Request successfully converted to Purchase Order' });
  } catch (error) {
    next(error);
  }
}
