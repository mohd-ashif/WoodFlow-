import { Request, Response, NextFunction } from 'express';
import { goodsReceiptSchema } from '@furniture-os/shared';
import * as grnService from './goods-receipt.service.js';

export async function createGRNHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const validated = goodsReceiptSchema.parse(req.body);
    const grn = await grnService.createGoodsReceipt(tenantId, validated, userId);
    return res.status(201).json({ success: true, data: grn });
  } catch (error) {
    next(error);
  }
}

export async function listGRNsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const grns = await grnService.listGoodsReceipts(tenantId);
    return res.status(200).json({ success: true, data: grns });
  } catch (error) {
    next(error);
  }
}
