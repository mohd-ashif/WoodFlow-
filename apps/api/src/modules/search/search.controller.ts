import { Request, Response, NextFunction } from 'express';
import { searchService } from './search.service.js';

/**
 * GET /api/v1/search?q=query
 * Multi-tenant global search across Products, Customers, Suppliers, Invoices, Purchases, Workers
 */
export async function globalSearch(req: Request, res: Response, next: NextFunction) {
  try {
    const companyId = req.tenantId!;
    const q = req.query.q as string || '';

    const results = await searchService.globalSearch(companyId, q);

    res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    next(error);
  }
}
