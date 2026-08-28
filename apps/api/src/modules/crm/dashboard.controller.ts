import { Request, Response, NextFunction } from 'express';
import { getCRMDashboardStats } from './dashboard.service.js';

export async function getDashboard(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await getCRMDashboardStats(req.tenantId!);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}
