import { Request, Response, NextFunction } from 'express';
import { analyticsService } from './analytics.service.js';
import { exportService } from './export.service.js';

export async function getOwnerSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, preset } = req.query as any;
    const data = await analyticsService.getOwnerSummary(req.tenantId!, { startDate, endDate, preset });
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getExecutiveOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, preset } = req.query as any;
    const data = await analyticsService.getExecutiveOverview(req.tenantId!, { startDate, endDate, preset });
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getSalesReports(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, preset } = req.query as any;
    const data = await analyticsService.getSalesReports(req.tenantId!, { startDate, endDate, preset });
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getInventoryReports(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getInventoryReports(req.tenantId!);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getPurchaseReports(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, preset } = req.query as any;
    const data = await analyticsService.getPurchaseReports(req.tenantId!, { startDate, endDate, preset });
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getCustomerAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getCustomerAnalytics(req.tenantId!);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getSupplierAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getSupplierAnalytics(req.tenantId!);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getFinanceReports(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, preset } = req.query as any;
    const data = await analyticsService.getFinanceReports(req.tenantId!, { startDate, endDate, preset });
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getExpenseReports(req: Request, res: Response, next: NextFunction) {
  try {
    const { startDate, endDate, preset } = req.query as any;
    const data = await analyticsService.getExpenseReports(req.tenantId!, { startDate, endDate, preset });
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getProductionReports(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await analyticsService.getProductionReports(req.tenantId!);
    return res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function exportReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { reportType, format, startDate, endDate, preset } = req.query as any;
    const { filename, content, contentType } = await exportService.generateReport(
      req.tenantId!,
      reportType || 'sales',
      format || 'csv',
      { startDate, endDate, preset }
    );

    res.setHeader('Content-Type', contentType);
    if (format === 'pdf') {
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    }
    return res.send(content);
  } catch (error) {
    next(error);
  }
}
