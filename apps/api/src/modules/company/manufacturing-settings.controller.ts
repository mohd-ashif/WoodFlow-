import { Request, Response, NextFunction } from 'express';
import * as settingsService from './manufacturing-settings.service.js';

export async function getManufacturingSettingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const settings = await settingsService.getManufacturingSettings(tenantId);
    return res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
}

export async function updateManufacturingSettingsHandler(req: Request, res: Response, next: NextFunction) {
  try {
    const tenantId = (req as any).tenantId;
    const userId = (req as any).user.id;
    const updated = await settingsService.updateManufacturingSettings(tenantId, req.body, userId);
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
}
