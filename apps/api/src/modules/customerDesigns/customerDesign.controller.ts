import { Request, Response, NextFunction } from 'express';
import { createCustomerDesignSchema, updateCustomerDesignSchema } from '@furniture-os/shared';
import * as customerDesignService from './customerDesign.service.js';

export async function createDesignHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const validated = createCustomerDesignSchema.parse(req.body);
    const design = await customerDesignService.createCustomerDesign(tenantId, validated, userId);
    return res.status(201).json({ success: true, data: design });
  } catch (error) {
    next(error);
  }
}

export async function listDesignsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const customerId = req.query.customerId as string;
    const designs = await customerDesignService.listCustomerDesigns(tenantId, customerId);
    return res.status(200).json({ success: true, data: designs });
  } catch (error) {
    next(error);
  }
}

export async function getDesignByIdHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const design = await customerDesignService.getCustomerDesignById(tenantId, req.params.id);
    return res.status(200).json({ success: true, data: design });
  } catch (error) {
    next(error);
  }
}

export async function updateDesignHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const validated = updateCustomerDesignSchema.parse(req.body);
    const updated = await customerDesignService.updateCustomerDesign(tenantId, req.params.id, validated, userId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}
