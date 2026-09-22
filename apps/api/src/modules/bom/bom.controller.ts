import { Request, Response, NextFunction } from 'express';
import { createBOMSchema, createBOMVersionSchema } from '@furniture-os/shared';
import * as bomService from './bom.service.js';

export async function createBOMHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const validated = createBOMSchema.parse(req.body);
    const bom = await bomService.createBOM(tenantId, validated, userId);
    return res.status(201).json({ success: true, data: bom });
  } catch (error) {
    next(error);
  }
}

export async function listBOMsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const productId = req.query.productId as string;
    const boms = await bomService.listBOMs(tenantId, productId);
    return res.status(200).json({ success: true, data: boms });
  } catch (error) {
    next(error);
  }
}

export async function getBOMByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const bom = await bomService.getBOMById(tenantId, req.params.id);
    return res.status(200).json({ success: true, data: bom });
  } catch (error) {
    next(error);
  }
}

export async function createBOMVersionHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const validated = createBOMVersionSchema.parse(req.body);
    const version = await bomService.createBOMVersion(tenantId, validated, userId);
    return res.status(201).json({ success: true, data: version });
  } catch (error) {
    next(error);
  }
}

export async function explodeBOMHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const { productId } = req.params;
    const quantity = Number(req.query.quantity || 1);
    const bomVersionId = req.query.bomVersionId as string;

    const materials = await bomService.explodeBOM(tenantId, productId, quantity, bomVersionId);
    return res.status(200).json({ success: true, data: { productId, targetQuantity: quantity, materials } });
  } catch (error) {
    next(error);
  }
}
