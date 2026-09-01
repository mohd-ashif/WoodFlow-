import { Request, Response, NextFunction } from 'express';
import { systemService } from './system.service.js';

export async function getSystemHealth(req: Request, res: Response, next: NextFunction) {
  try {
    const health = await systemService.getSystemHealth();
    res.status(200).json({
      success: true,
      data: health
    });
  } catch (error) {
    next(error);
  }
}

export async function checkDataConsistency(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const result = await systemService.checkDataConsistency(companyId);

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
}
