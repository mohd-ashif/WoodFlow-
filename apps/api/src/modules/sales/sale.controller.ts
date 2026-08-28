import { Request, Response, NextFunction } from 'express';
import { createSaleSchema, cancelSaleSchema, saleQuerySchema } from '@furniture-os/shared';
import { createSaleDraft, confirmSale, cancelSale, getSalesList, getSaleDetails } from './sale.service.js';

export async function createSale(req: Request, res: Response, next: NextFunction) {
  try {
    const input = createSaleSchema.parse(req.body);
    const sale = await createSaleDraft(req.tenantId!, input, req.user!.id);
    res.status(201).json({
      success: true,
      data: sale,
      message: 'Sale draft created successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function confirmSaleController(req: Request, res: Response, next: NextFunction) {
  try {
    const saleId = req.params.id;
    const sale = await confirmSale(req.tenantId!, saleId, req.user!.id);
    res.json({
      success: true,
      data: sale,
      message: 'Sale confirmed successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelSaleController(req: Request, res: Response, next: NextFunction) {
  try {
    const saleId = req.params.id;
    const body = cancelSaleSchema.parse(req.body);
    const sale = await cancelSale(req.tenantId!, saleId, body.reason, req.user!.id);
    res.json({
      success: true,
      data: sale,
      message: 'Sale cancelled and stock restored successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function listSalesController(req: Request, res: Response, next: NextFunction) {
  try {
    const query = saleQuerySchema.parse({
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      search: req.query.search as string,
      status: req.query.status as string,
      paymentStatus: req.query.paymentStatus as string,
      customerId: req.query.customerId as string,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
    });

    const result = await getSalesList(req.tenantId!, query);
    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export async function getSaleController(req: Request, res: Response, next: NextFunction) {
  try {
    const saleId = req.params.id;
    const sale = await getSaleDetails(req.tenantId!, saleId);
    res.json({
      success: true,
      data: sale,
    });
  } catch (error) {
    next(error);
  }
}
